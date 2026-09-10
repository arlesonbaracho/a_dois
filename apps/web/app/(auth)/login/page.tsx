import { FormLogin } from "./form";

// Server Component só para ler a query string: o "proxima" que o middleware
// pendura ao barrar uma rota, e o "erro=link" de quem chegou por um link de
// e-mail vencido. Assim o formulário não precisa de useSearchParams nem do
// Suspense que ele exigiria. A peneira contra redirect aberto está em
// ../actions.ts.
export default async function Login({ searchParams }: PageProps<"/login">) {
  const { proxima, erro } = await searchParams;

  return (
    <FormLogin
      proxima={typeof proxima === "string" ? proxima : "/"}
      erroInicial={erro === "link" ? "Esse link não vale mais. Peça outro." : undefined}
    />
  );
}
