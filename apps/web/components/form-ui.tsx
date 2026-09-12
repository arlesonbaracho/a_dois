"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { APP_NAME } from "@repo/core";

// Peças burras dos formulários: nenhuma delas sabe o que é Supabase.

/**
 * O que uma Server Action devolve para a tela.
 *
 * `email` existe porque o React 19 reseta o formulário depois de TODA ação,
 * inclusive quando ela falha: sem devolver o endereço, quem erra a senha
 * redigita o e-mail a cada tentativa. A senha nunca volta — ela não faz o
 * caminho de volta para o cliente por nada.
 */
export type EstadoForm = { erro?: string; aviso?: string; email?: string };

/**
 * A moldura de toda tela de porta: login, cadastro, senha, convite.
 *
 * Carrega a marca. Antes eram seis telas de creme vazio com um título no
 * meio — a primeira coisa que alguém vê do produto, e a única parte dele que
 * não dizia de quem era. A pílula preta com o nome em limão é o vocabulário
 * que o app já usa para o total; aqui ela assina. Fica no topo, e não colada
 * no título, porque rótulo acima de cabeçalho não é marca, é etiqueta.
 */
export function Cartao({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col p-6">
      <p className="py-6">
        <span className="inline-block rounded-full bg-tinta px-3.5 py-1.5 text-[12px] font-bold tracking-[-0.02em] text-limao">
          {APP_NAME}
        </span>
      </p>
      <div className="flex flex-1 flex-col justify-center gap-6 pb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.035em]">{titulo}</h1>
          <p className="mt-1.5 font-corpo text-[13.5px] leading-relaxed text-suave-forte">
            {subtitulo}
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}

/**
 * O link de rodapé das telas de porta.
 *
 * Eram `text-sm underline` soltos — 14px na fonte de display, que é a voz do
 * que o app afirma, para uma frase que é conversa. Um lugar só, e as seis
 * telas param de divergir.
 */
export function Saida({ children }: { children: ReactNode }) {
  return (
    <span className="font-corpo text-[12.5px] font-semibold text-suave-forte underline transition-colors hover:text-tinta">
      {children}
    </span>
  );
}

export function Campo({
  rotulo,
  ...props
}: { rotulo: string } & ComponentProps<"input">) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-corpo text-[11.5px] font-semibold text-suave-forte">
        {rotulo}
      </span>
      <input
        {...props}
        className="rounded-bloco border border-borda bg-white px-3.5 py-2.5 text-base text-tinta placeholder:text-suave"
      />
    </label>
  );
}

/** Select com a mesma casca do Campo, para os dois não destoarem. */
export function Escolha({
  rotulo,
  children,
  ...props
}: { rotulo: string } & ComponentProps<"select">) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-corpo text-[11.5px] font-semibold text-suave-forte">
        {rotulo}
      </span>
      <select
        {...props}
        className="rounded-bloco border border-borda bg-white px-3.5 py-2.5 text-base text-tinta"
      >
        {children}
      </select>
    </label>
  );
}

export function Interruptor({
  rotulo,
  descricao,
  ...props
}: { rotulo: string; descricao: string } & ComponentProps<"input">) {
  return (
    <label className="flex items-start gap-3">
      <input {...props} type="checkbox" className="mt-0.5 size-4 accent-tinta" />
      <span>
        <span className="block text-[13.5px] font-semibold">{rotulo}</span>
        <span className="mt-0.5 block font-corpo text-[12px] leading-relaxed text-suave-forte">
          {descricao}
        </span>
      </span>
    </label>
  );
}

/**
 * `pendente` existe porque nem todo formulário do app é Server Action: os de
 * jornadas e itens enviam por mutation do TanStack Query, e ali o
 * useFormStatus não tem o que observar. Quem sabe se está ocupado passa; quem
 * não passa cai no useFormStatus, como antes.
 */
export function Enviar({ children, pendente }: { children: ReactNode; pendente?: boolean }) {
  const { pending } = useFormStatus();
  const ocupado = pendente ?? pending;
  return (
    <button
      type="submit"
      disabled={ocupado}
      className="rounded-full bg-tinta px-5 py-3.5 text-[13.5px] font-semibold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
    >
      {ocupado ? "Um instante…" : children}
    </button>
  );
}

/** Botão secundário: mesma pílula, sem o peso da tinta. */
export function Secundario({
  children,
  ...props
}: { children: ReactNode } & ComponentProps<"button">) {
  return (
    <button
      {...props}
      className="rounded-full border border-borda bg-transparent px-4 py-2.5 text-[12.5px] font-semibold text-tinta transition hover:bg-white active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
    >
      {children}
    </button>
  );
}

export function Recado({ erro, aviso }: EstadoForm) {
  if (!erro && !aviso) return null;
  return (
    <p
      role="status"
      className={`rounded-bloco px-3.5 py-2.5 font-corpo text-[12.5px] leading-relaxed ${
        erro ? "bg-alerta-suave text-alerta" : "bg-areia text-corpo"
      }`}
    >
      {erro ?? aviso}
    </p>
  );
}

/**
 * A pílula do que não volta.
 *
 * Contorno e não preenchimento: apagar e sair precisam do peso de aviso, não
 * do peso de botão principal — o preenchido em `alerta` fica reservado à
 * confirmação final, que já existe em /perfil. Antes estas ações eram texto
 * sublinhado solto, indistinguível de um link de rodapé, e a regra da pílula
 * diz que tudo que se clica é pílula.
 */
export function Perigo({
  children,
  ...props
}: { children: ReactNode } & ComponentProps<"button">) {
  return (
    <button
      {...props}
      className="self-start rounded-full border border-alerta/35 px-4 py-2.5 font-corpo text-[12.5px] font-semibold text-alerta transition hover:bg-alerta-suave active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
    >
      {children}
    </button>
  );
}
