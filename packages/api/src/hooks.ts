"use client";

import type { Cotacao } from "@repo/core";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import { urlsDasCapas, enviarCapa, type NovaCapa } from "./capas";
import { buscarPrecoDoLink, cotacoesDoItem, type ResultadoBusca } from "./prices";
import { aportes, registrarAporte, type Aporte } from "./contributions";
import { membrosDoCasal, meuCasal, type MembroDoCasal } from "./couple";
import { ofertasParaItem, type Oferta } from "./offers";
import { salvarConsentimento, type TipoConsentimento } from "./privacy";
import { meuPerfil, type Perfil } from "./profiles";
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
  ofertas: (termo: string, categoria: string) => ["ofertas", categoria, termo] as const,
  casal: ["casal"] as const,
  membros: ["membros"] as const,
  perfil: (userId: string) => ["perfil", userId] as const,
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
  // Os caminhos entram na chave, e não só a lista de jornadas: trocar a foto
  // muda o caminho, a chave muda junto e a assinatura é refeita sozinha. Sem
  // isso, a tela mostraria a capa velha até alguém recarregar.
  capas: (caminhos: string[]) => ["capas", caminhos.join(",")] as const,
  cotacoes: (itemId: string) => ["cotacoes", itemId] as const,
} as const;

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

export function useCasal() {
  const client = useSupabase();
  return useQuery({ queryKey: chaves.casal, queryFn: () => meuCasal(client) });
}

/**
 * Quem está no casal. Existe para a barra bicolor: sem os membros, a tela de
 * cliente não tem como saber quem é verde e quem é âmbar, e a cor de cada
 * pessoa mudaria de tela para tela.
 *
 * Fora do Realtime de propósito: `couple_members` não é publicada, e entrar e
 * sair do casal são eventos raros que já recarregam a navegação inteira.
 */
export function useMembros(): UseQueryResult<MembroDoCasal[]> {
  const client = useSupabase();
  return useQuery({ queryKey: chaves.membros, queryFn: () => membrosDoCasal(client) });
}

export function useMeuPerfil(userId: string | undefined) {
  const client = useSupabase();
  return useQuery({
    queryKey: chaves.perfil(userId ?? ""),
    queryFn: () => meuPerfil(client, userId as string),
    enabled: Boolean(userId),
  });
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

/**
 * As URLs assinadas das capas de uma tela.
 *
 * O bucket é privado, então a foto não tem endereço fixo: cada visita pede uma
 * assinatura com o JWT de quem está olhando, e o Storage só assina o que a
 * policy de select deixa ver.
 *
 * `staleTime` bem abaixo da validade da assinatura, de propósito: URL vencida
 * na tela é foto quebrada, e vale mais assinar de novo do que descobrir isso
 * pelo buraco branco na polaroide.
 */
export function useCapas(caminhos: (string | null)[]): UseQueryResult<Map<string, string>> {
  const client = useSupabase();
  const lista = [...new Set(caminhos.filter((c): c is string => Boolean(c)))].sort();

  return useQuery({
    queryKey: chaves.capas(lista),
    queryFn: () => urlsDasCapas(client, lista),
    enabled: lista.length > 0,
    staleTime: 30 * 60 * 1000,
    // Sem capa nenhuma a query nem roda, e a tela ainda precisa de um mapa
    // para consultar. Vazio é a resposta certa, não "carregando".
    initialData: lista.length === 0 ? new Map<string, string>() : undefined,
  });
}

/**
 * O histórico de preço de um item.
 *
 * `enabled` amarrado ao id: a lista de itens monta um hook por linha, e sem
 * isso cada item sem id dispararia uma consulta vazia.
 */
/**
 * As ofertas para um item. `staleTime` longo de propósito: oferta não muda por
 * ação de casal, e o Realtime não assina esta tabela.
 */
export function useOfertasParaItem(
  nomeDoItem: string,
  categoria: string,
): UseQueryResult<Oferta[]> {
  const client = useSupabase();
  return useQuery({
    queryKey: chaves.ofertas(nomeDoItem, categoria),
    queryFn: () => ofertasParaItem(client, nomeDoItem, categoria),
    staleTime: 10 * 60_000,
  });
}

export function useCotacoes(goalItemId: string): UseQueryResult<Cotacao[]> {
  const client = useSupabase();
  return useQuery({
    queryKey: chaves.cotacoes(goalItemId),
    queryFn: () => cotacoesDoItem(client, goalItemId),
    enabled: Boolean(goalItemId),
  });
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

/**
 * Troca a capa da jornada.
 *
 * Invalida a lista e o detalhe porque as duas mostram a foto — e não invalida
 * as capas: o caminho novo já muda a chave de `useCapas`, que é o que faz a
 * assinatura ser refeita.
 */
export function useEnviarCapa(
  goalId: string,
): UseMutationResult<string, Error, Omit<NovaCapa, "goalId">> {
  const client = useSupabase();
  const cache = useQueryClient();

  return useMutation({
    mutationFn: (nova: Omit<NovaCapa, "goalId">) => enviarCapa(client, { ...nova, goalId }),
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: chaves.meta(goalId) });
      await cache.invalidateQueries({ queryKey: chaves.metas });
    },
  });
}

/**
 * Vai à loja, lê o preço e guarda a cotação.
 *
 * Invalida as cotações do item e a lista de itens: a função grava uma linha
 * nova em `price_quotes`, e a tela mostra a variação a partir dela.
 */
export function useBuscarPreco(
  goalId: string,
): UseMutationResult<ResultadoBusca, Error, { itemId: string; url: string }> {
  const client = useSupabase();
  const cache = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, url }: { itemId: string; url: string }) =>
      buscarPrecoDoLink(client, itemId, url),
    onSuccess: async (resultado, { itemId }) => {
      // Recusa da loja não mexeu em nada: invalidar aqui faria a tela
      // recarregar para mostrar exatamente o que já estava lá.
      if (!resultado.ok) return;
      await cache.invalidateQueries({ queryKey: chaves.cotacoes(itemId) });
      await cache.invalidateQueries({ queryKey: chaves.itens(goalId) });
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

/**
 * Marcar um item mexe numa caixa de marcar, e caixa de marcar tem que responder
 * no instante do clique. Sem o estado otimista ela só muda quando a escrita
 * volta do servidor — em rede ruim parece que o clique não pegou, e a pessoa
 * clica de novo.
 *
 * O par completo, e não só o onMutate: sem o rollback do onError, uma escrita
 * que falha deixa a tela mentindo, que é pior que a demora.
 */
export function useSalvarItem(
  goalId: string,
): UseMutationResult<
  void,
  Error,
  { itemId: string; nome?: string; precoCents?: number | null; status?: StatusItem },
  { anterior: Item[] | undefined }
> {
  const client = useSupabase();
  const cache = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, ...dados }) => salvarItem(client, itemId, dados),

    onMutate: async ({ itemId, nome, precoCents, status }) => {
      // Cancela o refetch em voo: se ele chegar depois, escreve por cima do
      // otimista e a caixa pisca de volta.
      await cache.cancelQueries({ queryKey: chaves.itens(goalId) });
      const anterior = cache.getQueryData<Item[]>(chaves.itens(goalId));

      cache.setQueryData<Item[]>(chaves.itens(goalId), (itens) =>
        (itens ?? []).map((item) =>
          item.id === itemId
            ? {
                ...item,
                ...(nome === undefined ? {} : { name: nome }),
                ...(precoCents === undefined ? {} : { estimated_price_cents: precoCents }),
                ...(status === undefined ? {} : { status }),
              }
            : item,
        ),
      );

      return { anterior };
    },

    onError: (_erro, _dados, contexto) => {
      if (contexto) cache.setQueryData(chaves.itens(goalId), contexto.anterior);
    },

    onSettled: () => cache.invalidateQueries({ queryKey: chaves.itens(goalId) }),
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

const COLUNA_DO_CONSENTIMENTO = {
  analytics: "consent_analytics_at",
  marketing: "consent_marketing_at",
  income_band: "consent_income_band_at",
} as const;

/**
 * Um consentimento por vez, de propósito: quem chama passa o tipo, e o banco
 * escreve só aquela coluna. Consentimento agrupado não é consentimento.
 *
 * Otimista pelo mesmo motivo do item — e aqui pesa mais: um toggle de
 * consentimento que demora a responder é um toggle que a pessoa clica duas
 * vezes, e o segundo clique desfaz o primeiro.
 */
export function useSalvarConsentimento(
  userId: string,
): UseMutationResult<
  void,
  Error,
  { tipo: TipoConsentimento; aceito: boolean },
  { anterior: Perfil | null | undefined }
> {
  const client = useSupabase();
  const cache = useQueryClient();

  return useMutation({
    mutationFn: ({ tipo, aceito }) => salvarConsentimento(client, tipo, aceito),

    onMutate: async ({ tipo, aceito }) => {
      await cache.cancelQueries({ queryKey: chaves.perfil(userId) });
      const anterior = cache.getQueryData<Perfil | null>(chaves.perfil(userId));

      cache.setQueryData<Perfil | null>(chaves.perfil(userId), (perfil) =>
        perfil
          ? { ...perfil, [COLUNA_DO_CONSENTIMENTO[tipo]]: aceito ? new Date().toISOString() : null }
          : perfil,
      );

      return { anterior };
    },

    onError: (_erro, _dados, contexto) => {
      if (contexto) cache.setQueryData(chaves.perfil(userId), contexto.anterior);
    },

    onSettled: () => cache.invalidateQueries({ queryKey: chaves.perfil(userId) }),
  });
}
