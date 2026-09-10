import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { OPCOES_COOKIE, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

// Negação padrão: toda rota exige sessão, menos as listadas aqui.
//
// A alternativa seria listar as rotas protegidas, mas app/(app) é route group
// e não aparece na URL — a lista viraria algo que alguém esquece de atualizar
// ao criar uma tela nova, e o esquecimento publicaria a tela. Esta lista falha
// para o outro lado: esquecer de incluir uma rota pública só pede login demais.
const PUBLICAS = ["/login", "/cadastro", "/recuperar-senha", "/nova-senha", "/auth", "/offline"];

// Dessas, as que não fazem sentido para quem já está dentro. /nova-senha fica
// de fora: chega-se nela justamente com uma sessão de recuperação no bolso.
const SO_DESLOGADO = ["/login", "/cadastro", "/recuperar-senha"];

const casa = (caminho: string, lista: string[]) =>
  lista.some((rota) => caminho === rota || caminho.startsWith(`${rota}/`));

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: OPCOES_COOKIE,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (paraGravar, headers) => {
        for (const { name, value, options } of paraGravar) {
          response.cookies.set(name, value, options);
        }
        // Resposta que grava cookie de sessão não pode ser cacheada por CDN,
        // sob pena de servir a sessão de uma pessoa para outra.
        for (const [nome, valor] of Object.entries(headers)) {
          response.headers.set(nome, valor);
        }
      },
    },
  });

  // getUser, e não getSession: é a chamada que confere o token com o servidor
  // de auth e renova o access token quando ele venceu. É por isso que o
  // middleware existe.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !casa(pathname, PUBLICAS)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("proxima", pathname);
    return NextResponse.redirect(login);
  }

  if (user && casa(pathname, SO_DESLOGADO)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Fora daqui: estáticos do Next e os arquivos do shell do PWA, que o
    // service worker busca sem cookie e não podem cair em redirect de login.
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|icon-.*\\.png).*)",
  ],
};
