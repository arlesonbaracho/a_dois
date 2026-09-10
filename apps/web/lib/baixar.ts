/**
 * Baixar um arquivo gerado no browser. É o único lugar do projeto que precisa
 * de DOM para isso, e por isso mora em apps/web e não em packages.
 */
export function baixar(nome: string, conteudo: string, tipo: string): void {
  // O BOM é o que faz o Excel em português abrir o CSV com acento certo. Sem
  // ele, "Apê" vira "ApÃª" — e o arquivo é para a pessoa ler, não para nós.
  const bom = tipo.startsWith("text/csv") ? "\uFEFF" : "";
  const url = URL.createObjectURL(new Blob([bom + conteudo], { type: tipo }));

  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();

  URL.revokeObjectURL(url);
}

/** `a-dois-meus-dados-2026-09-10.json` */
export function nomeDoArquivo(extensao: string): string {
  return `a-dois-meus-dados-${new Date().toISOString().slice(0, 10)}.${extensao}`;
}
