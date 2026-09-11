import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { criarClienteServidor } from "@/lib/supabase/server";

// Onde os links dos e-mails caem: confirmação de cadastro e troca de senha.
//
// Sempre no servidor, o único lugar capaz de gravar um cookie httpOnly. Nenhum
// dos dois caminhos abaixo devolve token no fragmento da URL, que só
// JavaScript lê — isso é a regra 9.
//
// Dois caminhos porque existem dois templates de e-mail, e qual chega depende
// do ambiente:
//
//   token_hash  templates nossos (supabase/templates/), usados no local via
//               config.toml. Não amarra a navegador nenhum: confirma do
//               celular um cadastro feito no computador.
//   code        template PADRÃO da Supabase, que é o que produção manda
//               enquanto não houver SMTP próprio — o painel só libera editar
//               template com remetente próprio configurado. O link passa por
//               /auth/v1/verify, que redireciona para cá com ?code= na query
//               (medido, não deduzido: ver o plano de 2026-09-11).
//
// O caminho do code é PKCE, e o preço está aqui: o código só vale junto do
// cookie code_verifier gravado no cadastro. Quem abre o e-mail em OUTRO
// navegador não confirma. É por isso que o ramo do token_hash continua de pé —
// no dia em que os templates próprios subirem, ele volta a ser o caminho e esta
// limitação some sem tocar em código.
//
// O redirect vem de next/navigation, e não um NextResponse novo, para que os
// cookies gravados logo acima sigam junto na resposta.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const tipo = request.nextUrl.searchParams.get("type") as EmailOtpType | null;

  // Começa recusando: qualquer saída que não seja sucesso explícito cai aqui.
  let destino = "/login?erro=link";

  if (code) {
    const supabase = await criarClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) destino = tipo === "recovery" ? "/nova-senha" : "/";
  } else if (tokenHash && tipo) {
    const supabase = await criarClienteServidor();
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    if (!error) destino = tipo === "recovery" ? "/nova-senha" : "/";
  }

  redirect(destino);
}
