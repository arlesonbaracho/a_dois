import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

type Client = SupabaseClient<Database>;

export type Perfil = Database["public"]["Tables"]["profiles"]["Row"];

/** O que a busca por apelido devolve: três colunas, nunca o e-mail. */
export type PessoaEncontrada =
  Database["public"]["Functions"]["find_by_nickname"]["Returns"][number];

// O user_id vem por parâmetro porque a policy de select alcança também o
// perfil de quem divide casal: sem o filtro, "o meu perfil" viraria dois.
export async function meuPerfil(client: Client, userId: string): Promise<Perfil | null> {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Os perfis que a policy alcança: o seu e o de quem divide o casal com você.
 * Sem filtro, porque é exatamente isso que profiles_select já devolve.
 */
export async function perfisDoCasal(client: Client): Promise<Perfil[]> {
  const { data, error } = await client.from("profiles").select("*");
  if (error) throw error;
  return data ?? [];
}

export async function salvarPerfil(
  client: Client,
  dados: { displayName: string | null; nickname: string | null; discoverable: boolean },
): Promise<void> {
  const { error } = await client.rpc("set_profile", {
    p_display_name: dados.displayName ?? "",
    p_nickname: dados.nickname ?? "",
    p_discoverable: dados.discoverable,
  });
  if (error) throw error;
}

/** Match exato. Nada de prefixo: busca parcial vira varredura de usuários. */
export async function procurarPorApelido(
  client: Client,
  apelido: string,
): Promise<PessoaEncontrada | null> {
  const { data, error } = await client.rpc("find_by_nickname", { p_nickname: apelido });
  if (error) throw error;
  return data?.[0] ?? null;
}
