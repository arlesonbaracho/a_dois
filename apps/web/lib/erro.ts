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
