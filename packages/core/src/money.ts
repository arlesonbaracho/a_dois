// Dinheiro é sempre integer em centavos. Reais (float) só existem na borda:
// entram por toCents, saem por fromCents ou formatBRL.

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// As mensagens de erro não carregam o valor de propósito: elas podem acabar
// num breadcrumb ou no Sentry, e valor monetário não sai daqui.
function assertCents(cents: number): void {
  if (!Number.isInteger(cents)) {
    throw new TypeError("Centavos precisam ser um número inteiro");
  }
}

/** Converte reais em centavos, arredondando meio para longe do zero. */
export function toCents(reais: number): number {
  if (!Number.isFinite(reais)) {
    throw new TypeError("Valor em reais precisa ser um número finito");
  }
  // O toFixed descarta o ruído binário antes do arredondamento: sem ele,
  // 1.005 * 100 é 100.49999999999999 e R$ 1,005 viraria R$ 1,00.
  const cents = Math.round(Number((Math.abs(reais) * 100).toFixed(6)));
  return reais < 0 ? -cents : cents;
}

/** Converte centavos em reais. Use só para cálculo de terceiros, nunca para somar. */
export function fromCents(cents: number): number {
  assertCents(cents);
  return cents / 100;
}

/** Formata centavos como moeda brasileira. Única forma de mostrar dinheiro na UI. */
export function formatBRL(cents: number): string {
  assertCents(cents);
  return brl.format(cents / 100);
}

export function sumCents(values: number[]): number {
  values.forEach(assertCents);
  return values.reduce((total, cents) => total + cents, 0);
}

/**
 * Quanto da meta já foi juntado, de 0 a 100.
 *
 * Inteiro, e nunca passa de 100: a barra não estoura quando o casal junta mais
 * do que combinou. Meta de alvo zero devolve 100 se já tem dinheiro dentro e 0
 * se não tem — sem alvo, qualquer aporte já é "chegou", e o que não pode
 * acontecer é dividir por zero e mostrar NaN% para as duas pessoas.
 */
export function progressoPercentual(aportadoCents: number, alvoCents: number): number {
  assertCents(aportadoCents);
  assertCents(alvoCents);

  if (alvoCents <= 0) return aportadoCents > 0 ? 100 : 0;
  return Math.max(0, Math.min(100, Math.round((aportadoCents / alvoCents) * 100)));
}

/**
 * Dinheiro digitado por gente virando centavos inteiros.
 *
 * Aceita "1.234,56", "1234.56", "1,234.56", "R$ 99,90" e "1234". A conta é
 * feita em cima do TEXTO, e não com ponto flutuante: dinheiro não passa por
 * float nem aqui, na borda mais suja do sistema.
 *
 * O caso que justifica a função existir é "1.234". Um parser ingênuo troca a
 * vírgula por ponto e chama Number(): esse lê 1,234 e devolve 123 centavos,
 * quando quem digitou queria R$ 1.234,00. Valor mil vezes menor, sem erro
 * nenhum na tela. Três casas depois do separador é milhar, não fração de real.
 *
 * Devolve null quando não há número nenhum — vazio, letra, só "R$".
 */
export function centavosDeTexto(cru: string): number | null {
  const limpo = cru.replace(/[^\d.,]/g, "");
  if (!/\d/.test(limpo)) return null;

  const virgula = limpo.lastIndexOf(",");
  const ponto = limpo.lastIndexOf(".");
  let separador = -1;

  if (virgula >= 0 && ponto >= 0) {
    // Os dois aparecem: o último é o decimal, o outro separa milhar.
    separador = Math.max(virgula, ponto);
  } else {
    const unico = Math.max(virgula, ponto);
    const decimais = limpo.length - unico - 1;
    if (unico >= 0 && limpo.indexOf(limpo[unico]) === unico && decimais >= 1 && decimais <= 2) {
      separador = unico;
    }
  }

  const inteiro = (separador >= 0 ? limpo.slice(0, separador) : limpo).replace(/[.,]/g, "");
  const fracao = separador >= 0 ? limpo.slice(separador + 1).replace(/[.,]/g, "") : "";
  if (inteiro === "" && fracao === "") return null;

  const centavos = Number(inteiro || "0") * 100 + Number(`${fracao}00`.slice(0, 2));
  return Number.isSafeInteger(centavos) && centavos >= 0 ? centavos : null;
}
