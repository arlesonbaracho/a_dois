// Validação de JWT para Edge Function.
//
// A regra 5 diz que toda Edge Function valida o JWT antes de qualquer lógica.
// O `verify_jwt` do config.toml já barra token inválido na porta, e mesmo assim
// isto existe: a checagem tem que estar escrita na função, e o cliente
// autenticado é necessário de qualquer forma para o insert passar por RLS.
//
// Sempre a ANON key, nunca a service role. Com anon + o Authorization de quem
// chamou, o PostgREST aplica as policies do casal daquela pessoa — que é
// exatamente o que queremos. Service role aqui seria a regra 4 pela metade:
// a chave não vazaria, mas o efeito dela sim.

import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2";

export type Sessao = { user: User; client: SupabaseClient };

export async function exigirUsuario(req: Request): Promise<Sessao | null> {
  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.toLowerCase().startsWith("bearer ")) return null;

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return null;

  const client = createClient(url, anon, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // getUser, e não decodificar o token à mão: só ele confere a assinatura e a
  // validade contra o servidor de auth.
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;

  return { user: data.user, client };
}
