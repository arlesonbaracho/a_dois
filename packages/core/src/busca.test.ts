import { describe, expect, it } from "vitest";

import { termosDeBusca } from "./busca";

describe("termosDeBusca", () => {
  it("liga os termos com OU, que é o que sugestão quer dizer", () => {
    expect(termosDeBusca("Geladeira 375L")).toBe("geladeira | 375l");
  });

  it("descarta preposição e número solto", () => {
    expect(termosDeBusca("Sofá de 3 lugares")).toBe("sofá | lugares");
  });

  it("tira o que é operador do to_tsquery, em vez de deixar virar sintaxe", () => {
    expect(termosDeBusca("Fogão & forno (5 bocas)!")).toBe("fogão | forno | bocas");
    expect(termosDeBusca("a:b|c!d")).toBe("");
  });

  it("nome sem nada aproveitável devolve vazio, e quem chama decide", () => {
    expect(termosDeBusca("de 3 e")).toBe("");
    expect(termosDeBusca("   ")).toBe("");
  });

  it("para em seis termos", () => {
    expect(termosDeBusca("uma duas tres quatro cinco seis sete oito").split(" | ")).toHaveLength(6);
  });
});
