"use client";

import Link from "next/link";
import { useActionState } from "react";

import { SENHA_MINIMA } from "@repo/core";

import { Campo, Cartao, Enviar, Recado, type EstadoForm } from "@/components/form-ui";

import { acaoCadastrar } from "../actions";

export default function Cadastro() {
  const [estado, acao] = useActionState<EstadoForm, FormData>(acaoCadastrar, {});

  return (
    <Cartao titulo="Vamos começar" subtitulo="Crie sua conta. O parceiro entra depois, por convite.">
      <form action={acao} className="flex flex-col gap-4">
        <Campo rotulo="E-mail" name="email" type="email" autoComplete="email" required />
        <Campo
          rotulo={`Senha (mínimo ${SENHA_MINIMA} caracteres)`}
          name="senha"
          type="password"
          autoComplete="new-password"
          minLength={SENHA_MINIMA}
          required
        />
        <Recado erro={estado.erro} aviso={estado.aviso} />
        <Enviar>Criar conta</Enviar>
      </form>

      <Link href="/login" className="text-sm underline">
        Já tenho conta
      </Link>
    </Cartao>
  );
}
