import { FormLogin } from "./form";

// Server Component só para ler a query string: o "proxima" que o middleware
// pendura ao barrar uma rota, o "erro=link" de quem chegou por um link de
// e-mail vencido, e o "aviso" de quem acabou de sair de um plano. Assim o
// formulário não precisa de useSearchParams nem do Suspense que ele exigiria.
// A peneira contra redirect aberto está em ../actions.ts.
const AVISOS: Record<string, string> = {
  saiu: "Você saiu do plano. Seus aportes ficaram lá, agora como ex-membro.",
  apagou: "Plano apagado. Não guardamos nada dele.",
};

export default async function Login({ searchParams }: PageProps<"/login">) {
  const { proxima, erro, aviso } = await searchParams;

  return (
    <FormLogin
      proxima={typeof proxima === "string" ? proxima : "/"}
      erroInicial={erro === "link" ? "Esse link não vale mais. Peça outro." : undefined}
      avisoInicial={typeof aviso === "string" ? AVISOS[aviso] : undefined}
    />
  );
}
