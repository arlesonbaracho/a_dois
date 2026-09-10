import { describe, expect, it } from "vitest";

import { sumCents } from "./money";
import {
  dividirCentavos,
  type Participante,
  PESO_FAIXA,
  pesosDaRegra,
  regraDoCasal,
  saldoDoCasal,
} from "./split";

function pessoa(over: Partial<Participante> & { userId: string }): Participante {
  return {
    papel: "parceiro",
    regra: "igual",
    faixaRenda: null,
    parteFixaCents: null,
    ...over,
  };
}

describe("dividirCentavos", () => {
  // O teste que justifica o arquivo inteiro existir.
  it("nunca cria nem destrói centavo", () => {
    const casos: [number, number[]][] = [
      [100, [1, 1, 1]],
      [1, [1, 1]],
      [0, [1, 1]],
      [7, [1, 1, 1, 1, 1]],
      [-100, [1, 1, 1]],
      [-1, [1, 1]],
      [999999, [2, 7]],
      [1, [1, 0]],
      [1, [0, 1]],
      [10, [3, 0, 0]],
    ];

    for (const [total, pesos] of casos) {
      expect(sumCents(dividirCentavos(total, pesos))).toBe(total);
    }
  });

  it("divide 100 centavos por 3 dando o resto a quem vem primeiro", () => {
    expect(dividirCentavos(100, [1, 1, 1])).toEqual([34, 33, 33]);
  });

  it("divide 1 centavo por 2 sem partir o centavo", () => {
    expect(dividirCentavos(1, [1, 1])).toEqual([1, 0]);
  });

  it("divide total zero em zeros, e nenhum deles é -0", () => {
    const partes = dividirCentavos(0, [1, 1]);
    expect(partes).toEqual([0, 0]);
    expect(partes.some((parte) => Object.is(parte, -0))).toBe(false);
  });

  it("divide valores negativos com a mesma exatidão", () => {
    expect(dividirCentavos(-100, [1, 1, 1])).toEqual([-34, -33, -33]);
    expect(dividirCentavos(-1, [1, 1])).toEqual([-1, 0]);
    // O zero do negativo também não pode virar -0: ele atravessa até a tela.
    expect(dividirCentavos(-1, [1, 1]).some((p) => Object.is(p, -0))).toBe(false);
  });

  it("respeita pesos desiguais", () => {
    // 100 na proporção 2:7 é 22,22… e 77,77…
    expect(dividirCentavos(100, [2, 7])).toEqual([22, 78]);
    expect(dividirCentavos(100, [7, 2])).toEqual([78, 22]);
  });

  it("dá zero a quem tem peso zero", () => {
    expect(dividirCentavos(1000, [1, 0])).toEqual([1000, 0]);
  });

  it("é determinístico: mesma entrada, mesma saída", () => {
    expect(dividirCentavos(100, [1, 1, 1])).toEqual(dividirCentavos(100, [1, 1, 1]));
  });

  // Não é teste de exemplo, é teste da invariante. Se algum dia alguém trocar o
  // método do maior resto por outra coisa, isto aqui é o que segura a peça.
  it("mantém a soma exata em milhares de combinações aleatórias", () => {
    for (let i = 0; i < 2000; i++) {
      const total = Math.floor(Math.random() * 2_000_001) - 1_000_000;
      const quantos = 2 + Math.floor(Math.random() * 4);
      const pesos = Array.from({ length: quantos }, () =>
        Math.floor(Math.random() * 1000),
      );
      if (pesos.reduce((a, b) => a + b, 0) === 0) pesos[0] = 1;

      const partes = dividirCentavos(total, pesos);

      expect(partes.every(Number.isInteger)).toBe(true);
      expect(sumCents(partes)).toBe(total);
      // Ninguém recebe parte de sinal contrário ao do total.
      expect(partes.every((p) => (total < 0 ? p <= 0 : p >= 0))).toBe(true);
    }
  });

  it("recusa entrada que não é dinheiro inteiro", () => {
    expect(() => dividirCentavos(10.5, [1, 1])).toThrow(TypeError);
    expect(() => dividirCentavos(Number.NaN, [1, 1])).toThrow(TypeError);
    expect(() => dividirCentavos(100, [1.5, 1])).toThrow(TypeError);
  });

  it("recusa peso negativo, lista vazia e pesos todos zerados", () => {
    expect(() => dividirCentavos(100, [-1, 2])).toThrow(RangeError);
    expect(() => dividirCentavos(100, [])).toThrow(RangeError);
    expect(() => dividirCentavos(100, [0, 0])).toThrow(RangeError);
  });

  it("recusa valores altos demais em vez de mentir na conta", () => {
    expect(() => dividirCentavos(Number.MAX_SAFE_INTEGER, [1, 1])).toThrow(RangeError);
  });
});

describe("pesosDaRegra", () => {
  const ana = pessoa({ userId: "ana" });
  const bia = pessoa({ userId: "bia" });

  it("no modo igual, todo mundo pesa o mesmo", () => {
    expect(pesosDaRegra("igual", [ana, bia])).toEqual([1, 1]);
  });

  it("no modo proporcional, usa o peso da faixa", () => {
    const pesos = pesosDaRegra("proporcional", [
      { ...ana, faixaRenda: "ate_2_sm" },
      { ...bia, faixaRenda: "de_5_a_10_sm" },
    ]);
    expect(pesos).toEqual([PESO_FAIXA.ate_2_sm, PESO_FAIXA.de_5_a_10_sm]);
  });

  // A faixa de renda é opcional. Sem ela a regra não se aplica, e isso é uma
  // resposta, não uma exceção: a tela desabilita a opção e explica.
  it("devolve null quando falta faixa de renda em alguém", () => {
    expect(pesosDaRegra("proporcional", [{ ...ana, faixaRenda: "ate_2_sm" }, bia])).toBeNull();
    expect(pesosDaRegra("proporcional", [ana, bia])).toBeNull();
  });

  it("no modo fixo, o peso é o valor que cada um coloca", () => {
    expect(
      pesosDaRegra("fixo", [
        { ...ana, parteFixaCents: 80000 },
        { ...bia, parteFixaCents: 50000 },
      ]),
    ).toEqual([80000, 50000]);
  });

  it("devolve null quando falta valor fixo, ou quando os dois são zero", () => {
    expect(pesosDaRegra("fixo", [{ ...ana, parteFixaCents: 80000 }, bia])).toBeNull();
    expect(
      pesosDaRegra("fixo", [
        { ...ana, parteFixaCents: 0 },
        { ...bia, parteFixaCents: 0 },
      ]),
    ).toBeNull();
  });

  it("devolve null quando não há ninguém", () => {
    expect(pesosDaRegra("igual", [])).toBeNull();
  });
});

describe("regraDoCasal", () => {
  it("o dono desempata quando as duas linhas discordam", () => {
    expect(
      regraDoCasal([
        pessoa({ userId: "ana", regra: "igual" }),
        pessoa({ userId: "bia", papel: "dono", regra: "proporcional" }),
      ]),
    ).toBe("proporcional");
  });

  it("sem dono, vale a primeira da lista", () => {
    expect(
      regraDoCasal([
        pessoa({ userId: "ana", regra: "fixo" }),
        pessoa({ userId: "bia", regra: "igual" }),
      ]),
    ).toBe("fixo");
  });

  it("sem ninguém, cai no igual", () => {
    expect(regraDoCasal([])).toBe("igual");
  });
});

describe("saldoDoCasal", () => {
  const ana = pessoa({ userId: "ana", papel: "dono" });
  const bia = pessoa({ userId: "bia" });

  it("fecha em zero quando os dois colocaram igual", () => {
    const saldo = saldoDoCasal([ana, bia], { ana: 50000, bia: 50000 }, "igual");
    expect(saldo.linhas.map((l) => l.diferencaCents)).toEqual([0, 0]);
    expect(saldo.totalRateadoCents).toBe(100000);
  });

  it("aponta quem colocou a mais, e a soma das diferenças é sempre zero", () => {
    const saldo = saldoDoCasal([ana, bia], { ana: 80000, bia: 20000 }, "igual");
    expect(saldo.linhas[0]).toMatchObject({ devidoCents: 50000, diferencaCents: 30000 });
    expect(saldo.linhas[1]).toMatchObject({ devidoCents: 50000, diferencaCents: -30000 });
    expect(sumCents(saldo.linhas.map((l) => l.diferencaCents))).toBe(0);
  });

  it("fecha em zero mesmo quando o total divide mal", () => {
    // 1 centavo entre duas pessoas: alguém tem que ficar com ele inteiro.
    const saldo = saldoDoCasal([ana, bia], { ana: 1, bia: 0 }, "igual");
    expect(sumCents(saldo.linhas.map((l) => l.devidoCents))).toBe(1);
    expect(sumCents(saldo.linhas.map((l) => l.diferencaCents))).toBe(0);
  });

  it("quem ganha menos deve menos, no proporcional", () => {
    const saldo = saldoDoCasal(
      [
        { ...ana, faixaRenda: "ate_2_sm" },
        { ...bia, faixaRenda: "de_5_a_10_sm" },
      ],
      { ana: 50000, bia: 50000 },
      "proporcional",
    );
    expect(saldo.aplicavel).toBe(true);
    expect(saldo.linhas[0].devidoCents).toBeLessThan(saldo.linhas[1].devidoCents);
    expect(sumCents(saldo.linhas.map((l) => l.devidoCents))).toBe(100000);
  });

  it("marca a regra como não aplicável em vez de estourar", () => {
    const saldo = saldoDoCasal([ana, bia], { ana: 50000, bia: 0 }, "proporcional");
    expect(saldo.aplicavel).toBe(false);
    // O que cada um colocou continua sendo verdade e continua aparecendo.
    expect(saldo.linhas[0].aportadoCents).toBe(50000);
    expect(saldo.linhas.every((l) => l.devidoCents === 0)).toBe(true);
  });

  it("deixa o dinheiro de quem saiu fora do rateio", () => {
    // A chave "null" não é participante: é o ex-membro. Não pode inflar o
    // que os dois que ficaram ainda devem um ao outro.
    const saldo = saldoDoCasal([ana, bia], { ana: 30000, bia: 30000, null: 999999 }, "igual");
    expect(saldo.totalRateadoCents).toBe(60000);
    expect(saldo.linhas.map((l) => l.diferencaCents)).toEqual([0, 0]);
  });

  it("usa a regra do dono quando ninguém passa uma", () => {
    const saldo = saldoDoCasal(
      [{ ...ana, regra: "fixo", parteFixaCents: 3 }, { ...bia, parteFixaCents: 1 }],
      { ana: 0, bia: 100 },
    );
    expect(saldo.regra).toBe("fixo");
    expect(saldo.linhas.map((l) => l.devidoCents)).toEqual([75, 25]);
  });
});
