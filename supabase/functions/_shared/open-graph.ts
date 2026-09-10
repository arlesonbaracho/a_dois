// Leitura das meta tags Open Graph de uma página de produto.
//
// Tudo que sai daqui veio do HTML de um terceiro, ou seja, de alguém que não
// somos nós. Nada volta sem passar por sanitizarTexto: a resposta desta função
// chega numa tela, e "título do produto" é um lugar tão bom quanto qualquer
// outro para tentarem enfiar marcação.
//
// Sem parser de DOM, de propósito. Puxar deno-dom para ler quatro meta tags
// seria uma dependência inteira num runtime onde ela não se paga — e um parser
// completo tem muito mais superfície do que uma regex que só olha <meta>.

import { ehIpLiteral } from "./ssrf-guard.ts";

export type Produto = {
  titulo: string | null;
  imagem: string | null;
  precoCents: number | null;
};

export const LIMITE_TITULO = 200;
export const LIMITE_URL = 500;

const ENTIDADES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodificar(nome: string): string {
  if (nome.startsWith("#")) {
    const hex = nome[1] === "x" || nome[1] === "X";
    const codigo = hex ? parseInt(nome.slice(2), 16) : parseInt(nome.slice(1), 10);
    return Number.isFinite(codigo) && codigo > 0 && codigo <= 0x10ffff
      ? String.fromCodePoint(codigo)
      : " ";
  }
  return ENTIDADES[nome.toLowerCase()] ?? " ";
}

/**
 * Texto de terceiro virando texto nosso.
 *
 * As entidades são decodificadas ANTES de a marcação sair, e a ordem é o ponto:
 * quem escrever `&lt;script&gt;` vira `<script>` na primeira passada e some na
 * segunda. Na ordem contrária, sairia daqui `<script>` inteirinho.
 */
export function sanitizarTexto(cru: string, limite: number): string {
  return cru
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_todo, nome: string) => decodificar(nome))
    .replace(/<[^>]*>?/g, " ")
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limite);
}

/**
 * Preço escrito por gente virando centavos inteiros.
 *
 * Aceita "1.234,56", "1234.56", "R$ 1.234,56" e "1234". A conta é feita em cima
 * do texto, e não com ponto flutuante: dinheiro não passa por float nem aqui,
 * na borda mais suja do sistema.
 */
export function precoParaCentavos(cru: string): number | null {
  const limpo = cru.replace(/[^\d.,]/g, "");
  if (!/\d/.test(limpo)) return null;

  const virgula = limpo.lastIndexOf(",");
  const ponto = limpo.lastIndexOf(".");
  let separador = -1;

  if (virgula >= 0 && ponto >= 0) {
    // Os dois aparecem: o último é o decimal, o outro separa milhar.
    separador = Math.max(virgula, ponto);
  } else {
    const unico = Math.max(virgula, ponto);
    const decimais = limpo.length - unico - 1;
    // "1.234" é mil duzentos e trinta e quatro. "1.23" é um e vinte e três.
    if (unico >= 0 && limpo.indexOf(limpo[unico]) === unico && decimais >= 1 && decimais <= 2) {
      separador = unico;
    }
  }

  const inteiro = (separador >= 0 ? limpo.slice(0, separador) : limpo).replace(/[.,]/g, "");
  const fracao = separador >= 0 ? limpo.slice(separador + 1).replace(/[.,]/g, "") : "";
  if (inteiro === "" && fracao === "") return null;

  const centavos = Number(inteiro || "0") * 100 + Number(`${fracao}00`.slice(0, 2));
  return Number.isSafeInteger(centavos) && centavos >= 0 ? centavos : null;
}

function atributo(tag: string, nome: string): string | null {
  const achado = tag.match(
    new RegExp(`\\b${nome}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i"),
  );
  return achado ? (achado[2] ?? achado[3] ?? achado[4] ?? null) : null;
}

/**
 * A URL da imagem só volta se for https e apontar para um NOME.
 *
 * Endereço IP cru aqui faria o navegador de quem olha a meta buscar um endereço
 * escolhido por terceiro — a mesma razão pela qual profiles.avatar_url existe e
 * ninguém grava nela.
 */
function imagemSegura(bruta: string, base: URL): string | null {
  let alvo: URL;
  try {
    alvo = new URL(bruta, base);
  } catch {
    return null;
  }
  if (alvo.protocol !== "https:") return null;
  if (alvo.username !== "" || alvo.password !== "") return null;
  if (ehIpLiteral(alvo.hostname)) return null;
  return alvo.toString().slice(0, LIMITE_URL);
}

/** Título, imagem e preço, já sanitizados. O que falta vira null, nunca erro. */
export function extrairOpenGraph(
  html: string,
  base = new URL("https://exemplo.invalid"),
): Produto {
  const meta = new Map<string, string>();

  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const chave = atributo(tag, "property") ?? atributo(tag, "name");
    const conteudo = atributo(tag, "content");
    if (chave === null || conteudo === null) continue;

    // A primeira ocorrência ganha: página que repete og:title está quebrada ou
    // está tentando alguma coisa, e nos dois casos a de cima é a boa.
    const normalizada = chave.trim().toLowerCase();
    if (!meta.has(normalizada)) meta.set(normalizada, conteudo);
  }

  const tituloCru = meta.get("og:title") ?? meta.get("twitter:title") ?? null;
  const imagemCrua = meta.get("og:image") ?? meta.get("twitter:image") ?? null;
  const precoCru =
    meta.get("og:price:amount") ?? meta.get("product:price:amount") ?? null;

  return {
    titulo: tituloCru === null ? null : sanitizarTexto(tituloCru, LIMITE_TITULO) || null,
    imagem:
      imagemCrua === null ? null : imagemSegura(sanitizarTexto(imagemCrua, LIMITE_URL), base),
    precoCents: precoCru === null ? null : precoParaCentavos(sanitizarTexto(precoCru, 40)),
  };
}
