import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

type Client = SupabaseClient<Database>;

export type CanalConvite = Database["public"]["Enums"]["invite_channel"];
export type StatusConvite = Database["public"]["Enums"]["invite_status"];
export type Convite = Database["public"]["Tables"]["couple_invites"]["Row"];

/** O que a tela de confirmação mostra. O e-mail já chega mascarado do banco. */
export type PedidoPendente =
  Database["public"]["Functions"]["pending_claim"]["Returns"][number];

// As funções do banco devolvem código em vez de levantar exceção, porque
// exceção desfaz a transação e leva junto a batida de rate limit. O banco
// devolve text; a união vive aqui, na fronteira, que é onde ela é verificável.
export type ResultadoCriacao =
  | "ok"
  | "limite"
  | "sem_plano"
  | "plano_cheio"
  | "convites_demais"
  | "email_invalido"
  | "email_proprio"
  | "apelido_nao_encontrado";

export type ResultadoReivindicacao =
  | "ok"
  | "limite"
  | "indisponivel"
  | "ja_tem_parceiro"
  | "plano_com_movimentacao";

/** Devolve o token em claro uma única vez. Depois disso só existe o hash. */
export async function criarConvite(
  client: Client,
  canal: CanalConvite,
  alvo?: { email?: string; apelido?: string },
): Promise<{ resultado: ResultadoCriacao; token: string | null }> {
  const { data, error } = await client.rpc("create_invite", {
    p_channel: canal,
    p_email: alvo?.email ?? undefined,
    p_nickname: alvo?.apelido ?? undefined,
  });
  if (error) throw error;

  const linha = data?.[0];
  return {
    resultado: (linha?.resultado ?? "limite") as ResultadoCriacao,
    token: linha?.token ?? null,
  };
}

/** Reivindicar não concede acesso nenhum: só registra que alguém apareceu. */
export async function reivindicarConvite(
  client: Client,
  token: string,
): Promise<ResultadoReivindicacao> {
  const { data, error } = await client.rpc("claim_invite", { p_token: token });
  if (error) throw error;
  return (data ?? "indisponivel") as ResultadoReivindicacao;
}

// O couple_id vem por parâmetro porque a policy de select alcança também o
// convite que a própria pessoa reivindicou no casal de outra gente — sem o
// filtro, a tela do parceiro misturaria os dois lados.
export async function convitesAtivos(client: Client, coupleId: string): Promise<Convite[]> {
  const { data, error } = await client
    .from("couple_invites")
    .select("*")
    .eq("couple_id", coupleId)
    .in("status", ["pending", "claimed"])
    .order("created_at");

  if (error) throw error;
  return data ?? [];
}

export async function pedidosPendentes(client: Client): Promise<PedidoPendente[]> {
  const { data, error } = await client.rpc("pending_claim");
  if (error) throw error;
  return data ?? [];
}

/** O pedido que a própria pessoa fez, para a tela de "esperando confirmação". */
export async function meuPedido(client: Client, userId: string): Promise<Convite | null> {
  const { data, error } = await client
    .from("couple_invites")
    .select("*")
    .eq("claimed_by_user_id", userId)
    .eq("status", "claimed")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function confirmarPedido(client: Client, conviteId: string): Promise<void> {
  const { error } = await client.rpc("confirm_invite", { p_invite_id: conviteId });
  if (error) throw error;
}

export async function recusarPedido(client: Client, conviteId: string): Promise<void> {
  const { error } = await client.rpc("reject_invite", { p_invite_id: conviteId });
  if (error) throw error;
}

export async function revogarConvite(client: Client, conviteId: string): Promise<void> {
  const { error } = await client.rpc("revoke_invite", { p_invite_id: conviteId });
  if (error) throw error;
}
