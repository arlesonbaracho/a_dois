// O export em CSV.
//
// O JSON do banco é aninhado, e CSV é plano. Em vez de gerar um arquivo por
// tabela (que viraria um zip, e zip precisa de biblioteca), tudo cabe num CSV
// só no formato longo: tabela, linha, campo, valor.
//
// É CSV de verdade — abre no Excel e no LibreOffice — e aguenta o schema mudar
// sem ninguém mexer aqui, porque as colunas não são as colunas do banco.

type Registro = Record<string, unknown>;

const CABECALHO = ["tabela", "linha", "campo", "valor"];

/** Aspas dobram dentro de campo entre aspas. É a regra do RFC 4180. */
function escapar(valor: string): string {
  return `"${valor.replace(/"/g, '""')}"`;
}

function comoTexto(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "object") return JSON.stringify(valor);
  return String(valor);
}

function ehRegistro(valor: unknown): valor is Registro {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

/**
 * Achata o export inteiro num CSV no formato longo.
 *
 * Todo campo sai entre aspas, sempre: quem gera não precisa adivinhar se o
 * valor tem vírgula, aspas ou quebra de linha, e o leitor não precisa
 * adivinhar nada. CRLF entre as linhas, que é o que o RFC pede e o que o Excel
 * espera.
 */
export function paraCsv(dados: unknown): string {
  if (!ehRegistro(dados)) {
    throw new TypeError("O export precisa ser um objeto");
  }

  const linhas: string[][] = [CABECALHO];

  for (const [tabela, conteudo] of Object.entries(dados)) {
    const registros = Array.isArray(conteudo) ? conteudo : [conteudo];

    registros.forEach((registro, indice) => {
      const numero = String(indice + 1);

      if (ehRegistro(registro)) {
        for (const [campo, valor] of Object.entries(registro)) {
          linhas.push([tabela, numero, campo, comoTexto(valor)]);
        }
        return;
      }

      // Valor solto no topo (uma data, uma frase): vira uma linha em que o
      // campo tem o nome da própria chave.
      linhas.push([tabela, numero, tabela, comoTexto(registro)]);
    });
  }

  return linhas.map((linha) => linha.map(escapar).join(",")).join("\r\n");
}
