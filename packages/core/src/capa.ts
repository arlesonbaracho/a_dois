/**
 * A capa da jornada: o formato do caminho, e nada além disso.
 *
 * TypeScript puro, como todo o resto de core — o Expo da fase 2 usa este mesmo
 * arquivo. Quem sabe o que é um File, um canvas ou uma requisição é a camada
 * de cima; aqui mora só a regra de como o caminho se escreve.
 *
 * O caminho É a autorização: o primeiro segmento é o casal, e é ele que as
 * quatro policies de storage.objects conferem. Por isso o formato não é
 * detalhe de arrumação — é a mesma coisa que a constraint
 * goals_cover_path_do_nosso_bucket exige do outro lado.
 */

/** O bucket privado das capas. */
export const CAPA_BUCKET = "capas";

/**
 * Um tipo só, e uma extensão só.
 *
 * Toda foto é reencodada para JPEG antes de subir, o que resolve dois
 * problemas de uma vez: tira o EXIF junto — e com ele a coordenada de GPS, que
 * o projeto declara não coletar — e derruba o peso de uma foto de celular.
 */
export const CAPA_TIPO = "image/jpeg";
export const CAPA_EXTENSAO = "jpg";

/** Teto de 2 MiB, o mesmo que está na linha do bucket. */
export const CAPA_MAX_BYTES = 2 * 1024 * 1024;

/** Maior lado da foto depois de reduzida. A polaroide nunca passa disso. */
export const CAPA_MAX_LADO = 1280;

/**
 * O mesmo padrão da constraint, do lado de cá.
 *
 * Existe para o teste poder provar que os dois lados concordam. Se o regex do
 * SQL mudar e este não, o teste de `capa.test.ts` reprova — que é exatamente o
 * momento em que a divergência custa barato.
 */
const FORMATO = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/;

/**
 * Onde a capa desta jornada mora.
 *
 * `id` vem de fora porque gerar uuid é coisa de ambiente: o navegador tem
 * `crypto.randomUUID`, o React Native não tem por padrão. core recebe pronto.
 */
export function caminhoDaCapa(coupleId: string, goalId: string, id: string): string {
  const caminho = `${coupleId}/${goalId}/${id}.${CAPA_EXTENSAO}`;
  if (!FORMATO.test(caminho)) {
    throw new Error("Caminho de capa fora do formato");
  }
  return caminho;
}

/** O caminho tem a forma que o banco aceita? */
export function ehCaminhoDeCapa(caminho: string): boolean {
  return FORMATO.test(caminho);
}
