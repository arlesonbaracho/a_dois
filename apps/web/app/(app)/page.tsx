import {
  aportes,
  membrosDoCasal,
  metas,
  pedidosPendentes,
  urlsDasCapas,
} from "@repo/api";
import {
  centavosNoMes,
  coresDoCasal,
  iniciaisDoCasal,
  mesPorExtenso,
  ordemEstavel,
  progressoPercentual,
  sumCents,
} from "@repo/core";

import { criarClienteServidor } from "@/lib/supabase/server";

import { Inicio } from "./inicio";

export default async function Home() {
  const supabase = await criarClienteServidor();

  const [membros, listaJornadas, listaAportes, pedidos] = await Promise.all([
    membrosDoCasal(supabase),
    metas(supabase),
    aportes(supabase),
    pedidosPendentes(supabase),
  ]);

  const cores = coresDoCasal(
    membros.map((membro) => ({ userId: membro.user_id, papel: membro.role })),
  );

  // Uma passada só pelos aportes: o total de cada jornada e o de cada pessoa
  // dentro dela saem daqui. Uma consulta por linha da lista seria o caminho
  // óbvio e o errado.
  const porJornada = new Map<string, Map<string, number>>();
  for (const aporte of listaAportes) {
    const dentro = porJornada.get(aporte.goal_id) ?? new Map<string, number>();
    const chave = aporte.user_id ?? "fora";
    dentro.set(chave, (dentro.get(chave) ?? 0) + aporte.amount_cents);
    porJornada.set(aporte.goal_id, dentro);
  }

  // As capas da tela inteira numa chamada só. Aqui é Server Component, então
  // a assinatura sai no mesmo render que busca as jornadas — sem ida e volta
  // extra do navegador.
  const capas = await urlsDasCapas(
    supabase,
    listaJornadas.map((jornada) => jornada.cover_path),
  );

  const agora = new Date();

  const jornadas = listaJornadas.map((jornada) => {
    const dentro = porJornada.get(jornada.id) ?? new Map<string, number>();
    const aportadoCents = sumCents([...dentro.values()]);

    // A ordem das fatias é a ordem estável dos membros, sempre — senão a barra
    // trocaria de cor conforme quem aportou primeiro.
    const fatias = ordemEstavel(
      membros.map((membro) => ({ userId: membro.user_id, papel: membro.role })),
    )
      .map((membro) => ({
        chave: membro.userId,
        cents: dentro.get(membro.userId) ?? 0,
        cor: cores.get(membro.userId) ?? ("fora" as const),
      }))
      .concat(
        dentro.has("fora")
          ? [{ chave: "fora", cents: dentro.get("fora") ?? 0, cor: "fora" as const }]
          : [],
      )
      .filter((fatia) => fatia.cents > 0);

    return {
      id: jornada.id,
      titulo: jornada.title,
      categoria: jornada.category,
      capaUrl: jornada.cover_path ? (capas.get(jornada.cover_path) ?? null) : null,
      aportadoCents,
      alvoCents: jornada.target_amount_cents,
      percentual: progressoPercentual(aportadoCents, jornada.target_amount_cents),
      fatias,
    };
  });

  const nomes = ordemEstavel(
    membros.map((membro) => ({
      userId: membro.user_id,
      papel: membro.role,
      nome: membro.display_name,
    })),
  ).map((membro) => membro.nome);

  const doMesPorPessoa = ordemEstavel(
    membros.map((membro) => ({ userId: membro.user_id, papel: membro.role })),
  ).map((membro) => ({
    chave: membro.userId,
    cents: centavosNoMes(
      listaAportes
        .filter((aporte) => aporte.user_id === membro.userId)
        .map((aporte) => ({ quandoISO: aporte.contributed_at, cents: aporte.amount_cents })),
      agora,
    ),
  }));

  // Quanto cada pessoa colocou no plano inteiro. Vai para a coluna da direita
  // no desktop, que antes terminava um terço da tela acima do álbum.
  const totalPorPessoa = new Map<string, number>();
  for (const aporte of listaAportes) {
    const chave = aporte.user_id ?? "fora";
    totalPorPessoa.set(chave, (totalPorPessoa.get(chave) ?? 0) + aporte.amount_cents);
  }

  const porPessoa = ordemEstavel(
    membros.map((membro) => ({
      userId: membro.user_id,
      papel: membro.role,
      nome: membro.display_name,
    })),
  ).map((membro) => ({
    chave: membro.userId,
    nome: membro.nome,
    cents: totalPorPessoa.get(membro.userId) ?? 0,
    cor: cores.get(membro.userId) ?? ("fora" as const),
  }));

  return (
    <Inicio
      porPessoa={porPessoa}
      nomes={nomes}
      iniciais={iniciaisDoCasal(nomes)}
      mes={mesPorExtenso(agora)}
      totalCents={sumCents(listaAportes.map((aporte) => aporte.amount_cents))}
      doMesCents={centavosNoMes(
        listaAportes.map((aporte) => ({
          quandoISO: aporte.contributed_at,
          cents: aporte.amount_cents,
        })),
        agora,
      )}
      doMesPorPessoa={doMesPorPessoa}
      jornadas={jornadas}
      temPedido={pedidos.length > 0}
    />
  );
}
