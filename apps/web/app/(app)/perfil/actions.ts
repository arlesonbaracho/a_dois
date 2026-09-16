"use server";

import { revalidatePath } from "next/cache";

import { excluirConta, sair, type ResultadoExclusao } from "@repo/api";
import { salvarPerfil } from "@repo/api";
import { mensagemDoBanco } from "@repo/core";

import type { EstadoForm } from "@/components/form-ui";
import { criarClienteServidor } from "@/lib/supabase/server";

export async function acaoSalvarPerfil(
  _anterior: EstadoForm,
  form: FormData,
): Promise<EstadoForm> {
  const texto = (campo: string) => {
    const valor = form.get(campo);
    return typeof valor === "string" ? valor.trim() : "";
  };

  const supabase = await criarClienteServidor();

  // As regras de apelido (formato, reservados, igual ao e-mail, já usado) são
  // do banco. Repeti-las aqui só criaria uma segunda versão para divergir.
  try {
    await salvarPerfil(supabase, {
      displayName: texto("display_name") || null,
      nickname: texto("nickname") || null,
      discoverable: form.get("discoverable") === "on",
    });
  } catch (erro) {
    return { erro: mensagemDoBanco(erro, "Não rolou agora. Tenta de novo daqui a pouco?") };
  }

  revalidatePath("/perfil");
  return { aviso: "Pronto, seu perfil está salvo." };
}

/**
 * Apagar a conta.
 *
 * Server Action, e não chamada do browser, por causa do cookie: o banco derruba
 * as sessões, mas quem apaga o cookie httpOnly é o servidor. Sem isto a pessoa
 * ficaria com um cookie apontando para uma conta que não existe mais.
 *
 * A palavra vai crua para o banco de propósito. Conferir aqui também seria uma
 * segunda cópia da regra, e é a do banco que vale para quem chama a API direto.
 */
export async function acaoExcluirConta(
  palavra: string,
  confirmoApagarPlano: boolean,
): Promise<ResultadoExclusao | "erro"> {
  const supabase = await criarClienteServidor();

  let resultado: ResultadoExclusao;
  try {
    resultado = await excluirConta(supabase, palavra, confirmoApagarPlano);
  } catch {
    return "erro";
  }

  if (resultado === "ok" || resultado === "conta_e_plano_apagados") {
    await sair(supabase);
  }

  return resultado;
}
