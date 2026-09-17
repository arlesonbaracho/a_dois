"use client";

import { useCallback, useRef, type ReactNode } from "react";

import { formatBRL } from "@repo/core";

/**
 * A chuva de moedas: quando entra aporte novo, moedas de R$ 1 caem sobre a
 * tela e o total do mês rola ao recebê-las.
 *
 * Imperativa de propósito. As moedas são dezesseis spans que vivem dois
 * segundos e meio e somem: passá-las por estado do React seria renderizar a
 * tela inteira para desenhar confete. Quem pediu menos movimento não recebe
 * moeda nenhuma — só o número muda.
 */
const MOEDAS = 16;

/**
 * A marca que a tela de anotar deixa para a home saber que entrou dinheiro. É
 * só a presença da chave — nenhum valor: o que está na sessão do navegador
 * não precisa saber quanto foi.
 */
export const CHAVE_APORTE_ANOTADO = "jornada:aporte-anotado";
const DURACAO_MS = 2700;

export function useChuva(): { chuva: ReactNode; chover: () => void } {
  const palco = useRef<HTMLDivElement>(null);

  const chover = useCallback(() => {
    const alvo = palco.current;
    if (!alvo || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const altura = window.innerHeight;
    for (let i = 0; i < MOEDAS; i++) {
      const moeda = document.createElement("span");
      moeda.className = "moeda absolute top-0";
      const tamanho = 26 + Math.random() * 22;
      moeda.style.cssText = [
        `left:calc(${6 + Math.random() * 88}% - ${tamanho / 2}px)`,
        `width:${tamanho}px`,
        `height:${tamanho}px`,
        `--d:${Math.random() * 650}ms`,
        `--t:${1100 + Math.random() * 700}ms`,
        `--g:${380 + Math.random() * 420}ms`,
        `--fim:${altura * (0.6 + Math.random() * 0.2)}px`,
        `--r0:${Math.random() * 60 - 30}deg`,
        `--r1:${Math.random() * 120 - 60}deg`,
      ].join(";");
      moeda.innerHTML = '<svg viewBox="0 0 64 64" width="100%" height="100%"><use href="#moeda-de-um-real"/></svg>';
      alvo.append(moeda);
      window.setTimeout(() => moeda.remove(), DURACAO_MS);
    }
  }, []);

  const chuva = (
    <div
      ref={palco}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
    >
      <svg width="0" height="0" className="absolute">
        <defs>
          <radialGradient id="moeda-ouro" cx="35%" cy="30%" r="75%">
            <stop offset="0" stopColor="#F6DC8C" />
            <stop offset=".55" stopColor="#D19B36" />
            <stop offset="1" stopColor="#8F6320" />
          </radialGradient>
          <radialGradient id="moeda-prata" cx="38%" cy="32%" r="70%">
            <stop offset="0" stopColor="#FBFBF8" />
            <stop offset=".6" stopColor="#C9CBC4" />
            <stop offset="1" stopColor="#8E918A" />
          </radialGradient>
          {/* A moeda de R$ 1: anel dourado, miolo prateado. */}
          <symbol id="moeda-de-um-real" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="30" fill="url(#moeda-ouro)" stroke="#7A5217" strokeWidth="1.2" />
            <circle cx="32" cy="32" r="25.5" fill="none" stroke="#FFF2C4" strokeOpacity=".5" strokeDasharray="1.2 2.2" />
            <circle cx="32" cy="32" r="19" fill="url(#moeda-prata)" stroke="#7F827B" />
            <text x="32" y="40.3" textAnchor="middle" fontSize="21" fontWeight="600" fill="#fff" fillOpacity=".7">1</text>
            <text x="32" y="39.5" textAnchor="middle" fontSize="21" fontWeight="600" fill="#6F726B">1</text>
            <path d="M14 22a21 21 0 0 1 16-12" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2.4" strokeLinecap="round" />
          </symbol>
        </defs>
      </svg>
    </div>
  );

  return { chuva, chover };
}

/**
 * O número que rola dígito a dígito.
 *
 * Cada dígito é uma coluna de 0 a 9 deslocada até o valor. Quando o total
 * muda, as colunas deslizam — com atraso, para o número mudar quando as
 * moedas chegam embaixo, e não quando saem do topo. As colunas são mudas; o
 * valor inteiro vai num texto só-para-leitor, que não precisa ouvir coluna por
 * coluna. A chave conta da direita: quando o total ganha um dígito, os
 * centavos continuam sendo a mesma coluna e não "pulam" para a vizinha.
 */
export function Odometro({ cents, className = "" }: { cents: number; className?: string }) {
  const texto = formatBRL(cents);
  const totalDeDigitos = texto.replace(/\D/g, "").length;
  let digito = 0;
  return (
    <span className={`num inline-flex leading-[1.15] ${className}`}>
      <span className="sr-only">{texto}</span>
      {[...texto].map((caractere, posicao) => {
        if (!/\d/.test(caractere)) {
          return (
            <span key={`s${texto.length - posicao}`} aria-hidden="true" className="whitespace-pre">
              {caractere}
            </span>
          );
        }
        digito += 1;
        return (
          <span
            key={`d${totalDeDigitos - digito}`}
            aria-hidden="true"
            className="inline-block h-[1.15em] w-[0.63em] overflow-hidden text-center"
          >
            <span
              className="block transition-transform delay-[900ms] duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)]"
              style={{ transform: `translateY(${-Number(caractere) * 10}%)` }}
            >
              {"0123456789".split("").map((n) => (
                <span key={n} className="block h-[1.15em]">
                  {n}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
