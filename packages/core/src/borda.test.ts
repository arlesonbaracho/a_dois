import { describe, expect, it } from "vitest";

import { mensagemDoBanco, paraCampoData, paraInstante } from "./borda";

describe("paraInstante", () => {
  it("fixa meio-dia UTC, para a data não andar para trás no Brasil", () => {
    expect(paraInstante(" 2026-09-16 ")).toBe("2026-09-16T12:00:00Z");
    expect(paraCampoData(paraInstante("2026-01-01"))).toBe("2026-01-01");
  });

  it("campo vazio é ausência, não data", () => {
    expect(paraInstante("  ")).toBeNull();
    expect(paraCampoData(null)).toBe("");
  });
});

describe("mensagemDoBanco", () => {
  it("passa adiante só a frase que nós escrevemos", () => {
    expect(mensagemDoBanco({ code: "P0001", message: "Plano cheio" }, "x")).toBe("Plano cheio");
    expect(mensagemDoBanco({ code: "53400", message: "limite" }, "x")).toMatch(/Muitas tentativas/);
  });

  it("esconde o que o banco diz de si mesmo", () => {
    const vazamento = {
      code: "23514",
      message: 'new row violates check constraint "goal_items_url_http"',
    };
    expect(mensagemDoBanco(vazamento, "Não rolou")).toBe("Não rolou");
    expect(mensagemDoBanco(null, "Não rolou")).toBe("Não rolou");
  });
});
