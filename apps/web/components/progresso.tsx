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
}: {
  percentual: number;
  aportadoCents: number;
  alvoCents: number;
  fatias?: Fatia[];
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
        className="flex h-1.5 w-full overflow-hidden rounded-full bg-areia"
      >
        {fatias && fatias.length > 0 ? (
          fatias.map((fatia) => (
            <i
              key={fatia.chave}
              className={`block h-full ${COR[fatia.cor]}`}
              style={{ width: `${base > 0 ? Math.min(100, (fatia.cents / base) * 100) : 0}%` }}
            />
          ))
        ) : (
          <i
            className="block h-full bg-tinta transition-[width] duration-500"
            style={{ width: `${percentual}%` }}
          />
        )}
      </div>
      <p className="font-corpo text-[11px] tabular-nums text-suave">
        {formatBRL(aportadoCents)}
        {alvoCents > 0 ? <> de {formatBRL(alvoCents)}</> : null} · {percentual}%
      </p>
    </div>
  );
}
