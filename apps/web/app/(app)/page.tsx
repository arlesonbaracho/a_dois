import Link from "next/link";

import { pedidosPendentes, usuarioAtual } from "@repo/api";
import { APP_NAME, formatBRL, sumCents } from "@repo/core";

import { criarClienteServidor } from "@/lib/supabase/server";

import { acaoSair } from "../(auth)/actions";
import { Casal } from "./casal";

// Home ainda provisória: as telas de verdade entram nos prompts de metas e
// aportes. Por enquanto ela prova que a sessão chegou inteira nos dois lados —
// servidor e browser.
const aportes = [120000, 85000, 45000];

export default async function Home() {
  const supabase = await criarClienteServidor();
  const usuario = await usuarioAtual(supabase);
  const pedidos = await pedidosPendentes(supabase);

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">{APP_NAME}</h1>
      <p>Você entrou como {usuario?.email}.</p>
      <Casal />
      <p>Quanto vocês já juntaram: {formatBRL(sumCents(aportes))}</p>

      {/* O aviso de pedido pendente. Sem valor nenhum no texto, como manda a
          regra 10 — e aqui nem faria sentido ter. */}
      {pedidos.length > 0 ? (
        <Link
          href="/parceiro"
          className="rounded-2xl bg-orange-50 p-4 text-sm font-semibold text-orange-900"
        >
          Alguém pediu para entrar no plano de vocês. Toque para ver quem é.
        </Link>
      ) : null}

      <div className="flex gap-4 text-sm">
        <Link href="/parceiro" className="underline">
          Quem divide o plano
        </Link>
        <Link href="/perfil" className="underline">
          Seu perfil
        </Link>
      </div>

      <form action={acaoSair}>
        <button type="submit" className="text-sm underline">
          Sair
        </button>
      </form>
    </main>
  );
}
