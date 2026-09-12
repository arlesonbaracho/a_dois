import { CAPA_MAX_BYTES, CAPA_MAX_LADO, CAPA_TIPO } from "@repo/core";

/**
 * Prepara a foto escolhida para virar capa.
 *
 * Mora em apps/web porque toca em canvas, que é DOM — na fase 2 o Expo faz o
 * mesmo com expo-image-manipulator, e a camada de dados nem fica sabendo.
 *
 * Reencodar não é otimização: é o que TIRA O EXIF, e com ele a coordenada de
 * GPS que a câmera do celular grava em toda foto. Geolocalização precisa está
 * na lista de dados que este projeto declara não coletar — subir o arquivo
 * como veio seria coletá-la sem querer. O canvas não copia metadado nenhum
 * para o blob de saída, então a limpeza é consequência do desenho, não uma
 * chamada que alguém pode esquecer de fazer.
 *
 * De quebra resolve o peso: a transformação de imagem do Supabase é do plano
 * Pro, então sem reduzir aqui serviríamos 5 MB numa polaroide de 96px, no
 * celular, em dados móveis.
 */
export async function prepararCapa(arquivo: File): Promise<Blob> {
  // `from-image` aplica a rotação do EXIF antes de descartá-lo. Sem isso, foto
  // tirada em pé chega deitada — o metadado que dizia "gire" some no reencode.
  const bitmap = await createImageBitmap(arquivo, { imageOrientation: "from-image" });

  try {
    const escala = Math.min(1, CAPA_MAX_LADO / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);

    const contexto = canvas.getContext("2d");
    if (!contexto) throw new Error("Sem canvas 2d");
    contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, CAPA_TIPO, 0.82),
    );
    if (!blob) throw new Error("Não consegui converter a imagem");

    // O bucket recusa acima disso de qualquer jeito — este teto é só para a
    // pessoa ouvir "essa foto é grande demais" em vez de ver a requisição
    // falhar sem explicação. A fronteira continua sendo a do servidor.
    if (blob.size > CAPA_MAX_BYTES) {
      throw new Error("Essa foto ficou grande demais");
    }
    return blob;
  } finally {
    bitmap.close();
  }
}
