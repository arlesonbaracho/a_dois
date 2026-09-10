import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

// database.types.ts está escrito à mão até o Docker existir por aqui, então
// nada garante que ele bata com a migration. Este teste garante: se uma coluna
// nascer, sumir ou for digitada errada de um lado só, ele quebra.
//
// ponytail: comparação por regex entre dois arquivos que nós mesmos formatamos,
// não um parser de SQL. Confere nome de tabela e de coluna, não tipo nem
// nulabilidade. Quando `npm run db:types` passar a rodar de verdade, o próprio
// gerador vira a fonte e este teste vira só a rede de segurança do commit.

const dir = (p: string) => fileURLToPath(new URL(p, import.meta.url));

const migration = (() => {
  const path = dir("../../../supabase/migrations");
  const files = readdirSync(path).filter((f) => f.endsWith(".sql"));
  return files.map((f) => readFileSync(join(path, f), "utf8")).join("\n");
})();

const types = readFileSync(dir("./database.types.ts"), "utf8");

const NAO_E_COLUNA = /^(primary|unique|foreign|check|constraint|references)\b/;

function colunasDaMigration(): Map<string, Set<string>> {
  const tabelas = new Map<string, Set<string>>();
  const bloco = /^create table public\.(\w+) \(\n([\s\S]*?)^\);/gm;

  for (const [, nome, corpo] of migration.matchAll(bloco)) {
    const colunas = new Set<string>();
    for (const linha of corpo!.split("\n")) {
      const m = /^ {2}(\w+) /.exec(linha);
      if (m && !NAO_E_COLUNA.test(m[1]!)) colunas.add(m[1]!);
    }
    tabelas.set(nome!, colunas);
  }
  return tabelas;
}

function colunasDosTipos(): Map<string, Set<string>> {
  const tabelas = new Map<string, Set<string>>();
  const bloco = /^ {6}(\w+): \{\n {8}Row: \{\n([\s\S]*?)^ {8}\};/gm;

  for (const [, nome, corpo] of types.matchAll(bloco)) {
    const colunas = new Set<string>();
    for (const linha of corpo!.split("\n")) {
      const m = /^ {10}(\w+):/.exec(linha);
      if (m) colunas.add(m[1]!);
    }
    tabelas.set(nome!, colunas);
  }
  return tabelas;
}

const noSql = colunasDaMigration();
const noTs = colunasDosTipos();
const ordenado = (s: Set<string>) => [...s].sort();

describe("database.types.ts x migration", () => {
  it("acha as duas pontas", () => {
    expect(noSql.size).toBe(7);
    expect(noTs.size).toBe(7);
  });

  it("cobre as mesmas tabelas", () => {
    expect([...noTs.keys()].sort()).toEqual([...noSql.keys()].sort());
  });

  it.each([...noSql.keys()])("%s tem as mesmas colunas", (tabela) => {
    expect(ordenado(noTs.get(tabela) ?? new Set())).toEqual(
      ordenado(noSql.get(tabela)!),
    );
  });

  it("declara todo enum criado na migration", () => {
    const criados = [...migration.matchAll(/^create type public\.(\w+) as enum/gm)]
      .map(([, nome]) => nome!)
      .sort();
    const declarados = [
      ...types
        .slice(types.indexOf("Enums: {"))
        .matchAll(/^ {6}(\w+): "/gm),
    ]
      .map(([, nome]) => nome!)
      .sort();
    expect(declarados).toEqual(criados);
  });
});
