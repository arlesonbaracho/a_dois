/**
 * A borda: onde o que vem de fora — campo de formulário, erro do banco — vira
 * valor do app. Morava em `apps/web/lib`, e o Expo da fase 2 teria que
 * reescrever cada uma destas; a do meio-dia já tinha sido reescrita à mão
 * dentro do próprio web.
 */

/** Data de calendário (`2026-09-16`) para instante.
 *
 * Meio-dia em UTC, e não meia-noite: meia-noite UTC é 21h do dia anterior no
 * Brasil, e a data escolhida no calendário andaria um dia para trás na tela.
 */
export function paraInstante(data: string): string | null {
  return data.trim() === "" ? null : `${data.trim()}T12:00:00Z`;
}

/** O contrário: instante para a data de calendário. */
export function paraCampoData(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

/**
 * Traduz um erro do Supabase em frase para a tela.
 *
 * Só passa adiante o que nós mesmos escrevemos com `raise exception` nas
 * funções SQL — P0001 é o código disso. Qualquer outro erro é do banco falando
 * consigo mesmo, e costuma carregar nome de constraint, de coluna ou trecho de
 * consulta. Isso vira `padrao`.
 */
export function mensagemDoBanco(erro: unknown, padrao: string): string {
  const e = erro as { code?: string; message?: string } | null;

  if (e?.code === "P0001" && e.message) return e.message;
  // 53400 é o que checar_limite levanta.
  if (e?.code === "53400") return "Muitas tentativas. Tenta de novo daqui a pouco.";

  return padrao;
}
