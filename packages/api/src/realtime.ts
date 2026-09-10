"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { chaves, useCasal } from "./hooks";
import { useSupabase } from "./provider";

type LinhaComMeta = { goal_id?: unknown; id?: unknown };

/** O goal_id do evento, seja ele insert, update ou delete. */
function goalIdDoEvento(nova: LinhaComMeta | null, velha: LinhaComMeta | null): string | null {
  const bruto = nova?.goal_id ?? velha?.goal_id;
  return typeof bruto === "string" ? bruto : null;
}

function idDoEvento(nova: LinhaComMeta | null, velha: LinhaComMeta | null): string | null {
  const bruto = nova?.id ?? velha?.id;
  return typeof bruto === "string" ? bruto : null;
}

/**
 * Faz o plano ser compartilhado de verdade: o que um escreve aparece na tela do
 * outro sem F5.
 *
 * Um canal por casal, filtrado por `couple_id` no servidor — assim o Realtime
 * não gasta a rede de ninguém mandando evento de casal alheio, e o RLS ainda
 * confere as policies antes de entregar a linha (o canal sobe com o JWT de quem
 * está olhando, que o supabase-js repassa do `accessToken`).
 *
 * Cada evento invalida a chave daquela tabela, e só ela. Um `invalidateQueries()`
 * sem argumento seria uma linha mais curta e a tela inteira piscando toda vez
 * que a outra pessoa mexe em qualquer coisa.
 *
 * Não desenha nada e não devolve nada: monte uma vez, no layout.
 */
export function useRealtimeDoCasal(): void {
  const client = useSupabase();
  const cache = useQueryClient();
  const { data: casal } = useCasal();
  const coupleId = casal?.id;

  useEffect(() => {
    if (!coupleId) return;

    const filtro = `couple_id=eq.${coupleId}`;
    const canal = client.channel(`casal:${coupleId}`);

    canal
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "goals", filter: filtro },
        ({ new: nova, old: velha }) => {
          void cache.invalidateQueries({ queryKey: chaves.metas });
          const id = idDoEvento(nova, velha);
          if (id) void cache.invalidateQueries({ queryKey: chaves.meta(id) });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "goal_items", filter: filtro },
        ({ new: nova, old: velha }) => {
          // Medido com sonda no navegador, e não deduzido: o payload de DELETE
          // do Realtime traz `old` só com a chave primária — nem com "replica
          // identity full" ele manda a linha velha inteira. Ou seja, num item
          // apagado NÃO dá para saber de qual meta ele era.
          //
          // Então: quando dá para saber (insert e update), invalida a meta
          // certa; quando não dá, invalida a raiz ["itens"], que casa por
          // prefixo com as listas de item em cache. Numa tela de meta aberta
          // isso é exatamente uma consulta — bem menos que recarregar tudo, e
          // com a garantia de que o item some da tela do outro.
          const goalId = goalIdDoEvento(nova, velha);
          void cache.invalidateQueries({
            queryKey: goalId ? chaves.itens(goalId) : chaves.itensDeQualquerMeta,
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contributions", filter: filtro },
        ({ new: nova, old: velha }) => {
          void cache.invalidateQueries({ queryKey: chaves.aportes() });
          // Mesma história do DELETE aqui: aporte apagado não diz de qual meta
          // era, e a barra de progresso dele precisa refazer a conta.
          const goalId = goalIdDoEvento(nova, velha);
          void cache.invalidateQueries({
            queryKey: goalId ? chaves.aportes(goalId) : chaves.aportesDeQualquerMeta,
          });
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(canal);
    };
  }, [client, cache, coupleId]);
}
