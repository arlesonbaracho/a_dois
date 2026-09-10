"use client";

import { useActionState } from "react";

import { SENHA_MINIMA } from "@repo/core";

import { Campo, Cartao, Enviar, Recado, type EstadoForm } from "@/components/form-ui";

import { acaoTrocarSenha } from "../actions";

export default function NovaSenha() {
  const [estado, acao] = useActionState<EstadoForm, FormData>(acaoTrocarSenha, {});

  return (
    <Cartao titulo="Escolha a nova senha" subtitulo="Depois disso você já entra direto.">
      <form action={acao} className="flex flex-col gap-4">
        <Campo
          rotulo={`Nova senha (mínimo ${SENHA_MINIMA} caracteres)`}
          name="senha"
          type="password"
          autoComplete="new-password"
          minLength={SENHA_MINIMA}
          required
        />
        <Recado erro={estado.erro} />
        <Enviar>Salvar senha</Enviar>
      </form>
    </Cartao>
  );
}
