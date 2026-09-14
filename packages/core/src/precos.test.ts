import { describe, expect, it } from "vitest";

import { motivoDaFalha, variacaoDePreco } from "./precos";

const em = (dia: number) => new Date(Date.UTC(2026, 0, dia)).toISOString();

describe("variacaoDePreco", () => {
  it("uma cotação só não é histórico", () => {
    expect(variacaoDePreco([])).toBeNull();
    expect(variacaoDePreco([{ precoCents: 419900, quandoISO: em(1) }])).toBeNull();
  });

  it("mede da mais antiga para a mais nova", () => {
    const v = variacaoDePreco([
      { precoCents: 419900, quandoISO: em(1) },
      { precoCents: 399000, quandoISO: em(13) },
    ])!;
    expect(v.deCents).toBe(419900);
    expect(v.paraCents).toBe(399000);
    expect(v.diferencaCents).toBe(-20900);
    expect(v.percentual).toBe(-5);
    expect(v.dias).toBe(12);
  });

  // Se a ordem viesse de quem chamou, uma consulta sem `order by` diria que o
  // preço subiu quando ele caiu — e o casal compraria com pressa por engano.
  it("não confia na ordem em que recebeu", () => {
    const bagunçada = variacaoDePreco([
      { precoCents: 399000, quandoISO: em(13) },
      { precoCents: 419900, quandoISO: em(1) },
    ])!;
    expect(bagunçada.diferencaCents).toBe(-20900);
  });

  it("subida é positiva", () => {
    const v = variacaoDePreco([
      { precoCents: 100000, quandoISO: em(1) },
      { precoCents: 125000, quandoISO: em(3) },
    ])!;
    expect(v.percentual).toBe(25);
    expect(v.diferencaCents).toBe(25000);
  });

  it("preço parado é zero, não é null", () => {
    const v = variacaoDePreco([
      { precoCents: 100000, quandoISO: em(1) },
      { precoCents: 100000, quandoISO: em(2) },
    ])!;
    expect(v.percentual).toBe(0);
    expect(v.diferencaCents).toBe(0);
  });

  // Loja com promoção mal marcada devolve 0. Dividir por ele daria Infinity na
  // tela, que é pior que não mostrar a porcentagem.
  it("não divide por zero", () => {
    const v = variacaoDePreco([
      { precoCents: 0, quandoISO: em(1) },
      { precoCents: 50000, quandoISO: em(2) },
    ])!;
    expect(Number.isFinite(v.percentual)).toBe(true);
    expect(v.percentual).toBe(0);
    expect(v.diferencaCents).toBe(50000);
  });

  it("duas no mesmo dia dão zero dia, não negativo", () => {
    const v = variacaoDePreco([
      { precoCents: 100000, quandoISO: em(5) },
      { precoCents: 90000, quandoISO: em(5) },
    ])!;
    expect(v.dias).toBe(0);
  });
});

describe("motivoDaFalha", () => {
  it("separa o que a pessoa pode consertar do que ela não pode", () => {
    // "o endereço não serve" é acionável: dá para tentar outro link.
    expect(motivoDaFalha("url_recusada")).toBe("endereco_recusado");
    // "a loja não respondeu" não é: é esperar.
    expect(motivoDaFalha("nao_consegui_ler")).toBe("loja_nao_respondeu");
  });

  // Código novo na função não pode virar tela branca num app que ainda não
  // sabe dele.
  it("cai em outro quando não reconhece", () => {
    expect(motivoDaFalha("codigo_que_ainda_nao_existe")).toBe("outro");
    expect(motivoDaFalha("")).toBe("outro");
  });
});
