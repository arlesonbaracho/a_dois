"use client";

import { useActionState } from "react";

import type { Perfil } from "@repo/api";

import { Campo, Cartao, Enviar, Interruptor, Recado, type EstadoForm } from "@/components/form-ui";

import { acaoSalvarPerfil } from "./actions";

export function FormPerfil({ perfil }: { perfil: Perfil | null }) {
  const [estado, acao] = useActionState<EstadoForm, FormData>(acaoSalvarPerfil, {});

  return (
    <Cartao
      titulo="Seu perfil"
      subtitulo="É isto que a outra pessoa vê ao te convidar, ou ao te achar pelo apelido."
    >
      <form action={acao} className="flex flex-col gap-4">
        <Campo
          rotulo="Como você quer aparecer"
          name="display_name"
          defaultValue={perfil?.display_name ?? ""}
          maxLength={80}
          autoComplete="nickname"
        />
        <Campo
          rotulo="Apelido (opcional)"
          name="nickname"
          defaultValue={perfil?.nickname ?? ""}
          placeholder="3 a 20, letras minúsculas, números e _"
          maxLength={20}
          autoComplete="off"
        />
        <Interruptor
          name="discoverable"
          defaultChecked={perfil?.discoverable_by_nickname ?? true}
          rotulo="Deixar que me achem pelo apelido"
          descricao="Só quem digitar seu apelido inteiro, exatamente igual. Nunca por parte dele, e nunca em lista."
        />
        <Recado erro={estado.erro} aviso={estado.aviso} />
        <Enviar>Salvar</Enviar>
      </form>

      <p className="text-sm text-stone-600">
        O apelido é um nome que você escolhe, não o seu e-mail. Ele fica visível
        para quem souber digitá-lo — então evite usar algo que te identifique
        fora daqui.
      </p>
    </Cartao>
  );
}
