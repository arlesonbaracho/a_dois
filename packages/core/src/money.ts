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
