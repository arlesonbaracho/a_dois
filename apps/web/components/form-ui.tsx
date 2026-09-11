"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";

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

export function Cartao({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.035em]">{titulo}</h1>
        <p className="mt-1.5 font-corpo text-[13.5px] leading-relaxed text-suave-forte">
          {subtitulo}
        </p>
      </div>
      {children}
    </main>
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
      className="rounded-full bg-tinta px-5 py-3.5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
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
      className="rounded-full border border-borda bg-transparent px-4 py-2.5 text-[12.5px] font-semibold text-tinta transition-colors hover:bg-white disabled:opacity-50"
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
