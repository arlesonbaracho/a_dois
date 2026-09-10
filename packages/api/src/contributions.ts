import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

type Client = SupabaseClient<Database>;

export type Aporte = Database["public"]["Tables"]["contributions"]["Row"];

/**
 * Os aportes do casal, do mais recente para o mais antigo. Com `goalId`, só os
 * de uma meta — é o que a barra de progresso daquela meta soma.
 */
export async function aportes(client: Client, goalId?: string): Promise<Aporte[]> {
  const consulta = client.from("contributions").select("*");
  const { data, error } = await (goalId ? consulta.eq("goal_id", goalId) : consulta).order(
    "contributed_at",
    { ascending: false },
  );

  if (error) throw error;
  return data ?? [];
}

/**
 * Registra aporte. Via RPC, e não insert: o couple_id sai de meu_casal_id() e o
 * user_id de auth.uid(), dentro do banco. Nenhum dos dois atravessa a rede,
 * então nenhum dos dois pode ser escolhido por quem chama.
 */
export async function registrarAporte(
  client: Client,
  dados: { goalId: string; valorCents: number; quandoISO?: string },
): Promise<string> {
  const { data, error } = await client.rpc("add_contribution", {
    p_goal_id: dados.goalId,
    p_amount_cents: dados.valorCents,
    ...(dados.quandoISO ? { p_contributed_at: dados.quandoISO } : {}),
  });
  if (error) throw error;
  return data;
}

/**
 * Salva como a pessoa quer dividir: a regra, a faixa de renda (opcional) e
 * quanto ela combina de colocar no modo fixo.
 *
 * Escreve só na própria linha. O userId vem de quem chama, não do corpo de um
 * formulário: quem monta a chamada é o Server Component, que já tem a sessão.
 */
export async function salvarMinhaDivisao(
  client: Client,
  userId: string,
  dados: {
    regra: Database["public"]["Enums"]["split_rule"];
    faixaRenda: Database["public"]["Enums"]["income_band"] | null;
    parteFixaCents: number | null;
  },
): Promise<void> {
  const { error } = await client
    .from("couple_members")
    .update({
      split_rule: dados.regra,
      income_band: dados.faixaRenda,
      fixed_share_cents: dados.parteFixaCents,
    })
    .eq("user_id", userId)
    .is("left_at", null);

  if (error) throw error;
}
