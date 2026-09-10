import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

type Client = SupabaseClient<Database>;

export type CanalConvite = Database["public"]["Enums"]["invite_channel"];
export type StatusConvite = Database["public"]["Enums"]["invite_status"];
export type Convite = Database["public"]["Tables"]["couple_invites"]["Row"];

/** Um convite em aberto, como a tela do parceiro o vê: sem e-mail em claro. */
export type ConviteAberto =
  Database["public"]["Functions"]["active_invites"]["Returns"][number];

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

/**
 * Os convites em aberto do casal, para a tela do parceiro.
 *
 * Via RPC, e não select: `invited_email` e `token_hash` saíram do grant de
 * `authenticated` — o e-mail é de um terceiro, e a auditoria achou ele em claro
 * aqui. A função devolve o endereço mascarado, e o casal sai do JWT lá dentro,
 * então o couple_id deixou de ser parâmetro.
 */
export async function convitesAtivos(client: Client): Promise<ConviteAberto[]> {
  const { data, error } = await client.rpc("active_invites");
  if (error) throw error;
  return data ?? [];
}

export async function pedidosPendentes(client: Client): Promise<PedidoPendente[]> {
  const { data, error } = await client.rpc("pending_claim");
  if (error) throw error;
  return data ?? [];
}

/**
 * O pedido que a própria pessoa fez, para a tela de "esperando confirmação".
 *
 * Só o id: quem chama usa isto como "já pediu?", e `select *` passaria por
 * cima das colunas que saíram do grant.
 */
export async function meuPedido(client: Client, userId: string): Promise<{ id: string } | null> {
  const { data, error } = await client
    .from("couple_invites")
    .select("id")
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
