import { formatBRL } from "@repo/core";

/**
 * A barra. Burra: recebe o percentual já calculado por `progressoPercentual`
 * de `@repo/core` e os centavos, e só desenha.
 *
 * `role="progressbar"` com os `aria-value*` é o que faz um leitor de tela dizer
 * "sessenta e dois por cento" em vez de ler uma div vazia. Não se simplifica
 * fora — sem isso, a informação principal da tela some para quem não enxerga.
 */
export function Progresso({
  percentual,
  aportadoCents,
  alvoCents,
}: {
  percentual: number;
  aportadoCents: number;
  alvoCents: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div
        role="progressbar"
        aria-valuenow={percentual}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Quanto vocês já juntaram desta meta"
        className="h-3 w-full overflow-hidden rounded-full bg-stone-200"
      >
        <div
          className="h-full rounded-full bg-orange-700 transition-[width] duration-500"
          style={{ width: `${percentual}%` }}
        />
      </div>
      <p className="text-sm text-stone-600">
        {formatBRL(aportadoCents)}
        {alvoCents > 0 ? <> de {formatBRL(alvoCents)}</> : null} · {percentual}%
      </p>
    </div>
  );
}
