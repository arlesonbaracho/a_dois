/**
 * Regras do álbum: quem é de que cor, e o que conta como "este mês".
 *
 * Moram aqui porque componente não calcula — e porque a cor de cada pessoa
 * precisa ser a MESMA em toda tela. Se cada componente ordenasse do seu jeito,
 * a mesma pessoa seria verde na home e âmbar na jornada, e a barra bicolor
 * deixaria de querer dizer alguma coisa.
 */

export type CorDePessoa = "pessoa-1" | "pessoa-2" | "fora";

type Membro = { userId: string; papel: string };

/**
 * A ordem estável dos membros: quem tem papel `dono` primeiro, e o empate
 * resolve pelo `userId`, que não muda nunca.
 *
 * Ordenar por data de entrada seria mais natural de ler, mas `joined_at` de
 * duas pessoas pode empatar no mesmo instante (o convite confirma numa
 * transação só), e aí a ordem viraria a do banco — que não é garantida.
 */
export function ordemEstavel<T extends Membro>(membros: readonly T[]): T[] {
  return [...membros].sort((a, b) => {
    const papel = Number(b.papel === "dono") - Number(a.papel === "dono");
    return papel !== 0 ? papel : a.userId.localeCompare(b.userId);
  });
}

/** A cor de cada pessoa do casal. Quem não é membro cai em `fora`. */
export function coresDoCasal(membros: readonly Membro[]): Map<string, CorDePessoa> {
  const cores = new Map<string, CorDePessoa>();
  ordemEstavel(membros).forEach((membro, indice) => {
    cores.set(membro.userId, indice === 0 ? "pessoa-1" : "pessoa-2");
  });
  return cores;
}

/**
 * Soma os aportes do mês da referência, no fuso de quem está olhando.
 *
 * Comparar por ano e mês locais, e não por intervalo em UTC, é o que faz um
 * aporte do dia 1º às 00h30 de Brasília contar no mês certo — em UTC ele já é
 * dia 1º às 03h30, mas um do dia 31 às 22h viraria o mês seguinte.
 */
export function centavosNoMes(
  aportes: readonly { quandoISO: string; cents: number }[],
  referencia: Date,
): number {
  const ano = referencia.getFullYear();
  const mes = referencia.getMonth();

  let total = 0;
  for (const aporte of aportes) {
    const quando = new Date(aporte.quandoISO);
    if (Number.isNaN(quando.getTime())) continue;
    if (quando.getFullYear() === ano && quando.getMonth() === mes) total += aporte.cents;
  }
  return total;
}

/** "setembro, 2026" — o subtítulo do cabeçalho da home. */
export function mesPorExtenso(referencia: Date): string {
  return referencia
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    .replace(" de ", ", ");
}

/**
 * As iniciais do casal para o disco do cabeçalho: "LA" para Lucas e Ana.
 *
 * Quem não preencheu o nome não vira lacuna nem placeholder — simplesmente não
 * contribui com letra. Casal inteiro sem nome devolve string vazia, e quem
 * chama decide o que desenhar.
 */
export function iniciaisDoCasal(nomes: readonly (string | null)[]): string {
  return nomes
    .map((nome) => nome?.trim()?.[0] ?? "")
    .join("")
    .toUpperCase();
}

/**
 * Quanto ainda cabe por mês para chegar no prazo.
 *
 * Devolve `null` quando não há prazo: sem horizonte não existe conta, e
 * inventar um seria mentir com número redondo. O piso de um mês evita que
 * prazo vencido ou de hoje vire divisão por zero — nesse caso o que falta é
 * tudo, agora, que é a resposta honesta.
 *
 * `agora` entra por parâmetro porque `core` é puro: quem chama decide qual é
 * o instante, e o teste consegue fixar um.
 */
export function parcelaMensalCents(
  faltamCents: number,
  prazoISO: string | null,
  agora: Date,
): number | null {
  if (!prazoISO) return null;
  const prazo = new Date(prazoISO);
  if (Number.isNaN(prazo.getTime())) return null;

  const MES_MEDIO = 1000 * 60 * 60 * 24 * 30.44;
  const meses = Math.max(1, Math.ceil((prazo.getTime() - agora.getTime()) / MES_MEDIO));
  return Math.ceil(faltamCents / meses);
}
