import { describe, expect, it } from "vitest";

import { faltaComecar, primeirosPassos, type FatosDoComeco } from "./primeiros-passos";

const SOZINHO: FatosDoComeco = {
  membros: 1,
  conviteEmAndamento: false,
  jornadas: 0,
  totalCents: 0,
  minhaFaixa: null,
  pedidoEnviado: false,
};

const passo = (fatos: FatosDoComeco, id: string) =>
  primeirosPassos(fatos).find((p) => p.id === id)!;

describe("o passo do parceiro", () => {
  it("começa a fazer", () => {
    expect(passo(SOZINHO, "parceiro").estado).toBe("a-fazer");
  });

  // Sem este estado, quem já mandou o convite continua sendo lembrado de
  // mandar o convite — e a lista vira cobrança em vez de ajuda.
  it("vira esperando quando o convite já saiu", () => {
    expect(passo({ ...SOZINHO, conviteEmAndamento: true }, "parceiro").estado).toBe("esperando");
  });

  it("fica feito quando os dois estão no casal", () => {
    expect(passo({ ...SOZINHO, membros: 2 }, "parceiro").estado).toBe("feito");
  });

  // Quem já entrou não precisa ver "convite enviado": o casal está formado, e
  // o convite em aberto é resíduo.
  it("membro no casal ganha de convite em aberto", () => {
    const p = passo({ ...SOZINHO, membros: 2, conviteEmAndamento: true }, "parceiro");
    expect(p.estado).toBe("feito");
  });
});

describe("os outros passos", () => {
  it("jornada e aporte seguem o que já existe", () => {
    const cheio = { ...SOZINHO, jornadas: 2, totalCents: 15000 };
    expect(passo(cheio, "jornada").estado).toBe("feito");
    expect(passo(cheio, "aporte").estado).toBe("feito");
  });

  it("a faixa de renda é opcional, e só ela", () => {
    const passos = primeirosPassos(SOZINHO);
    expect(passos.filter((p) => p.opcional).map((p) => p.id)).toEqual(["faixa"]);
  });
});

describe("faltaComecar", () => {
  it("acende com tudo por fazer", () => {
    expect(faltaComecar(primeirosPassos(SOZINHO))).toBe(true);
  });

  it("continua aceso se só um obrigatório falta", () => {
    const quase = { ...SOZINHO, membros: 2, jornadas: 1 };
    expect(faltaComecar(primeirosPassos(quase))).toBe(true);
  });

  // O teste que importa: a faixa em branco não pode segurar a lista na home
  // para sempre de quem nunca quis dividir pela renda.
  it("apaga com os três obrigatórios feitos, mesmo sem a faixa", () => {
    const pronto = { ...SOZINHO, membros: 2, jornadas: 1, totalCents: 5000 };
    expect(passo(pronto, "faixa").estado).toBe("a-fazer");
    expect(faltaComecar(primeirosPassos(pronto))).toBe(false);
  });
});

// O convidado que pediu para entrar está num plano solo. Criar jornada ali é o
// único jeito de ele mesmo quebrar o próprio pedido: `confirm_invite` recusa
// plano com movimentação. A lista não pode ensinar esse caminho.
describe("quem pediu para entrar no plano de alguém", () => {
  const convidado = { ...SOZINHO, pedidoEnviado: true };

  it("não recebe passo de jornada nem de aporte", () => {
    expect(primeirosPassos(convidado).map((p) => p.id)).toEqual(["parceiro"]);
  });

  it("espera, e sabe por que não criar nada ainda", () => {
    const p = passo(convidado, "parceiro");
    expect(p.estado).toBe("esperando");
    expect(p.dica).toMatch(/impede a confirmação/);
    expect(faltaComecar(primeirosPassos(convidado))).toBe(true);
  });

  it("depois de confirmado, volta a ser um casal como outro qualquer", () => {
    const junto = { ...convidado, membros: 2 };
    expect(primeirosPassos(junto).map((p) => p.id)).toEqual(["parceiro", "jornada", "aporte", "faixa"]);
  });
});

describe("os links levam à tela que resolve", () => {
  it("jornada cria, aporte abre o teclado", () => {
    expect(passo(SOZINHO, "jornada").href).toBe("/jornadas/nova");
    expect(passo(SOZINHO, "aporte").href).toBe("/aportes/novo");
  });
});
