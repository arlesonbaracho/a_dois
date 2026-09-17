import { membrosDoCasal, metas, usuarioAtual } from "@repo/api";
import { coresDoCasal } from "@repo/core";

import { criarClienteServidor } from "@/lib/supabase/server";

import { Anotar } from "./anotar";

export default async function NovoAporte({ searchParams }: PageProps<"/aportes/novo">) {
  const { jornada } = await searchParams;
  const supabase = await criarClienteServidor();

  const [usuario, lista, membros] = await Promise.all([
    usuarioAtual(supabase),
    metas(supabase),
    membrosDoCasal(supabase),
  ]);

  const eu = membros.find((membro) => membro.user_id === usuario?.id);
  const cores = coresDoCasal(
    membros.map((membro) => ({ userId: membro.user_id, papel: membro.role })),
  );

  // A jornada de onde a pessoa veio chega pela URL, e só vale se for uma das
  // jornadas do casal — a lista já veio filtrada pelo RLS, então conferir
  // contra ela é conferir contra o banco.
  const pedida = typeof jornada === "string" ? jornada : undefined;
  const inicial = lista.some((meta) => meta.id === pedida) ? pedida : lista[0]?.id;

  return (
    <Anotar
      // A jornada escolhida vai para a frente da faixa: numa faixa que rola,
      // a escolhida fora da vista é escolha que ninguém vê.
      jornadas={[...lista]
        .sort((a, b) => Number(b.id === inicial) - Number(a.id === inicial))
        .map((meta) => ({
        id: meta.id,
        titulo: meta.title,
        categoria: meta.category,
        alvoCents: meta.target_amount_cents,
        }))}
      inicial={inicial ?? null}
      quem={{
        nome: eu?.display_name?.trim() || "Você",
        cor: (usuario && cores.get(usuario.id)) || "pessoa-1",
      }}
    />
  );
}
