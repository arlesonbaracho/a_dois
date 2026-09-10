"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Campo, Cartao, Enviar, Recado, type EstadoForm } from "@/components/form-ui";

import { acaoEntrar } from "../actions";

export function FormLogin({
  proxima,
  erroInicial,
  avisoInicial,
}: {
  proxima: string;
  erroInicial?: string;
  avisoInicial?: string;
}) {
  const [estado, acao] = useActionState<EstadoForm, FormData>(acaoEntrar, {
    erro: erroInicial,
    aviso: avisoInicial,
  });

  return (
    <Cartao titulo="Bem-vindo de volta" subtitulo="O plano de vocês está esperando.">
      <form action={acao} className="flex flex-col gap-4">
        <input type="hidden" name="proxima" value={proxima} />
        <Campo rotulo="E-mail" name="email" type="email" autoComplete="email" required />
        <Campo
          rotulo="Senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
        />
        <Recado erro={estado.erro} aviso={estado.aviso} />
        <Enviar>Entrar</Enviar>
      </form>

      <div className="flex flex-col gap-2 text-sm">
        <Link href="/recuperar-senha" className="underline">
          Esqueci minha senha
        </Link>
        <Link href="/cadastro" className="underline">
          Ainda não temos conta
        </Link>
      </div>
    </Cartao>
  );
}
