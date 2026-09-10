// extract-product-link: lê título, imagem e preço de uma página de produto.
//
// Este arquivo é fino de propósito. Tudo que merece teste mora em _shared —
// o guard anti-SSRF e a leitura das meta tags — porque lá roda no Vitest do
// monorepo, sem precisar de Deno. Aqui fica só a ordem das coisas, e a ordem é
// a parte que a regra 5 nomeia: JWT antes de qualquer lógica.

import { exigirUsuario } from "../_shared/auth.ts";
import { extrairOpenGraph } from "../_shared/open-graph.ts";
import { buscarComGuard, UrlRecusada } from "../_shared/ssrf-guard.ts";

// Sem valor monetário, sem e-mail, sem couple_id: nem no corpo, nem em log.
// Regra 8 vale para a resposta de erro também.
function json(status: number, corpo: Record<string, unknown>): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return json(405, { erro: "metodo_nao_permitido" });

  // 1. JWT antes de tudo. Antes de ler o corpo, antes de olhar a URL.
  const sessao = await exigirUsuario(req);
  if (!sessao) return json(401, { erro: "nao_autenticado" });

  // 2. Corpo.
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return json(400, { erro: "corpo_invalido" });
  }

  const campos = corpo as { goalItemId?: unknown; url?: unknown };
  const goalItemId = typeof campos.goalItemId === "string" ? campos.goalItemId : "";
  const url = typeof campos.url === "string" ? campos.url : "";
  if (goalItemId === "" || url === "") return json(400, { erro: "corpo_invalido" });

  // 3. O item é do casal de quem pediu? A pergunta vem ANTES do fetch, e não
  //    junto do insert lá embaixo: sem isso, uma página sem preço nunca chegava
  //    ao insert, e um item de outro casal recebia 200 — além de a gente sair
  //    buscando na internet a mando de quem não tinha o que guardar aqui.
  //    Quem responde é o RLS: fora do casal, isto volta vazio.
  const { data: item } = await sessao.client
    .from("goal_items")
    .select("id")
    .eq("id", goalItemId)
    .maybeSingle();

  if (!item) return json(404, { erro: "item_nao_encontrado" });

  // 4. A busca, com o guard em cada salto. Nada nosso vai junto: sem cookie,
  //    sem referer, sem user_id, sem e-mail, sem nada da meta. A loja não fica
  //    sabendo que alguém do nosso app olhou aquele produto.
  let pagina: { url: URL; html: string };
  try {
    pagina = await buscarComGuard(url);
  } catch (erro) {
    if (erro instanceof UrlRecusada) {
      return json(400, { erro: "url_recusada", motivo: erro.motivo });
    }
    // Timeout, DNS caindo, TLS quebrado, loja fora do ar. O detalhe fica de
    // fora da resposta: ele é sobre a infraestrutura, não sobre quem perguntou.
    return json(502, { erro: "nao_consegui_ler" });
  }

  // 5. Extração e sanitização, tudo em _shared/open-graph.ts.
  const produto = extrairOpenGraph(pagina.html, pagina.url);

  // 6. Preço novo entra como linha nova. price_quotes é append-only, e o
  //    caminho é a função: insert direto exigiria o couple_id no corpo da
  //    requisição, e ele sai do JWT (regra 3).
  if (produto.precoCents !== null) {
    const { error } = await sessao.client.rpc("add_price_quote", {
      p_goal_item_id: goalItemId,
      p_price_cents: produto.precoCents,
      p_source_url: pagina.url.toString(),
    });
    if (error) return json(400, { erro: "nao_consegui_guardar" });
  }

  return json(200, {
    titulo: produto.titulo,
    imagem: produto.imagem,
    precoCents: produto.precoCents,
    url: pagina.url.toString(),
  });
});
