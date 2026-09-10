"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { cadastrar, entrar, pedirNovaSenha, sair, trocarSenha } from "@repo/api";
import { credenciaisSchema, emailSchema, senhaSchema, SENHA_MINIMA } from "@repo/core";

import type { EstadoForm } from "@/components/form-ui";
import { criarClienteServidor } from "@/lib/supabase/server";

// A mesma frase para senha errada, e-mail que não existe e e-mail mal
// formatado. Qualquer diferença entre esses três casos conta para quem está
// tentando adivinhar se alguém tem conta aqui.
const ERRO_CREDENCIAIS = "E-mail ou senha inválidos.";
const ERRO_SENHA_CURTA = `A senha precisa de pelo menos ${SENHA_MINIMA} caracteres.`;
const ERRO_GENERICO = "Não rolou agora. Tenta de novo daqui a pouco?";

async function origem() {
  const cabecalhos = await headers();
  return cabecalhos.get("origin") ?? `https://${cabecalhos.get("host")}`;
}

// "proxima" vem da URL, ou seja, de quem clicou no link. Sem esta peneira,
// /login?proxima=https://site-falso vira redirect aberto com a nossa cara.
function destinoSeguro(bruto: FormDataEntryValue | null): string {
  const valor = typeof bruto === "string" ? bruto : "";
  return valor.startsWith("/") && !valor.startsWith("//") ? valor : "/";
}

export async function acaoEntrar(_anterior: EstadoForm, form: FormData): Promise<EstadoForm> {
  const dados = credenciaisSchema.safeParse({
    email: form.get("email"),
    senha: form.get("senha"),
  });
  if (!dados.success) return { erro: ERRO_CREDENCIAIS };

  const supabase = await criarClienteServidor();
  if (await entrar(supabase, dados.data.email, dados.data.senha)) {
    return { erro: ERRO_CREDENCIAIS };
  }

  redirect(destinoSeguro(form.get("proxima")));
}

export async function acaoCadastrar(_anterior: EstadoForm, form: FormData): Promise<EstadoForm> {
  const dados = credenciaisSchema.safeParse({
    email: form.get("email"),
    senha: form.get("senha"),
  });
  if (!dados.success) {
    const problema = dados.error.issues[0];
    return {
      erro: problema?.path[0] === "senha" ? ERRO_SENHA_CURTA : "Confere o e-mail?",
    };
  }

  const supabase = await criarClienteServidor();
  const falha = await cadastrar(
    supabase,
    dados.data.email,
    dados.data.senha,
    `${await origem()}/auth/confirm`,
  );
  if (falha === "senha_fraca") return { erro: ERRO_SENHA_CURTA };
  if (falha) return { erro: ERRO_GENERICO };

  // Mesma resposta para e-mail novo e para e-mail que já tinha conta.
  return { aviso: "Se esse e-mail for novo por aqui, o link de confirmação já está a caminho." };
}

export async function acaoPedirNovaSenha(
  _anterior: EstadoForm,
  form: FormData,
): Promise<EstadoForm> {
  const email = emailSchema.safeParse(form.get("email"));
  const aviso = "Se esse e-mail estiver cadastrado, o link já está a caminho.";
  if (!email.success) return { aviso };

  const supabase = await criarClienteServidor();
  await pedirNovaSenha(supabase, email.data, `${await origem()}/auth/confirm`);
  return { aviso };
}

export async function acaoTrocarSenha(
  _anterior: EstadoForm,
  form: FormData,
): Promise<EstadoForm> {
  const senha = senhaSchema.safeParse(form.get("senha"));
  if (!senha.success) return { erro: ERRO_SENHA_CURTA };

  const supabase = await criarClienteServidor();
  const falha = await trocarSenha(supabase, senha.data);
  if (falha === "senha_fraca") return { erro: ERRO_SENHA_CURTA };
  if (falha) return { erro: "Esse link já venceu. Pede outro e a gente manda na hora." };

  redirect("/");
}

export async function acaoSair() {
  const supabase = await criarClienteServidor();
  await sair(supabase);
  redirect("/login");
}
