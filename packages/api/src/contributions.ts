import type { SupabaseClient } from "@supabase/supabase-js";

import { meuCasal } from "./couple";
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
 *
 * Escolher uma faixa aqui registra, no banco, o consentimento com o uso dela —
 * é um gatilho em couple_members, e não uma chamada extra daqui, para que valha
 * para qualquer caminho de escrita que exista amanhã.
 */
export async function salvarMinhaDivisao(
  client: Client,
  userId: string,
  dados: {
    faixaRenda: Database["public"]["Enums"]["income_band"] | null;
    parteFixaCents: number | null;
  },
): Promise<void> {
  const { error } = await client
    .from("couple_members")
    .update({
      income_band: dados.faixaRenda,
      fixed_share_cents: dados.parteFixaCents,
    })
    .eq("user_id", userId)
    .is("left_at", null);

  if (error) throw error;
}

/**
 * A regra de divisão, que é do casal e não de cada um.
 *
 * Escrita separada de `salvarMinhaDivisao` porque são fatos em tabelas
 * diferentes: o que cada pessoa ganha e quanto ela coloca são dela; COMO os
 * dois dividem é dos dois.
 *
 * O id do casal é buscado aqui e não recebido por parâmetro. Duas razões: o
 * PostgREST recusa update sem WHERE (`21000`), e couple_id vindo do cliente é
 * o que a regra 3 do CLAUDE.md proíbe. Assim ele sai de `meuCasal`, que já
 * passa pela policy de select — nunca atravessa a rede vindo de fora.
 */
export async function salvarRegraDoCasal(
  client: Client,
  regra: Database["public"]["Enums"]["split_rule"],
): Promise<void> {
  const casal = await meuCasal(client);
  if (!casal) throw new Error("Você ainda não tem um plano por aqui");

  const { data, error } = await client
    .from("couples")
    .update({ split_rule: regra })
    .eq("id", casal.id)
    .select("id");

  if (error) throw error;
  // Zero linhas é RLS dizendo "esse casal não é seu". Sem esta checagem, a
  // tela mostraria a regra nova e o banco guardaria a antiga.
  if (!data?.length) throw new Error("Nenhum plano para atualizar");
}
