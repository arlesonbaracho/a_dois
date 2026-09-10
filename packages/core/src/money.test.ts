import { describe, expect, it } from "vitest";

import { formatBRL, fromCents, progressoPercentual, sumCents, toCents } from "./money";

// O Intl usa espaço não-quebrável entre "R$" e o número, e o caractere muda
// conforme a versão do ICU. Normalizar deixa o teste estável.
const normalize = (value: string) => value.replace(/[\u00a0\u202f]/g, " ");

describe("toCents", () => {
  it("converte reais em centavos inteiros", () => {
    expect(toCents(10)).toBe(1000);
    expect(toCents(4200.5)).toBe(420050);
  });

  it("arredonda meio para cima, apesar do ruído binário do float", () => {
    // 1.005 * 100 === 100.49999999999999 em ponto flutuante
    expect(toCents(1.005)).toBe(101);
    expect(toCents(2.675)).toBe(268);
    expect(toCents(0.1 + 0.2)).toBe(30);
  });

  it("trata o zero sem virar -0", () => {
    expect(toCents(0)).toBe(0);
    expect(Object.is(toCents(0), -0)).toBe(false);
    expect(Object.is(toCents(-0), -0)).toBe(false);
  });

  it("arredonda negativos para longe do zero", () => {
    expect(toCents(-1.005)).toBe(-101);
    expect(toCents(-0.005)).toBe(-1); // Math.round(-0.5) daria -0
    expect(toCents(-12.34)).toBe(-1234);
  });

  it("recusa valor que não é número finito", () => {
    expect(() => toCents(Number.NaN)).toThrow(TypeError);
    expect(() => toCents(Number.POSITIVE_INFINITY)).toThrow(TypeError);
  });
});

describe("fromCents", () => {
  it("converte centavos em reais", () => {
    expect(fromCents(101)).toBe(1.01);
    expect(fromCents(0)).toBe(0);
    expect(fromCents(-150)).toBe(-1.5);
  });

  it("recusa centavos fracionados", () => {
    expect(() => fromCents(1.5)).toThrow(TypeError);
  });
});

describe("formatBRL", () => {
  it("formata em real brasileiro", () => {
    expect(normalize(formatBRL(0))).toBe("R$ 0,00");
    expect(normalize(formatBRL(420000))).toBe("R$ 4.200,00");
    expect(normalize(formatBRL(1))).toBe("R$ 0,01");
  });

  it("formata negativo", () => {
    expect(normalize(formatBRL(-150))).toBe("-R$ 1,50");
  });

  it("recusa centavos fracionados", () => {
    expect(() => formatBRL(0.5)).toThrow(TypeError);
  });
});

describe("sumCents", () => {
  it("soma lista vazia como zero", () => {
    expect(sumCents([])).toBe(0);
  });

  it("soma positivos e negativos", () => {
    expect(sumCents([100, 250, -50])).toBe(300);
  });

  it("recusa centavos fracionados", () => {
    expect(() => sumCents([100, 1.5])).toThrow(TypeError);
  });
});

describe("progressoPercentual", () => {
  it("mede o quanto já foi juntado", () => {
    expect(progressoPercentual(0, 100000)).toBe(0);
    expect(progressoPercentual(25000, 100000)).toBe(25);
    expect(progressoPercentual(100000, 100000)).toBe(100);
  });

  it("não estoura a barra quando o casal junta mais do que combinou", () => {
    expect(progressoPercentual(250000, 100000)).toBe(100);
  });

  // Sem isso, as duas pessoas veem "NaN%" na tela.
  it("não divide por zero quando a meta não tem alvo", () => {
    expect(progressoPercentual(0, 0)).toBe(0);
    expect(progressoPercentual(50000, 0)).toBe(100);
  });

  it("recusa o que não é centavo inteiro", () => {
    expect(() => progressoPercentual(10.5, 100000)).toThrow(TypeError);
    expect(() => progressoPercentual(1000, 99.9)).toThrow(TypeError);
  });
});
