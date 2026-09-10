import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { criarClienteServidor } from "@/lib/supabase/server";

// Onde os links dos e-mails caem: confirmação de cadastro e troca de senha.
//
// Trocamos o token_hash por uma sessão aqui no servidor, o único lugar capaz
// de gravar um cookie httpOnly. O fluxo padrão da Supabase devolve os tokens no
// fragmento da URL, que só JavaScript lê — incompatível com a regra 9. Os
// templates que apontam para cá estão em supabase/templates/.
//
// O redirect vem de next/navigation, e não um NextResponse novo, para que os
// cookies gravados logo acima sigam junto na resposta.
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const tipo = request.nextUrl.searchParams.get("type") as EmailOtpType | null;

  let destino = "/login?erro=link";

  if (tokenHash && tipo) {
    const supabase = await criarClienteServidor();
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    if (!error) destino = tipo === "recovery" ? "/nova-senha" : "/";
  }

  redirect(destino);
}
