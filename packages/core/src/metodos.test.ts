import { describe, expect, it } from "vitest";

import { cronograma, fimDoPrazo, METODOS, nomeDoRitmo } from "./metodos";

const soma = (parcelas: number[]) => parcelas.reduce((total, parte) => total + parte, 0);

describe("cronograma", () => {
  it("a soma das parcelas é exatamente o alvo, em toda forma e todo tamanho", () => {
    for (const forma of ["igual", "crescente", "decrescente"] as const) {
      for (const periodos of [1, 7, 26, 52, 100, 365]) {
        // 10.000,01 de propósito: um total que não divide redondo por nada.
        expect(soma(cronograma(1000001, forma, periodos)), `${forma}/${periodos}`).toBe(1000001);
      }
    }
  });

  it("crescente sobe e decrescente é o espelho dele", () => {
    const sobe = cronograma(1000000, "crescente", 52);
    const desce = cronograma(1000000, "decrescente", 52);
    expect(sobe[0]).toBeLessThan(sobe[51]);
    expect(desce).toEqual([...sobe].reverse());
  });

  it("igual só varia no centavo do resto", () => {
    const parcelas = cronograma(1000, "igual", 3);
    expect(Math.max(...parcelas) - Math.min(...parcelas)).toBeLessThanOrEqual(1);
  });

  it("recusa cronograma sem período", () => {
    expect(() => cronograma(1000, "igual", 0)).toThrow(RangeError);
  });
});

describe("fimDoPrazo", () => {
  it("mês é mês de calendário, e não trinta dias", () => {
    const fim = fimDoPrazo("mes", 12, new Date("2026-01-31T12:00:00Z"));
    expect(fim.getUTCFullYear()).toBe(2027);
    expect(fim.getUTCMonth()).toBe(0);
  });

  it("semana é sete dias, dia é um", () => {
    const de = new Date("2026-01-01T12:00:00Z");
    expect(fimDoPrazo("semana", 52, de).getTime() - de.getTime()).toBe(52 * 7 * 864e5);
    expect(fimDoPrazo("dia", 365, de).getTime() - de.getTime()).toBe(365 * 864e5);
  });

  it("não mexe na data recebida", () => {
    const de = new Date("2026-01-01T12:00:00Z");
    fimDoPrazo("mes", 6, de);
    expect(de.toISOString()).toBe("2026-01-01T12:00:00.000Z");
  });
});

describe("nomeDoRitmo", () => {
  it("pluraliza mês como meses, e não como mêss", () => {
    expect(nomeDoRitmo("mes", true)).toBe("meses");
    expect(nomeDoRitmo("semana", true)).toBe("semanas");
    expect(nomeDoRitmo("dia", true)).toBe("dias");
  });
});

describe("METODOS", () => {
  it("todo método tem id único, e só 'quando der' fica sem prazo", () => {
    const ids = METODOS.map((metodo) => metodo.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(METODOS.filter((metodo) => metodo.opcoes.length === 0).map((m) => m.id)).toEqual([
      "livre",
    ]);
  });
});
