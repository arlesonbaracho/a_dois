import type { CookieOptions } from "@supabase/ssr";

function exigir(nome: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(`Falta ${nome}. Copie apps/web/.env.example para .env.local.`);
  }
  return valor;
}

// O acesso literal a process.env.NEXT_PUBLIC_* é o que o Next substitui no
// build. Guardar em variável antes de passar adiante quebraria a substituição.
export const SUPABASE_URL = exigir(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);
export const SUPABASE_ANON_KEY = exigir(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

// Regra 9, escrita uma vez só. O cookie de sessão é gravado em dois lugares —
// aqui pelo servidor e lá pelo middleware — e um httpOnly que valesse só num
// dos dois não valeria em nenhum.
//
// O padrão do @supabase/ssr é httpOnly: false, para o cliente do browser
// conseguir ler a sessão. Nós preferimos que ele não consiga; como o browser
// então fica sem sessão para ler, ele recebe o token por outro caminho — ver
// lib/supabase/client.ts.
export const OPCOES_COOKIE: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
};
