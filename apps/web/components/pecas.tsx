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

export function Polaroide({
  indice = 0,
  endireitada = false,
  className = "",
  children,
}: {
  indice?: number;
  endireitada?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const giro = endireitada ? "rotate-0" : INCLINACOES[indice % INCLINACOES.length];
  return (
    <div
      className={`rounded-polaroide bg-white p-2 pb-3 shadow-polaroide transition-transform duration-500 ${giro} ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * O retângulo hachurado que faz as vezes de foto.
 *
 * Não é enfeite à espera de imagem: enquanto não houver Storage, é ele que
 * segura a composição da polaroide. A hachura é CSS, não imagem — nada a
 * baixar, e nenhuma URL de terceiro entrando na tela.
 */
export function Chapa({ rotulo, className = "" }: { rotulo: string; className?: string }) {
  return (
    <div
      className={`grid place-items-center rounded-[3px] bg-[repeating-linear-gradient(135deg,#7E8E86_0_11px,#72827A_11px_22px)] ${className}`}
    >
      <span className="font-corpo text-[10px] text-white/85">{rotulo}</span>
    </div>
  );
}

/** A pílula preta com o total em limão. */
export function PilulaTotal({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-full bg-tinta px-4 py-2 text-center font-corpo text-[11px] font-bold text-limao">
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
        <Chapa rotulo={`[ ${categoria} ]`} className="h-24" />
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
