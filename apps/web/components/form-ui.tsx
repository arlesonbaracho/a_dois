"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { APP_NAME } from "@repo/core";

import { IconeOlho } from "./icones";

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
 * Carrega a marca no topo, e o rodapé é fixo — o botão principal e a saída
 * ficam no alcance do polegar, não no fim de uma rolagem. Antes eram seis
 * telas de superfície vazia com um título no meio, e é a primeira coisa que
 * alguém vê do produto.
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
        <span className="inline-block rounded-full bg-tinta px-4 py-2 font-corpo text-[11.5px] font-semibold tracking-[0.14em] text-creme">
          {APP_NAME.toUpperCase()}
        </span>
      </p>
      <div className="flex flex-1 flex-col gap-6">
        <div>
          <h1 className="max-w-[22ch] text-[21px] font-semibold leading-tight tracking-[-0.03em]">
            {titulo}
          </h1>
          <p className="mt-2 max-w-[34ch] font-corpo text-[12.5px] leading-relaxed text-suave">
            {subtitulo}
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}

export function Campo({ rotulo, ...props }: { rotulo: string } & ComponentProps<"input">) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-corpo text-[11.5px] font-semibold text-suave-forte">{rotulo}</span>
      <input
        {...props}
        className="rounded-bloco border border-contorno/60 bg-white px-4 py-3 text-base text-tinta placeholder:text-suave focus:border-verde"
      />
    </label>
  );
}

/**
 * O campo de senha, com o olho.
 *
 * O rótulo do botão nunca contém a palavra "senha": `getByLabel("Senha")` faz
 * casamento por substring, e um botão chamado "Mostrar a senha" faria a suíte
 * e2e encontrar dois controles onde deveria haver um.
 */
export function CampoSenha({ rotulo, ...props }: { rotulo: string } & ComponentProps<"input">) {
  const [aberto, setAberto] = useState(false);
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-corpo text-[11.5px] font-semibold text-suave-forte">{rotulo}</span>
      <span className="flex items-center rounded-bloco border border-contorno/60 bg-white pr-1.5 focus-within:border-verde">
        <input
          {...props}
          type={aberto ? "text" : "password"}
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-tinta outline-none placeholder:text-suave"
        />
        <button
          type="button"
          onClick={() => setAberto((estava) => !estava)}
          aria-label={aberto ? "Esconder o que digitei" : "Ver o que digitei"}
          aria-pressed={aberto}
          className="grid size-10 flex-none place-items-center rounded-full text-suave-forte transition-colors hover:bg-areia"
        >
          <IconeOlho cortado={!aberto} className="size-5" />
        </button>
      </span>
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
      <span className="font-corpo text-[11.5px] font-semibold text-suave-forte">{rotulo}</span>
      <select
        {...props}
        className="rounded-bloco border border-contorno/60 bg-white px-4 py-3 text-base text-tinta focus:border-verde"
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
      <input {...props} type="checkbox" className="mt-0.5 size-4 accent-verde" />
      <span>
        <span className="block text-[13.5px] font-semibold">{rotulo}</span>
        <span className="mt-0.5 block font-corpo text-[12px] leading-relaxed text-suave">
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
export function Enviar({
  children,
  pendente,
  largo = false,
}: {
  children: ReactNode;
  pendente?: boolean;
  /** Ocupa a linha inteira — é a forma do botão de rodapé do v2. */
  largo?: boolean;
}) {
  const { pending } = useFormStatus();
  const ocupado = pendente ?? pending;
  return (
    <button
      type="submit"
      disabled={ocupado}
      className={`rounded-full bg-tinta px-5 py-4 text-[13.5px] font-semibold text-creme transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 ${
        largo ? "w-full" : ""
      }`}
    >
      {ocupado ? "Um instante…" : children}
    </button>
  );
}

/** Botão secundário: mesma pílula, contorno em vez de peso. */
export function Secundario({
  children,
  ...props
}: { children: ReactNode } & ComponentProps<"button">) {
  return (
    <button
      {...props}
      className="rounded-full border border-contorno/60 bg-white px-4 py-2.5 text-[12.5px] font-semibold text-tinta transition hover:border-contorno active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
    >
      {children}
    </button>
  );
}

/**
 * A pílula do que não volta.
 *
 * Contorno e não preenchimento: apagar e sair precisam do peso de aviso, não
 * do peso de botão principal — o preenchido em `alerta` fica reservado à
 * confirmação final em /perfil.
 */
export function Perigo({
  children,
  ...props
}: { children: ReactNode } & ComponentProps<"button">) {
  return (
    <button
      {...props}
      className="self-start rounded-full border border-alerta/40 px-4 py-2.5 font-corpo text-[12.5px] font-semibold text-alerta transition hover:bg-alerta-suave active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
    >
      {children}
    </button>
  );
}

/**
 * O link de rodapé das telas de porta.
 *
 * Eram `text-sm underline` soltos — 14px na fonte de display, que é a voz do
 * que o app afirma, para uma frase que é conversa.
 */
export function Saida({ children }: { children: ReactNode }) {
  return (
    <span className="font-corpo text-[12.5px] font-semibold text-verde underline transition-colors hover:text-tinta">
      {children}
    </span>
  );
}

export function Recado({ erro, aviso }: EstadoForm) {
  if (!erro && !aviso) return null;
  return (
    <p
      role="status"
      className={`rounded-bloco px-4 py-3 font-corpo text-[12.5px] leading-relaxed ${
        erro ? "bg-alerta-suave text-alerta" : "bg-salvia text-tinta"
      }`}
    >
      {erro ?? aviso}
    </p>
  );
}
