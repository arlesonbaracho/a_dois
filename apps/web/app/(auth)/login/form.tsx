"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  Campo,
  CampoSenha,
  Cartao,
  Enviar,
  Recado,
  Saida,
  type EstadoForm,
} from "@/components/form-ui";

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
    <Cartao titulo="Bem-vindos de volta" subtitulo="O plano de vocês continua de onde parou.">
      <form action={acao} className="flex flex-1 flex-col gap-4">
        <input type="hidden" name="proxima" value={proxima} />
        <Campo
          rotulo="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          required
          // O React reseta o formulário depois da ação; o defaultValue novo é
          // onde esse reset cai.
          defaultValue={estado.email ?? ""}
        />
        <CampoSenha rotulo="Senha" name="senha" autoComplete="current-password" required />
        <Link href="/recuperar-senha" className="-mt-1 self-end">
          <Saida>Esqueci minha senha</Saida>
        </Link>

        <Recado erro={estado.erro} aviso={estado.aviso} />

        {/* A promessa que o produto inteiro sustenta, dita na porta. */}
        <p className="mt-auto pt-6 font-corpo text-[12px] leading-relaxed text-suave">
          Ninguém entra no plano de vocês sem a sua confirmação, nem por link.
        </p>
        <Enviar largo>Entrar</Enviar>
        <p className="pb-2 text-center font-corpo text-[13px] text-suave">
          Ainda não têm conta?{" "}
          <Link href="/cadastro">
            <Saida>Criar conta</Saida>
          </Link>
        </p>
      </form>
    </Cartao>
  );
}
