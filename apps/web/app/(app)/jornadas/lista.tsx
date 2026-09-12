"use client";

import { useState } from "react";

import {
  type Prioridade,
  useAportes,
  useCapas,
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
import { EsqueletoAlbum } from "@/components/esqueleto";
import { Bloco, CartaoJornada, Explica, PilulaTotal, Secao } from "@/components/pecas";
import type { Fatia } from "@/components/progresso";
import { marcarPrimeiraMeta } from "@/components/pwa";
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
  // Tela de cliente, então a assinatura vem por hook. Mesma função embaixo que
  // a home usa no servidor — o que muda é só quem chama.
  const { data: capas } = useCapas((jornadas ?? []).map((jornada) => jornada.cover_path));
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
      // Libera o convite de instalar o PWA. A função existia sem nenhum
      // chamador desde o prompt 5 — o convite nunca aparecia.
      marcarPrimeiraMeta();
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
        <Explica className="mt-1">
          O que vocês estão juntando dinheiro para conseguir.
        </Explica>
      </header>

      {/* Desktop: álbum à esquerda, "nova jornada" à direita. Antes o
          formulário ficava colado na esquerda e a metade direita da tela
          ficava vazia. */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-x-10">
      <div className="flex flex-col gap-4 lg:col-start-1">
      {isError ? (
        <Recado erro="Não consegui carregar as jornadas agora." />
      ) : isPending ? (
        <EsqueletoAlbum quantos={4} />
      ) : jornadas.length === 0 ? (
        /* O vazio é uma página em branco do álbum, não um recado de erro: a
           frase grande diz o que falta, e a linha abaixo aponta para o
           formulário que já está na tela. */
        <div className="flex flex-col items-start gap-3 py-2">
          <p className="max-w-[26ch] text-[22px] font-bold leading-tight tracking-[-0.03em]">
            Ainda não tem jornada nenhuma. Comecem por uma.
          </p>
          <Explica className="max-w-[42ch]">
            Pode ser a viagem, a entrada do apê, ou só um fundo do sossego. Dá
            para mudar o nome e o valor depois — o que importa é começar.
          </Explica>
        </div>
      ) : (
        <>
          <PilulaTotal>{formatBRL(total)} juntos</PilulaTotal>
          <div className="gap-3 columns-2 lg:columns-2">
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
                  capaUrl={jornada.cover_path ? capas?.get(jornada.cover_path) : null}
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

      </div>

      <Bloco className="mt-1 lg:sticky lg:top-10 lg:col-start-2 lg:row-start-1 lg:mt-0">
        <Secao>Nova jornada</Secao>
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
      </div>
    </main>
  );
}
