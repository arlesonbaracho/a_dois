"use server";

import { revalidatePath } from "next/cache";

import { salvarPerfil } from "@repo/api";

import type { EstadoForm } from "@/components/form-ui";
import { mensagemDoBanco } from "@/lib/erro";
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
