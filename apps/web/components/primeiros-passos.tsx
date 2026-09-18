import Image from "next/image";
import Link from "next/link";

import type { Passo } from "@repo/core";

import { Moeda } from "./chuva";
import { IconeAvancar, IconeCheck, IconeMais } from "./icones";
import { campoDe } from "./pecas";

/**
 * Os primeiros passos, na home.
 *
 * Não são lista: são cartas do mesmo deck das jornadas. Enquanto o casal não
 * tem jornada, o deck da home é feito deles — o próximo passo na frente, os
 * que faltam atrás. Cada carta leva à tela de verdade e sai do deck sozinha
 * quando o que ela pede acontece, porque nada aqui guarda "em que passo você
 * está": os dados é que respondem (`primeirosPassos`, em `packages/core`).
 *
 * Burros, como as outras peças: recebem os passos prontos.
 */

/** O campo de fundo de cada passo, do mesmo material das categorias. */
const CAMPO: Record<Passo["id"], string> = {
  parceiro: campoDe("casamento"),
  jornada: campoDe("casa"),
  aporte: campoDe("reserva"),
  faixa: campoDe("geral"),
};

/** Quanto a carta de trás desce, por camada — o mesmo do deck de jornadas. */
const CAMADA_PX = 17;

/**
 * O casal ainda pela metade: quem chegou, e a cadeira da outra pessoa em
 * tracejado. Com `selo`, o disco de tinta com o confere diz que quem decide
 * quem senta ali é quem já está.
 */
export function ArteDoCasal({
  inicial,
  selo = false,
  className = "",
}: {
  inicial: string;
  selo?: boolean;
  className?: string;
}) {
  return (
    <span aria-hidden="true" className={`relative flex items-center ${className}`}>
      {/* Quem chegou vem na frente; a cadeira vazia, opaca, fica atrás — a
          transparência pintava uma meia-lua esverdeada na sobreposição. */}
      <span className="relative z-10 grid size-24 place-items-center rounded-full border-4 border-white bg-pessoa-1 text-[34px] font-medium text-creme shadow-carta">
        {inicial || "·"}
      </span>
      <span className="-ml-6 grid size-24 place-items-center rounded-full border-2 border-dashed border-contorno bg-white text-suave">
        <IconeMais className="size-9" />
      </span>
      {selo ? (
        <span className="absolute -bottom-2 left-1/2 z-20 grid size-11 -translate-x-1/2 place-items-center rounded-full border-4 border-white bg-tinta text-creme">
          <IconeCheck className="size-5" />
        </span>
      ) : null}
    </span>
  );
}

function ArteDoPasso({ passo, inicial }: { passo: Passo; inicial: string }) {
  if (passo.id === "parceiro") return <ArteDoCasal inicial={inicial} selo={passo.estado === "esperando"} />;
  if (passo.id === "aporte") return <Moeda className="size-28 drop-shadow-[0_16px_20px_rgb(7_0_1/0.18)]" />;
  return (
    <Image
      src="/arte/casa.png"
      alt=""
      width={256}
      height={256}
      unoptimized
      className="size-32 drop-shadow-[0_16px_20px_rgb(7_0_1/0.14)]"
    />
  );
}

/**
 * O deck de começo: aparece no lugar do deck de jornadas enquanto não há
 * jornada nenhuma. Sem giro automático — é tarefa, não vitrine.
 *
 * O passo opcional (a faixa de renda) não vira carta: ele nunca segurou o
 * bloco aceso, e mora em /aportes, onde a divisão é decidida.
 */
export function DeckDeComeco({ passos, inicial }: { passos: Passo[]; inicial: string }) {
  const obrigatorios = passos.filter((passo) => !passo.opcional);
  const pendentes = obrigatorios.filter((passo) => passo.estado !== "feito");
  const feitos = obrigatorios.length - pendentes.length;
  const frente = pendentes[0];
  if (!frente) return null;

  const atras = pendentes.slice(1, 3);
  const esperando = frente.estado === "esperando";

  return (
    <section aria-labelledby="primeiros-passos" className="flex flex-col gap-3 lg:max-w-[27rem]">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="primeiros-passos" className="text-[18px] font-medium tracking-[-0.02em]">
          Comecem por aqui
        </h2>
        {obrigatorios.length > 1 ? (
          <span className="num text-[13px] text-suave">
            {feitos} de {obrigatorios.length} feitos
          </span>
        ) : null}
      </div>

      <div className="relative" style={{ paddingBottom: `${atras.length * CAMADA_PX}px` }}>
        {atras.map((passo, posicao) => {
          const camada = posicao + 1;
          return (
            <div
              key={passo.id}
              aria-hidden="true"
              className={`absolute inset-x-0 top-0 rounded-carta ${CAMPO[passo.id]}`}
              style={{
                height: `calc(100% - ${atras.length * CAMADA_PX}px)`,
                zIndex: 10 - camada,
                transformOrigin: "50% 100%",
                transform: `translateY(${camada * CAMADA_PX}px) scale(${1 - camada * 0.045}) rotate(${camada % 2 ? 2 : -1.5}deg)`,
              }}
            />
          );
        })}

        <article className="relative z-10 rounded-carta bg-white p-2.5 shadow-carta">
          <div
            className={`relative flex h-[200px] items-center justify-center overflow-hidden rounded-cartao ${CAMPO[frente.id]}`}
          >
            <ArteDoPasso passo={frente} inicial={inicial} />
            {esperando ? (
              <span className="absolute left-3.5 top-3.5 rounded-full bg-white px-3 py-1.5 text-[13px] text-suave">
                esperando
              </span>
            ) : null}
          </div>
          <div className="px-3 pb-2 pt-4">
            <h3 className="text-[21px] font-medium leading-tight tracking-[-0.02em]">
              {frente.titulo}
            </h3>
            <p className="mt-1.5 text-[14px] leading-relaxed text-suave">{frente.dica}</p>
            <Link
              href={frente.href}
              className={`mt-4 flex h-12 items-center justify-center gap-2 rounded-full text-[16px] font-medium transition active:scale-[0.98] ${
                esperando
                  ? "border border-contorno bg-white text-tinta hover:bg-areia"
                  : "bg-tinta text-creme hover:opacity-90"
              }`}
            >
              {frente.acao}
              <IconeAvancar aria-hidden="true" className="size-[18px]" />
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}

/**
 * Com jornada no deck e passo obrigatório pendente — em geral a outra pessoa
 * que ainda não chegou —, uma linha só acima do deck. A carta grande ali
 * tiraria o lugar das jornadas, que agora são o assunto da tela.
 */
export function ProximoPasso({ passos, inicial }: { passos: Passo[]; inicial: string }) {
  const passo = passos.find((item) => !item.opcional && item.estado !== "feito");
  if (!passo) return null;

  return (
    <Link
      href={passo.href}
      className="flex items-center gap-3 rounded-cartao border border-borda bg-white p-2 pr-4 transition hover:bg-areia/40 active:scale-[0.99]"
    >
      <span
        aria-hidden="true"
        className={`grid size-12 flex-none place-items-center overflow-hidden rounded-chapa ${CAMPO[passo.id]}`}
      >
        {passo.id === "parceiro" ? (
          <span className="grid size-7 place-items-center rounded-full bg-pessoa-1 text-[13px] font-medium text-creme">
            {inicial || "·"}
          </span>
        ) : passo.id === "aporte" ? (
          <Moeda className="size-8" />
        ) : (
          <Image src="/arte/casa.png" alt="" width={32} height={32} unoptimized />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <b className="block text-[15px] font-medium leading-snug">{passo.titulo}</b>
        <span className="block text-[12px] text-suave">
          {passo.estado === "esperando" ? "esperando" : passo.acao}
        </span>
      </span>
      <IconeAvancar aria-hidden="true" className="size-5 flex-none text-suave" />
    </Link>
  );
}
