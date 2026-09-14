import Link from "next/link";
import type { ReactNode } from "react";

import {
  AVISO_DE_PUBLICIDADE,
  formatBRL,
  iniciaisDoCasal,
  rotuloDaCategoria,
} from "@repo/core";

import {
  IconeAvancar,
  MarcaBebe,
  MarcaCasa,
  MarcaCasamento,
  MarcaGeral,
  MarcaReserva,
  MarcaViagem,
} from "./icones";
import { Progresso, type Fatia } from "./progresso";

/**
 * As peças do design v2. Burras: recebem pronto e desenham.
 *
 * O mundo mudou de superfície: o creme saiu do fundo e virou o texto sobre o
 * escuro, o limão saiu de cena e o verde assumiu a ação. O que ficou foi a
 * gramática — pílula em todo controle, uma cor por pessoa, e a foto como
 * conteúdo principal.
 */

/**
 * A polaroide.
 *
 * O v2 a manteve em dois lugares (dentro da jornada e na jornada nova) e
 * trocou a home por um cartão reto e grande. Onde ela fica, fica torta: a
 * inclinação vem de um índice, nunca de Math.random, porque sorteio aqui daria
 * ângulo diferente no servidor e no cliente e quebraria a hidratação.
 */
const INCLINACOES = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"] as const;
// Linha larga precisa de giro menor: a 690px, 2° cisalham 24px e a linha
// encosta na de baixo. O gesto de endireitar continua legível em 0.4°.
const INCLINACOES_SUTIS = [
  "-rotate-[0.4deg]",
  "rotate-[0.25deg]",
  "-rotate-[0.25deg]",
  "rotate-[0.4deg]",
] as const;

export function Polaroide({
  indice = 0,
  endireitada = false,
  sutil = false,
  className = "",
  children,
}: {
  indice?: number;
  endireitada?: boolean;
  sutil?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const escala = sutil ? INCLINACOES_SUTIS : INCLINACOES;
  const giro = endireitada ? "rotate-0" : escala[indice % escala.length];
  return (
    <div
      className={`rounded-polaroide bg-white p-2 pb-3 shadow-polaroide transition-transform duration-500 ${giro} ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * A chapa: o plano de imagem.
 *
 * Um duotone autoral por categoria, com a marca da categoria desenhada por
 * cima. A marca não é enfeite: sem ela um retângulo de gradiente lê como
 * imagem que não carregou, que foi o defeito mais visível da versão anterior.
 *
 * Com o Storage, a foto de verdade entra por cima — e o material continua
 * aqui, no papel que sempre foi o dele: é o que se vê enquanto a foto não
 * chegou, e é o que fica quando a jornada não tem capa.
 */
const MATERIAL: Record<
  string,
  { arte: string; Marca: (props: { className?: string }) => ReactNode }
> = {
  casa: {
    arte: "radial-gradient(120% 100% at 20% 12%, #A8B7AD 0%, #91A398 46%, #6F8179 100%)",
    Marca: MarcaCasa,
  },
  viagem: {
    arte: "radial-gradient(120% 100% at 78% 16%, #8B6340 0%, #68462B 52%, #4A3120 100%)",
    Marca: MarcaViagem,
  },
  reserva: {
    arte: "radial-gradient(120% 100% at 30% 18%, #4B7C74 0%, #33605A 50%, #24463F 100%)",
    Marca: MarcaReserva,
  },
  casamento: {
    arte: "radial-gradient(120% 100% at 68% 14%, #C09C7A 0%, #9D7E58 50%, #74593A 100%)",
    Marca: MarcaCasamento,
  },
  bebe: {
    arte: "radial-gradient(120% 100% at 26% 16%, #AFBAC4 0%, #8494A1 50%, #5F6E79 100%)",
    Marca: MarcaBebe,
  },
  geral: {
    arte: "radial-gradient(120% 100% at 50% 14%, #A6B2A8 0%, #7E8F84 50%, #5A6A61 100%)",
    Marca: MarcaGeral,
  },
};

export function Chapa({
  categoria,
  capaUrl,
  className = "",
  children,
}: {
  categoria: string;
  capaUrl?: string | null;
  className?: string;
  children?: ReactNode;
}) {
  const m = MATERIAL[categoria.trim().toLowerCase()] ?? MATERIAL.geral;
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundImage: m.arte }}>
      {capaUrl ? (
        /* alt vazio de propósito: o nome acessível do cartão é o título da
           jornada, logo ali embaixo. Descrever a foto de novo faria o leitor
           de tela anunciar a mesma coisa duas vezes.

           <img> e não next/image: a URL é assinada e vence em uma hora, então
           o cache do otimizador trabalharia contra a gente — e o Storage já
           serve a imagem no tamanho em que ela subiu. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={capaUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <m.Marca className="absolute -bottom-[12%] -right-[6%] h-[78%] w-auto text-white/30" />
      )}
      {children}
    </div>
  );
}

/** A pílula escura com o total. */
export function PilulaTotal({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-full bg-tinta px-4 py-2.5 text-center font-corpo text-[11px] font-bold text-creme lg:max-w-xs lg:py-3 lg:text-[13px]">
      {children}
    </p>
  );
}

/**
 * O cartão de destaque: rótulo pequeno, número grande, fundo verde.
 *
 * Era o cartão limão. O verde carrega o mesmo papel — o número que importa —
 * e o texto dentro dele é creme, porque a tinta sobre o verde mediria 3.4:1 e
 * o creme mede 5.42:1.
 */
export function CartaoDestaque({
  rotulo,
  valorCents,
  rodape,
  className = "",
  children,
}: {
  rotulo: string;
  valorCents: number;
  rodape?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    /* creme/90 e não /80 nos rótulos: sobre o verde, 80% mede 4.10:1 e 90%
       mede 4.73:1 — e estes são 10.5px, que é onde o piso de 4.5:1 vale. */
    <div className={`rounded-bloco bg-verde p-3.5 text-creme ${className}`}>
      <span className="font-corpo text-[10.5px] text-creme/90">{rotulo}</span>
      <b className="mt-px block text-xl font-bold tabular-nums tracking-[-0.035em]">
        {formatBRL(valorCents)}
      </b>
      {rodape ? <span className="font-corpo text-[10.5px] text-creme/90">{rodape}</span> : null}
      {children}
    </div>
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
      className={`flex flex-none items-center gap-1.5 rounded-full border px-3.5 py-2.5 text-[12.5px] font-medium transition active:scale-95 ${
        ativo
          ? "border-tinta bg-tinta text-creme"
          : "border-contorno/60 bg-white text-tinta hover:border-contorno"
      }`}
      {...props}
    >
      {rotulo}
      {quantos === undefined ? null : (
        <span
          className={`rounded-full px-1.5 py-px text-[10.5px] font-semibold ${
            ativo ? "bg-creme/25 text-creme" : "bg-areia text-suave"
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
 * Borda e nenhuma sombra: o v2 troca elevação por contorno. Quem tem borda não
 * tem sombra, e vice-versa.
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

/** Pílula pequena de estado: "você", "pendente", "no plano", "comprado". */
export function Etiqueta({ children, forte = false }: { children: ReactNode; forte?: boolean }) {
  return (
    <span
      className={`flex-none rounded-full px-2.5 py-1 font-corpo text-[10.5px] font-semibold ${
        forte ? "bg-verde text-creme" : "bg-areia text-suave"
      }`}
    >
      {children}
    </span>
  );
}

/**
 * O cartão grande de uma jornada. É a peça-assinatura do v2.
 *
 * A foto ocupa a maior parte e carrega os dois fatos que se leem de relance: a
 * porcentagem no canto de cima e a categoria no de baixo. O disco de seta
 * sangra para fora da foto, que é o que faz o cartão parecer um objeto a ser
 * aberto e não um bloco de painel.
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
      className="group block rounded-cartao border border-borda bg-white p-2.5 pb-1 shadow-peca transition hover:-translate-y-0.5"
    >
      {/* O disco sangra para FORA da foto, então ele é irmão da chapa: dentro
          dela o `overflow-hidden` cortava metade do círculo. */}
      <div className="relative">
        <Chapa
          categoria={categoria}
          capaUrl={capaUrl}
          className="h-[268px] rounded-bloco lg:h-[300px]"
        >
          <span className="absolute right-3 top-3 rounded-full bg-white px-2.5 py-1.5 font-corpo text-[10.5px] font-semibold tabular-nums">
            {percentual}%
          </span>
          <span className="absolute bottom-3 left-3 rounded-full bg-papel/90 px-2.5 py-1.5 font-corpo text-[10.5px] font-semibold">
            {rotuloDaCategoria(categoria)}
          </span>
        </Chapa>
        <span className="absolute -bottom-5 right-3.5 grid size-11 place-items-center rounded-full bg-tinta text-creme shadow-disco transition-transform group-hover:scale-105">
          <IconeAvancar className="size-5" />
        </span>
      </div>
      <div className="px-2.5 pb-3 pt-7">
        <h2 className="max-w-[20ch] text-[21px] font-semibold leading-tight tracking-[-0.03em]">
          {titulo}
        </h2>
        <div className="mt-2">
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

/**
 * O mesmo objeto em escala de lista.
 *
 * O v2 não desenhou a lista — só a home, que mostra uma jornada por vez. Esta
 * é a derivação: a mesma peça, metade do tamanho, em duas colunas. Sem ela a
 * lista seria um mundo visual de terceiro tipo.
 */
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
  indice?: number;
}) {
  return (
    <Link
      href={`/jornadas/${id}`}
      className="block rounded-cartao border border-borda bg-white p-2 transition hover:-translate-y-0.5"
    >
      <Chapa
        categoria={categoria}
        capaUrl={capaUrl}
        className="h-28 rounded-quadro lg:h-44"
      >
        <span className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 font-corpo text-[10px] font-semibold tabular-nums">
          {percentual}%
        </span>
      </Chapa>
      <div className="px-1.5 pb-1 pt-2.5">
        <b className="block truncate text-[14px] font-semibold tracking-[-0.02em]">{titulo}</b>
        <span className="block font-corpo text-[10.5px] text-suave">
          {rotuloDaCategoria(categoria)}
        </span>
        <div className="mt-2">
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

/**
 * O degrau de seção.
 *
 * Existia de fato — e em quatro tamanhos diferentes: 17, 16, 15 e o `text-sm`
 * que nem era do sistema. Um degrau só, com nome, é o que impede a próxima
 * tela de inventar o quinto.
 */
export function Secao({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-[17px] font-semibold tracking-[-0.03em] ${className}`}>{children}</h2>
  );
}

/**
 * O parágrafo que explica.
 *
 * Toda vez que uma tela escreveu `text-sm text-suave-forte` ela pediu 14px na
 * fonte de display — que é a voz do que o app AFIRMA. Explicação é o app
 * conversando, e conversa é Manrope.
 */
export function Explica({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-corpo text-[12.5px] leading-relaxed text-suave ${className}`}>{children}</p>
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
      className={`grid size-8 flex-none place-items-center rounded-full text-[12px] font-semibold text-creme ${DISCO[cor]} ${className}`}
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
 * Os dois do casal, empilhados.
 *
 * Diz de relance de quem é a jornada sem gastar uma linha de texto. A borda da
 * cor do fundo é o que separa um disco do outro na sobreposição.
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
          className={`grid size-7 place-items-center rounded-full border-2 border-papel text-[11px] font-semibold text-creme ${
            DISCO[pessoa.cor]
          } ${indice > 0 ? "-ml-2.5" : ""}`}
        >
          {iniciaisDoCasal([pessoa.nome]) || "·"}
        </span>
      ))}
    </span>
  );
}

/**
 * Uma linha de aporte: quem, quando, quanto.
 *
 * Mora aqui porque o mesmo fato aparecia de duas formas — bloco branco com
 * disco colorido na jornada, e duas colunas de texto pelado em /aportes. Era a
 * mesma coisa desenhada duas vezes, e por isso desenhada diferente.
 */
export function LinhaAporte({
  nome,
  legenda,
  cor,
  valorCents,
}: {
  nome: string;
  legenda: string;
  cor: Fatia["cor"];
  valorCents: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-cartao border border-borda bg-white p-3">
      <DiscoDePessoa iniciais={iniciaisDoCasal([nome])} cor={cor} />
      <span className="min-w-0 flex-1">
        <b className="block truncate text-[13px] font-semibold">{nome}</b>
        <i className="block font-corpo text-[10.5px] not-italic text-suave">{legenda}</i>
      </span>
      <b className="flex-none text-[13px] font-semibold tabular-nums">{formatBRL(valorCents)}</b>
    </div>
  );
}

/**
 * A sugestão de compra, colada no item que o casal anotou.
 *
 * Linha e não cartão: o item é deles, a oferta é convidada. Se a sugestão
 * empurrar o item para fora da vista, a aba deixou de ser a lista do casal e
 * virou vitrine.
 *
 * A imagem é a chapa da categoria, e não a foto da loja: um `<img>` apontando
 * para o CDN do parceiro entregaria a ele o IP e o horário de quem só ABRIU a
 * tela, sem clicar em nada.
 *
 * `rel="sponsored"` é a declaração nativa de link pago; `noreferrer` fica
 * porque o referrer contaria à loja de qual jornada a visita saiu, e a
 * atribuição de afiliado é por parâmetro na URL, não por referrer.
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
      className="mt-2 flex items-center gap-3 rounded-bloco border border-borda bg-papel p-2.5 transition hover:border-contorno/60 active:scale-[0.99]"
    >
      <Chapa categoria={categoria} className="size-10 flex-none rounded-quadro" />
      <span className="min-w-0 flex-1">
        <b className="block truncate text-[12.5px] font-semibold tracking-[-0.02em]">{titulo}</b>
        <i className="block truncate font-corpo text-[10.5px] not-italic text-suave">
          {/* A palavra vem primeiro e é texto: quem usa leitor de tela ouve
              "Publicidade" antes do nome da loja e do preço. */}
          {AVISO_DE_PUBLICIDADE} · {loja} · visto em{" "}
          {new Date(vistoEmISO).toLocaleDateString("pt-BR")}
        </i>
      </span>
      <b className="flex-none text-[12.5px] font-semibold tabular-nums">{formatBRL(precoCents)}</b>
    </a>
  );
}
