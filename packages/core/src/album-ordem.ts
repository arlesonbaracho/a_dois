/**
 * A ordem em que as jornadas aparecem.
 *
 * O banco devolve por `created_at desc`, ou seja, a mais nova primeiro. Numa
 * grade isso é inofensivo; num carrossel que mostra UMA por vez, é o contrário
 * do que serve: a jornada recém-criada tem 0% e é justamente a que menos tem o
 * que mostrar. Quem abre o app quer ver o que está perto de acontecer.
 *
 * Critério: mais adiantada primeiro; empate resolve pela mais nova, e o id
 * fecha a ordem para ela nunca depender da ordem de chegada do banco.
 */
export type EmOrdem = { id: string; percentual: number; criadaEmISO: string };

export function ordemDoAlbum<T extends EmOrdem>(jornadas: readonly T[]): T[] {
  return [...jornadas].sort((a, b) => {
    if (a.percentual !== b.percentual) return b.percentual - a.percentual;
    const quando = Date.parse(b.criadaEmISO) - Date.parse(a.criadaEmISO);
    if (quando !== 0 && !Number.isNaN(quando)) return quando;
    return a.id.localeCompare(b.id);
  });
}
