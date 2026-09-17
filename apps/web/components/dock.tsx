"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { IconeCasa, IconeDeck, IconeMais, IconePessoa } from "./icones";

/**
 * O dock.
 *
 * Círculos soltos, e não uma pílula: três destinos à esquerda e, separado, o
 * disco de tinta com a ação que o app existe para fazer — anotar um aporte.
 * No desktop o mesmo dock deita e vira trilho à esquerda.
 *
 * Os ícones são mudos para leitor de tela (`aria-hidden` no SVG), então cada
 * destino carrega o nome em texto só-para-leitor.
 */
const DESTINOS = [
  { href: "/", rotulo: "Início", Icone: IconeCasa },
  { href: "/jornadas", rotulo: "Jornadas", Icone: IconeDeck },
  { href: "/perfil", rotulo: "Seu perfil", Icone: IconePessoa },
] as const;

export function Dock() {
  const caminho = usePathname();

  // Anotar é uma tela cheia, com o próprio botão de fechar: o dock sai da
  // frente do teclado de valor.
  if (caminho.startsWith("/aportes/novo")) return null;

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 bg-linear-to-t from-papel from-55% to-papel/0 px-5 pb-5 pt-8 lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:w-24 lg:flex-col lg:justify-center lg:bg-none lg:p-5"
    >
      <div className="flex gap-2 lg:flex-col">
        {DESTINOS.map(({ href, rotulo, Icone }) => {
          const aqui = href === "/" ? caminho === "/" : caminho.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={aqui ? "page" : undefined}
              className={`grid size-14 place-items-center rounded-full border transition active:scale-90 ${
                aqui
                  ? "border-tinta bg-tinta text-creme"
                  : "border-borda bg-white text-tinta hover:bg-areia"
              }`}
            >
              <Icone className="size-[22px]" />
              <span className="sr-only">{rotulo}</span>
            </Link>
          );
        })}
      </div>

      <Link
        href="/aportes/novo"
        className="grid size-14 place-items-center rounded-full bg-tinta text-creme shadow-disco transition-transform hover:scale-105 active:scale-95"
      >
        <IconeMais className="size-6" />
        <span className="sr-only">Anotar um aporte</span>
      </Link>
    </nav>
  );
}
