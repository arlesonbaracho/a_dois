import Link from "next/link";

import { meuPedido, meuPerfil, usuarioAtual } from "@repo/api";

import { Cartao, Saida } from "@/components/form-ui";
import { criarClienteServidor } from "@/lib/supabase/server";

import { Esperando, FormConvite } from "./form";

// O token viaja na query string, então esta rota vai com Referrer-Policy:
// no-referrer (ver next.config.ts) — senão ele vazaria no Referer de qualquer
// imagem ou link que a página carregasse.
export default async function Convite({ searchParams }: PageProps<"/convite">) {
  const { t } = await searchParams;
  const token = typeof t === "string" ? t : "";

  const supabase = await criarClienteServidor();
  const usuario = await usuarioAtual(supabase);

  // Já pediu antes? Não adianta pedir de novo: é esperar.
  const pedido = usuario ? await meuPedido(supabase, usuario.id) : null;
  if (pedido) return <Esperando />;

  if (!token) {
    return (
      <Cartao
        titulo="Convite não encontrado"
        subtitulo="Esse link não tem um convite dentro. Peça outro para quem te chamou."
      >
        <Link href="/" className="self-start">
          <Saida>Voltar</Saida>
        </Link>
      </Cartao>
    );
  }

  const perfil = usuario ? await meuPerfil(supabase, usuario.id) : null;

  return <FormConvite token={token} nome={perfil?.display_name ?? ""} />;
}
