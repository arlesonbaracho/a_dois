import { APP_NAME, formatBRL, sumCents } from "@repo/core";
import { usuarioAtual } from "@repo/api";

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

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">{APP_NAME}</h1>
      <p>Você entrou como {usuario?.email}.</p>
      <Casal />
      <p>Quanto vocês já juntaram: {formatBRL(sumCents(aportes))}</p>

      <form action={acaoSair}>
        <button type="submit" className="text-sm underline">
          Sair
        </button>
      </form>
    </main>
  );
}
