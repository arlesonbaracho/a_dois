"use client";

import { useState } from "react";

import {
  type Prioridade,
  useAportes,
  useCriarMeta,
  useMembros,
  useMetas,
} from "@repo/api";
import {
  coresDoCasal,
  formatBRL,
  ordemEstavel,
  progressoPercentual,
  sumCents,
} from "@repo/core";

import { Campo, Enviar, Escolha, Recado } from "@/components/form-ui";
import { Bloco, CartaoJornada, PilulaTotal } from "@/components/pecas";
import type { Fatia } from "@/components/progresso";
import { paraCentavos, paraInstante } from "@/lib/dinheiro";

export const PRIORIDADES: [Prioridade, string][] = [
  ["alta", "É o que a gente mais quer"],
  ["media", "Importante, sem pressa"],
  ["baixa", "Um dia"],
];

export function Lista() {
  const { data: jornadas, isPending, isError } = useMetas();
  const { data: aportes } = useAportes();
  const { data: membros } = useMembros();
  const criar = useCriarMeta();
  const [erro, setErro] = useState("");

  // Quanto já entrou em cada jornada, e de quem. Uma passada pelos aportes do
  // casal, e a barra de cada cartão sai daqui — nada de uma consulta por linha
  // da lista.
  const porJornada = new Map<string, Map<string, number>>();
  for (const aporte of aportes ?? []) {
    const dentro = porJornada.get(aporte.goal_id) ?? new Map<string, number>();
    const chave = aporte.user_id ?? "fora";
    dentro.set(chave, (dentro.get(chave) ?? 0) + aporte.amount_cents);
    porJornada.set(aporte.goal_id, dentro);
  }

  const pessoas = (membros ?? []).map((membro) => ({
    userId: membro.user_id,
    papel: membro.role,
  }));
  const cores = coresDoCasal(pessoas);

  function fatiasDe(goalId: string): Fatia[] {
    const dentro = porJornada.get(goalId) ?? new Map<string, number>();
    const dasPessoas = ordemEstavel(pessoas).map((pessoa) => ({
      chave: pessoa.userId,
      cents: dentro.get(pessoa.userId) ?? 0,
      cor: cores.get(pessoa.userId) ?? ("fora" as const),
    }));
    const deQuemSaiu = dentro.has("fora")
      ? [{ chave: "fora", cents: dentro.get("fora") ?? 0, cor: "fora" as const }]
      : [];
    return [...dasPessoas, ...deQuemSaiu].filter((fatia) => fatia.cents > 0);
  }

  async function criarJornada(evento: React.FormEvent<HTMLFormElement>) {
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

  const total = sumCents(
    [...porJornada.values()].flatMap((dentro) => [...dentro.values()]),
  );

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-5 lg:max-w-4xl lg:p-10">
      <header>
        <h1 className="text-[27px] font-bold tracking-[-0.04em] lg:text-4xl">
          Jornadas de vocês
        </h1>
        <p className="mt-1 font-corpo text-[12.5px] text-suave-forte">
          O que vocês estão juntando dinheiro para conseguir.
        </p>
      </header>

      {isError ? (
        <Recado erro="Não consegui carregar as jornadas agora." />
      ) : isPending ? (
        <p className="font-corpo text-[13px] text-suave">Carregando…</p>
      ) : jornadas.length === 0 ? (
        <p className="max-w-[26ch] text-[20px] font-bold leading-tight tracking-[-0.03em]">
          Ainda não tem jornada nenhuma. Comecem por uma.
        </p>
      ) : (
        <>
          <PilulaTotal>{formatBRL(total)} juntos</PilulaTotal>
          <div className="gap-3 columns-2 lg:columns-3">
            {jornadas.map((jornada, indice) => {
              const dentro = porJornada.get(jornada.id) ?? new Map<string, number>();
              const aportado = sumCents([...dentro.values()]);
              return (
                <CartaoJornada
                  key={jornada.id}
                  indice={indice}
                  id={jornada.id}
                  titulo={jornada.title}
                  categoria={jornada.category}
                  aportadoCents={aportado}
                  alvoCents={jornada.target_amount_cents}
                  percentual={progressoPercentual(aportado, jornada.target_amount_cents)}
                  fatias={fatiasDe(jornada.id)}
                />
              );
            })}
          </div>
        </>
      )}

      <Bloco className="mt-1 lg:max-w-md">
        <h2 className="text-[17px] font-bold tracking-[-0.03em]">Nova jornada</h2>
        <form onSubmit={criarJornada} className="mt-3 flex flex-col gap-3.5">
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
          <Escolha rotulo="Quanto isso importa" name="prioridade" defaultValue="media">
            {PRIORIDADES.map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </Escolha>

          <Recado erro={erro} />
          <Enviar pendente={criar.isPending}>Criar jornada</Enviar>
        </form>
      </Bloco>
    </main>
  );
}
