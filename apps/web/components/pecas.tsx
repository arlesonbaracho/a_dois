import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  AVISO_DE_PUBLICIDADE,
  type Categoria,
  categoriaConhecida,
  formatBRL,
  iniciaisDoCasal,
  rotuloDaCategoria,
} from "@repo/core";

import { IconeAvancar } from "./icones";
import { Progresso, type Fatia } from "./progresso";

/**
 * As peças do mundo v3. Burras: recebem pronto e desenham.
 *
 * O plano do casal virou um deck: cada jornada é uma carta, com a arte em
 * cima e a legenda branca embaixo. Tinta é estrutura e ação; verde e marrom
 * são só as duas pessoas.
 */

/**
 * O fundo de cada categoria. Mapa estático porque o Tailwind lê classe por
 * varredura de texto: montar `bg-campo-${categoria}` em tempo de execução
 * produz classe que não existe no CSS.
 */
const CAMPO: Record<Categoria, string> = {
  casa: "bg-campo-casa",
  viagem: "bg-campo-viagem",
  reserva: "bg-campo-reserva",
  casamento: "bg-campo-casamento",
  bebe: "bg-campo-bebe",
  geral: "bg-campo-geral",
};

/** A classe do fundo da categoria — é a cor da carta quando ela está atrás no deck. */
export function campoDe(categoria: string): string {
  return CAMPO[categoriaConhecida(categoria) ?? "geral"];
}

/**
 * A chapa: o plano de imagem.
 *
 * Sem foto, é o campo da categoria com a arte 3D dela (Fluent Emoji, MIT, em
 * `public/arte/`). Com foto, a foto do casal entra por cima de tudo — e o
 * campo continua aqui, que é o que se vê enquanto ela não chegou.
 */
export function Chapa({
  categoria,
  capaUrl,
  className = "",
  arte = "h-[62%]",
  children,
}: {
  categoria: string;
  capaUrl?: string | null;
  className?: string;
  /** A altura da arte dentro do campo. */
  arte?: string;
  children?: ReactNode;
}) {
  const chave = categoriaConhecida(categoria) ?? "geral";
  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${CAMPO[chave]} ${className}`}>
      {capaUrl ? (
        /* alt vazio de propósito: o nome acessível do cartão é o título da
           jornada, logo ali embaixo. Descrever a foto de novo faria o leitor
           de tela anunciar a mesma coisa duas vezes.

           <img> e não next/image: a URL é assinada e vence em uma hora, então
           o cache do otimizador trabalharia contra a gente. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={capaUrl}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <Image
          src={`/arte/${chave}.png`}
          alt=""
          width={256}
          height={256}
          unoptimized
          draggable={false}
          className={`w-auto drop-shadow-[0_16px_20px_rgb(7_0_1/0.14)] ${arte}`}
        />
      )}
      {children}
    </div>
  );
}

/**
 * O total, dito como número e não como botão: pílula preta larga é a forma da
 * ação principal, e um número vestido dela convida a ser tocado.
 */
export function PilulaTotal({ children }: { children: ReactNode }) {
  return (
    <p className="num rounded-cartao bg-areia px-4 py-3 text-[15px] font-medium text-tinta lg:max-w-xs">
      {children}
    </p>
  );
}

/** Chip de filtro, com contagem opcional. */
export function Chip({
  rotulo,
  quantos,
  ativo,
  ...props
}: {
  rotulo: string;
  quantos?: number;
  ativo: boolean;
} & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      className={`flex h-10 flex-none items-center gap-2 rounded-full border text-[14px] transition active:scale-95 ${
        quantos === undefined ? "px-4" : "pl-4 pr-2"
      } ${
        ativo ? "border-tinta bg-tinta text-creme" : "border-borda bg-white text-tinta hover:bg-areia"
      }`}
      {...props}
    >
      {rotulo}
      {quantos === undefined ? null : (
        <span
          className={`num grid h-[26px] min-w-[26px] place-items-center rounded-full px-1.5 text-[12px] ${
            ativo ? "bg-creme/20 text-creme" : "bg-areia text-tinta"
          }`}
        >
          {quantos}
        </span>
      )}
    </button>
  );
}

/**
 * Cartão branco comum.
 *
 * Borda e nenhuma sombra: sombra é da carta do deck, que flutua. Quem tem
 * borda não tem sombra, e vice-versa.
 */
export function Bloco({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-cartao border border-borda bg-white p-4 ${className}`}>{children}</div>
  );
}

/**
 * Pílula pequena de estado: "você", "pendente", "no plano", "comprado".
 * Sobre areia o texto é tinta: suave ali mede 4.44:1, abaixo do piso.
 */
export function Etiqueta({ children, forte = false }: { children: ReactNode; forte?: boolean }) {
  return (
    <span
      className={`num flex-none rounded-full px-2.5 py-1 text-[12px] font-medium ${
        forte ? "bg-tinta text-creme" : "bg-areia text-tinta"
      }`}
    >
      {children}
    </span>
  );
}

/** "mar/2027" — o prazo dito curto, como cabe na legenda da carta. */
function prazoCurto(iso: string): string {
  const data = new Date(iso);
  const mes = data.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  return `${mes}/${data.getFullYear()}`;
}

/** A linha que a carta diz embaixo do título: quanto falta, e até quando. */
function oQueFalta(aportadoCents: number, alvoCents: number, prazoISO?: string | null): string {
  const prazo = prazoISO ? ` · até ${prazoCurto(prazoISO)}` : "";
  if (alvoCents <= 0) return `${formatBRL(aportadoCents)} juntados${prazo}`;
  const faltam = alvoCents - aportadoCents;
  if (faltam <= 0) return `Juntaram tudo${prazo}`;
  return `Faltam ${formatBRL(faltam)}${prazo}`;
}

/**
 * A carta do deck. É a peça-assinatura do v3.
 *
 * A arte ocupa a maior parte, com a categoria e a porcentagem em pílulas
 * brancas. O disco de seta fica no vinco entre a arte e a legenda — irmão da
 * chapa, nunca filho, porque o `overflow-hidden` dela cortaria o círculo.
 *
 * `draggable={false}`: a carta é arrastada pelo deck, e o arrasto nativo de
 * link do navegador cancelaria o gesto.
 */
export function CartaoHero({
  id,
  titulo,
  categoria,
  capaUrl,
  aportadoCents,
  alvoCents,
  percentual,
  fatias,
  prazoISO,
}: {
  id: string;
  titulo: string;
  categoria: string;
  capaUrl?: string | null;
  aportadoCents: number;
  alvoCents: number;
  percentual: number;
  fatias?: Fatia[];
  prazoISO?: string | null;
}) {
  return (
    <Link
      href={`/jornadas/${id}`}
      draggable={false}
      className="group block select-none rounded-carta bg-white p-2.5 shadow-carta"
    >
      <div className="relative">
        <Chapa
          categoria={categoria}
          capaUrl={capaUrl}
          className="h-[262px] rounded-cartao lg:h-[300px]"
        >
          <span className="absolute left-3.5 top-3.5 rounded-full bg-white px-3 py-1.5 text-[13px] text-suave">
            {rotuloDaCategoria(categoria)}
          </span>
          <span className="num absolute right-3.5 top-3.5 rounded-full bg-white px-3 py-1.5 text-[13px] font-medium">
            {percentual}%
          </span>
        </Chapa>
        <span
          aria-hidden="true"
          className="absolute -bottom-7 right-3 grid size-14 place-items-center rounded-full bg-tinta text-creme shadow-disco transition-transform group-hover:scale-105"
        >
          <IconeAvancar className="size-[22px]" />
        </span>
      </div>
      <div className="px-4 pb-4 pt-4">
        <h2 className="pr-16 text-[21px] font-medium leading-tight tracking-[-0.02em]">{titulo}</h2>
        <p className="num mb-3 mt-1 text-[14px] text-suave">
          {oQueFalta(aportadoCents, alvoCents, prazoISO)}
        </p>
        <Progresso
          percentual={percentual}
          aportadoCents={aportadoCents}
          alvoCents={alvoCents}
          fatias={fatias}
          semLegenda
        />
      </div>
    </Link>
  );
}

/** A mesma carta em escala de lista: metade do tamanho, em duas colunas. */
export function CartaoJornada({
  id,
  titulo,
  categoria,
  capaUrl,
  aportadoCents,
  alvoCents,
  percentual,
  fatias,
}: {
  id: string;
  titulo: string;
  categoria: string;
  capaUrl?: string | null;
  aportadoCents: number;
  alvoCents: number;
  percentual: number;
  fatias?: Fatia[];
}) {
  return (
    <Link
      href={`/jornadas/${id}`}
      className="block rounded-cartao border border-borda bg-white p-2 transition hover:-translate-y-0.5"
    >
      <Chapa
        categoria={categoria}
        capaUrl={capaUrl}
        arte="h-[66%]"
        className="h-32 rounded-bloco lg:h-44"
      >
        <span className="num absolute right-2 top-2 rounded-full bg-white px-2.5 py-1 text-[12px] font-medium">
          {percentual}%
        </span>
      </Chapa>
      <div className="px-1.5 pb-1.5 pt-3">
        <b className="line-clamp-2 block text-[15px] font-medium leading-snug tracking-[-0.02em]">{titulo}</b>
        <span className="block text-[12px] text-suave">{rotuloDaCategoria(categoria)}</span>
        <div className="mt-2.5">
          <Progresso
            percentual={percentual}
            aportadoCents={aportadoCents}
            alvoCents={alvoCents}
            fatias={fatias}
          />
        </div>
      </div>
    </Link>
  );
}

/** O degrau de seção. Um só, com nome, para a próxima tela não inventar outro. */
export function Secao({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-[18px] font-medium tracking-[-0.02em] ${className}`}>{children}</h2>
  );
}

/** O parágrafo que explica: o app conversando. */
export function Explica({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-corpo text-[14px] leading-relaxed text-suave ${className}`}>{children}</p>
  );
}

/** O disco com as iniciais, na cor de quem colocou o dinheiro. */
const DISCO: Record<Fatia["cor"], string> = {
  "pessoa-1": "bg-pessoa-1",
  "pessoa-2": "bg-pessoa-2",
  fora: "bg-pessoa-fora",
};

export function DiscoDePessoa({
  iniciais,
  cor,
  className = "",
}: {
  iniciais: string;
  cor: Fatia["cor"];
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-11 flex-none place-items-center rounded-full text-[15px] font-medium text-creme ${DISCO[cor]} ${className}`}
    >
      {iniciais || "·"}
    </span>
  );
}

/** O ponto de cor ao lado de um nome, onde o disco de iniciais seria grande demais. */
export function PontoDePessoa({ cor }: { cor: Fatia["cor"] }) {
  return <span aria-hidden="true" className={`size-2.5 flex-none rounded-full ${DISCO[cor]}`} />;
}

/**
 * Os dois do casal, sobrepostos. A borda da cor do fundo é o que separa um
 * disco do outro na sobreposição.
 */
export function AvataresDoCasal({
  pessoas,
}: {
  pessoas: { chave: string; nome: string; cor: Fatia["cor"] }[];
}) {
  if (pessoas.length === 0) return null;
  return (
    <span className="flex flex-none">
      <span className="sr-only">
        {pessoas.map((pessoa) => pessoa.nome).join(" e ")} dividem esta jornada
      </span>
      {pessoas.map((pessoa, indice) => (
        <span
          key={pessoa.chave}
          aria-hidden="true"
          className={`grid size-11 place-items-center rounded-full border-[3px] border-papel text-[14px] font-medium text-creme ${
            DISCO[pessoa.cor]
          } ${indice > 0 ? "-ml-3" : ""}`}
        >
          {iniciaisDoCasal([pessoa.nome]) || "·"}
        </span>
      ))}
    </span>
  );
}

/**
 * Uma linha de aporte: quem, quando, quanto. Cada uma é um comprovante, na
 * cor de quem colocou.
 */
export function LinhaAporte({
  nome,
  acao,
  legenda,
  cor,
  valorCents,
}: {
  nome: string;
  /** "anotou": vai depois do nome, fora das iniciais do disco. */
  acao?: string;
  legenda: string;
  cor: Fatia["cor"];
  valorCents: number;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <DiscoDePessoa iniciais={iniciaisDoCasal([nome])} cor={cor} />
      <span className="min-w-0 flex-1">
        <b className="block truncate text-[15px] font-normal">
          {nome}
          {acao ? ` ${acao}` : null}
        </b>
        <i className="block text-[12px] not-italic text-suave">{legenda}</i>
      </span>
      <b className="num flex-none text-[15px] font-medium">{formatBRL(valorCents)}</b>
    </div>
  );
}

/**
 * A sugestão de compra, colada no item que o casal anotou.
 *
 * Linha e não cartão: o item é deles, a oferta é convidada.
 *
 * A imagem é a chapa da categoria, e não a foto da loja: um `<img>` apontando
 * para o CDN do parceiro entregaria a ele o IP e o horário de quem só ABRIU a
 * tela, sem clicar em nada.
 *
 * `rel="sponsored"` é a declaração nativa de link pago; `noreferrer` fica
 * porque o referrer contaria à loja de qual jornada a visita saiu.
 */
export function LinhaOferta({
  titulo,
  categoria,
  loja,
  precoCents,
  vistoEmISO,
  url,
}: {
  titulo: string;
  categoria: string;
  loja: string;
  precoCents: number;
  vistoEmISO: string;
  url: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className="mt-2 flex items-center gap-3 rounded-bloco border border-borda bg-white p-2 pr-3.5 transition hover:border-contorno active:scale-[0.99]"
    >
      <Chapa categoria={categoria} arte="h-[68%]" className="size-10 flex-none rounded-chapa" />
      <span className="min-w-0 flex-1">
        <b className="block truncate text-[13px] font-medium">{titulo}</b>
        <i className="block text-[12px] not-italic leading-snug text-suave">
          {/* A palavra vem primeiro e é texto: quem usa leitor de tela ouve
              "Publicidade" antes do nome da loja e do preço. */}
          {AVISO_DE_PUBLICIDADE} · {loja} · visto em{" "}
          {new Date(vistoEmISO).toLocaleDateString("pt-BR")}
        </i>
      </span>
      <b className="num flex-none text-[13px] font-medium">{formatBRL(precoCents)}</b>
    </a>
  );
}
