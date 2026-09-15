"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { formatBRL, type Passo, rotuloDaCategoria } from "@repo/core";

import { IconePessoa } from "@/components/icones";
import { CartaoHero, CartaoJornada, Chip, Explica, PilulaTotal } from "@/components/pecas";
import { PrimeirosPassos } from "@/components/primeiros-passos";
import type { Fatia } from "@/components/progresso";

type Jornada = {
  id: string;
  criadaEmISO: string;
  titulo: string;
  categoria: string;
  capaUrl: string | null;
  aportadoCents: number;
  alvoCents: number;
  percentual: number;
  fatias: Fatia[];
};

const TUDO = "Tudo";
const GIRO_MS = 5000;

/** "oi, Lucas e Ana" — e "oi, vocês" quando ninguém preencheu o nome. */
function saudacao(nomes: (string | null)[]): string {
  const ditos = nomes.filter((nome): nome is string => Boolean(nome?.trim()));
  if (ditos.length === 0) return "oi, vocês";
  return `oi, ${ditos.join(" e ")}`;
}

export function Inicio({
  passos,
  nomes,
  iniciais,
  mes,
  totalCents,
  jornadas,
  temPedido,
}: {
  /** Nulo quando o casal já passou dos primeiros passos. */
  passos: Passo[] | null;
  nomes: (string | null)[];
  iniciais: string;
  mes: string;
  totalCents: number;
  jornadas: Jornada[];
  temPedido: boolean;
}) {
  // Filtro e posição no mesmo estado: trocar o chip zera o carrossel na MESMA
  // atualização. Em dois estados isso vira um efeito que escreve estado depois
  // do render — cascata de renderização, e o lint reprova com razão.
  const [{ filtro, indice }, setCena] = useState({ filtro: TUDO, indice: 0 });
  const setFiltro = (novo: string) => setCena({ filtro: novo, indice: 0 });
  const irPara = (nova: number) => setCena((antes) => ({ ...antes, indice: nova }));
  // Quem tocou num ponto assumiu o controle: o giro automático não volta. É o
  // mecanismo de parada que conteúdo em movimento precisa ter, e sai sem
  // acrescentar um botão que ninguém entenderia.
  const [automatico, setAutomatico] = useState(true);
  // Pausa só enquanto alguém tem foco de teclado aqui dentro — se o cartão
  // trocasse com o foco num link dele, o foco cairia no vazio. A pausa por
  // ponteiro saiu: no desktop o mouse repousa em cima do cartão sem querer, e
  // o carrossel parava de girar até alguém mexer no mouse.
  const [comFoco, setComFoco] = useState(false);

  // Categorias com contagem, na ordem em que aparecem. Ordenar por nome
  // embaralharia a lista cada vez que alguém criasse uma jornada nova.
  const contagem = new Map<string, number>();
  for (const jornada of jornadas) {
    contagem.set(jornada.categoria, (contagem.get(jornada.categoria) ?? 0) + 1);
  }

  const visiveis =
    filtro === TUDO ? jornadas : jornadas.filter((jornada) => jornada.categoria === filtro);
  const atual = visiveis.length > 0 ? indice % visiveis.length : 0;
  const emCena = visiveis[atual];

  // Com uma jornada só, não há o que alternar: o cartão fica parado.
  //
  // `prefers-reduced-motion` NÃO para o relógio, e isso é de propósito: a
  // regra proíbe movimento, não mudança de conteúdo. Quem pediu menos
  // movimento continua vendo as jornadas alternarem — o que some é o deslize,
  // porque o bloco de `globals.css` já zera toda transição. Parar o relógio
  // também deixava o cartão congelado no aparelho de quem tem "Reduzir
  // movimento" ligado, que é o padrão de muita gente no iPhone.
  useEffect(() => {
    if (!automatico || comFoco || visiveis.length < 2) return;

    const relogio = setInterval(
      () => setCena((antes) => ({ ...antes, indice: antes.indice + 1 })),
      GIRO_MS,
    );
    return () => clearInterval(relogio);
  }, [automatico, comFoco, visiveis.length]);

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-3.5 p-5 lg:max-w-5xl lg:p-10">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-corpo text-[11.5px] text-suave">
            {saudacao(nomes)}
            <span className="mx-1.5">·</span>
            <span className="font-semibold tracking-[-0.02em]">{mes}</span>
          </p>
          <h1 className="mt-0.5 text-[28px] font-semibold leading-none tracking-[-0.03em]">
            Nossa jornada
          </h1>
        </div>
        <Link
          href="/perfil"
          className="grid size-9 flex-none place-items-center rounded-full bg-verde text-[12px] font-semibold text-creme transition active:scale-95"
        >
          {iniciais ? iniciais : <IconePessoa className="size-5" />}
          <span className="sr-only">Seu perfil</span>
        </Link>
      </header>

      {temPedido ? (
        <Link
          href="/parceiro"
          className="rounded-cartao bg-tinta p-4 text-[13.5px] font-semibold text-creme transition active:scale-[0.99]"
        >
          Alguém pediu para entrar no plano de vocês. Toque para ver quem é.
        </Link>
      ) : null}

      {passos ? <PrimeirosPassos passos={passos} /> : null}

      {jornadas.length > 1 ? (
        <div className="sem-barra -mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0">
          <Chip
            rotulo={TUDO}
            quantos={jornadas.length}
            ativo={filtro === TUDO}
            onClick={() => setFiltro(TUDO)}
          />
          {/* O rótulo é de gente, a chave continua sendo o valor do banco: a
              faixa mostrava "bebe" e "geral" em minúscula e sem acento, que é
              coluna vazando para a tela. */}
          {[...contagem].map(([categoria, quantos]) => (
            <Chip
              key={categoria}
              rotulo={rotuloDaCategoria(categoria)}
              quantos={quantos}
              ativo={filtro === categoria}
              onClick={() => setFiltro(categoria)}
            />
          ))}
        </div>
      ) : null}

      {emCena ? (
        /* No celular é um cartão por vez, como o design pede. No desktop o
           mesmo cartão fica em destaque à esquerda e o resto do álbum abre à
           direita: um único cartão numa tela de 1280px deixava dois terços de
           superfície vazia, e o design só desenhou o celular. */
        <div className="lg:grid lg:grid-cols-[27rem_minmax(0,1fr)] lg:items-start lg:gap-8">
          <div className="flex flex-col gap-3.5">
            {/* O trilho: todos os cartões lado a lado, e o que muda é o
                deslocamento. Deslizar o trilho inteiro dá transição de
                verdade — o que sai e o que entra se movem juntos, em vez de
                um sumir e outro aparecer no lugar.

                `pb-10 -mb-10` existe para a sombra do cartão caber dentro do
                recorte: `overflow-hidden` corta no padding, então o padding é
                o espaço que a sombra ocupa, e a margem negativa devolve esse
                espaço ao layout. */}
            <div
              className="-mb-10 overflow-hidden pb-10"
              onFocusCapture={() => setComFoco(true)}
              onBlurCapture={() => setComFoco(false)}
            >
              {/* O passo do deslize é a largura de um cartão MAIS o vão
                  entre eles — com `gap` e só `-100%`, o trilho para meio
                  cartão adiantado a cada volta. */}
              <div
                className="flex gap-4 transition-transform duration-500 ease-out"
                style={{ transform: `translateX(calc(${-atual * 100}% - ${atual}rem))` }}
              >
                {visiveis.map((jornada, posicao) => (
                  /* `inert` e não `aria-hidden`: o cartão fora de cena
                     continua no DOM e precisa sair do caminho do teclado
                     também, senão a tabulação entra num cartão invisível. */
                  <div
                    key={jornada.id}
                    className="w-full flex-none"
                    inert={posicao !== atual}
                  >
                    <CartaoHero {...jornada} />
                  </div>
                ))}
              </div>
            </div>

            {visiveis.length > 1 ? (
              <div className="flex justify-center gap-2 pt-3 lg:hidden">
                {visiveis.map((jornada, posicao) => (
                  <button
                    key={jornada.id}
                    type="button"
                    onClick={() => {
                      irPara(posicao);
                      setAutomatico(false);
                    }}
                    aria-label={`Ver ${jornada.titulo}`}
                    aria-current={posicao === atual ? "true" : undefined}
                    className={`h-1.5 rounded-full transition-all ${
                      posicao === atual ? "w-5 bg-verde" : "w-1.5 bg-listra hover:bg-contorno"
                    }`}
                  />
                ))}
              </div>
            ) : null}

            <PilulaTotal>{formatBRL(totalCents)} juntos</PilulaTotal>
          </div>

          {/* O resto do álbum. Só no desktop: no celular ele é o carrossel, e
              repetir as mesmas jornadas embaixo desfaria a escolha. */}
          {visiveis.length > 1 ? (
            <div className="mt-6 hidden grid-cols-2 gap-4 lg:mt-0 lg:grid">
              {visiveis
                .filter((jornada) => jornada.id !== emCena.id)
                .map((jornada) => (
                  <CartaoJornada key={jornada.id} {...jornada} />
                ))}
            </div>
          ) : null}
        </div>
      ) : jornadas.length > 0 ? (
        /* Filtro que não sobrou nada. Acontece quando a única jornada de uma
           categoria é apagada com o chip ainda selecionado. */
        <div className="flex flex-col items-start gap-3 py-6">
          <Explica>Nenhuma jornada nesta categoria.</Explica>
          <button
            type="button"
            onClick={() => setFiltro(TUDO)}
            className="rounded-full border border-contorno/60 bg-white px-4 py-2.5 text-[12.5px] font-semibold transition hover:border-contorno active:scale-[0.97]"
          >
            Ver todas
          </button>
        </div>
      ) : passos ? null : (
        <div className="flex flex-col items-start gap-4 py-4">
          <p className="max-w-[22ch] text-[21px] font-semibold leading-tight tracking-[-0.03em]">
            Vocês ainda não escolheram o que querem conquistar.
          </p>
          <Explica className="max-w-[40ch]">
            Começa por uma. Pode ser a viagem, a entrada do apê, ou só um fundo do
            sossego.
          </Explica>
          <Link
            href="/jornadas/nova"
            className="rounded-full bg-tinta px-5 py-3.5 text-[13.5px] font-semibold text-creme transition hover:opacity-90 active:scale-[0.97]"
          >
            Criar a primeira
          </Link>
        </div>
      )}
    </main>
  );
}
