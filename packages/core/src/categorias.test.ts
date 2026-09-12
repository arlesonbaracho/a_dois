import { describe, expect, it } from "vitest";

import { categoriaConhecida, rotuloDaCategoria } from "./categorias";

describe("categoriaConhecida", () => {
  it("normaliza caixa e espaço", () => {
    expect(categoriaConhecida(" Bebe ")).toBe("bebe");
  });

  it("devolve nulo para categoria livre", () => {
    expect(categoriaConhecida("moto")).toBeNull();
  });
});

describe("rotuloDaCategoria", () => {
  it("acentua e capitaliza as conhecidas", () => {
    expect(rotuloDaCategoria("bebe")).toBe("Bebê");
    expect(rotuloDaCategoria("CASA")).toBe("Casa");
  });

  it("sobe só a primeira letra da categoria livre", () => {
    expect(rotuloDaCategoria("casa do mar")).toBe("Casa do mar");
  });

  it("vazio cai em Geral, que é o que o banco usa por padrão", () => {
    expect(rotuloDaCategoria("   ")).toBe("Geral");
  });
});
