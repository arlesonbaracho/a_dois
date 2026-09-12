"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Campo, Cartao, Enviar, Recado, Saida, type EstadoForm } from "@/components/form-ui";

import { acaoPedirNovaSenha } from "../actions";

export default function RecuperarSenha() {
  const [estado, acao] = useActionState<EstadoForm, FormData>(acaoPedirNovaSenha, {});

  return (
    <Cartao titulo="Esqueceu a senha?" subtitulo="Acontece. A gente manda um link para você escolher outra.">
      <form action={acao} className="flex flex-col gap-4">
        <Campo rotulo="E-mail" name="email" type="email" autoComplete="email" required />
        <Recado aviso={estado.aviso} />
        <Enviar>Mandar o link</Enviar>
      </form>

      <Link href="/login" className="self-start">
        <Saida>Voltar para o login</Saida>
      </Link>
    </Cartao>
  );
}
