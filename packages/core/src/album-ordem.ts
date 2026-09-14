/**
 * A ordem em que as jornadas aparecem.
 *
 * Dois critérios, nesta ordem, e cada um resolve um problema diferente:
 *
 * 1. **A prioridade que o casal declarou.** `goals.priority` era gravada e
 *    nunca lida — a consulta em `packages/api/src/goals.ts` já a ordena no
 *    SQL, e esta função respeita isso em vez de desfazer.
 * 2. **Quanto já andou.** Dentro da mesma prioridade, a mais adiantada vem
 *    primeiro. Numa grade isso é indiferente; num carrossel que mostra UMA por
 *    vez, abrir na recém-criada é abrir na que tem 0% e nada a mostrar.
 *
 * Empate nos dois resolve pela mais nova, e o id fecha a ordem para ela nunca
 * depender da ordem de chegada do banco.
 */
export type EmOrdem = {
  id: string;
  percentual: number;
  criadaEmISO: string;
  /** "alta" | "media" | "baixa". Texto livre: o que não conhecemos fica no meio. */
  prioridade?: string;
};

const PESO: Record<string, number> = { alta: 0, media: 1, baixa: 2 };
const pesoDe = (prioridade: string | undefined) => PESO[prioridade ?? "media"] ?? 1;

export function ordemDoAlbum<T extends EmOrdem>(jornadas: readonly T[]): T[] {
  return [...jornadas].sort((a, b) => {
    const prioridade = pesoDe(a.prioridade) - pesoDe(b.prioridade);
    if (prioridade !== 0) return prioridade;

    if (a.percentual !== b.percentual) return b.percentual - a.percentual;

    const quando = Date.parse(b.criadaEmISO) - Date.parse(a.criadaEmISO);
    if (quando !== 0 && !Number.isNaN(quando)) return quando;

    return a.id.localeCompare(b.id);
  });
}
