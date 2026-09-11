import { describe, expect, it } from "vitest";

import {
  centavosNoMes,
  coresDoCasal,
  iniciaisDoCasal,
  mesPorExtenso,
  ordemEstavel,
  parcelaMensalCents,
} from "./album";

describe("ordemEstavel", () => {
  it("põe o dono primeiro", () => {
    const membros = [
      { userId: "zzz", papel: "parceiro" },
      { userId: "aaa", papel: "dono" },
    ];
    expect(ordemEstavel(membros).map((m) => m.userId)).toEqual(["aaa", "zzz"]);
  });

  it("desempata pelo userId quando ninguém é dono", () => {
    const membros = [
      { userId: "bbb", papel: "parceiro" },
      { userId: "aaa", papel: "parceiro" },
    ];
    expect(ordemEstavel(membros).map((m) => m.userId)).toEqual(["aaa", "bbb"]);
  });

  it("não muda a ordem quando a entrada muda de ordem", () => {
    const a = { userId: "aaa", papel: "parceiro" };
    const b = { userId: "bbb", papel: "dono" };
    expect(ordemEstavel([a, b])).toEqual(ordemEstavel([b, a]));
  });

  it("não mexe no array recebido", () => {
    const membros = [
      { userId: "zzz", papel: "parceiro" },
      { userId: "aaa", papel: "dono" },
    ];
    ordemEstavel(membros);
    expect(membros[0].userId).toBe("zzz");
  });
});

describe("coresDoCasal", () => {
  it("dá verde ao dono e âmbar ao parceiro", () => {
    const cores = coresDoCasal([
      { userId: "parceiro", papel: "parceiro" },
      { userId: "dono", papel: "dono" },
    ]);
    expect(cores.get("dono")).toBe("pessoa-1");
    expect(cores.get("parceiro")).toBe("pessoa-2");
  });

  it("quem não é membro não tem cor", () => {
    expect(coresDoCasal([{ userId: "a", papel: "dono" }]).get("estranho")).toBeUndefined();
  });
});

describe("centavosNoMes", () => {
  const setembro = new Date(2026, 8, 15);

  it("soma só o mês da referência", () => {
    const total = centavosNoMes(
      [
        { quandoISO: "2026-09-02T12:00:00Z", cents: 1000 },
        { quandoISO: "2026-09-28T12:00:00Z", cents: 500 },
        { quandoISO: "2026-08-31T12:00:00Z", cents: 9999 },
        { quandoISO: "2026-10-01T12:00:00Z", cents: 9999 },
      ],
      setembro,
    );
    expect(total).toBe(1500);
  });

  it("ignora data inválida em vez de virar NaN", () => {
    expect(centavosNoMes([{ quandoISO: "nada", cents: 100 }], setembro)).toBe(0);
  });

  it("mês sem aporte é zero, não undefined", () => {
    expect(centavosNoMes([], setembro)).toBe(0);
  });
});

describe("mesPorExtenso", () => {
  it("escreve mês e ano separados por vírgula", () => {
    expect(mesPorExtenso(new Date(2026, 8, 11))).toBe("setembro, 2026");
  });
});

describe("iniciaisDoCasal", () => {
  it("junta a primeira letra de cada nome", () => {
    expect(iniciaisDoCasal(["Lucas", "Ana"])).toBe("LA");
  });

  it("pula quem não informou nome", () => {
    expect(iniciaisDoCasal(["Lucas", null])).toBe("L");
    expect(iniciaisDoCasal([null, null])).toBe("");
  });

  it("não tropeça em espaço em branco", () => {
    expect(iniciaisDoCasal(["  ana  ", "   "])).toBe("A");
  });
});

describe("parcelaMensalCents", () => {
  const agora = new Date(2026, 8, 11);

  it("divide o que falta pelos meses que restam", () => {
    // ~12 meses até setembro de 2027.
    const parcela = parcelaMensalCents(1200000, new Date(2027, 8, 11).toISOString(), agora);
    expect(parcela).toBe(100000);
  });

  it("sem prazo não existe conta", () => {
    expect(parcelaMensalCents(1200000, null, agora)).toBeNull();
  });

  it("prazo inválido também devolve null, em vez de NaN", () => {
    expect(parcelaMensalCents(1200000, "não é data", agora)).toBeNull();
  });

  it("prazo vencido não divide por zero: o que falta é tudo, agora", () => {
    const parcela = parcelaMensalCents(50000, new Date(2020, 0, 1).toISOString(), agora);
    expect(parcela).toBe(50000);
  });

  it("arredonda para cima, para a soma das parcelas nunca ficar abaixo do alvo", () => {
    const parcela = parcelaMensalCents(101, new Date(2027, 8, 11).toISOString(), agora);
    expect(parcela).toBe(9);
  });
});
