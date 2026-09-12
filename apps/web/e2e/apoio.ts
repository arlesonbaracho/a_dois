import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { expect, type APIRequestContext, type Page } from "@playwright/test";

/**
 * As chaves do stack local.
 *
 * Perguntadas à CLI em vez de escritas aqui: chave de service role em arquivo
 * versionado é chave que o gitleaks do CI reprova — e com razão, mesmo sendo a
 * do Supabase local. Vem uma vez por processo.
 */
let cache: Record<string, string> | undefined;

export function chaves(): Record<string, string> {
  if (!cache) {
    const saida = execFileSync("npx", ["supabase", "status", "-o", "json"], {
      cwd: `${__dirname}/../../..`,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    cache = JSON.parse(saida) as Record<string, string>;
  }
  return cache;
}

export const SENHA = "senhamuitolonga123";

export type Conta = { email: string; senha: string; userId: string };

function cabecalhosDeServico(): Record<string, string> {
  const { SERVICE_ROLE_KEY } = chaves();
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
}

/**
 * Uma conta nova, já confirmada, com e-mail único.
 *
 * Único de propósito: é o que deixa os testes rodarem em paralelo sem um
 * pisar no outro, e sem precisar limpar o banco entre eles.
 */
export async function criarConta(
  request: APIRequestContext,
  apelido = "pessoa",
  nome?: string,
): Promise<Conta> {
  const { API_URL } = chaves();
  const email = `${apelido}-${randomUUID()}@teste.invalid`;

  const resposta = await request.post(`${API_URL}/auth/v1/admin/users`, {
    headers: cabecalhosDeServico(),
    data: {
      email,
      password: SENHA,
      email_confirm: true,
      // Vira raw_user_meta_data, que é exatamente o que o signUp da tela
      // manda — a mesma trigger lê os dois caminhos.
      ...(nome ? { user_metadata: { display_name: nome } } : {}),
    },
  });
  expect(resposta.ok(), await resposta.text()).toBeTruthy();

  const { id } = (await resposta.json()) as { id: string };
  return { email, senha: SENHA, userId: id };
}

/** Entra pela tela, como gente. É o login de verdade em todos os testes. */
export async function entrar(page: Page, conta: Conta, proxima = "/"): Promise<void> {
  await page.goto(proxima === "/" ? "/login" : `/login?proxima=${encodeURIComponent(proxima)}`);
  await page.getByLabel("E-mail").fill(conta.email);
  await page.getByLabel("Senha").fill(conta.senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/**
 * Junta duas contas num casal, por fora.
 *
 * Usa a service role de propósito: o fluxo de convite tem o teste dele em
 * parceiro.spec.ts, e repeti-lo no começo dos outros quatro só tornaria todos
 * eles lentos e dependentes de uma coisa que não é o assunto deles.
 */
export async function parear(
  request: APIRequestContext,
  dono: Conta,
  parceiro: Conta,
  nomes: { dono: string; parceiro: string } = { dono: "Ana", parceiro: "Beto" },
): Promise<string> {
  const { API_URL } = chaves();
  const rest = `${API_URL}/rest/v1`;
  const headers = cabecalhosDeServico();

  const casalDe = async (conta: Conta) => {
    const r = await request.get(`${rest}/couple_members?select=couple_id&user_id=eq.${conta.userId}`, {
      headers,
    });
    const [linha] = (await r.json()) as { couple_id: string }[];
    return linha.couple_id;
  };

  const coupleId = await casalDe(dono);

  // O casal solo de quem entra some, como confirm_invite faria.
  await request.delete(`${rest}/couples?id=eq.${await casalDe(parceiro)}`, { headers });

  await request.post(`${rest}/couple_members`, {
    headers,
    data: {
      couple_id: coupleId,
      user_id: parceiro.userId,
      role: "parceiro",
      display_name: nomes.parceiro,
    },
  });

  await request.patch(`${rest}/couple_members?user_id=eq.${dono.userId}`, {
    headers,
    data: { display_name: nomes.dono },
  });

  return coupleId;
}

/**
 * Um cliente REST autenticado como a pessoa, para escrever "do outro
 * aparelho" sem abrir um segundo navegador.
 *
 * Passa pelas MESMAS policies que o app: anon key mais o token dela. Não é
 * atalho de permissão, é atalho de interface.
 */
export async function comoPessoa(request: APIRequestContext, conta: Conta) {
  const { API_URL, ANON_KEY } = chaves();

  const resposta = await request.post(`${API_URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    data: { email: conta.email, password: conta.senha },
  });
  const { access_token } = (await resposta.json()) as { access_token: string };

  const headers = {
    apikey: ANON_KEY,
    Authorization: `Bearer ${access_token}`,
    "Content-Type": "application/json",
  };

  // Sem assertiva de status de propósito: metade das chamadas daqui ESPERA
  // recusa (teto de valor, RLS, append-only), e a resposta é o que elas medem.
  return {
    rpc: (nome: string, args: Record<string, unknown>) =>
      request.post(`${chaves().API_URL}/rest/v1/rpc/${nome}`, { headers, data: args }),
    apagar: (caminho: string) =>
      request.delete(`${chaves().API_URL}/rest/v1/${caminho}`, { headers }),
    atualizar: (caminho: string, data: Record<string, unknown>) =>
      request.patch(`${chaves().API_URL}/rest/v1/${caminho}`, { headers, data }),
    ler: async <T>(caminho: string): Promise<T> => {
      const r = await request.get(`${chaves().API_URL}/rest/v1/${caminho}`, { headers });
      return (await r.json()) as T;
    },
  };
}
