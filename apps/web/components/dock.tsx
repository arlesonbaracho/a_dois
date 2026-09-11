"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { IconeCasa, IconeMais, IconePilha } from "./icones";

/**
 * O dock.
 *
 * No celular é a pílula branca do design, colada no rodapé, com o disco preto
 * separado à direita. No desktop o mesmo dock deita e vira trilho à esquerda —
 * o design só desenhou o celular, e esta é a derivação: o álbum aberto sobre a
 * mesa em vez de na mão.
 *
 * Os ícones são mudos para leitor de tela (`aria-hidden` no SVG), então cada
 * destino carrega o nome em texto só-para-leitor. Sem isso o dock inteiro vira
 * três links sem nome.
 */
const DESTINOS = [
  { href: "/", rotulo: "Início", Icone: IconeCasa },
  { href: "/jornadas", rotulo: "Jornadas", Icone: IconePilha },
] as const;

export function Dock() {
  const caminho = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 p-4 lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:w-24 lg:flex-col lg:justify-center lg:p-6"
    >
      <div className="flex gap-2 rounded-full bg-white p-1.5 shadow-peca lg:flex-col">
        {DESTINOS.map(({ href, rotulo, Icone }) => {
          const aqui = href === "/" ? caminho === "/" : caminho.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={aqui ? "page" : undefined}
              className={`grid size-11 place-items-center rounded-full transition-colors ${
                aqui ? "bg-tinta text-white" : "text-suave hover:bg-areia"
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
        className="grid size-12 place-items-center rounded-full bg-tinta text-limao shadow-peca transition-transform hover:scale-105"
      >
        <IconeMais className="size-6" />
        <span className="sr-only">Anotar um aporte</span>
      </Link>
    </nav>
  );
}
