import { expect, test } from "@playwright/test";

import { comoPessoa, criarConta, entrar, parear, capaExiste } from "./apoio";

/** O que o navegador baixaria, sem escrever nada no disco. */
async function baixado(page: import("@playwright/test").Page, botao: string): Promise<string> {
  const espera = page.waitForEvent("download");
  await page.getByRole("button", { name: botao }).click();
  const arquivo = await espera;

  const fluxo = await arquivo.createReadStream();
  const pedacos: Buffer[] = [];
  for await (const pedaco of fluxo) pedacos.push(pedaco as Buffer);
  return Buffer.concat(pedacos).toString("utf8");
}

/** PNG de 8x8 e 74 bytes: pequeno para ser rápido, imagem de verdade para o
 *  canvas do navegador conseguir decodificar. */
const PNG_MINUSCULO =
  "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGM4EaCBFTEMLQkAaplQAc/OcKAAAAAASUVORK5CYII=";

test.describe("privacidade", () => {
  test("o export leva o plano e esconde o que é do parceiro", async ({ page, request }) => {
    const ana = await criarConta(request, "ana");
    const beto = await criarConta(request, "beto");
    const comoAna = await comoPessoa(request, ana);

    // O convite entra ANTES do pareamento: com o plano já de duas pessoas,
    // create_invite devolve "plano_cheio" e não grava nada. Ele existe aqui só
    // para provar que o token dele nunca sai no export.
    await comoAna.rpc("create_invite", { p_channel: "link" });
    await parear(request, ana, beto);

    const meta = await (await comoAna.rpc("add_goal", {
      p_title: "Entrada do apê",
      p_target_amount_cents: 12000000,
    })).json();
    await comoAna.rpc("add_contribution", { p_goal_id: meta, p_amount_cents: 150000 });

    await entrar(page, ana);
    await page.goto("/perfil");

    const json = JSON.parse(await baixado(page, "Baixar JSON")) as {
      minha_conta: { email: string };
      pessoas_do_plano: { user_id: string; email: string }[];
      metas: unknown[];
      aportes: unknown[];
      convites: Record<string, unknown>[];
    };

    expect(json.metas).toHaveLength(1);
    expect(json.aportes).toHaveLength(1);
    expect(json.minha_conta.email).toBe(ana.email);

    // O e-mail dela sai em claro; o do parceiro, mascarado. auth.users não é
    // exposta por policy nenhuma, e o export não pode ser a porta dos fundos.
    const doParceiro = json.pessoas_do_plano.find((p) => p.user_id === beto.userId);
    expect(doParceiro?.email).not.toBe(beto.email);
    expect(doParceiro?.email).toContain("•");

    // Token de convite é segredo do sistema, não dado dela.
    expect(json.convites).toHaveLength(1);
    expect(json.convites[0]).not.toHaveProperty("token_hash");
    expect(JSON.stringify(json)).not.toContain("token_hash");
  });

  test("o CSV abre no Excel e leva o mesmo conteúdo", async ({ page, request }) => {
    const ana = await criarConta(request, "csv");
    await entrar(page, ana);

    const comoAna = await comoPessoa(request, ana);
    await comoAna.rpc("add_goal", {
      p_title: 'Apê 2 quartos, com "varanda"',
      p_target_amount_cents: 12000000,
    });

    await page.goto("/perfil");
    const csv = await baixado(page, "Baixar CSV");

    // O BOM é o que faz o Excel em português mostrar "Apê" e não "ApÃª".
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"tabela","linha","campo","valor"');

    // Vírgula e aspas dentro do título não podem quebrar o arquivo.
    expect(csv).toContain('"Apê 2 quartos, com ""varanda"""');
    expect(csv).not.toContain("token_hash");
  });

  test("os três consentimentos são independentes", async ({ page, request }) => {
    const ana = await criarConta(request, "consent");
    await entrar(page, ana);
    await page.goto("/perfil");

    const caixa = (nome: string) => page.getByRole("checkbox", { name: nome });
    const analytics = caixa("Métricas de uso");
    const marketing = caixa("Novidades por e-mail");
    const faixa = caixa("Usar minha faixa de renda no cálculo");

    // A tela desabilita os três até o perfil chegar, para um clique rápido não
    // conceder achando que revoga.
    await expect(analytics).toBeEnabled();
    for (const c of [analytics, marketing, faixa]) await expect(c).not.toBeChecked();

    await analytics.click();
    await expect(analytics).toBeChecked();
    await expect(marketing).not.toBeChecked();
    await expect(faixa).not.toBeChecked();

    await marketing.click();
    await analytics.click();
    await expect(analytics).not.toBeChecked();
    await expect(marketing).toBeChecked();

    await page.reload();
    await expect(caixa("Novidades por e-mail")).toBeChecked();
    await expect(caixa("Métricas de uso")).not.toBeChecked();
  });

  test("apagar a conta só com a palavra EXCLUIR", async ({ page, request }) => {
    const ana = await criarConta(request, "excluindo");
    const beto = await criarConta(request, "beto");
    await parear(request, ana, beto);

    await entrar(page, ana);
    await page.goto("/perfil");

    const campo = page.getByLabel("Para confirmar, escreva EXCLUIR");
    const botao = page.getByRole("button", { name: "Apagar minha conta" });

    await expect(botao).toBeDisabled();

    for (const quase of ["excluir", "EXCLUI", "EXCLUIRR", " EXCLUIR"]) {
      await campo.fill(quase);
      await expect(botao, `"${quase}" não pode habilitar`).toBeDisabled();
    }

    await campo.fill("EXCLUIR");
    await expect(botao).toBeEnabled();
  });

  // A regra do CLAUDE.md: quem sai é pseudonimizado, e o dinheiro fica com o
  // valor intacto. Hard delete do plano só quando o último membro sai.
  test("apagar a conta deixa o plano e o dinheiro para quem fica", async ({ page, request }) => {
    const ana = await criarConta(request, "ana");
    const beto = await criarConta(request, "beto");
    await parear(request, ana, beto);

    const comoAna = await comoPessoa(request, ana);
    const meta = await (await comoAna.rpc("add_goal", {
      p_title: "Entrada do apê",
      p_target_amount_cents: 12000000,
    })).json();
    await comoAna.rpc("add_contribution", { p_goal_id: meta, p_amount_cents: 150000 });

    const comoBeto = await comoPessoa(request, beto);
    await comoBeto.rpc("add_contribution", { p_goal_id: meta, p_amount_cents: 90000 });

    await entrar(page, ana);
    await page.goto("/perfil");
    await page.getByLabel("Para confirmar, escreva EXCLUIR").fill("EXCLUIR");
    await page.getByRole("button", { name: "Apagar minha conta" }).click();

    await expect(page).toHaveURL(/\/login/);

    // E do lado do Beto, o plano continua inteiro.
    const aportes = await comoBeto.ler<{ amount_cents: number; user_id: string | null }[]>(
      "contributions?select=amount_cents,user_id&order=amount_cents.desc",
    );
    expect(aportes).toHaveLength(2);
    expect(aportes.reduce((total, a) => total + a.amount_cents, 0)).toBe(240000);

    // O dela ficou, com o valor intacto e sem dono: virou "ex-membro".
    expect(aportes.find((a) => a.amount_cents === 150000)?.user_id).toBeNull();
    expect(aportes.find((a) => a.amount_cents === 90000)?.user_id).toBe(beto.userId);

    expect(await comoBeto.ler<unknown[]>(`goals?select=id&id=eq.${meta}`)).toHaveLength(1);

    // E a Ana não entra mais.
    await page.getByLabel("E-mail").fill(ana.email);
    await page.getByLabel("Senha").fill(ana.senha);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("status")).toHaveText("E-mail ou senha inválidos.");
  });

  /**
   * O direito de eliminação (Art. 18, VI) vale para a foto também.
   *
   * Antes desta rodada a capa ficava no bucket depois de a conta sumir:
   * inalcançável, porque a policy pergunta por um casal que já não existe —
   * mas guardada. "Ninguém consegue ver" não é "foi eliminado".
   */
  test("apagar a conta sozinha leva a capa da jornada junto", async ({ page, request }) => {
    const sozinha = await criarConta(request, "sozinha");
    await entrar(page, sozinha);

    const comoEla = await comoPessoa(request, sozinha);
    const meta = await (await comoEla.rpc("add_goal", {
      p_title: "Praia em janeiro",
      p_target_amount_cents: 800000,
    })).json();

    await page.goto(`/jornadas/${meta}`);
    await page.getByLabel("Capa da jornada").setInputFiles({
      name: "praia.png",
      mimeType: "image/png",
      buffer: Buffer.from(PNG_MINUSCULO, "base64"),
    });
    await expect(page.locator('img[src*="/capas/"]')).toBeVisible();

    const [linha] = await comoEla.ler<{ cover_path: string }[]>(
      `goals?select=cover_path&id=eq.${meta}`,
    );
    expect(linha.cover_path, "a capa devia estar gravada na jornada").toBeTruthy();
    expect(await capaExiste(request, linha.cover_path)).toBe(true);

    await page.goto("/perfil");
    await page.getByLabel(/Se eu for a única pessoa/).check();
    await page.getByLabel("Para confirmar, escreva EXCLUIR").fill("EXCLUIR");
    await page.getByRole("button", { name: "Apagar minha conta" }).click();
    await expect(page).toHaveURL(/\/login/);

    // O arquivo, e não só a linha: é o que separa eliminar de esconder.
    expect(
      await capaExiste(request, linha.cover_path),
      "a capa continuou no bucket depois de a conta ser apagada",
    ).toBe(false);
  });

  // A política é a única coisa do app que fica desatualizada em silêncio: ela
  // não quebra, não dá erro, e continua servindo a frase antiga. Este teste é
  // o alarme — a página dizia "Não há propaganda no app" com a sugestão de
  // afiliado já na tela da jornada.
  test("a política declara a publicidade, e não nega mais que ela existe", async ({ page }) => {
    await page.goto("/privacidade");

    const corpo = page.locator("main");
    await expect(corpo).not.toContainText("Não há propaganda no app");
    await expect(corpo).toContainText("a gente ganha comissão");
    await expect(corpo).toContainText("nunca é por comissão");
  });
});
