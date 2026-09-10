"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import {
  confirmarPedido,
  criarConvite,
  recusarPedido,
  revogarConvite,
  type CanalConvite,
  type ResultadoCriacao,
} from "@repo/api";

import type { EstadoForm } from "@/components/form-ui";
import { mensagemDoBanco } from "@/lib/erro";
import { criarClienteServidor } from "@/lib/supabase/server";

/** O link só existe nesta resposta: depois dela, o banco só tem o hash. */
export type EstadoConvite = EstadoForm & { link?: string };

const RECADO: Record<Exclude<ResultadoCriacao, "ok">, string> = {
  limite: "Muitos convites nesta hora. Respira e tenta de novo daqui a pouco.",
  sem_plano: "Você ainda não tem um plano para convidar alguém.",
  plano_cheio: "Este plano já é de duas pessoas.",
  convites_demais: "Já são três convites em aberto. Cancele um antes de criar outro.",
  email_invalido: "Confere o e-mail?",
  email_proprio: "Esse é o seu próprio e-mail.",
  apelido_nao_encontrado: "Não encontramos ninguém com esse apelido.",
};

export async function acaoCriarConvite(
  _anterior: EstadoConvite,
  form: FormData,
): Promise<EstadoConvite> {
  const canal = form.get("canal") as CanalConvite;
  if (canal !== "email" && canal !== "nickname" && canal !== "link") {
    return { erro: "Escolhe um jeito de convidar." };
  }

  const texto = (campo: string) => {
    const valor = form.get(campo);
    return typeof valor === "string" ? valor.trim() : undefined;
  };

  const supabase = await criarClienteServidor();

  let saida;
  try {
    saida = await criarConvite(supabase, canal, {
      email: texto("email"),
      apelido: texto("apelido"),
    });
  } catch (erro) {
    return { erro: mensagemDoBanco(erro, "Não rolou agora. Tenta de novo daqui a pouco?") };
  }

  if (saida.resultado !== "ok" || !saida.token) {
    return { erro: RECADO[saida.resultado as Exclude<ResultadoCriacao, "ok">] };
  }

  const cabecalhos = await headers();
  const origem = cabecalhos.get("origin") ?? `https://${cabecalhos.get("host")}`;

  revalidatePath("/parceiro");
  return {
    aviso: "Convite criado. Mande o link para a pessoa — ele só aparece aqui uma vez.",
    link: `${origem}/convite?t=${encodeURIComponent(saida.token)}`,
  };
}

/**
 * Confirmar, recusar e revogar num lugar só.
 *
 * O botão que foi clicado manda o próprio name/value no FormData — HTML puro,
 * sem precisar de três estados de formulário na tela.
 */
export async function acaoPedido(
  _anterior: EstadoForm,
  form: FormData,
): Promise<EstadoForm> {
  const acao = form.get("acao");
  const id = form.get("id");
  if (typeof id !== "string") return { erro: "Pedido não encontrado." };

  const supabase = await criarClienteServidor();

  try {
    if (acao === "confirmar") await confirmarPedido(supabase, id);
    else if (acao === "recusar") await recusarPedido(supabase, id);
    else if (acao === "revogar") await revogarConvite(supabase, id);
    else return { erro: "Ação desconhecida." };
  } catch (erro) {
    return { erro: mensagemDoBanco(erro, "Não rolou agora. Tenta de novo daqui a pouco?") };
  }

  revalidatePath("/parceiro");
  revalidatePath("/");

  return {
    aviso:
      acao === "confirmar"
        ? "Pronto: o plano agora é de vocês dois."
        : "Feito. O convite não vale mais.",
  };
}
