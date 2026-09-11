"use client";

import Link from "next/link";
import { useState } from "react";

import { formatBRL } from "@repo/core";

import { IconePessoa } from "@/components/icones";
import { CartaoJornada, CartaoLimao, Chip, PilulaTotal } from "@/components/pecas";
import type { Fatia } from "@/components/progresso";

type Jornada = {
  id: string;
  titulo: string;
  categoria: string;
  aportadoCents: number;
  alvoCents: number;
  percentual: number;
  fatias: Fatia[];
};

const TUDO = "Tudo";

/** "oi, Lucas e Ana" — e "oi, vocês" quando ninguém preencheu o nome. */
function saudacao(nomes: (string | null)[]): string {
  const ditos = nomes.filter((nome): nome is string => Boolean(nome?.trim()));
  if (ditos.length === 0) return "oi, vocês";
  return `oi, ${ditos.join(" e ")}`;
}

export function Inicio({
  nomes,
  iniciais,
  mes,
  totalCents,
  doMesCents,
  doMesPorPessoa,
  jornadas,
  temPedido,
}: {
  nomes: (string | null)[];
  iniciais: string;
  mes: string;
  totalCents: number;
  doMesCents: number;
  doMesPorPessoa: { chave: string; cents: number }[];
  jornadas: Jornada[];
  temPedido: boolean;
}) {
  const [filtro, setFiltro] = useState(TUDO);

  // Categorias com contagem, na ordem em que aparecem. Ordenar por nome
  // embaralharia a lista cada vez que alguém criasse uma jornada nova.
  const contagem = new Map<string, number>();
  for (const jornada of jornadas) {
    contagem.set(jornada.categoria, (contagem.get(jornada.categoria) ?? 0) + 1);
  }

  const visiveis =
    filtro === TUDO ? jornadas : jornadas.filter((jornada) => jornada.categoria === filtro);

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-3.5 p-5 lg:max-w-5xl lg:p-10">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="font-corpo text-[11.5px] text-suave">
            {saudacao(nomes)}
            <span className="mx-1.5 text-suave">·</span>
            <span className="font-semibold tracking-[-0.02em] text-suave">{mes}</span>
          </p>
          <h1 className="mt-px text-[27px] font-bold tracking-[-0.04em] lg:text-4xl">
            Nossa jornada
          </h1>
        </div>
        <Link
          href="/perfil"
          className="grid size-10 flex-none place-items-center rounded-full bg-tinta text-[13px] font-semibold text-white"
        >
          {iniciais ? iniciais : <IconePessoa className="size-5" />}
          <span className="sr-only">Seu perfil</span>
        </Link>
      </header>

      {/* Celular: uma coluna, na ordem do design. Desktop: o álbum ocupa a
          esquerda e o total sobe para uma coluna fixa à direita — sem isso o
          desktop era o mobile esticado, com meia tela de creme vazio. */}
      <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-x-10 lg:gap-y-4">
      <div className="lg:col-start-1 lg:row-start-1">
      {jornadas.length > 0 ? (
        <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0">
          <Chip
            rotulo={TUDO}
            quantos={jornadas.length}
            ativo={filtro === TUDO}
            onClick={() => setFiltro(TUDO)}
          />
          {[...contagem].map(([categoria, quantos]) => (
            <Chip
              key={categoria}
              rotulo={categoria}
              quantos={quantos}
              ativo={filtro === categoria}
              onClick={() => setFiltro(categoria)}
            />
          ))}
        </div>
      ) : null}
      </div>

      <aside className="flex flex-col gap-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-10">
        <PilulaTotal>{formatBRL(totalCents)} juntos</PilulaTotal>
        {jornadas.length > 0 ? (
          <CartaoLimao rotulo="este mês" valorCents={doMesCents}>
            {doMesCents > 0 ? (
              <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-tinta/15">
                {doMesPorPessoa.map((pessoa, indice) => (
                  <i
                    key={pessoa.chave}
                    className={`block h-full ${indice === 0 ? "bg-tinta" : "bg-white"}`}
                    style={{ width: `${(pessoa.cents / doMesCents) * 100}%` }}
                  />
                ))}
              </div>
            ) : null}
          </CartaoLimao>
        ) : null}
      </aside>

      <div className="flex flex-col gap-3.5 lg:col-start-1 lg:row-start-2">
      {temPedido ? (
        <Link
          href="/parceiro"
          className="rounded-cartao bg-tinta p-4 text-[14px] font-semibold text-limao"
        >
          Alguém pediu para entrar no plano de vocês. Toque para ver quem é.
        </Link>
      ) : null}

      {jornadas.length === 0 ? (
        <div className="mt-2 flex flex-col items-start gap-4">
          <p className="max-w-[22ch] text-[22px] font-bold leading-tight tracking-[-0.03em]">
            Vocês ainda não escolheram o que querem conquistar.
          </p>
          <p className="font-corpo text-[13px] leading-relaxed text-suave-forte">
            Começa por uma. Pode ser a viagem, a entrada do apê, ou só um fundo
            do sossego.
          </p>
          <Link
            href="/jornadas"
            className="rounded-full bg-tinta px-5 py-3 text-[13.5px] font-semibold text-white"
          >
            Criar a primeira
          </Link>
        </div>
      ) : (
        <div className="gap-3 [column-fill:balance] columns-2">
          {visiveis.map((jornada, indice) => (
            <CartaoJornada key={jornada.id} indice={indice} {...jornada} />
          ))}
        </div>
      )}
      </div>
      </div>
    </main>
  );
}
