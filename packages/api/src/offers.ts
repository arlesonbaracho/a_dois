import type { SupabaseClient } from "@supabase/supabase-js";

import { termosDeBusca } from "@repo/core";

import type { Database } from "./database.types";

type Client = SupabaseClient<Database>;

export type Oferta = Database["public"]["Tables"]["offers"]["Row"];

/**
 * As ofertas para um item que o casal anotou.
 *
 * O casamento principal é pelo NOME do item — é ele que diz o que a pessoa
 * quer. A categoria da jornada é a rede: entra quando o nome não acha nada, ou
 * quando ainda não há item nenhum.
 *
 * Nenhuma chamada sai do app: a busca roda no nosso Postgres, com o dicionário
 * `portuguese` nativo. O parceiro comercial só sabe de alguém quando essa
 * pessoa clica — e aí é uma visita comum à loja.
 *
 * A vigência não é filtrada aqui de propósito: quem faz isso é a policy
 * `offers_select`. Filtro na consulta do cliente é sugestão; policy é regra.
 */
export async function ofertasParaItem(
  client: Client,
  nomeDoItem: string,
  categoria: string,
  limite = 3,
): Promise<Oferta[]> {
  const termos = termosDeBusca(nomeDoItem);

  if (termos !== "") {
    const { data, error } = await client
      .from("offers")
      .select("*")
      .textSearch("title", termos, { config: "portuguese" })
      .limit(limite);

    if (error) throw error;
    if (data && data.length > 0) return data;
  }

  return ofertasDaCategoria(client, categoria, limite);
}

/** A rede: o que existe para a categoria da jornada, mais nova primeiro. */
export async function ofertasDaCategoria(
  client: Client,
  categoria: string,
  limite = 4,
): Promise<Oferta[]> {
  const { data, error } = await client
    .from("offers")
    .select("*")
    .eq("category", categoria)
    .order("published_at", { ascending: false })
    .limit(limite);

  if (error) throw error;
  return data ?? [];
}
