import { centavosDeTexto } from "@repo/core";

/**
 * Reais digitados num campo viram centavos, aqui na borda, e nunca voltam a ser
 * float. A regra de leitura mora em `@repo/core`, testada, porque ela é a mesma
 * no web e no Expo da fase 2 — e porque errar nela devolve valor mil vezes
 * menor sem nenhum erro na tela.
 */
export const paraCentavos = centavosDeTexto;

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
