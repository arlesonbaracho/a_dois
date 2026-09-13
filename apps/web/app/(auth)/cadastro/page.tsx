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

      <div className="flex flex-col gap-2">
        <Link href="/login" className="text-sm underline">
          Já tenho conta
        </Link>
        {/* Aqui, e não só no perfil: é neste instante que a pessoa decide
            entregar o e-mail dela, e é antes de decidir que ela precisa poder
            ler o que a gente guarda. */}
        <Link href="/privacidade" className="font-corpo text-[12.5px] text-suave underline">
          O que a gente guarda, e o que não guarda
        </Link>
      </div>
    </Cartao>
  );
}
