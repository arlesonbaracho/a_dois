"use client";

import Link from "next/link";
import { useState } from "react";

import {
  type Prioridade,
  useAportes,
  useCriarMeta,
  useMetas,
} from "@repo/api";
import { formatBRL, progressoPercentual, sumCents } from "@repo/core";

import { Campo, Enviar, Recado } from "@/components/form-ui";
import { Progresso } from "@/components/progresso";
import { paraCentavos, paraInstante } from "@/lib/dinheiro";

export const PRIORIDADES: [Prioridade, string][] = [
  ["alta", "É o que a gente mais quer"],
  ["media", "Importante, sem pressa"],
  ["baixa", "Um dia"],
];

export function Lista() {
  const { data: metas, isPending, isError } = useMetas();
  const { data: aportes } = useAportes();
  const criar = useCriarMeta();
  const [erro, setErro] = useState("");

  // Quanto já entrou em cada meta. Uma passada pelos aportes do casal, e a
  // barra de cada meta sai daqui — nada de uma consulta por linha da lista.
  const aportadoPorMeta = new Map<string, number>();
  for (const aporte of aportes ?? []) {
    aportadoPorMeta.set(
      aporte.goal_id,
      (aportadoPorMeta.get(aporte.goal_id) ?? 0) + aporte.amount_cents,
    );
  }

  async function criarMeta(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = new FormData(evento.currentTarget);
    const campo = (nome: string) => String(form.get(nome) ?? "").trim();

    const alvo = paraCentavos(campo("alvo"));
    if (alvo === null) {
      setErro("Escreva quanto vocês querem juntar, em reais.");
      return;
    }

    setErro("");
    try {
      await criar.mutateAsync({
        titulo: campo("titulo"),
        alvoCents: alvo,
        categoria: campo("categoria") || "geral",
        prazoISO: paraInstante(campo("prazo")),
        prioridade: (campo("prioridade") || "media") as Prioridade,
      });
      evento.currentTarget?.reset();
    } catch {
      setErro("Não consegui criar agora. Tenta de novo?");
    }
  }

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">Metas de vocês</h1>
        <p className="mt-1 text-stone-600">
          O que vocês estão juntando dinheiro para conseguir.
        </p>
      </div>

      {isError ? (
        <Recado erro="Não consegui carregar as metas agora." />
      ) : isPending ? (
        <p className="text-stone-600">Carregando…</p>
      ) : metas.length === 0 ? (
        <p className="rounded-2xl bg-orange-50 p-4 text-sm text-orange-900">
          Ainda não tem meta nenhuma. Comecem por uma — pode ser a viagem, a
          entrada do apê, ou só um &ldquo;fundo do sossego&rdquo;.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {metas.map((meta) => {
            const aportado = aportadoPorMeta.get(meta.id) ?? 0;
            return (
              <li key={meta.id}>
                <Link
                  href={`/metas/${meta.id}`}
                  className="flex flex-col gap-2 rounded-2xl border border-stone-200 p-4"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{meta.title}</span>
                    <span className="text-sm text-stone-600">{meta.category}</span>
                  </div>
                  <Progresso
                    percentual={progressoPercentual(aportado, meta.target_amount_cents)}
                    aportadoCents={aportado}
                    alvoCents={meta.target_amount_cents}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {metas && metas.length > 0 ? (
        <p className="text-sm text-stone-600">
          Somando tudo: {formatBRL(sumCents([...aportadoPorMeta.values()]))} já
          guardados.
        </p>
      ) : null}

      <form onSubmit={criarMeta} className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Nova meta</h2>

        <Campo rotulo="O que vocês querem" name="titulo" maxLength={120} required />
        <Campo
          rotulo="Quanto vocês querem juntar (R$)"
          name="alvo"
          type="text"
          required
          inputMode="decimal"
          placeholder="0,00"
        />
        <Campo
          rotulo="Categoria"
          name="categoria"
          maxLength={40}
          defaultValue="geral"
          placeholder="casa, viagem, bebê…"
        />
        <Campo rotulo="Para quando (opcional)" name="prazo" type="date" />

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Quanto isso importa</span>
          <select
            name="prioridade"
            defaultValue="media"
            className="rounded-xl border border-stone-300 px-3 py-2 text-base"
          >
            {PRIORIDADES.map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>

        <Recado erro={erro} />
        <Enviar pendente={criar.isPending}>Criar meta</Enviar>
      </form>

      <div className="flex gap-4 text-sm">
        <Link href="/" className="underline">
          Voltar
        </Link>
        <Link href="/aportes" className="underline">
          Saldo entre vocês
        </Link>
      </div>
    </main>
  );
}
