import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

type Client = SupabaseClient<Database>;

export type Meta = Database["public"]["Tables"]["goals"]["Row"];

/**
 * As metas do casal.
 *
 * Sem filtro por couple_id, como em couple.ts: a policy goals_select já reduz a
 * tabela à lista de casais do auth.uid().
 */
export async function metas(client: Client): Promise<Meta[]> {
  const { data, error } = await client
    .from("goals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Cria meta. Via RPC porque insert direto exigiria o couple_id no corpo da
 * requisição, e ele vem do JWT — a policy de insert nega justamente por isso.
 *
 * Mínima de propósito: título e valor alvo. Categoria, prioridade e prazo
 * entram com a tela de metas de verdade.
 */
export async function criarMeta(
  client: Client,
  dados: { titulo: string; alvoCents: number },
): Promise<string> {
  const { data, error } = await client.rpc("add_goal", {
    p_title: dados.titulo,
    p_target_amount_cents: dados.alvoCents,
  });
  if (error) throw error;
  return data;
}
