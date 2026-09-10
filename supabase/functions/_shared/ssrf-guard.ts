// Guard anti-SSRF: a peneira por onde passa toda URL escolhida por usuário.
//
// Sem ele, a Edge Function vira um proxy com as credenciais da nossa
// infraestrutura: qualquer pessoa cola um link, a função busca, e a resposta
// volta. O alvo clássico é http://169.254.169.254/, o endpoint de metadata das
// nuvens, que devolve credencial de instância para quem perguntar de dentro.
//
// Três peneiras, nesta ordem, e todas têm que passar:
//
//   1. protocolo — só http e https;
//   2. domínio — allowlist, comparada por rótulo;
//   3. rede — o nome é RESOLVIDO e todo IP que ele devolve é conferido.
//
// A peneira 3 é a que não dá para pular. "www.malvado.com" é um nome público
// que resolve para 127.0.0.1 se o dono quiser: confiar no hostname é confiar em
// quem escreveu o DNS.
//
// Este arquivo é TypeScript puro de propósito — nenhum import de Deno, e o
// resolvedor de DNS entra por parâmetro. É o que permite testar cada recusa com
// o Vitest que o monorepo já tem, sem subir runtime nenhum.

export const ALLOWLIST_PADRAO: readonly string[] = [
  "mercadolivre.com.br",
  "amazon.com.br",
  "magazineluiza.com.br",
  "americanas.com.br",
];

export type MotivoRecusa =
  | "protocolo"
  | "credencial"
  | "dominio"
  | "dns"
  | "rede_interna"
  | "redirects";

export class UrlRecusada extends Error {
  constructor(
    readonly motivo: MotivoRecusa,
    readonly detalhe = "",
  ) {
    super(`URL recusada (${motivo})${detalhe ? `: ${detalhe}` : ""}`);
    this.name = "UrlRecusada";
  }
}

// ---------------------------------------------------------------------------
// Classificação de IP
// ---------------------------------------------------------------------------

// Prefixo e tamanho da máscara. Os cinco primeiros são os que o pedido nomeia;
// o resto está aqui porque deixar de fora seria deixar porta aberta com o
// cadeado do lado.
const BLOCOS_V4: readonly [string, number][] = [
  ["0.0.0.0", 8], // "este host"
  ["10.0.0.0", 8], // privado
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, onde mora o metadata da nuvem
  ["172.16.0.0", 12], // privado
  ["192.0.0.0", 24], // atribuições de protocolo
  ["192.168.0.0", 16], // privado
  ["198.18.0.0", 15], // benchmark
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reservado, inclui 255.255.255.255
];

/** IPv4 em número, ou null se não for um IPv4 decimal bem formado. */
function ipv4ParaNumero(ip: string): number | null {
  const partes = ip.split(".");
  if (partes.length !== 4) return null;

  let numero = 0;
  for (const parte of partes) {
    // Sem zero à esquerda: "010" é 8 para quem lê em octal e 10 para quem lê em
    // decimal, e essa discordância entre duas bibliotecas já foi bypass.
    if (!/^(0|[1-9]\d{0,2})$/.test(parte)) return null;
    const octeto = Number(parte);
    if (octeto > 255) return null;
    numero = numero * 256 + octeto;
  }
  return numero;
}

/** Os 8 grupos de 16 bits de um IPv6, ou null se não for IPv6 bem formado. */
function ipv6Grupos(ip: string): number[] | null {
  // Zona ("%eth0") e colchetes não fazem parte do endereço.
  let texto = ip.toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];

  // Cauda em forma de IPv4: "::ffff:127.0.0.1" e companhia.
  let cauda: number[] = [];
  const ponto = texto.lastIndexOf(":");
  if (texto.includes(".")) {
    const numero = ipv4ParaNumero(texto.slice(ponto + 1));
    if (numero === null) return null;
    cauda = [Math.floor(numero / 65536), numero % 65536];
    texto = texto.slice(0, ponto + 1);
    if (texto.endsWith("::")) texto = texto.slice(0, -1);
    else texto = texto.slice(0, -1);
  }

  const metades = texto.split("::");
  if (metades.length > 2) return null;

  const paraGrupos = (pedaco: string): number[] | null => {
    if (pedaco === "") return [];
    const grupos: number[] = [];
    for (const g of pedaco.split(":")) {
      if (!/^[0-9a-f]{1,4}$/.test(g)) return null;
      grupos.push(parseInt(g, 16));
    }
    return grupos;
  };

  const esquerda = paraGrupos(metades[0]);
  const direita = metades.length === 2 ? paraGrupos(metades[1]) : [];
  if (esquerda === null || direita === null) return null;

  const corpo = [...esquerda, ...direita, ...cauda];
  if (metades.length === 1) return corpo.length === 8 ? corpo : null;
  if (corpo.length >= 8) return null;

  const preenchimento = Array<number>(8 - corpo.length).fill(0);
  return [...esquerda, ...preenchimento, ...direita, ...cauda];
}

/**
 * O endereço é de rede interna, reservada, ou coisa que não sabemos ler?
 *
 * Falha fechada: o que esta função não consegue classificar volta como
 * reservado. Numa peneira de segurança, "não entendi" e "não pode" têm que dar
 * na mesma coisa — a alternativa é deixar passar o que ninguém previu.
 */
export function ipReservado(ip: string): boolean {
  const v4 = ipv4ParaNumero(ip);
  if (v4 !== null) {
    return BLOCOS_V4.some(([base, mascara]) => {
      const inicio = ipv4ParaNumero(base);
      if (inicio === null) return true;
      const deslocamento = 32 - mascara;
      return v4 >>> deslocamento === inicio >>> deslocamento;
    });
  }

  const grupos = ipv6Grupos(ip);
  if (grupos === null) return true;

  // ::ffff:a.b.c.d é IPv4 vestido de IPv6. Sem desembrulhar, ::ffff:127.0.0.1
  // entraria pela porta dos fundos.
  const mapeado = grupos.slice(0, 5).every((g) => g === 0) && grupos[5] === 0xffff;
  const compativel = grupos.slice(0, 6).every((g) => g === 0) && grupos[6] !== 0;
  if (mapeado || compativel) {
    const numero = grupos[6] * 65536 + grupos[7];
    const octetos = [numero >>> 24, (numero >>> 16) & 255, (numero >>> 8) & 255, numero & 255];
    return ipReservado(octetos.join("."));
  }

  if (grupos.every((g) => g === 0)) return true; // ::
  if (grupos.slice(0, 7).every((g) => g === 0) && grupos[7] === 1) return true; // ::1
  if ((grupos[0] & 0xfe00) === 0xfc00) return true; // fc00::/7, único local
  if ((grupos[0] & 0xffc0) === 0xfe80) return true; // fe80::/10, link-local
  if ((grupos[0] & 0xff00) === 0xff00) return true; // ff00::/8, multicast

  return false;
}

// ---------------------------------------------------------------------------
// assertSafeUrl
// ---------------------------------------------------------------------------

export type Resolvedor = (host: string) => Promise<string[]>;

export type OpcoesGuard = {
  /** Domínios aceitos. Subdomínio deles também passa. */
  allowlist?: readonly string[];
  resolver?: Resolvedor;
};

type DenoComDns = { resolveDns(host: string, tipo: "A" | "AAAA"): Promise<string[]> };

/** O resolvedor de verdade, que só existe quando rodamos dentro do Deno. */
async function resolverPadrao(host: string): Promise<string[]> {
  const runtime = (globalThis as { Deno?: DenoComDns }).Deno;
  if (!runtime?.resolveDns) {
    throw new UrlRecusada("dns", "runtime sem resolvedor de DNS");
  }

  const ips: string[] = [];
  for (const tipo of ["A", "AAAA"] as const) {
    try {
      ips.push(...(await runtime.resolveDns(host, tipo)));
    } catch {
      // Nome sem registro desse tipo é normal. Sem registro NENHUM é que não é,
      // e quem decide isso é quem chamou, olhando a lista vazia.
    }
  }
  return ips;
}

/** O host já é um endereço, e não um nome que precise passar pelo DNS? */
export function ehIpLiteral(host: string): boolean {
  const limpo = host.replace(/^\[|\]$/g, "");
  return ipv4ParaNumero(limpo) !== null || ipv6Grupos(limpo) !== null;
}

/**
 * Compara por rótulo, e não por sufixo de texto. "amazon.com.br.malvado.com"
 * termina com "amazon.com.br" no meio do nome e não é a Amazon coisa nenhuma.
 */
function dominioPermitido(host: string, allowlist: readonly string[]): boolean {
  const alvo = host.toLowerCase().replace(/\.$/, "");
  return allowlist.some((permitido) => {
    const dominio = permitido.toLowerCase().replace(/^\.|\.$/g, "");
    return alvo === dominio || alvo.endsWith(`.${dominio}`);
  });
}

/**
 * Recusa a URL, ou devolve ela pronta para uso. Sempre `await`: a peneira de
 * rede depende de DNS.
 */
export async function assertSafeUrl(
  url: string | URL,
  opcoes: OpcoesGuard = {},
): Promise<URL> {
  let alvo: URL;
  try {
    alvo = new URL(url);
  } catch {
    throw new UrlRecusada("protocolo", "não é uma URL");
  }

  if (alvo.protocol !== "http:" && alvo.protocol !== "https:") {
    throw new UrlRecusada("protocolo", alvo.protocol);
  }

  // "https://amazon.com.br@malvado.com/" é um clássico: o olho lê a Amazon, o
  // navegador conecta no malvado.
  if (alvo.username !== "" || alvo.password !== "") {
    throw new UrlRecusada("credencial", alvo.hostname);
  }

  if (!dominioPermitido(alvo.hostname, opcoes.allowlist ?? ALLOWLIST_PADRAO)) {
    throw new UrlRecusada("dominio", alvo.hostname);
  }

  const host = alvo.hostname.replace(/^\[|\]$/g, "");

  // Host que já é IP não precisa de DNS: ele é a própria resposta.
  const ips = ehIpLiteral(host) ? [host] : await (opcoes.resolver ?? resolverPadrao)(host);

  if (ips.length === 0) throw new UrlRecusada("dns", host);
  for (const ip of ips) {
    if (ipReservado(ip)) throw new UrlRecusada("rede_interna", host);
  }

  return alvo;
}

// ---------------------------------------------------------------------------
// buscarComGuard
// ---------------------------------------------------------------------------

export const LIMITE_REDIRECTS = 3;
export const TIMEOUT_MS = 5_000;
export const LIMITE_BYTES = 2 * 1024 * 1024;

export type OpcoesBusca = OpcoesGuard & {
  fetch?: typeof globalThis.fetch;
  maxRedirects?: number;
  timeoutMs?: number;
  maxBytes?: number;
};

// Nada aqui identifica quem perguntou. Sem cookie, sem referer, sem
// Authorization, sem nada do casal nem da meta: o site de destino não fica
// sabendo que alguém do nosso app olhou aquele produto.
const CABECALHOS: Record<string, string> = {
  accept: "text/html,application/xhtml+xml",
  "accept-language": "pt-BR,pt;q=0.9",
  "user-agent": "Mozilla/5.0 (compatible; PrecoBot/1.0)",
};

/** Lê no máximo maxBytes e para de baixar. Página de loja é grande. */
async function lerLimitado(resposta: Response, maxBytes: number): Promise<string> {
  if (!resposta.body) return "";

  const leitor = resposta.body.getReader();
  const pedacos: Uint8Array[] = [];
  let lidos = 0;

  while (lidos < maxBytes) {
    const { done, value } = await leitor.read();
    if (done) break;
    pedacos.push(value);
    lidos += value.byteLength;
  }
  await leitor.cancel().catch(() => {});

  const total = Math.min(lidos, maxBytes);
  const buffer = new Uint8Array(total);
  let escrito = 0;
  for (const pedaco of pedacos) {
    if (escrito >= total) break;
    const fatia = pedaco.subarray(0, total - escrito);
    buffer.set(fatia, escrito);
    escrito += fatia.byteLength;
  }

  return new TextDecoder().decode(buffer);
}

/**
 * Busca uma página passando pelo guard — e passando de novo A CADA redirect.
 *
 * Conferir só a primeira URL não serve para nada: um domínio da allowlist pode
 * responder 302 para http://169.254.169.254/ e a peneira teria sido usada uma
 * vez, no lugar errado. Por isso `redirect: "manual"` e o laço aqui, em vez de
 * deixar o fetch seguir sozinho.
 */
export async function buscarComGuard(
  url: string,
  opcoes: OpcoesBusca = {},
): Promise<{ url: URL; html: string }> {
  const buscar = opcoes.fetch ?? globalThis.fetch;
  const maxRedirects = opcoes.maxRedirects ?? LIMITE_REDIRECTS;
  const maxBytes = opcoes.maxBytes ?? LIMITE_BYTES;

  // Um relógio só para a operação inteira, redirects e leitura do corpo
  // incluídos. Cinco segundos por salto seriam vinte segundos de janela.
  const relogio = AbortSignal.timeout(opcoes.timeoutMs ?? TIMEOUT_MS);

  let atual: string | URL = url;

  for (let salto = 0; salto <= maxRedirects; salto++) {
    const seguro = await assertSafeUrl(atual, opcoes);

    const resposta = await buscar(seguro, {
      method: "GET",
      redirect: "manual",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      headers: CABECALHOS,
      signal: relogio,
    });

    const destino = resposta.headers.get("location");
    if (resposta.status >= 300 && resposta.status < 400 && destino) {
      await resposta.body?.cancel().catch(() => {});
      atual = new URL(destino, seguro).toString();
      continue;
    }

    return { url: seguro, html: await lerLimitado(resposta, maxBytes) };
  }

  throw new UrlRecusada("redirects", `mais de ${maxRedirects} saltos`);
}
