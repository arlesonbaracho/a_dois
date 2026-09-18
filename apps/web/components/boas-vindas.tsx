"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { APP_NAME } from "@repo/core";

import { COOKIE_BOAS_VINDAS } from "@/lib/boas-vindas";

import { Moeda } from "./chuva";
import { Leque } from "./form-ui";
import { ArteDoCasal } from "./primeiros-passos";

type Tela = { titulo: string; texto: string; arte: ReactNode };

/**
 * As boas-vindas: três telas, uma vez, só para casal que ainda não tem nada.
 *
 * Não é gate: mora por cima da própria home, em `/`, e "Pular" está sempre ali.
 * A troca de tela é o scroll-snap do navegador — desliza com o dedo, sem
 * biblioteca e sem arrasto escrito à mão; os botões só rolam até a próxima.
 */
export function BoasVindas({ inicial, aoTerminar }: { inicial: string; aoTerminar: () => void }) {
  const telas: Tela[] = [
    {
      titulo: "O plano de vocês dois, num lugar só.",
      texto: "Os dois veem o mesmo número, na mesma hora — sem planilha e sem discussão de centavo.",
      arte: <Leque className="h-52" />,
    },
    {
      titulo: "Ninguém entra sem você confirmar.",
      texto: "O convite só pede para entrar. Quem decide se a pessoa do outro lado é mesmo quem você chamou é você.",
      arte: <ArteDoCasal inicial={inicial} selo />,
    },
    {
      titulo: "Cada aporte vira um comprovante.",
      texto: "E quando a outra pessoa anota, vocês veem o dinheiro cair na tela.",
      arte: (
        <span aria-hidden="true" className="relative grid size-52 place-items-center">
          <Moeda className="absolute left-2 top-6 size-14 -rotate-12" />
          <Moeda className="absolute bottom-4 right-3 size-16 rotate-12" />
          <Image
            src="/arte/comprovante.png"
            alt=""
            width={256}
            height={256}
            unoptimized
            className="relative size-32 drop-shadow-[0_16px_20px_rgb(7_0_1/0.16)]"
          />
        </span>
      ),
    },
  ];

  const trilho = useRef<HTMLDivElement>(null);
  const titulos = useRef<(HTMLHeadingElement | null)[]>([]);
  const [atual, setAtual] = useState(0);
  // Para onde o botão mandou rolar. A tela atual NÃO pode sair da posição de
  // rolagem enquanto a rolagem suave anda: dois toques rápidos em "Próximo"
  // liam a posição antiga e iam da 1 para a 2 duas vezes, e a 3 nunca chegava.
  const destino = useRef<number | null>(null);
  const ultima = atual === telas.length - 1;

  // A home fica embaixo: sem isto a rolagem da página vazava por trás.
  useEffect(() => {
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    titulos.current[0]?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = antes;
    };
  }, []);

  function terminar() {
    const seguro = location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${COOKIE_BOAS_VINDAS}=vista; path=/; max-age=31536000; samesite=lax${seguro}`;
    aoTerminar();
  }

  function irPara(indice: number) {
    const faixa = trilho.current;
    if (!faixa) return;
    destino.current = indice;
    setAtual(indice);
    const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
    faixa.scrollTo({ left: indice * faixa.clientWidth, behavior: calmo ? "auto" : "smooth" });
    titulos.current[indice]?.focus({ preventScroll: true });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Boas-vindas ao ${APP_NAME}`}
      onKeyDown={(evento) => {
        if (evento.key === "Escape") terminar();
      }}
      className="fixed inset-0 z-40 bg-papel"
    >
      <div className="mx-auto flex h-full max-w-sm flex-col px-5 pb-8 pt-5">
        <div className="flex min-h-11 items-center gap-3">
          <div className="flex flex-1 gap-1.5" aria-hidden="true">
            {telas.map((tela, indice) => (
              <span
                key={tela.titulo}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  indice <= atual ? "bg-tinta" : "bg-areia"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={terminar}
            className="h-11 rounded-full px-3 text-[14px] text-suave underline underline-offset-4 transition hover:text-tinta"
          >
            Pular
          </button>
        </div>

        <div
          ref={trilho}
          aria-roledescription="apresentação"
          onScroll={(evento) => {
            const faixa = evento.currentTarget;
            const aqui = Math.round(faixa.scrollLeft / faixa.clientWidth);
            // Rolagem mandada pelo botão: espera chegar, sem mexer na tela atual.
            if (destino.current !== null) {
              if (aqui === destino.current) destino.current = null;
              return;
            }
            setAtual(aqui);
          }}
          className="sem-barra -mx-5 flex flex-1 snap-x snap-mandatory overflow-x-auto"
        >
          {telas.map((tela, indice) => (
            <section
              key={tela.titulo}
              role="group"
              aria-roledescription="tela"
              aria-label={`${indice + 1} de ${telas.length}`}
              className="flex w-full flex-none snap-center flex-col justify-center px-5"
            >
              <div className="grid h-60 place-items-center">{tela.arte}</div>
              <h2
                ref={(elemento) => {
                  titulos.current[indice] = elemento;
                }}
                tabIndex={-1}
                className="mt-6 text-[30px] font-medium leading-[1.1] tracking-[-0.03em] outline-none"
              >
                {tela.titulo}
              </h2>
              <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-suave">{tela.texto}</p>
            </section>
          ))}
        </div>

        <button
          type="button"
          onClick={() => (ultima ? terminar() : irPara(atual + 1))}
          className="h-14 w-full rounded-full bg-tinta text-[16px] font-medium text-creme transition hover:opacity-90 active:scale-[0.98]"
        >
          {ultima ? "Começar" : "Próximo"}
        </button>
      </div>
    </div>
  );
}
