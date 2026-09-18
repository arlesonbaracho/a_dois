import { cookies } from "next/headers";

import {
  aportes,
  convitesAtivos,
  membrosDoCasal,
  meuPedido,
  metas,
  pedidosPendentes,
  urlsDasCapas,
  usuarioAtual,
} from "@repo/api";
import {
  centavosNoMes,
  coresDoCasal,
  ordemDoAlbum,
  faltaComecar,
  iniciaisDoCasal,
  ordemEstavel,
  primeirosPassos,
  progressoPercentual,
  sumCents,
} from "@repo/core";

import { COOKIE_BOAS_VINDAS } from "@/lib/boas-vindas";
import { criarClienteServidor } from "@/lib/supabase/server";

import { Inicio } from "./inicio";

export default async function Home() {
  const supabase = await criarClienteServidor();

  const usuario = await usuarioAtual(supabase);

  const [membros, listaJornadas, listaAportes, pedidos, ativos, meu] = await Promise.all([
    membrosDoCasal(supabase),
    metas(supabase),
    aportes(supabase),
    pedidosPendentes(supabase),
    convitesAtivos(supabase),
    usuario ? meuPedido(supabase, usuario.id) : Promise.resolve(null),
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
      criadaEmISO: jornada.created_at,
      prioridade: jornada.priority,
      titulo: jornada.title,
      categoria: jornada.category,
      capaUrl: jornada.cover_path ? (capas.get(jornada.cover_path) ?? null) : null,
      aportadoCents,
      alvoCents: jornada.target_amount_cents,
      percentual: progressoPercentual(aportadoCents, jornada.target_amount_cents),
      fatias,
      prazoISO: jornada.deadline_at,
    };
  });

  // Mais adiantada primeiro: num carrossel de uma por vez, abrir na jornada
  // recém-criada (0%) é abrir na que menos tem o que mostrar.
  const emOrdem = ordemDoAlbum(jornadas);

  const pessoas = ordemEstavel(
    membros.map((membro) => ({
      userId: membro.user_id,
      papel: membro.role,
      nome: membro.display_name,
    })),
  ).map((membro) => ({
    chave: membro.userId,
    nome: membro.nome ?? "",
    cor: cores.get(membro.userId) ?? ("fora" as const),
  }));

  const totalCents = sumCents(listaAportes.map((aporte) => aporte.amount_cents));

  // A faixa de renda sai da MINHA linha em membros — nenhuma consulta a mais,
  // e a do parceiro não é da minha conta aqui.
  const eu = membros.find((membro) => membro.user_id === usuario?.id);

  const passos = primeirosPassos({
    membros: membros.length,
    conviteEmAndamento: ativos.length > 0 || pedidos.length > 0,
    jornadas: listaJornadas.length,
    totalCents,
    minhaFaixa: eu?.income_band ?? null,
    pedidoEnviado: meu !== null,
  });

  // As boas-vindas são só para casal que ainda não tem nada — quem já usa o
  // app nunca as vê — e uma vez por navegador.
  const jaViu = (await cookies()).has(COOKIE_BOAS_VINDAS);
  const boasVindas = !jaViu && listaJornadas.length === 0 && totalCents === 0;

  return (
    <Inicio
      passos={faltaComecar(passos) ? passos : null}
      pessoas={pessoas}
      minhaInicial={iniciaisDoCasal([eu?.display_name ?? null])}
      boasVindas={boasVindas}
      mes={agora.toLocaleDateString("pt-BR", { month: "long" })}
      doMesCents={centavosNoMes(
        listaAportes.map((aporte) => ({
          quandoISO: aporte.contributed_at,
          cents: aporte.amount_cents,
        })),
        agora,
      )}
      jornadas={emOrdem}
      temPedido={pedidos.length > 0}
    />
  );
}
