import Link from "next/link";

import { aportes, pedidosPendentes, usuarioAtual } from "@repo/api";
import { APP_NAME, formatBRL, sumCents } from "@repo/core";

import { criarClienteServidor } from "@/lib/supabase/server";

import { acaoSair } from "../(auth)/actions";
import { Casal } from "./casal";

// Home ainda provisória: a tela de metas entra no prompt 7. O número aqui,
// porém, já é o de verdade — vem de contributions.
export default async function Home() {
  const supabase = await criarClienteServidor();
  const usuario = await usuarioAtual(supabase);
  const [pedidos, listaAportes] = await Promise.all([
    pedidosPendentes(supabase),
    aportes(supabase),
  ]);

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">{APP_NAME}</h1>
      <p>Você entrou como {usuario?.email}.</p>
      <Casal />
      <p>
        Quanto vocês já juntaram:{" "}
        {formatBRL(sumCents(listaAportes.map((aporte) => aporte.amount_cents)))}
      </p>

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
        <Link href="/metas" className="underline">
          Metas
        </Link>
        <Link href="/parceiro" className="underline">
          Quem divide o plano
        </Link>
        <Link href="/aportes" className="underline">
          Aportes
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
