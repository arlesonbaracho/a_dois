"use client";

import Link from "next/link";
import { useState } from "react";

import { useCriarMeta } from "@repo/api";
import { CATEGORIAS, formatBRL, rotuloDaCategoria } from "@repo/core";

import { Campo, Enviar, Recado } from "@/components/form-ui";
import { IconeAvancar, IconeFechar } from "@/components/icones";
import { Chapa, Chip, Explica, Polaroide } from "@/components/pecas";
import { marcarPrimeiraMeta } from "@/components/pwa";
import { paraCentavos } from "@/lib/dinheiro";

/**
 * Criar uma jornada, em dois passos.
 *
 * Antes era um formulário encostado na lateral de /jornadas: seis campos
 * empilhados, e nenhum deles respondia à pergunta que o casal realmente tem,
 * que não é "quanto custa" — é "dá pra fazer?". O passo 1 responde isso a
 * cada toque, porque o cartão verde recalcula quanto cabe por mês enquanto o
 * valor e o prazo mudam.
 */
const PRAZOS: [number | null, string][] = [
  [12, "12 meses"],
  [24, "24 meses"],
  [36, "36 meses"],
  [null, "quando der"],
];

const MINIMO = 50000; // R$ 500
const MAXIMO = 10000000; // R$ 100.000
const PASSO = 50000; // R$ 500

/** A data que um prazo em meses vira, no fim do dia, em ISO. */
function prazoParaISO(meses: number | null): string | null {
  if (meses === null) return null;
  const quando = new Date();
  quando.setMonth(quando.getMonth() + meses);
  return quando.toISOString();
}

export function NovaJornada() {
  const criar = useCriarMeta();

  const [categoria, setCategoria] = useState<string>("casa");
  const [titulo, setTitulo] = useState("");
  const [alvoTexto, setAlvoTexto] = useState("12.000,00");
  const [meses, setMeses] = useState<number | null>(24);
  const [erro, setErro] = useState("");
  const [criada, setCriada] = useState<string | null>(null);

  const alvoCents = paraCentavos(alvoTexto) ?? 0;
  const porMesCents = meses && meses > 0 ? Math.ceil(alvoCents / meses) : null;
  // O nome cai no rótulo da categoria enquanto ninguém digitar o próprio.
  const nome = titulo.trim() || rotuloDaCategoria(categoria);

  async function criarJornada(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const alvo = paraCentavos(alvoTexto);
    if (alvo === null || alvo <= 0) {
      setErro("Escreva quanto vocês querem juntar, em reais.");
      return;
    }

    setErro("");
    try {
      const id = await criar.mutateAsync({
        titulo: nome,
        alvoCents: alvo,
        categoria,
        prazoISO: prazoParaISO(meses),
        prioridade: "media",
      });
      // Libera o convite de instalar o PWA.
      marcarPrimeiraMeta();
      setCriada(id);
    } catch {
      setErro("Não consegui criar agora. Tenta de novo?");
    }
  }

  if (criada) return <Pronto id={criada} nome={nome} categoria={categoria} />;

  return (
    <form
      onSubmit={criarJornada}
      className="mx-auto flex max-w-sm flex-col gap-3.5 p-5 lg:max-w-md lg:p-10"
    >
      <header className="flex items-end justify-between gap-3">
        <div>
          <span className="font-corpo text-[10.5px] text-suave">passo 1 de 2</span>
          <h1 className="text-[21px] font-semibold leading-tight tracking-[-0.03em]">
            Nova jornada
          </h1>
        </div>
        <Link
          href="/jornadas"
          className="grid size-9 flex-none place-items-center rounded-full border border-borda bg-white text-suave-forte transition active:scale-95"
        >
          <IconeFechar className="size-4" />
          <span className="sr-only">Sair sem criar</span>
        </Link>
      </header>

      <div className="flex gap-3">
        <div className="flex-1">
          <Polaroide indice={0}>
            <Chapa categoria={categoria} className="h-[86px] rounded-chapa" />
            <b className="mt-2 block truncate text-[12.5px] font-semibold leading-tight">
              {nome}
            </b>
            <span className="font-corpo text-[10.5px] text-suave">
              {meses === null ? "sem prazo" : `em ${meses} meses`}
            </span>
          </Polaroide>
        </div>
        {/* Responde "dá pra fazer?" a cada toque no valor e no prazo. É a peça
            que o formulário antigo não tinha, e é por ela que a tela existe. */}
        <div className="flex flex-1 flex-col justify-center rounded-bloco bg-verde p-3.5 text-creme">
          <span className="font-corpo text-[10.5px] text-creme/90">
            {porMesCents === null ? "vocês querem juntar" : "precisam guardar"}
          </span>
          <b className="mt-0.5 block text-[21px] font-semibold tabular-nums tracking-[-0.035em]">
            {formatBRL(porMesCents ?? alvoCents)}
          </b>
          <span className="font-corpo text-[10.5px] text-creme/90">
            {porMesCents === null ? "quando der" : "por mês, a dois"}
          </span>
        </div>
      </div>

      <span className="mt-1 font-corpo text-[10.5px] text-suave">
        o que vocês querem conquistar
      </span>
      <div className="flex flex-wrap gap-2">
        {CATEGORIAS.map((valor) => (
          <Chip
            key={valor}
            rotulo={rotuloDaCategoria(valor)}
            ativo={categoria === valor}
            onClick={() => setCategoria(valor)}
          />
        ))}
      </div>

      <Campo
        rotulo="O que vocês querem"
        name="titulo"
        maxLength={120}
        value={titulo}
        onChange={(evento) => setTitulo(evento.target.value)}
        placeholder={rotuloDaCategoria(categoria)}
        className="mt-1"
      />

      <div className="rounded-cartao border border-borda bg-white p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-corpo text-[10.5px] text-suave">quanto custa</span>
          <b className="text-[21px] font-semibold tabular-nums tracking-[-0.035em]">
            {formatBRL(alvoCents)}
          </b>
        </div>
        {/* O controle deslizante é para explorar; o campo é para acertar. Só
            o slider deixaria de fora todo valor que não cai num degrau de
            R$ 500 — e "R$ 12.450" é um alvo tão legítimo quanto os outros. */}
        <input
          type="range"
          min={MINIMO}
          max={MAXIMO}
          step={PASSO}
          value={Math.min(MAXIMO, Math.max(MINIMO, alvoCents))}
          onChange={(evento) =>
            setAlvoTexto((Number(evento.target.value) / 100).toFixed(2).replace(".", ","))
          }
          aria-label="Arrastar para escolher quanto vocês querem juntar"
          className="mt-3.5"
        />
        <div className="mt-3.5">
          <Campo
            rotulo="Quanto vocês querem juntar (R$)"
            name="alvo"
            type="text"
            inputMode="decimal"
            required
            value={alvoTexto}
            onChange={(evento) => setAlvoTexto(evento.target.value)}
            placeholder="0,00"
          />
        </div>
        <div className="mt-3.5 flex gap-2">
          {PRAZOS.map(([valor, rotulo]) => (
            <button
              key={rotulo}
              type="button"
              aria-pressed={meses === valor}
              onClick={() => setMeses(valor)}
              className={`flex-1 whitespace-nowrap rounded-full border px-1 py-2.5 text-[11.5px] font-semibold transition active:scale-95 ${
                meses === valor
                  ? "border-tinta bg-tinta text-creme"
                  : "border-contorno/60 bg-white text-suave-forte hover:border-contorno"
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </div>

      <Recado erro={erro} />

      <div className="pt-2">
        <Enviar pendente={criar.isPending} largo>
          Criar jornada
        </Enviar>
      </div>
    </form>
  );
}

/**
 * Passo 2: a jornada existe, e o que falta é o que a faz valer.
 *
 * Os três são links de verdade para a tela certa, e não caixas que se marcam
 * sozinhas — uma lista de tarefas que não leva a lugar nenhum é decoração.
 */
function Pronto({ id, nome, categoria }: { id: string; nome: string; categoria: string }) {
  const comecos: [string, string, string][] = [
    [`/jornadas/${id}`, "Subir a capa", "a foto que abre a jornada"],
    [`/jornadas/${id}`, "Adicionar o primeiro item", "com link, dá para acompanhar o preço"],
    ["/parceiro", "Chamar quem divide o plano", "ninguém entra sem você confirmar"],
  ];

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-3.5 p-5 lg:max-w-md lg:p-10">
      <header>
        <span className="font-corpo text-[10.5px] text-suave">passo 2 de 2</span>
        <h1 className="text-[21px] font-semibold leading-tight tracking-[-0.03em]">
          Jornada criada
        </h1>
      </header>

      <Polaroide indice={0}>
        <Chapa categoria={categoria} className="h-[124px] rounded-chapa" />
        <b className="mt-2.5 block text-[13.5px] font-semibold tracking-[-0.02em]">{nome}</b>
        <span className="font-corpo text-[11px] text-suave">nada guardado ainda</span>
      </Polaroide>

      <span className="mt-2 font-corpo text-[10.5px] text-suave">para começar</span>
      <ul className="flex flex-col gap-2">
        {comecos.map(([href, rotulo, dica]) => (
          <li key={rotulo}>
            <Link
              href={href}
              className="flex items-center gap-3 rounded-cartao border border-borda bg-white p-3 transition hover:border-contorno/60 active:scale-[0.99]"
            >
              <span className="min-w-0 flex-1">
                <b className="block text-[13px] font-semibold tracking-[-0.02em]">{rotulo}</b>
                <i className="block font-corpo text-[10.5px] not-italic text-suave">{dica}</i>
              </span>
              <IconeAvancar aria-hidden="true" className="size-4 flex-none text-suave" />
            </Link>
          </li>
        ))}
      </ul>

      <Explica className="mt-1">
        A jornada só aparece para quem divide o plano depois que essa pessoa
        aceitar o convite e você confirmar.
      </Explica>

      <div className="pt-2">
        <Link
          href={`/jornadas/${id}`}
          className="block rounded-full bg-verde px-5 py-4 text-center text-[13.5px] font-semibold text-creme transition hover:opacity-90 active:scale-[0.98]"
        >
          Abrir a jornada
        </Link>
      </div>
    </main>
  );
}
