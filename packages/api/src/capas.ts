import type { SupabaseClient } from "@supabase/supabase-js";

import { CAPA_BUCKET, CAPA_TIPO, caminhoDaCapa } from "@repo/core";

import type { Database } from "./database.types";

type Client = SupabaseClient<Database>;

/**
 * A capa da jornada, dos dois lados: subir e ver.
 *
 * O bucket é privado. Isso é decisão, não configuração esquecida: bucket
 * público entregaria a foto do casal a qualquer um com o link. O preço é que
 * ver exige uma URL assinada — e o Storage só assina o que a policy de select
 * deixa ver, com o JWT de quem está olhando.
 */

/** Uma hora. Mais que o suficiente para uma tela aberta, e nada de eterno. */
const VALIDADE_SEGUNDOS = 3600;

/**
 * Assina as capas de uma tela inteira numa chamada só.
 *
 * Em lote de propósito: uma assinatura por cartão seria uma requisição por
 * linha da lista, que é o caminho óbvio e o errado — o mesmo motivo pelo qual
 * a lista soma os aportes numa passada e não numa consulta por meta.
 *
 * Devolve um mapa de caminho -> URL. Caminho que o Storage recusar assinar
 * simplesmente não entra no mapa, e a tela mostra a chapa: capa que sumiu não
 * é erro de tela, é tela sem capa.
 */
export async function urlsDasCapas(
  client: Client,
  caminhos: (string | null)[],
): Promise<Map<string, string>> {
  const lista = [...new Set(caminhos.filter((c): c is string => Boolean(c)))];
  if (lista.length === 0) return new Map();

  const { data, error } = await client.storage
    .from(CAPA_BUCKET)
    .createSignedUrls(lista, VALIDADE_SEGUNDOS);

  if (error) throw error;

  const assinadas = new Map<string, string>();
  for (const item of data ?? []) {
    if (item.path && item.signedUrl && !item.error) {
      assinadas.set(item.path, item.signedUrl);
    }
  }
  return assinadas;
}

export type NovaCapa = {
  coupleId: string;
  goalId: string;
  /** O JPEG já reduzido e sem EXIF. Quem reduz é a camada que tem canvas. */
  blob: Blob;
  /** uuid da foto. Vem de fora porque gerar uuid é coisa de ambiente. */
  id: string;
  /** A capa que estava lá, para não deixar lixo acumulando a cada troca. */
  anterior?: string | null;
};

/**
 * Sobe a capa e aponta a jornada para ela.
 *
 * O caminho sai de `caminhoDaCapa`, e o banco confere de novo pela constraint
 * `goals_cover_path_do_nosso_bucket`: mesmo que esta função errasse o formato,
 * a coluna recusaria. É de propósito que a regra esteja nos dois lugares — o
 * daqui é conveniência, o de lá é a garantia.
 */
export async function enviarCapa(client: Client, nova: NovaCapa): Promise<string> {
  const caminho = caminhoDaCapa(nova.coupleId, nova.goalId, nova.id);

  const { error: erroUpload } = await client.storage
    .from(CAPA_BUCKET)
    .upload(caminho, nova.blob, { contentType: CAPA_TIPO });

  if (erroUpload) throw erroUpload;

  const { error } = await client
    .from("goals")
    .update({ cover_path: caminho })
    .eq("id", nova.goalId);

  if (error) {
    // A linha não aponta para o objeto que acabou de subir: ele ficaria órfão
    // e contando espaço para sempre. Melhor esforço, e o erro original é o que
    // sobe — falhar por causa da limpeza esconderia a causa.
    await client.storage.from(CAPA_BUCKET).remove([caminho]);
    throw error;
  }

  // A anterior sai só depois de a nova estar no lugar. Na outra ordem, uma
  // falha no meio deixaria a jornada sem capa nenhuma.
  if (nova.anterior && nova.anterior !== caminho) {
    await client.storage.from(CAPA_BUCKET).remove([nova.anterior]);
  }

  return caminho;
}
