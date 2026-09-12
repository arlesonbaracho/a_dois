import Link from "next/link";

import type { Passo } from "@repo/core";

import { IconeAvancar, IconeCheck, IconeCirculo } from "./icones";

/**
 * Os primeiros passos, na home.
 *
 * É o tutorial — e é uma lista, não um tour. Cada linha leva à tela de
 * verdade, marca sozinha a partir do que já aconteceu, e o bloco inteiro some
 * quando os obrigatórios acabam. Nada aqui guarda "em que passo você está",
 * porque não existe passo guardado: os dados é que respondem.
 *
 * Burro, como as outras peças: recebe os passos prontos de `primeirosPassos`.
 */
export function PrimeirosPassos({ passos }: { passos: Passo[] }) {
  const feitos = passos.filter((passo) => !passo.opcional && passo.estado === "feito").length;
  const total = passos.filter((passo) => !passo.opcional).length;

  return (
    // O cartão escuro é reservado ao momento que concede acesso ao dinheiro do
    // outro, e chamar o parceiro é exatamente isso. Por isso ele mora aqui, e
    // não em qualquer bloco branco.
    <section
      aria-labelledby="primeiros-passos"
      className="rounded-cartao bg-tinta p-4 text-papel"
    >
      <h2 id="primeiros-passos" className="text-[16px] font-bold tracking-[-0.03em]">
        Comecem por aqui
      </h2>
      <p className="mt-0.5 font-corpo text-[11.5px] text-noite-suave">
        {feitos} de {total} — a lista some sozinha quando acabar.
      </p>

      <ul className="mt-3 flex flex-col gap-1">
        {passos.map((passo) => {
          const feito = passo.estado === "feito";
          const Marca = feito ? IconeCheck : IconeCirculo;
          return (
            <li key={passo.id}>
              <Link
                href={passo.href}
                className={`flex items-start gap-2.5 rounded-bloco px-2.5 py-2.5 transition-colors hover:bg-papel/10 ${
                  feito ? "opacity-55" : ""
                }`}
              >
                <Marca
                  aria-hidden="true"
                  className={`mt-px size-4 flex-none ${feito ? "text-limao" : "text-noite-suave"}`}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-[13.5px] font-semibold tracking-[-0.02em] ${
                      feito ? "line-through" : ""
                    }`}
                  >
                    {passo.titulo}
                    {passo.opcional ? (
                      <span className="ml-1.5 font-corpo text-[10.5px] font-normal text-noite-suave">
                        opcional
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block font-corpo text-[11.5px] leading-relaxed text-noite-corpo">
                    {passo.dica}
                  </span>
                </span>
                {feito ? null : (
                  <IconeAvancar
                    aria-hidden="true"
                    className="mt-0.5 size-4 flex-none text-noite-suave"
                  />
                )}
                {/* O estado precisa existir para quem não vê o ícone: sem
                    isto, "feito" e "a fazer" são o mesmo link. */}
                <span className="sr-only">
                  {feito ? "feito" : passo.estado === "esperando" ? "esperando" : "a fazer"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Informação, não tarefa. Empurrar alguém a LIGAR permissão no
          onboarding contradiz a minimização que o produto vende como
          argumento — o que cabe aqui é dizer onde se desliga. */}
      <Link
        href="/perfil"
        className="mt-2 inline-block px-2.5 font-corpo text-[11px] text-noite-suave underline"
      >
        O que a gente guarda, e o que vocês podem desligar
      </Link>
    </section>
  );
}
