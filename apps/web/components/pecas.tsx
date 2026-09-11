import Link from "next/link";
import type { ReactNode } from "react";

import { formatBRL } from "@repo/core";

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
 * autoral por categoria: duotone com horizonte e grão fino, tudo em CSS.
 *
 * Não é fotografia, e não pretende ser: a foto de verdade depende do Storage,
 * que é migration e está no backlog. O que esta peça precisa fazer até lá é
 * parecer um objeto, e não uma falha de carregamento.
 */
const MATERIAL: Record<string, { de: string; para: string; forma: string }> = {
  casa: { de: "#8C9A8E", para: "#5F6E62", forma: "circle at 72% 118%" },
  viagem: { de: "#9BB4C4", para: "#6C8699", forma: "circle at 28% 120%" },
  reserva: { de: "#B9AE95", para: "#8A7F68", forma: "circle at 50% 125%" },
  casamento: { de: "#C1A17E", para: "#93765A", forma: "circle at 60% 120%" },
  bebe: { de: "#C2B3C4", para: "#8E7E92", forma: "circle at 40% 118%" },
  geral: { de: "#A2A492", para: "#75786A", forma: "circle at 55% 120%" },
};

// Grão: um ruído SVG em data URI. Fica no arquivo, não na rede — nenhuma
// requisição a terceiro, que é a mesma razão das fontes serem self-hosted.
const GRAO =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='r'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23r)' opacity='.22'/%3E%3C/svg%3E\")";

export function Chapa({ categoria, className = "" }: { categoria: string; className?: string }) {
  const m = MATERIAL[categoria.trim().toLowerCase()] ?? MATERIAL.geral;
  return (
    <div
      className={`relative overflow-hidden rounded-[3px] ${className}`}
      style={{
        backgroundImage: `radial-gradient(${m.forma}, ${m.de} 0%, ${m.para} 68%)`,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 mix-blend-overlay"
        style={{ backgroundImage: GRAO }}
      />
      {/* O brilho oblíquo que uma foto impressa tem sob luz de sala. */}
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

/** A pílula preta com o total em limão. */
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
      className={`flex flex-none items-center gap-1.5 rounded-full border px-3 py-2 text-[12.5px] font-medium transition-colors ${
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
  aportadoCents,
  alvoCents,
  percentual,
  fatias,
  indice,
}: {
  id: string;
  titulo: string;
  categoria: string;
  aportadoCents: number;
  alvoCents: number;
  percentual: number;
  fatias?: Fatia[];
  indice: number;
}) {
  return (
    <Link href={`/jornadas/${id}`} className="mb-3 block break-inside-avoid">
      <Polaroide indice={indice}>
        <Chapa categoria={categoria} className="h-24" />
        <b className="mt-2 block text-[13.5px] font-semibold tracking-[-0.02em]">{titulo}</b>
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
