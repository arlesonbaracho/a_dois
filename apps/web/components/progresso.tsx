import { formatBRL } from "@repo/core";

/**
 * A barra.
 *
 * Burra: recebe o percentual já calculado por `progressoPercentual` de
 * `@repo/core` e os centavos, e só desenha.
 *
 * `role="progressbar"` com os `aria-value*` é o que faz um leitor de tela
 * dizer "sessenta e dois por cento" em vez de ler uma div vazia. Não se
 * simplifica fora — sem isso, a informação principal da tela some para quem
 * não enxerga.
 *
 * `fatias` é o que o design pede: a barra mostra de QUEM é o dinheiro, não só
 * quanto é. Sem fatias ela volta a ser um preenchimento só, que é o certo na
 * lista onde ainda não se sabe quem colocou.
 */
export type Fatia = { chave: string; cents: number; cor: "pessoa-1" | "pessoa-2" | "fora" };

// Mapa estático porque o Tailwind lê classe por varredura de texto: montar
// `bg-${cor}` em tempo de execução produz classe que não existe no CSS.
const COR: Record<Fatia["cor"], string> = {
  "pessoa-1": "bg-pessoa-1",
  "pessoa-2": "bg-pessoa-2",
  fora: "bg-pessoa-fora",
};

export function Progresso({
  percentual,
  aportadoCents,
  alvoCents,
  fatias,
  semLegenda = false,
}: {
  percentual: number;
  aportadoCents: number;
  alvoCents: number;
  fatias?: Fatia[];
  /** A carta do deck já diz quanto falta numa linha própria. */
  semLegenda?: boolean;
}) {
  // Contra o que a barra é medida. Meta sem alvo (alvo zero é caso real) mede
  // contra o próprio aportado, senão a divisão seria por zero.
  const base = alvoCents > 0 ? alvoCents : aportadoCents;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="progressbar"
        aria-valuenow={percentual}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Quanto vocês já juntaram desta jornada"
        className={`flex h-2 w-full overflow-hidden rounded-full bg-areia ${
          // Sem nada dentro, a barra lisa lê como defeito. A listra diz "ainda
          // não começou", que é estado legítimo e comum numa jornada nova.
          aportadoCents === 0
            ? "bg-[repeating-linear-gradient(115deg,var(--color-areia)_0_7px,var(--color-listra)_7px_14px)]"
            : ""
        }`}
      >
        {/* O grupo inteiro cresce da esquerda, uma vez, a cada valor novo.
            `key` no total é o que faz o gesto REPETIR quando o parceiro
            aporta do outro aparelho: sem ele a animação só rodaria na
            primeira montagem, e a barra mudaria de tamanho num salto. É o
            único movimento da tela que fala do dinheiro. */}
        <span key={aportadoCents} className="anima-crescer flex h-full w-full origin-left gap-0.5">
          {fatias && fatias.length > 0 ? (
            fatias.map((fatia) => (
              <i
                key={fatia.chave}
                className={`block h-full rounded-full ${COR[fatia.cor]}`}
                style={{ width: `${base > 0 ? Math.min(100, (fatia.cents / base) * 100) : 0}%` }}
              />
            ))
          ) : (
            <i className="block h-full rounded-full bg-tinta" style={{ width: `${percentual}%` }} />
          )}
        </span>
      </div>
      {/* O texto é um nó só de propósito — a suíte e2e ancora na frase
          inteira. O que muda é o peso: o que já entrou é o fato, o alvo e a
          porcentagem são referência. */}
      <p className={`num text-[12px] text-suave ${semLegenda ? "sr-only" : ""}`}>
        <b className="font-medium text-tinta">{formatBRL(aportadoCents)}</b>{" "}
        {/* O `{" "}` acima não é enfeite: sem ele o JSX come o espaço entre os
            dois nós e a linha fica sem ponto de quebra nenhum — o texto
            vazava para fora do cartão. */}
        <span className="whitespace-nowrap">
          {alvoCents > 0 ? <>de {formatBRL(alvoCents)} </> : null}· {percentual}%
        </span>
      </p>
    </div>
  );
}
