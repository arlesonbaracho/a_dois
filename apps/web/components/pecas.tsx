import Link from "next/link";
import type { ReactNode } from "react";

import { formatBRL, iniciaisDoCasal, rotuloDaCategoria } from "@repo/core";

import {
  MarcaBebe,
  MarcaCasa,
  MarcaCasamento,
  MarcaGeral,
  MarcaReserva,
  MarcaViagem,
} from "./icones";
import { Progresso, type Fatia } from "./progresso";

/**
 * As peças do design "Jornada". Burras: recebem pronto e desenham.
 */

/**
 * A polaroide — a peça-assinatura.
 *
 * A inclinação vem de um índice, nunca de Math.random: sorteio aqui daria
 * ângulo diferente no servidor e no cliente, e o React reclamaria de
 * hidratação a cada carga. `endireitada` existe para o gesto de "colar no
 * álbum": item comprado para de ser rascunho e assenta em 0°.
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
 * A chapa: o plano de imagem da polaroide.
 *
 * A hachura anterior lia como imagem quebrada, e a etiqueta `[ categoria ]`
 * lia como token de debug — os dois foram embora. No lugar, um material
 * autoral por categoria: duotone com horizonte, grão fino e a marca da
 * categoria desenhada por cima, tudo em CSS e SVG nosso.
 *
 * A marca não é enfeite: seis retângulos de gradiente lado a lado no álbum
 * liam como galeria de imagem que não carregou, e era o defeito mais visível
 * da tela inteira. Com o desenho dentro, cada polaroide vira um objeto
 * diferente dos outros — que é o que a tese do álbum prometia.
 *
 * Com o Storage, a foto de verdade entra por cima — e o material continua
 * aqui, agora no papel que sempre foi o dele: é o que se vê enquanto a foto
 * não chegou, e é o que fica quando a jornada não tem capa. O navegador pinta
 * o fundo antes de baixar a imagem, então a espera sai de graça, sem estado e
 * sem efeito. Polaroide sem foto continua parecendo um objeto, e não uma
 * falha de carregamento.
 */
const MATERIAL: Record<
  string,
  { de: string; para: string; forma: string; Marca: (props: { className?: string }) => ReactNode }
> = {
  casa: { de: "#86A98C", para: "#47614F", forma: "circle at 72% 118%", Marca: MarcaCasa },
  viagem: { de: "#8FB7CE", para: "#476A86", forma: "circle at 28% 120%", Marca: MarcaViagem },
  reserva: { de: "#D2B478", para: "#8D6F3D", forma: "circle at 50% 125%", Marca: MarcaReserva },
  casamento: { de: "#D7A6A1", para: "#94595C", forma: "circle at 60% 120%", Marca: MarcaCasamento },
  bebe: { de: "#BCAAD9", para: "#73629A", forma: "circle at 40% 118%", Marca: MarcaBebe },
  geral: { de: "#A5AA8F", para: "#686D57", forma: "circle at 55% 120%", Marca: MarcaGeral },
};

// Grão: um ruído SVG em data URI. Fica no arquivo, não na rede — nenhuma
// requisição a terceiro, que é a mesma razão das fontes serem self-hosted.
const GRAO =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='r'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23r)' opacity='.22'/%3E%3C/svg%3E\")";

export function Chapa({
  categoria,
  capaUrl,
  className = "",
}: {
  categoria: string;
  capaUrl?: string | null;
  className?: string;
}) {
  const m = MATERIAL[categoria.trim().toLowerCase()] ?? MATERIAL.geral;
  return (
    <div
      className={`relative overflow-hidden rounded-[3px] ${className}`}
      style={{
        backgroundImage: `radial-gradient(${m.forma}, ${m.de} 0%, ${m.para} 68%)`,
      }}
    >
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
        <>
          {/* O grão só existe para o gradiente parecer material. Sobre uma foto
              de verdade ele vira ruído — num plano de 96px de altura, leria
              como artefato de compressão. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 mix-blend-overlay"
            style={{ backgroundImage: GRAO }}
          />
          {/* A marca da categoria. Sem ela o plano de imagem é um retângulo de
              gradiente, e retângulo de gradiente lê como foto que não carregou
              — foi o defeito mais visível do álbum. Decorativa de propósito:
              a categoria já é dita por extenso ao lado do título. */}
          <m.Marca className="absolute -bottom-[12%] -right-[6%] h-[78%] w-auto text-white/35" />
        </>
      )}
      {/* O brilho oblíquo que uma foto impressa tem sob luz de sala. Fica por
          cima da foto também: é o que faz a imagem parecer papel revelado e
          não uma miniatura colada. */}
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(118deg, rgb(255 255 255 / 0.16) 0%, transparent 38%, transparent 76%, rgb(22 23 15 / 0.13) 100%)",
        }}
      />
    </div>
  );
}

export function PilulaTotal({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-full bg-tinta px-4 py-2.5 text-center font-corpo text-[11px] font-bold text-limao lg:py-3 lg:text-[13px]">
      {children}
    </p>
  );
}

/** O cartão limão: rótulo pequeno, número grande. */
export function CartaoLimao({
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
    <div className={`rounded-bloco bg-limao p-3 ${className}`}>
      <span className="font-corpo text-[10.5px] text-limao-tinta">{rotulo}</span>
      <b className="mt-px block text-xl font-extrabold tabular-nums tracking-[-0.04em]">
        {formatBRL(valorCents)}
      </b>
      {rodape ? (
        <span className="font-corpo text-[10.5px] text-limao-tinta">{rodape}</span>
      ) : null}
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
      className={`flex flex-none items-center gap-1.5 rounded-full border px-3 py-2 text-[12.5px] font-medium transition active:scale-95 ${
        ativo
          ? "border-tinta bg-tinta text-white"
          : "border-tinta/10 bg-white text-tinta hover:border-tinta/25"
      }`}
      {...props}
    >
      {rotulo}
      {quantos === undefined ? null : (
        <span
          className={`rounded-full px-1.5 py-px text-[10.5px] ${
            ativo ? "bg-white/20 text-white" : "bg-areia text-suave"
          }`}
        >
          {quantos}
        </span>
      )}
    </button>
  );
}

/** Cartão branco comum — o fundo de quase tudo que não é polaroide. */
export function Bloco({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={`rounded-cartao bg-white p-4 ${className}`}>{children}</div>;
}

/**
 * O cartão de uma jornada no álbum.
 *
 * Mora aqui, e não dentro de uma tela, porque a home e a lista mostram o mesmo
 * objeto: duplicar o cartão seria garantir que as duas divergissem na primeira
 * vez que alguém mexesse em uma delas.
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
  indice,
}: {
  id: string;
  titulo: string;
  categoria: string;
  capaUrl?: string | null;
  aportadoCents: number;
  alvoCents: number;
  percentual: number;
  fatias?: Fatia[];
  indice: number;
}) {
  return (
    <Link
      href={`/jornadas/${id}`}
      className="group mb-3 block break-inside-avoid lg:mb-4"
    >
      {/* A peça levanta do papel ao passar o mouse. Translação, nunca sombra
          nova: a sombra pertence ao objeto, não ao ponteiro. */}
      <Polaroide
        indice={indice}
        className="group-hover:-translate-y-1 group-focus-visible:-translate-y-1"
      >
        <Chapa categoria={categoria} capaUrl={capaUrl} className="h-24 lg:h-40" />
        <b className="mt-2 block text-[13.5px] font-semibold tracking-[-0.02em]">
          {titulo}
        </b>
        <span className="mt-px block font-corpo text-[10.5px] text-suave">
          {rotuloDaCategoria(categoria)}
        </span>
        <div className="mt-1.5">
          <Progresso
            percentual={percentual}
            aportadoCents={aportadoCents}
            alvoCents={alvoCents}
            fatias={fatias}
          />
        </div>
      </Polaroide>
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
export function Secao({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`text-[17px] font-bold tracking-[-0.03em] ${className}`}>{children}</h2>
  );
}

/**
 * O parágrafo que explica.
 *
 * Toda vez que uma tela escreveu `text-sm text-suave-forte` ela pediu 14px na
 * fonte de display — que é a voz do que o app AFIRMA. Explicação é o app
 * conversando, e conversa é Manrope. A regra das duas vozes cabe num
 * componente.
 */
export function Explica({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`font-corpo text-[12.5px] leading-relaxed text-suave-forte ${className}`}>
      {children}
    </p>
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
      className={`grid size-8 flex-none place-items-center rounded-full text-[12px] font-bold text-white ${DISCO[cor]} ${className}`}
    >
      {iniciais || "·"}
    </span>
  );
}

/** O ponto de cor ao lado de um nome, onde o disco de iniciais seria grande demais. */
export function PontoDePessoa({ cor }: { cor: Fatia["cor"] }) {
  return (
    <span aria-hidden="true" className={`size-2.5 flex-none rounded-full ${DISCO[cor]}`} />
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
    <div className="flex items-center gap-3 rounded-bloco bg-white p-3">
      <DiscoDePessoa iniciais={iniciaisDoCasal([nome])} cor={cor} />
      <span className="min-w-0 flex-1">
        <b className="block truncate text-[13px] font-semibold">{nome}</b>
        <i className="block font-corpo text-[10.5px] not-italic text-suave">{legenda}</i>
      </span>
      <b className="flex-none text-[13px] font-bold tabular-nums">{formatBRL(valorCents)}</b>
    </div>
  );
}
