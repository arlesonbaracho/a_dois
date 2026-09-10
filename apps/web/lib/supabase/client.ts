import { createClient } from "@supabase/supabase-js";

import type { Database } from "@repo/api";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * Cliente do browser.
 *
 * Não usa o `createBrowserClient` do @supabase/ssr de propósito: a única função
 * dele é ler a sessão de `document.cookie`, e o nosso cookie é httpOnly — o
 * browser não enxerga, que é justamente o ponto da regra 9. A documentação do
 * próprio pacote manda cair no `createClient` nesse caso.
 *
 * O access token chega por parâmetro, vindo do Server Component, e vive só em
 * memória: nada em cookie legível, nada em localStorage. Como efeito colateral
 * bem-vindo, a opção `accessToken` desliga o namespace `auth` do supabase-js,
 * então login, cadastro e logout não têm como acontecer aqui nem por engano —
 * passam todos por Server Action.
 */
export function criarClienteBrowser(accessToken: string) {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    accessToken: async () => accessToken,
  });
}
