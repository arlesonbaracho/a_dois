"use client";

import { useActionState } from "react";

import { SENHA_MINIMA } from "@repo/core";

import { CampoSenha, Cartao, Enviar, Recado, type EstadoForm } from "@/components/form-ui";

import { acaoTrocarSenha } from "../actions";

export default function NovaSenha() {
  const [estado, acao] = useActionState<EstadoForm, FormData>(acaoTrocarSenha, {});

  return (
    <Cartao titulo="Escolha a nova senha" subtitulo="Depois disso você já entra direto.">
      <form action={acao} className="flex flex-1 flex-col gap-4">
        <CampoSenha
          rotulo={`Nova senha (mínimo ${SENHA_MINIMA} caracteres)`}
          name="senha"
          autoComplete="new-password"
          minLength={SENHA_MINIMA}
          required
        />
        <Recado erro={estado.erro} />
        <div className="mt-auto pb-2 pt-6">
          <Enviar largo>Salvar senha</Enviar>
        </div>
      </form>
    </Cartao>
  );
}
