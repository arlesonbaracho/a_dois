import type { SupabaseClient } from "@supabase/supabase-js";

import { motivoDaFalha, type Cotacao, type MotivoDaFalha } from "@repo/core";

import type { Database } from "./database.types";

type Client = SupabaseClient<Database>;

export type CotacaoDoItem = Database["public"]["Tables"]["price_quotes"]["Row"];

/**
 * O histórico de preço de um item, do mais antigo para o mais novo.
 *
 * Sem filtro por couple_id: a policy `price_quotes_select` já reduz a tabela
 * aos casais do `auth.uid()`, como em toda leitura daqui.
 */
export async function cotacoesDoItem(
  client: Client,
  goalItemId: string,
): Promise<Cotacao[]> {
  const { data, error } = await client
    .from("price_quotes")
    .select("price_cents, created_at")
    .eq("goal_item_id", goalItemId)
    .order("created_at");

  if (error) throw error;
  return (data ?? []).map((linha) => ({
    precoCents: linha.price_cents,
    quandoISO: linha.created_at,
  }));
}

/**
 * O que a tela precisa saber depois de tentar ler a loja.
 *
 * Resultado, não exceção: "a loja não respondeu" e "esse endereço a gente não
 * busca" são respostas normais de um botão que sai para a internet, e virar
 * `throw` obrigaria cada tela a montar try/catch para um caso esperado.
 */
export type ResultadoBusca =
  | { ok: true; precoCents: number | null; titulo: string | null }
  | { ok: false; motivo: MotivoDaFalha };

/**
 * Lê a página do produto e guarda a cotação.
 *
 * Quem faz o trabalho é a Edge Function `extract-product-link`: ela valida o
 * JWT antes de qualquer lógica, passa a URL pelo guard anti-SSRF a cada salto,
 * e grava por `add_price_quote` — que tira o `couple_id` do JWT. Nada disso
 * pode acontecer no navegador, e é por isso que a chamada é esta e não um
 * `fetch`.
 */
export async function buscarPrecoDoLink(
  client: Client,
  goalItemId: string,
  url: string,
): Promise<ResultadoBusca> {
  const { data, error } = await client.functions.invoke("extract-product-link", {
    body: { goalItemId, url },
  });

  if (error) {
    // supabase-js embrulha a resposta de erro: o código que a função devolveu
    // está no corpo, não na mensagem. Sem isto, "endereço recusado pelo guard"
    // e "loja fora do ar" viram a mesma frase na tela.
    // Tipado pela FORMA e não como `Response`: `packages/api` compila com
    // `lib: ["ES2022"]`, sem DOM, porque a fase 2 roda este mesmo código no
    // React Native. O que importa aqui é que o objeto sabe fazer `json()`.
    const contexto = (error as { context?: { json?: () => Promise<unknown> } }).context;
    let codigo = "";
    try {
      const corpo = (await contexto?.json?.()) as { erro?: unknown } | undefined;
      codigo = typeof corpo?.erro === "string" ? corpo.erro : "";
    } catch {
      codigo = "";
    }
    return { ok: false, motivo: motivoDaFalha(codigo) };
  }

  const corpo = data as { precoCents?: number | null; titulo?: string | null };
  return {
    ok: true,
    precoCents: typeof corpo?.precoCents === "number" ? corpo.precoCents : null,
    titulo: typeof corpo?.titulo === "string" ? corpo.titulo : null,
  };
}
