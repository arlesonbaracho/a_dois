"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import { aportes, registrarAporte, type Aporte } from "./contributions";
import { meuCasal } from "./couple";
import {
  apagarItem,
  criarItem,
  itensDaMeta,
  salvarItem,
  type Item,
  type StatusItem,
} from "./goal-items";
import {
  apagarMeta,
  criarMeta,
  meta,
  metas,
  salvarMeta,
  type DadosMeta,
  type Meta,
  type ResultadoApagarMeta,
} from "./goals";
import { useSupabase } from "./provider";

/**
 * As chaves do cache, num lugar só.
 *
 * Elas moram aqui e não espalhadas pelos hooks porque o Realtime precisa
 * invalidar EXATAMENTE estas — uma chave escrita à mão em dois lugares vira,
 * mais cedo ou mais tarde, um evento que chega e não atualiza nada.
 */
export const chaves = {
  casal: ["casal"] as const,
  metas: ["metas"] as const,
  // Raízes distintas de propósito. O invalidateQueries casa por PREFIXO: com
  // a chave do detalhe sendo ["metas", id], invalidar a lista arrastaria junto
  // o detalhe de toda meta aberta — e "invalide as queries certas" viraria
  // "invalide quase tudo" sem ninguém perceber.
  meta: (goalId: string) => ["meta", goalId] as const,
  itens: (goalId: string) => ["itens", goalId] as const,
  // A raiz das duas de cima. O Realtime precisa dela porque o evento de DELETE
  // não diz de qual meta era o item — ver o comentário em realtime.ts.
  itensDeQualquerMeta: ["itens"] as const,
  aportesDeQualquerMeta: ["aportes-da-meta"] as const,
  aportes: (goalId?: string) =>
    goalId ? (["aportes-da-meta", goalId] as const) : (["aportes-do-casal"] as const),
} as const;

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

export function useCasal() {
  const client = useSupabase();
  return useQuery({ queryKey: chaves.casal, queryFn: () => meuCasal(client) });
}

export function useMetas(): UseQueryResult<Meta[]> {
  const client = useSupabase();
  return useQuery({ queryKey: chaves.metas, queryFn: () => metas(client) });
}

export function useMeta(goalId: string): UseQueryResult<Meta | null> {
  const client = useSupabase();
  return useQuery({ queryKey: chaves.meta(goalId), queryFn: () => meta(client, goalId) });
}

export function useItens(goalId: string): UseQueryResult<Item[]> {
  const client = useSupabase();
  return useQuery({ queryKey: chaves.itens(goalId), queryFn: () => itensDaMeta(client, goalId) });
}

export function useAportes(goalId?: string): UseQueryResult<Aporte[]> {
  const client = useSupabase();
  return useQuery({ queryKey: chaves.aportes(goalId), queryFn: () => aportes(client, goalId) });
}

// ---------------------------------------------------------------------------
// Escrita
// ---------------------------------------------------------------------------

// Cada mutation invalida só o que ela mexeu. "Invalidar tudo" seria uma linha
// mais curta e uma tela que pisca inteira a cada clique.

export function useCriarMeta(): UseMutationResult<string, Error, DadosMeta> {
  const client = useSupabase();
  const cache = useQueryClient();

  return useMutation({
    mutationFn: (dados: DadosMeta) => criarMeta(client, dados),
    onSuccess: () => cache.invalidateQueries({ queryKey: chaves.metas }),
  });
}

export function useSalvarMeta(
  goalId: string,
): UseMutationResult<void, Error, DadosMeta> {
  const client = useSupabase();
  const cache = useQueryClient();

  return useMutation({
    mutationFn: (dados: DadosMeta) => salvarMeta(client, goalId, dados),
    onSuccess: async () => {
      // A lista mostra título e alvo; o detalhe mostra o resto. As duas mudaram.
      await cache.invalidateQueries({ queryKey: chaves.meta(goalId) });
      await cache.invalidateQueries({ queryKey: chaves.metas });
    },
  });
}

export function useApagarMeta(
  goalId: string,
): UseMutationResult<ResultadoApagarMeta, Error, boolean | void> {
  const client = useSupabase();
  const cache = useQueryClient();

  return useMutation({
    mutationFn: (confirmo?: boolean | void) => apagarMeta(client, goalId, confirmo === true),
    onSuccess: async (resultado) => {
      // 'precisa_confirmar' não mexeu em nada: invalidar aqui faria a tela
      // recarregar para mostrar exatamente o que já estava lá.
      if (resultado !== "ok") return;
      await cache.invalidateQueries({ queryKey: chaves.metas });
      await cache.invalidateQueries({ queryKey: chaves.aportes() });
    },
  });
}

export function useCriarItem(
  goalId: string,
): UseMutationResult<string, Error, { nome: string; precoCents: number | null; url: string | null }> {
  const client = useSupabase();
  const cache = useQueryClient();

  return useMutation({
    mutationFn: (dados: { nome: string; precoCents: number | null; url: string | null }) =>
      criarItem(client, { goalId, ...dados }),
    onSuccess: () => cache.invalidateQueries({ queryKey: chaves.itens(goalId) }),
  });
}

export function useSalvarItem(
  goalId: string,
): UseMutationResult<
  void,
  Error,
  { itemId: string; nome?: string; precoCents?: number | null; status?: StatusItem }
> {
  const client = useSupabase();
  const cache = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, ...dados }) => salvarItem(client, itemId, dados),
    onSuccess: () => cache.invalidateQueries({ queryKey: chaves.itens(goalId) }),
  });
}

export function useApagarItem(goalId: string): UseMutationResult<void, Error, string> {
  const client = useSupabase();
  const cache = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => apagarItem(client, itemId),
    onSuccess: () => cache.invalidateQueries({ queryKey: chaves.itens(goalId) }),
  });
}

export function useRegistrarAporte(
  goalId: string,
): UseMutationResult<string, Error, { valorCents: number; quandoISO?: string }> {
  const client = useSupabase();
  const cache = useQueryClient();

  return useMutation({
    mutationFn: (dados: { valorCents: number; quandoISO?: string }) =>
      registrarAporte(client, { goalId, ...dados }),
    onSuccess: async () => {
      // A barra desta meta e o saldo do casal saem da mesma tabela, por dois
      // recortes diferentes. Os dois mudaram.
      await cache.invalidateQueries({ queryKey: chaves.aportes(goalId) });
      await cache.invalidateQueries({ queryKey: chaves.aportes() });
    },
  });
}
