import { aportes, membrosDoCasal, metas, usuarioAtual } from "@repo/api";
import {
  type Participante,
  pesosDaRegra,
  regraDoCasal,
  saldoDoCasal,
  sumCents,
} from "@repo/core";

import { criarClienteServidor } from "@/lib/supabase/server";

import { TelaAportes } from "./form";

export default async function Aportes() {
  const supabase = await criarClienteServidor();
  const usuario = await usuarioAtual(supabase);

  const [membros, listaMetas, listaAportes] = await Promise.all([
    membrosDoCasal(supabase),
    metas(supabase),
    aportes(supabase),
  ]);

  // Quem está ativo no casal, na forma que o core entende. A regra de divisão
  // é coluna por pessoa; quem desempata é regraDoCasal.
  const participantes: Participante[] = membros.map((membro) => ({
    userId: membro.user_id,
    papel: membro.role,
    regra: membro.split_rule,
    faixaRenda: membro.income_band,
    parteFixaCents: membro.fixed_share_cents,
  }));

  const aportadoPorPessoa: Record<string, number> = {};
  for (const aporte of listaAportes) {
    // user_id nulo é o "ex-membro" que leave_couple deixa. Ele não entra no
    // rateio, e saldoDoCasal ignora chave que não é participante.
    const chave = aporte.user_id ?? "ex-membro";
    aportadoPorPessoa[chave] = (aportadoPorPessoa[chave] ?? 0) + aporte.amount_cents;
  }

  const regra = regraDoCasal(participantes);
  const saldo = saldoDoCasal(participantes, aportadoPorPessoa, regra);
  const totalDoPlanoCents = sumCents(listaAportes.map((a) => a.amount_cents));

  // O componente não descobre sozinho se a regra dá para aplicar: ele recebe
  // pronto. Onde é null, a opção aparece desabilitada com uma explicação.
  const disponivel = {
    igual: pesosDaRegra("igual", participantes) !== null,
    proporcional: pesosDaRegra("proporcional", participantes) !== null,
    fixo: pesosDaRegra("fixo", participantes) !== null,
  };

  const eu = membros.find((membro) => membro.user_id === usuario?.id);

  const nomes: Record<string, string> = {};
  for (const membro of membros) {
    nomes[membro.user_id] =
      membro.user_id === usuario?.id
        ? "Você"
        : (membro.display_name ?? "Sua dupla");
  }

  return (
    <TelaAportes
      metas={listaMetas.map((meta) => ({
        id: meta.id,
        titulo: meta.title,
        alvoCents: meta.target_amount_cents,
      }))}
      ultimos={listaAportes.slice(0, 8).map((aporte) => ({
        id: aporte.id,
        quem: aporte.user_id ? (nomes[aporte.user_id] ?? "Ex-membro") : "Ex-membro",
        valorCents: aporte.amount_cents,
        quando: aporte.contributed_at,
      }))}
      saldo={saldo}
      nomes={nomes}
      totalDoPlanoCents={totalDoPlanoCents}
      disponivel={disponivel}
      minhaRegra={eu?.split_rule ?? "igual"}
      minhaFaixa={eu?.income_band ?? null}
      minhaParteFixaCents={eu?.fixed_share_cents ?? null}
    />
  );
}
