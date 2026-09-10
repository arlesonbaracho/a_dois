import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

type Client = SupabaseClient<Database>;

/**
 * Motivo de falha que a UI sabe traduzir. Não é o erro do Supabase: é o que
 * decidimos contar para quem está do outro lado.
 */
export type FalhaAuth = "credenciais" | "senha_fraca" | "desconhecida";

/**
 * Entra com e-mail e senha.
 *
 * Devolve sempre "credenciais" quando falha, e é de propósito: distinguir
 * "esse e-mail não existe" de "a senha está errada" transforma a tela de login
 * num oráculo que confirma quem tem conta aqui. A normalização mora nesta
 * função, e não na tela, para que nenhum chamador futuro consiga vazar isso
 * por esquecimento.
 */
export async function entrar(
  client: Client,
  email: string,
  senha: string,
): Promise<FalhaAuth | null> {
  const { error } = await client.auth.signInWithPassword({ email, password: senha });
  return error ? "credenciais" : null;
}

/**
 * Cadastra e dispara o e-mail de confirmação.
 *
 * Também não confirma se o e-mail já existia: o Supabase devolve sucesso com
 * um usuário fantasma nesse caso, e quem chama daqui deve mostrar a mesma
 * mensagem dos dois jeitos.
 */
export async function cadastrar(
  client: Client,
  email: string,
  senha: string,
  redirecionarPara: string,
): Promise<FalhaAuth | null> {
  const { error } = await client.auth.signUp({
    email,
    password: senha,
    options: { emailRedirectTo: redirecionarPara },
  });
  if (!error) return null;
  return error.code === "weak_password" ? "senha_fraca" : "desconhecida";
}

export async function sair(client: Client): Promise<void> {
  await client.auth.signOut();
}

/**
 * Pede o e-mail de troca de senha. Não devolve falha nenhuma: se devolvesse,
 * seria o mesmo oráculo de enumeração pela porta dos fundos.
 */
export async function pedirNovaSenha(
  client: Client,
  email: string,
  redirecionarPara: string,
): Promise<void> {
  await client.auth.resetPasswordForEmail(email, { redirectTo: redirecionarPara });
}

export async function trocarSenha(
  client: Client,
  senha: string,
): Promise<FalhaAuth | null> {
  const { error } = await client.auth.updateUser({ password: senha });
  if (!error) return null;
  return error.code === "weak_password" ? "senha_fraca" : "desconhecida";
}

/** getUser, e não getSession: só ele confere o token contra o servidor de auth. */
export async function usuarioAtual(client: Client) {
  const { data } = await client.auth.getUser();
  return data.user;
}
