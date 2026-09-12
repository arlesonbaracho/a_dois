import { describe, expect, it } from "vitest";

import { CAPA_BUCKET, CAPA_MAX_BYTES, caminhoDaCapa, ehCaminhoDeCapa } from "./capa";

const CASAL = "11111111-1111-1111-1111-111111111111";
const JORNADA = "22222222-2222-2222-2222-222222222222";
const FOTO = "33333333-3333-3333-3333-333333333333";

describe("caminhoDaCapa", () => {
  it("abre pelo casal, que é quem autoriza", () => {
    // O primeiro segmento é o que as policies de storage.objects conferem.
    // Se ele deixar de ser o couple_id, a autorização inteira muda de lugar.
    expect(caminhoDaCapa(CASAL, JORNADA, FOTO)).toBe(`${CASAL}/${JORNADA}/${FOTO}.jpg`);
  });

  it("recusa qualquer coisa que não seja uuid", () => {
    expect(() => caminhoDaCapa("../..", JORNADA, FOTO)).toThrow();
    expect(() => caminhoDaCapa(CASAL, "", FOTO)).toThrow();
    expect(() => caminhoDaCapa(CASAL, JORNADA, "foto do apê")).toThrow();
  });
});

describe("ehCaminhoDeCapa", () => {
  it("aceita o que o banco aceita", () => {
    expect(ehCaminhoDeCapa(`${CASAL}/${JORNADA}/${FOTO}.jpg`)).toBe(true);
  });

  // O ponto da tarefa inteira: a coluna guarda caminho, nunca endereço. Uma URL
  // faria o navegador de quem abre a tela buscar um destino escolhido por outra
  // pessoa, entregando IP e horário.
  it("nunca aceita URL", () => {
    expect(ehCaminhoDeCapa("https://sei-la.example/foto.jpg")).toBe(false);
    expect(ehCaminhoDeCapa(`//sei-la.example/${JORNADA}/${FOTO}.jpg`)).toBe(false);
    expect(ehCaminhoDeCapa(`data:image/jpeg;base64,${FOTO}`)).toBe(false);
  });

  it("nunca aceita travessia nem segmento a mais", () => {
    expect(ehCaminhoDeCapa(`${CASAL}/../${JORNADA}/${FOTO}.jpg`)).toBe(false);
    expect(ehCaminhoDeCapa(`${CASAL}/${JORNADA}/pasta/${FOTO}.jpg`)).toBe(false);
    expect(ehCaminhoDeCapa(`${CASAL}/${JORNADA}`)).toBe(false);
  });

  it("nunca aceita outra extensão", () => {
    // O bucket só aceita image/jpeg. Um .svg subindo seria script no nosso
    // domínio de Storage, servido para o parceiro.
    expect(ehCaminhoDeCapa(`${CASAL}/${JORNADA}/${FOTO}.svg`)).toBe(false);
    expect(ehCaminhoDeCapa(`${CASAL}/${JORNADA}/${FOTO}.jpg.html`)).toBe(false);
  });
});

describe("os limites", () => {
  it("são os mesmos que estão na linha do bucket", () => {
    expect(CAPA_BUCKET).toBe("capas");
    expect(CAPA_MAX_BYTES).toBe(2097152);
  });
});
