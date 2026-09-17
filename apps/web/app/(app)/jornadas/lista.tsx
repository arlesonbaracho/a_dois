"use client";

import Link from "next/link";

import { useAportes, useCapas, useMembros, useMetas } from "@repo/api";
import {
  coresDoCasal,
  formatBRL,
  ordemDoAlbum,
  ordemEstavel,
  progressoPercentual,
  sumCents,
} from "@repo/core";

import { EsqueletoAlbum } from "@/components/esqueleto";
import { Recado } from "@/components/form-ui";
import { IconeMais } from "@/components/icones";
import { CartaoJornada, Explica, PilulaTotal } from "@/components/pecas";
import type { Fatia } from "@/components/progresso";

export function Lista() {
  const { data: jornadas, isPending, isError } = useMetas();
  const { data: aportes } = useAportes();
  const { data: membros } = useMembros();
  // Tela de cliente, então a assinatura vem por hook. Mesma função embaixo que
  // a home usa no servidor — o que muda é só quem chama.
  const { data: capas } = useCapas((jornadas ?? []).map((jornada) => jornada.cover_path));

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

  const total = sumCents([...porJornada.values()].flatMap((dentro) => [...dentro.values()]));

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-5 lg:max-w-4xl lg:p-10">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[30px] font-medium leading-none tracking-[-0.03em] lg:text-4xl">
            Jornadas de vocês
          </h1>
          <Explica className="mt-1.5">
            O que vocês estão juntando dinheiro para conseguir.
          </Explica>
        </div>
        {/* Pílula com texto, e não disco: o disco de "+" do dock já quer dizer
            "anotar aporte", e dois "+" iguais com dois sentidos na mesma tela
            fariam a pessoa errar o toque. */}
        <Link
          href="/jornadas/nova"
          className="flex h-11 flex-none items-center gap-1.5 rounded-full border border-contorno bg-white pl-3 pr-4 text-[14px] transition hover:bg-areia active:scale-95"
        >
          <IconeMais className="size-[18px]" />
          Nova jornada
        </Link>
      </header>

      {isError ? (
        <Recado erro="Não consegui carregar as jornadas agora." />
      ) : isPending ? (
        <EsqueletoAlbum quantos={4} />
      ) : jornadas.length === 0 ? (
        /* O vazio diz o que falta e leva à tela que resolve. */
        <div className="flex flex-col items-start gap-4 py-4">
          <p className="max-w-[26ch] text-[22px] font-medium leading-tight tracking-[-0.03em]">
            Ainda não tem jornada nenhuma. Comecem por uma.
          </p>
          <Explica className="max-w-[42ch]">
            Pode ser a viagem, a entrada do apê, ou só um fundo do sossego. Dá
            para mudar o nome e o valor depois — o que importa é começar.
          </Explica>
          <Link
            href="/jornadas/nova"
            className="rounded-full bg-tinta px-5 py-3.5 text-[15px] font-medium text-creme transition hover:opacity-90 active:scale-[0.97]"
          >
            Criar a primeira
          </Link>
        </div>
      ) : (
        <>
          <PilulaTotal>{formatBRL(total)} juntos</PilulaTotal>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
            {ordemDoAlbum(
              jornadas.map((jornada) => {
                const dentro = porJornada.get(jornada.id) ?? new Map<string, number>();
                const aportado = sumCents([...dentro.values()]);
                return {
                  id: jornada.id,
                  criadaEmISO: jornada.created_at,
                  prioridade: jornada.priority,
                  titulo: jornada.title,
                  categoria: jornada.category,
                  capaUrl: jornada.cover_path ? (capas?.get(jornada.cover_path) ?? null) : null,
                  aportadoCents: aportado,
                  alvoCents: jornada.target_amount_cents,
                  percentual: progressoPercentual(aportado, jornada.target_amount_cents),
                  fatias: fatiasDe(jornada.id),
                };
              }),
            ).map((jornada) => (
              <CartaoJornada key={jornada.id} {...jornada} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
