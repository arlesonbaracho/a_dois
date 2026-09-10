// Divisão de dinheiro entre as pessoas do casal.
//
// A regra que manda em tudo aqui: a soma das partes é EXATAMENTE o total. Não
// existe centavo criado nem centavo perdido. Se essa invariante quebrar, um dos
// dois passa a pagar um centavo a mais para sempre, e ninguém descobre por quê.
//
// Tudo em centavos inteiros, como o resto do projeto. Nada de porcentagem em
// float no meio do caminho.

import { sumCents } from "./money";

export type RegraDivisao = "igual" | "proporcional" | "fixo";

export type FaixaRenda = "ate_2_sm" | "de_2_a_5_sm" | "de_5_a_10_sm" | "acima_10_sm";

/**
 * Peso de cada faixa: o ponto médio dela em salários mínimos, multiplicado por
 * 2 para virar inteiro. A faixa aberta do topo entra como 15 SM — é um chute
 * honesto, e o que importa para a divisão é a proporção entre as faixas, não o
 * valor absoluto.
 *
 * Continua sendo faixa, nunca o valor exato: minimização de dado (LGPD,
 * Art. 6º, III).
 */
export const PESO_FAIXA: Record<FaixaRenda, number> = {
  ate_2_sm: 2, // ~1 SM
  de_2_a_5_sm: 7, // ~3,5 SM
  de_5_a_10_sm: 15, // ~7,5 SM
  acima_10_sm: 30, // ~15 SM
};

/** Uma pessoa ativa no casal, do ponto de vista da divisão. */
export type Participante = {
  userId: string;
  papel: "dono" | "parceiro";
  regra: RegraDivisao;
  faixaRenda: FaixaRenda | null;
  /**
   * A pessoa consentiu com o uso da faixa dela no cálculo?
   *
   * Sem consentimento a faixa existe no banco e não pode ser usada — é aqui, e
   * só aqui, que o app deixa de usá-la. Uma leitura, um lugar.
   */
  usoDaFaixaConsentido: boolean;
  parteFixaCents: number | null;
};

// As mensagens não carregam valor monetário de propósito: elas podem acabar num
// breadcrumb ou no Sentry. Mesma disciplina de money.ts.
function assertInteiro(valor: number, oQue: string): void {
  if (!Number.isSafeInteger(valor)) {
    throw new TypeError(`${oQue} precisa ser um inteiro seguro`);
  }
}

/**
 * Divide um total em partes proporcionais aos pesos, sem criar nem destruir
 * centavo: `sumCents(dividirCentavos(t, p)) === t`, sempre.
 *
 * Método do maior resto: cada um leva o piso da sua parte, e os centavos que
 * sobram vão para quem ficou com a maior fração, empate resolvido pela ordem da
 * lista. É determinístico — a mesma entrada dá a mesma saída, o que importa
 * quando duas telas mostram a mesma conta.
 *
 * Total negativo é dividido pelo módulo e tem o sinal reposto no fim. A soma
 * continua exata, e não existe uma segunda implementação para o caso negativo.
 */
export function dividirCentavos(totalCents: number, pesos: number[]): number[] {
  assertInteiro(totalCents, "O total em centavos");

  if (pesos.length === 0) {
    throw new RangeError("Divisão precisa de pelo menos uma parte");
  }
  for (const peso of pesos) {
    assertInteiro(peso, "Peso");
    if (peso < 0) throw new RangeError("Peso não pode ser negativo");
  }

  const somaPesos = pesos.reduce((total, peso) => total + peso, 0);
  if (somaPesos === 0) {
    // Quem chama decide o que fazer antes de chegar aqui: pesosDaRegra devolve
    // null nesse caso justamente para a tela explicar em vez de estourar.
    throw new RangeError("A soma dos pesos precisa ser maior que zero");
  }

  const negativo = totalCents < 0;
  const total = Math.abs(totalCents);

  // total * peso <= total * somaPesos. Acima do inteiro seguro o produto passa
  // a mentir, e uma conta de dinheiro errada em silêncio é pior que um erro.
  if (total * somaPesos > Number.MAX_SAFE_INTEGER) {
    throw new RangeError("Valores altos demais para dividir com exatidão");
  }

  const partes = pesos.map((peso) => Math.floor((total * peso) / somaPesos));
  const restos = pesos.map((peso) => (total * peso) % somaPesos);

  // Quantos centavos o piso deixou na mesa. Sempre menor que a quantidade de
  // partes, então cada um recebe no máximo um.
  const sobra = total - partes.reduce((soma, parte) => soma + parte, 0);

  const ordem = pesos
    .map((_, indice) => indice)
    .sort((a, b) => restos[b] - restos[a] || a - b);

  for (let i = 0; i < sobra; i++) partes[ordem[i]] += 1;

  // O "|| 0" mata o -0 que o unário sobre zero produziria.
  return negativo ? partes.map((parte) => -parte || 0) : partes;
}

/**
 * Qual regra vale para o casal.
 *
 * A regra é coluna de couple_members, ou seja, existe uma por pessoa, e as duas
 * podem discordar. Quem desempata é o papel 'dono'; sem dono, a primeira da
 * lista (a consulta vem ordenada por created_at). Esta função só existe por
 * causa desse modelo — está registrada em Dívidas.
 */
export function regraDoCasal(participantes: Participante[]): RegraDivisao {
  const dono = participantes.find((p) => p.papel === "dono");
  return (dono ?? participantes[0])?.regra ?? "igual";
}

/**
 * Os pesos que a regra produz, ou `null` quando ela não dá para aplicar com os
 * dados que existem.
 *
 * `null` não é erro: a faixa de renda é opcional, e quem não quis informar tem
 * o direito de não informar. Quem chama usa esse `null` para desabilitar a
 * opção na tela com uma explicação — nunca para mostrar uma tela de erro.
 */
export function pesosDaRegra(
  regra: RegraDivisao,
  participantes: Participante[],
): number[] | null {
  if (participantes.length === 0) return null;

  if (regra === "igual") return participantes.map(() => 1);

  if (regra === "proporcional") {
    const pesos: number[] = [];
    for (const pessoa of participantes) {
      // Faixa que existe mas não pode ser usada vale o mesmo que faixa que não
      // existe: a regra não se aplica, e a tela explica em vez de estourar.
      // Revogar o consentimento não quebra nada — cai neste mesmo caminho.
      if (pessoa.faixaRenda === null || !pessoa.usoDaFaixaConsentido) return null;
      pesos.push(PESO_FAIXA[pessoa.faixaRenda]);
    }
    return pesos;
  }

  const pesos: number[] = [];
  for (const pessoa of participantes) {
    if (pessoa.parteFixaCents === null) return null;
    pesos.push(pessoa.parteFixaCents);
  }
  // Os dois zerados não é "divisão por valor fixo", é ausência de resposta.
  return pesos.some((peso) => peso > 0) ? pesos : null;
}

export type LinhaSaldo = {
  userId: string;
  aportadoCents: number;
  devidoCents: number;
  /** Positivo: colocou mais do que cabia. Negativo: está devendo. */
  diferencaCents: number;
};

export type Saldo = {
  regra: RegraDivisao;
  /** false quando a regra escolhida não dá para aplicar: a tela explica. */
  aplicavel: boolean;
  linhas: LinhaSaldo[];
  /** Soma do que os participantes ativos colocaram. É o que foi rateado. */
  totalRateadoCents: number;
};

/**
 * O saldo entre as pessoas do casal: quem colocou mais e quem colocou menos do
 * que cabia, segundo a regra.
 *
 * Rateia só o que os membros ATIVOS aportaram. Dinheiro de quem já saiu do
 * casal (contributions.user_id nulo, o "ex-membro" que leave_couple cria) conta
 * no total do plano, mas fica fora daqui: incluí-lo inflaria o que cada um
 * ainda deve por uma conta que ninguém pode acertar.
 *
 * Como a soma dos devidos é a soma dos aportados, a soma das diferenças é
 * exatamente zero. É a mesma invariante de dividirCentavos, vista de lado.
 */
export function saldoDoCasal(
  participantes: Participante[],
  aportadoPorPessoa: Readonly<Record<string, number>>,
  regra: RegraDivisao = regraDoCasal(participantes),
): Saldo {
  const aportado = participantes.map((p) => aportadoPorPessoa[p.userId] ?? 0);
  const totalRateadoCents = sumCents(aportado);

  const pesos = pesosDaRegra(regra, participantes);

  if (pesos === null) {
    return {
      regra,
      aplicavel: false,
      totalRateadoCents,
      linhas: participantes.map((pessoa, i) => ({
        userId: pessoa.userId,
        aportadoCents: aportado[i],
        devidoCents: 0,
        diferencaCents: 0,
      })),
    };
  }

  const devido = dividirCentavos(totalRateadoCents, pesos);

  return {
    regra,
    aplicavel: true,
    totalRateadoCents,
    linhas: participantes.map((pessoa, i) => ({
      userId: pessoa.userId,
      aportadoCents: aportado[i],
      devidoCents: devido[i],
      diferencaCents: aportado[i] - devido[i],
    })),
  };
}
