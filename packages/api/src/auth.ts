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
 * Também não confirma se o e-mail já existia — e isso é trabalho DESTA função,
 * não da tela. O GoTrue responde 422 `user_already_exists` para e-mail que já
 * tem conta, então deixar o erro passar transformaria o cadastro no oráculo de
 * enumeração que o login evita com cuidado: bastava tentar cadastrar um
 * endereço para saber se ele usa o app. Aqui ele vira sucesso, e quem chama
 * mostra a mesma frase dos dois jeitos.
 *
 * (A auditoria de 2026-09-10 achou isto. O comentário antigo dizia que o
 * Supabase devolvia sucesso com um usuário fantasma; não devolve nesta versão.)
 */
export async function cadastrar(
  client: Client,
  email: string,
  senha: string,
  redirecionarPara: string,
  nome?: string,
): Promise<FalhaAuth | null> {
  const { error } = await client.auth.signUp({
    email,
    password: senha,
    options: {
      emailRedirectTo: redirecionarPara,
      // Viaja no raw_user_meta_data e é lido pela trigger on_auth_user_created,
      // que é o único ponto rodando na mesma transação do cadastro. set_profile
      // não serviria: ela exige sessão, e com confirmação de e-mail ligada não
      // existe sessão logo depois do cadastro.
      //
      // A trigger apara e corta antes de gravar, e é lá que a checagem vale:
      // isto aqui é o cliente, e o cliente não é fronteira de confiança.
      data: nome ? { display_name: nome } : undefined,
    },
  });
  if (!error) return null;
  if (error.code === "user_already_exists") return null;
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
