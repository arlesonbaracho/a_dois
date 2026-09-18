import type { SupabaseClient } from "@supabase/supabase-js";

import { apagarPastaDaCapa } from "./capas";
import type { Database } from "./database.types";

type Client = SupabaseClient<Database>;

export type Meta = Database["public"]["Tables"]["goals"]["Row"];
export type Prioridade = Database["public"]["Enums"]["goal_priority"];

/** O que delete_goal responde. 'precisa_confirmar' é resposta, não erro. */
export type ResultadoApagarMeta = "ok" | "precisa_confirmar" | "nao_encontrada";

export type DadosMeta = {
  titulo: string;
  alvoCents: number;
  categoria: string;
  prazoISO: string | null;
  prioridade: Prioridade;
};

/**
 * As metas do casal.
 *
 * Sem filtro por couple_id, como em couple.ts: a policy goals_select já reduz a
 * tabela à lista de casais do auth.uid().
 */
export async function metas(client: Client): Promise<Meta[]> {
  // A prioridade ordena o álbum, e quem ordena é o banco. O enum
  // `goal_priority` foi declarado como ('baixa', 'media', 'alta'), e Postgres
  // ordena enum pela ordem de declaração — então descendente põe "É o que a
  // gente mais quer" primeiro, sem função de comparação nenhuma no cliente.
  //
  // Até aqui o campo era gravado e nunca lido: a pessoa escolhia a prioridade
  // e o app ignorava. Pedir uma decisão e ignorá-la é pior que não perguntar.
  const { data, error } = await client
    .from("goals")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function meta(client: Client, goalId: string): Promise<Meta | null> {
  const { data, error } = await client
    .from("goals")
    .select("*")
    .eq("id", goalId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Cria meta. Via RPC porque insert direto exigiria o couple_id no corpo da
 * requisição, e ele vem do JWT — a policy de insert nega justamente por isso.
 */
export async function criarMeta(client: Client, dados: DadosMeta): Promise<string> {
  const { data, error } = await client.rpc("add_goal", {
    p_title: dados.titulo,
    p_target_amount_cents: dados.alvoCents,
    p_category: dados.categoria,
    // O tipo gerado marca os parâmetros com default como opcionais, não
    // como anuláveis: mandar undefined é o que faz o default do SQL valer.
    p_deadline_at: dados.prazoISO ?? undefined,
    p_priority: dados.prioridade,
  });
  if (error) throw error;
  return data;
}

/**
 * Edita meta. Update direto, e pode ser: a policy de update confere o casal nos
 * dois lados, e nenhum couple_id novo atravessa a rede.
 */
export async function salvarMeta(
  client: Client,
  goalId: string,
  dados: DadosMeta,
): Promise<void> {
  const { error } = await client
    .from("goals")
    .update({
      title: dados.titulo,
      target_amount_cents: dados.alvoCents,
      category: dados.categoria,
      deadline_at: dados.prazoISO,
      priority: dados.prioridade,
    })
    .eq("id", goalId);

  if (error) throw error;
}

/**
 * Apaga meta. Com dinheiro dentro devolve 'precisa_confirmar' e não apaga nada:
 * quem chama mostra o aviso e chama de novo com `confirmo`.
 */
export async function apagarMeta(
  client: Client,
  goalId: string,
  confirmo = false,
): Promise<ResultadoApagarMeta> {
  const { data, error } = await client.rpc("delete_goal", {
    p_goal_id: goalId,
    p_confirmo_apagar: confirmo,
  });
  if (error) throw error;
  // Só depois do 'ok': com 'precisa_confirmar' nada foi apagado, e a foto fica.
  if (data === "ok") await apagarPastaDaCapa(client, goalId);
  return data as ResultadoApagarMeta;
}
