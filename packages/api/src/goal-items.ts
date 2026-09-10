import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

type Client = SupabaseClient<Database>;

export type Item = Database["public"]["Tables"]["goal_items"]["Row"];
export type StatusItem = Database["public"]["Enums"]["goal_item_status"];

export async function itensDaMeta(client: Client, goalId: string): Promise<Item[]> {
  const { data, error } = await client
    .from("goal_items")
    .select("*")
    .eq("goal_id", goalId)
    .order("created_at");

  if (error) throw error;
  return data ?? [];
}

/** Via RPC: o couple_id do item sai do JWT, e a URL passa por peneira lá. */
export async function criarItem(
  client: Client,
  dados: { goalId: string; nome: string; precoCents: number | null; url: string | null },
): Promise<string> {
  const { data, error } = await client.rpc("add_goal_item", {
    p_goal_id: dados.goalId,
    p_name: dados.nome,
    // O tipo gerado marca os parâmetros com default como opcionais, não
    // como anuláveis: mandar undefined é o que faz o default do SQL valer.
    p_estimated_price_cents: dados.precoCents ?? undefined,
    p_url: dados.url ?? undefined,
  });
  if (error) throw error;
  return data;
}

export async function salvarItem(
  client: Client,
  itemId: string,
  dados: { nome?: string; precoCents?: number | null; status?: StatusItem },
): Promise<void> {
  const { error } = await client
    .from("goal_items")
    .update({
      ...(dados.nome === undefined ? {} : { name: dados.nome }),
      ...(dados.precoCents === undefined ? {} : { estimated_price_cents: dados.precoCents }),
      ...(dados.status === undefined ? {} : { status: dados.status }),
    })
    .eq("id", itemId);

  if (error) throw error;
}

export async function apagarItem(client: Client, itemId: string): Promise<void> {
  const { error } = await client.from("goal_items").delete().eq("id", itemId);
  if (error) throw error;
}
