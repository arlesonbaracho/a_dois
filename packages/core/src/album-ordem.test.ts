import { describe, expect, it } from "vitest";

import { ordemDoAlbum } from "./album-ordem";

const j = (id: string, percentual: number, criadaEmISO: string, prioridade = "media") => ({
  id,
  percentual,
  criadaEmISO,
  prioridade,
});

describe("ordemDoAlbum", () => {
  it("a prioridade declarada vem antes do progresso", () => {
    // A de 90% é baixa; a de 10% é alta. Quem o casal disse que importa ganha.
    const fora = [j("quase", 90, "2026-01-01", "baixa"), j("importa", 10, "2026-01-01", "alta")];
    expect(ordemDoAlbum(fora).map((x) => x.id)).toEqual(["importa", "quase"]);
  });

  it("prioridade desconhecida cai no meio, e não na frente", () => {
    const fora = [
      j("estranha", 0, "2026-01-01", "sei-la"),
      j("alta", 0, "2026-01-01", "alta"),
      j("baixa", 0, "2026-01-01", "baixa"),
    ];
    expect(ordemDoAlbum(fora).map((x) => x.id)).toEqual(["alta", "estranha", "baixa"]);
  });

  it("dentro da mesma prioridade, põe a mais adiantada na frente", () => {
    const fora = [j("a", 10, "2026-01-01"), j("b", 80, "2026-01-01"), j("c", 45, "2026-01-01")];
    expect(ordemDoAlbum(fora).map((x) => x.id)).toEqual(["b", "c", "a"]);
  });

  it("empate de progresso resolve pela mais nova", () => {
    const fora = [j("velha", 50, "2026-01-01"), j("nova", 50, "2026-06-01")];
    expect(ordemDoAlbum(fora).map((x) => x.id)).toEqual(["nova", "velha"]);
  });

  it("empate de progresso e de data resolve pelo id, e nunca pela ordem de chegada", () => {
    const fora = [j("z", 0, "2026-01-01"), j("a", 0, "2026-01-01")];
    expect(ordemDoAlbum(fora).map((x) => x.id)).toEqual(["a", "z"]);
    expect(ordemDoAlbum([...fora].reverse()).map((x) => x.id)).toEqual(["a", "z"]);
  });

  it("data ilegível não embaralha a lista", () => {
    const fora = [j("a", 0, "nao-e-data"), j("b", 0, "tambem-nao")];
    expect(ordemDoAlbum(fora).map((x) => x.id)).toEqual(["a", "b"]);
  });

  it("não mexe na lista recebida", () => {
    const fora = [j("a", 10, "2026-01-01"), j("b", 90, "2026-01-01")];
    ordemDoAlbum(fora);
    expect(fora.map((x) => x.id)).toEqual(["a", "b"]);
  });
});
