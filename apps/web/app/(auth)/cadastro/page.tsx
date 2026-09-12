"use client";

import Link from "next/link";
import { useActionState } from "react";

import { SENHA_MINIMA } from "@repo/core";

import { Campo, Cartao, Enviar, Recado, Saida, type EstadoForm } from "@/components/form-ui";

import { acaoCadastrar } from "../actions";

export default function Cadastro() {
  const [estado, acao] = useActionState<EstadoForm, FormData>(acaoCadastrar, {});

  return (
    <Cartao titulo="Vamos começar" subtitulo="Crie sua conta. O parceiro entra depois, por convite.">
      <form action={acao} className="flex flex-col gap-4">
        {/* Primeiro campo, e opcional: é o que faz a home dizer "oi, Lia" em
            vez de "oi, vocês", e é o nome que seu parceiro vê na hora de
            confirmar quem está entrando no plano. maxLength casa com o corte
            que a trigger faz — quem grava é ela, isto aqui só evita digitar
            o que vai ser cortado. */}
        <Campo
          rotulo="Como você quer ser chamado (opcional)"
          name="nome"
          autoComplete="given-name"
          maxLength={80}
          placeholder="Lia"
        />
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

      <Link href="/login" className="self-start">
        <Saida>Já tenho conta</Saida>
      </Link>
    </Cartao>
  );
}
