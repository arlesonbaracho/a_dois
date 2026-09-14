"use client";

import Link from "next/link";
import { useActionState } from "react";

import { SENHA_MINIMA } from "@repo/core";

import {
  Campo,
  CampoSenha,
  Cartao,
  Enviar,
  Recado,
  Saida,
  type EstadoForm,
} from "@/components/form-ui";

import { acaoCadastrar } from "../actions";

export default function Cadastro() {
  const [estado, acao] = useActionState<EstadoForm, FormData>(acaoCadastrar, {});

  return (
    <Cartao
      titulo="Vamos começar"
      subtitulo="Crie sua conta. Quem divide o plano com você entra depois, por convite."
    >
      <form action={acao} className="flex flex-1 flex-col gap-4">
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
        <CampoSenha
          rotulo={`Senha (mínimo ${SENHA_MINIMA} caracteres)`}
          name="senha"
          autoComplete="new-password"
          minLength={SENHA_MINIMA}
          required
        />
        <Recado erro={estado.erro} aviso={estado.aviso} />

        <p className="mt-auto pt-6 font-corpo text-[11px] leading-relaxed text-suave">
          A gente não pede CPF, endereço nem data de nascimento. Nunca pediu, e
          não é por esquecimento.{" "}
          {/* Aqui, e não só no perfil: é neste instante que a pessoa decide
              entregar o e-mail dela, e é antes de decidir que ela precisa
              poder ler o que a gente guarda. */}
          <Link href="/privacidade">
            <Saida>O que a gente guarda</Saida>
          </Link>
        </p>
        <Enviar largo>Criar conta</Enviar>
        <p className="pb-2 text-center font-corpo text-[12px] text-suave">
          Já tem conta?{" "}
          <Link href="/login">
            <Saida>Entrar</Saida>
          </Link>
        </p>
      </form>
    </Cartao>
  );
}
