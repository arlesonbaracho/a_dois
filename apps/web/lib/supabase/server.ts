import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@repo/api";

import { OPCOES_COOKIE, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * Cliente para Server Components, Route Handlers e Server Actions.
 *
 * Um por requisição, sempre. Reaproveitar entre requisições misturaria a
 * sessão de duas pessoas.
 */
export async function criarClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: OPCOES_COOKIE,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (paraGravar) => {
        try {
          for (const { name, value, options } of paraGravar) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component não pode gravar cookie, e tudo bem: o middleware
          // já renovou a sessão antes de a página começar a renderizar.
        }
      },
    },
  });
}
