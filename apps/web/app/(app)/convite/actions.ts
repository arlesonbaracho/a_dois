"use server";

import { revalidatePath } from "next/cache";

import { reivindicarConvite, salvarPerfil, type ResultadoReivindicacao } from "@repo/api";

import type { EstadoForm } from "@/components/form-ui";
import { mensagemDoBanco } from "@/lib/erro";
import { criarClienteServidor } from "@/lib/supabase/server";

// Recusa e revogação chegam aqui como "indisponivel", igual a token inventado
// ou vencido: quem reivindicou não descobre o que aconteceu do outro lado.
const RECADO: Record<Exclude<ResultadoReivindicacao, "ok">, string> = {
  indisponivel: "Esse convite não está mais disponível.",
  limite: "Muitas tentativas. Tenta de novo daqui a pouco.",
  ja_tem_parceiro: "Você já divide um plano com outra pessoa.",
  plano_com_movimentacao:
    "Seu plano já tem movimentação. Entrar em outro deixaria esses dados para trás, então preferimos parar aqui.",
};

export async function acaoReivindicar(
  _anterior: EstadoForm,
  form: FormData,
): Promise<EstadoForm> {
  const token = form.get("token");
  if (typeof token !== "string" || token === "") {
    return { erro: RECADO.indisponivel };
  }

  const supabase = await criarClienteServidor();

  // O nome vai junto porque é o que a outra pessoa vai ver na hora de
  // confirmar. Sem ele, o cartão de confirmação diz "não informou".
  const nome = form.get("display_name");
  if (typeof nome === "string" && nome.trim() !== "") {
    try {
      await salvarPerfil(supabase, {
        displayName: nome,
        nickname: null,
        discoverable: true,
      });
    } catch {
      // Nome é acessório: se não gravar, o pedido segue mesmo assim.
    }
  }

  let resultado: ResultadoReivindicacao;
  try {
    resultado = await reivindicarConvite(supabase, token);
  } catch (erro) {
    return { erro: mensagemDoBanco(erro, "Não rolou agora. Tenta de novo daqui a pouco?") };
  }

  if (resultado !== "ok") return { erro: RECADO[resultado] };

  revalidatePath("/convite");
  return { aviso: "Pedido enviado." };
}
