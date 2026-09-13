"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { IconeCasa, IconeLista, IconeMais, IconePessoa } from "./icones";

/**
 * O dock.
 *
 * No celular é a pílula branca do design, colada no rodapé, com o disco de
 * ação separado à direita. No desktop o mesmo dock deita e vira trilho à
 * esquerda — o design só desenhou o celular, e esta é a derivação.
 *
 * Três destinos, e não dois: a home agora mostra UMA jornada por vez, então a
 * lista deixou de ser atalho e virou o caminho para as outras. O perfil entra
 * junto porque o disco de iniciais do cabeçalho some nas telas internas.
 *
 * Os ícones são mudos para leitor de tela (`aria-hidden` no SVG), então cada
 * destino carrega o nome em texto só-para-leitor.
 */
const DESTINOS = [
  { href: "/", rotulo: "Início", Icone: IconeCasa },
  { href: "/jornadas", rotulo: "Jornadas", Icone: IconeLista },
  { href: "/perfil", rotulo: "Seu perfil", Icone: IconePessoa },
] as const;

export function Dock() {
  const caminho = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 p-4 lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:w-24 lg:flex-col lg:justify-center lg:p-6"
    >
      <div className="flex gap-1.5 rounded-full border border-borda bg-white p-1.5 shadow-peca lg:flex-col">
        {DESTINOS.map(({ href, rotulo, Icone }) => {
          const aqui = href === "/" ? caminho === "/" : caminho.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={aqui ? "page" : undefined}
              className={`grid size-11 place-items-center rounded-full transition active:scale-90 ${
                aqui ? "bg-tinta text-creme" : "text-suave hover:bg-areia"
              }`}
            >
              <Icone className="size-5" />
              <span className="sr-only">{rotulo}</span>
            </Link>
          );
        })}
      </div>

      <Link
        href="/aportes"
        className="grid size-13 place-items-center rounded-full bg-verde text-creme shadow-disco transition-transform hover:scale-105 active:scale-95"
      >
        <IconeMais className="size-6" />
        <span className="sr-only">Anotar um aporte</span>
      </Link>
    </nav>
  );
}
