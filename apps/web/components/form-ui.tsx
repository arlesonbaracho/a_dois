"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";

// Peças burras dos formulários: nenhuma delas sabe o que é Supabase.

/** O que uma Server Action devolve para a tela. */
export type EstadoForm = { erro?: string; aviso?: string };

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
        <h1 className="text-2xl font-bold">{titulo}</h1>
        <p className="mt-1 text-stone-600">{subtitulo}</p>
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
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">{rotulo}</span>
      <input
        {...props}
        className="rounded-xl border border-stone-300 px-3 py-2 text-base"
      />
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
      <input {...props} type="checkbox" className="mt-1 size-4" />
      <span>
        <span className="block text-sm font-medium">{rotulo}</span>
        <span className="block text-sm text-stone-600">{descricao}</span>
      </span>
    </label>
  );
}

export function Enviar({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-orange-700 px-4 py-2 font-semibold text-orange-50 disabled:opacity-60"
    >
      {pending ? "Um instante…" : children}
    </button>
  );
}

export function Recado({ erro, aviso }: EstadoForm) {
  if (!erro && !aviso) return null;
  return (
    <p
      role="status"
      className={`rounded-xl px-3 py-2 text-sm ${
        erro ? "bg-red-50 text-red-900" : "bg-orange-50 text-orange-900"
      }`}
    >
      {erro ?? aviso}
    </p>
  );
}
