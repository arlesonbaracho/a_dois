"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { APP_NAME } from "@repo/core";

import { IconeOlho } from "./icones";
import { Chapa } from "./pecas";

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
 * Carrega a marca e o leque de cartas — três jornadas do deck abertas na mão,
 * que é o produto inteiro numa imagem antes de qualquer conta existir. O
 * botão principal e a saída ficam no alcance do polegar.
 */
export function Cartao({
  titulo,
  subtitulo,
  porta = true,
  children,
}: {
  titulo: string;
  subtitulo: ReactNode;
  /** Falso quando a moldura é usada DENTRO do app: marca e leque são da porta. */
  porta?: boolean;
  children: ReactNode;
}) {
  if (!porta) {
    return (
      <main className="mx-auto flex max-w-sm flex-col gap-6 px-5 pb-8 pt-5 lg:max-w-2xl lg:p-10">
        <div>
          <h1 className="text-[30px] font-medium leading-[1.1] tracking-[-0.03em]">{titulo}</h1>
          <p className="mt-2 max-w-[40ch] text-[14px] leading-relaxed text-suave">{subtitulo}</p>
        </div>
        {children}
      </main>
    );
  }
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col px-5 pb-8 pt-5">
      <p className="flex items-center gap-2.5 text-[18px] font-medium tracking-[-0.02em]">
        <span
          aria-hidden="true"
          className="grid size-11 place-items-center rounded-full bg-tinta text-creme"
        >
          {APP_NAME[0]}
        </span>
        {APP_NAME}
      </p>
      {/* Cada chapa vai dentro de uma caixa posicionada: a chapa carrega o
          próprio `relative`, que venceria um `absolute` passado de fora. */}
      <div aria-hidden="true" className="relative mx-auto my-3 h-40 w-full max-w-[20rem]">
        <div className="absolute left-2 top-4 h-32 w-28 -rotate-9">
          <Chapa categoria="viagem" arte="h-[56%]" className="h-full rounded-cartao shadow-carta" />
        </div>
        <div className="absolute right-2 top-4 h-32 w-28 rotate-9">
          <Chapa categoria="casamento" arte="h-[56%]" className="h-full rounded-cartao shadow-carta" />
        </div>
        <div className="absolute left-1/2 top-0 z-10 h-36 w-32 -translate-x-1/2">
          <Chapa categoria="casa" arte="h-[58%]" className="h-full rounded-cartao shadow-carta" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-6">
        <div>
          <h1 className="max-w-[20ch] text-[28px] font-medium leading-[1.12] tracking-[-0.03em]">
            {titulo}
          </h1>
          <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-suave">{subtitulo}</p>
        </div>
        {children}
      </div>
    </main>
  );
}

export function Campo({ rotulo, ...props }: { rotulo: string } & ComponentProps<"input">) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] text-suave">{rotulo}</span>
      <input
        {...props}
        className="h-[52px] rounded-bloco border border-contorno bg-white px-4 text-base text-tinta outline-none transition placeholder:text-suave focus:border-tinta focus:ring-[3px] focus:ring-areia"
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
      <span className="text-[13px] text-suave">{rotulo}</span>
      <span className="flex h-[52px] items-center rounded-bloco border border-contorno bg-white pr-1.5 transition focus-within:border-tinta focus-within:ring-[3px] focus-within:ring-areia">
        <input
          {...props}
          type={aberto ? "text" : "password"}
          className="min-w-0 flex-1 bg-transparent px-4 text-base text-tinta outline-none placeholder:text-suave"
        />
        <button
          type="button"
          onClick={() => setAberto((estava) => !estava)}
          aria-label={aberto ? "Esconder o que digitei" : "Ver o que digitei"}
          aria-pressed={aberto}
          className="grid size-10 flex-none place-items-center rounded-full text-suave transition-colors hover:bg-areia"
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
      <span className="text-[13px] text-suave">{rotulo}</span>
      <select
        {...props}
        className="h-[52px] rounded-bloco border border-contorno bg-white px-4 text-base text-tinta outline-none transition focus:border-tinta focus:ring-[3px] focus:ring-areia"
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
      <input {...props} type="checkbox" className="mt-0.5" />
      <span>
        <span className="block text-[15px] font-medium">{rotulo}</span>
        <span className="mt-0.5 block text-[13px] leading-relaxed text-suave">
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
      className={`h-14 rounded-full bg-tinta px-6 text-[16px] font-medium text-creme transition hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 ${
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
      className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-contorno bg-white px-5 text-[14px] text-tinta transition hover:bg-areia active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
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
      className="h-11 self-start rounded-full border border-alerta/50 px-5 text-[14px] text-alerta transition hover:bg-alerta-suave active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
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
    <span className="text-[14px] text-tinta underline transition-colors hover:text-suave">
      {children}
    </span>
  );
}

export function Recado({ erro, aviso }: EstadoForm) {
  if (!erro && !aviso) return null;
  return (
    <p
      role="status"
      className={`rounded-bloco px-4 py-3 text-[14px] leading-relaxed ${
        erro ? "bg-alerta-suave text-alerta" : "bg-salvia text-tinta"
      }`}
    >
      {erro ?? aviso}
    </p>
  );
}
