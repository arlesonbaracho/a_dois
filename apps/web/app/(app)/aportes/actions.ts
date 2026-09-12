"use server";

import { revalidatePath } from "next/cache";

import {
  registrarAporte,
  salvarMinhaDivisao,
  salvarRegraDoCasal,
  usuarioAtual,
} from "@repo/api";
import { type FaixaRenda, PESO_FAIXA, type RegraDivisao } from "@repo/core";

import type { EstadoForm } from "@/components/form-ui";
import { paraCentavos } from "@/lib/dinheiro";
import { mensagemDoBanco } from "@/lib/erro";
import { criarClienteServidor } from "@/lib/supabase/server";

// Estreitam string solta em união, sem cast: PESO_FAIXA é a lista de faixas
// que o core conhece, e o typecheck reclama se ela divergir do enum do banco.
const ehFaixa = (valor: string): valor is FaixaRenda => valor in PESO_FAIXA;
const ehRegra = (valor: string): valor is RegraDivisao =>
  valor === "igual" || valor === "proporcional" || valor === "fixo";

function texto(form: FormData, campo: string): string {
  const valor = form.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

function centavos(form: FormData, campo: string): number | null {
  return paraCentavos(texto(form, campo));
}

export async function acaoRegistrarAporte(
  _anterior: EstadoForm,
  form: FormData,
): Promise<EstadoForm> {
  const valor = centavos(form, "valor");
  if (valor === null) return { erro: "Escreva quanto você colocou, em reais." };

  const quando = texto(form, "quando");

  const supabase = await criarClienteServidor();

  try {
    await registrarAporte(supabase, {
      goalId: texto(form, "meta"),
      valorCents: valor,
      // Meio-dia em UTC: qualquer fuso do Brasil cai no mesmo dia que a pessoa
      // escolheu no calendário, e nenhum aporte "anda" um dia para trás.
      quandoISO: quando ? `${quando}T12:00:00Z` : undefined,
    });
  } catch (erro) {
    return { erro: mensagemDoBanco(erro, "Não consegui registrar agora. Tenta de novo?") };
  }

  revalidatePath("/aportes");
  revalidatePath("/");
  // Sem valor na mensagem: ela pode virar breadcrumb, e regra 8 vale aqui também.
  return { aviso: "Anotado. Bom trabalho, vocês dois." };
}

export async function acaoSalvarDivisao(
  _anterior: EstadoForm,
  form: FormData,
): Promise<EstadoForm> {
  const regra = texto(form, "regra");
  if (!ehRegra(regra)) return { erro: "Escolha uma das três formas de dividir." };

  const faixa = texto(form, "faixa");
  const supabase = await criarClienteServidor();
  const usuario = await usuarioAtual(supabase);
  if (!usuario) return { erro: "Sua sessão expirou. Entra de novo?" };

  try {
    // Duas escritas, em duas tabelas, porque são dois fatos: como o CASAL
    // divide, e o que ESTA pessoa ganha e coloca. A regra primeiro — é a que a
    // outra pessoa também vê.
    await salvarRegraDoCasal(supabase, regra);
    await salvarMinhaDivisao(supabase, usuario.id, {
      // Qualquer coisa que não seja faixa conhecida vira nulo — inclusive o
      // "prefiro não dizer". A faixa é opcional, e ficar sem ela é resposta.
      faixaRenda: ehFaixa(faixa) ? faixa : null,
      parteFixaCents: centavos(form, "parte_fixa"),
    });
  } catch (erro) {
    return { erro: mensagemDoBanco(erro, "Não consegui salvar agora. Tenta de novo?") };
  }

  revalidatePath("/aportes");
  return { aviso: "Pronto, é assim que vocês dividem." };
}
