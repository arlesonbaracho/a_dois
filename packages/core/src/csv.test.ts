import { describe, expect, it } from "vitest";

import { paraCsv } from "./csv";

const linhas = (csv: string) => csv.split("\r\n");

describe("paraCsv", () => {
  it("achata objeto e lista no formato longo", () => {
    const csv = paraCsv({
      exportado_em: "2026-09-10",
      metas: [
        { id: "m1", title: "Apê" },
        { id: "m2", title: "Viagem" },
      ],
    });

    expect(linhas(csv)).toEqual([
      '"tabela","linha","campo","valor"',
      '"exportado_em","1","exportado_em","2026-09-10"',
      '"metas","1","id","m1"',
      '"metas","1","title","Apê"',
      '"metas","2","id","m2"',
      '"metas","2","title","Viagem"',
    ]);
  });

  // O que quebra CSV escrito à mão. Tudo entre aspas, aspas dobradas dentro.
  it("aguenta vírgula, aspas e quebra de linha dentro do valor", () => {
    const csv = paraCsv({ metas: [{ title: 'Apê 2 quartos, com "varanda"\ne garagem' }] });

    expect(csv).toContain('"Apê 2 quartos, com ""varanda""\ne garagem"');
    // A quebra dentro do campo NÃO é quebra de registro: o campo está entre
    // aspas, então o leitor continua na mesma linha lógica.
    expect(linhas(csv)).toHaveLength(2);
  });

  it("nulo vira campo vazio, não a palavra null", () => {
    const csv = paraCsv({ itens: [{ preco: null, nome: "Cooktop" }] });
    expect(csv).toContain('"itens","1","preco",""');
    expect(csv).not.toContain("null");
  });

  it("objeto aninhado vira JSON dentro da célula, em vez de sumir", () => {
    const csv = paraCsv({ plano: { config: { tema: "claro" } } });
    expect(csv).toContain('"{""tema"":""claro""}"');
  });

  it("lista vazia não gera linha nenhuma", () => {
    expect(linhas(paraCsv({ metas: [] }))).toHaveLength(1);
  });

  it("recusa o que não é objeto", () => {
    expect(() => paraCsv("nem objeto é")).toThrow(TypeError);
    expect(() => paraCsv(null)).toThrow(TypeError);
    expect(() => paraCsv([1, 2])).toThrow(TypeError);
  });
});
