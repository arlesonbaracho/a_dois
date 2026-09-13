import { describe, expect, it } from "vitest";

import { ordemDoAlbum } from "./album-ordem";

const j = (id: string, percentual: number, criadaEmISO: string) => ({
  id,
  percentual,
  criadaEmISO,
});

describe("ordemDoAlbum", () => {
  it("põe a mais adiantada na frente", () => {
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
