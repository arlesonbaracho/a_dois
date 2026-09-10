import { toCents } from "@repo/core";

/**
 * Reais digitados num campo viram centavos, aqui na borda, e nunca voltam a ser
 * float. Devolve null quando não dá para ler um número — vazio, letra, infinito.
 *
 * Aceita vírgula porque é assim que se escreve dinheiro em português, e o
 * `<input type="number">` do Firefox em pt-BR entrega exatamente isso.
 */
export function paraCentavos(texto: string): number | null {
  const cru = texto.trim().replace(",", ".");
  if (cru === "") return null;
  const reais = Number(cru);
  return Number.isFinite(reais) ? toCents(reais) : null;
}

/** Data de `<input type="date">` para instante.
 *
 * Meio-dia em UTC, e não meia-noite: meia-noite UTC é 21h do dia anterior no
 * Brasil, e a data escolhida no calendário andaria um dia para trás na tela.
 */
export function paraInstante(data: string): string | null {
  return data.trim() === "" ? null : `${data.trim()}T12:00:00Z`;
}

/** O contrário: instante para o valor que `<input type="date">` entende. */
export function paraCampoData(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}
