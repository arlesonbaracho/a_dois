import { aportes, membrosDoCasal, metas, meuCasal, perfisDoCasal, usuarioAtual } from "@repo/api";
import {
  centavosNoMes,
  type CorDePessoa,
  coresDoCasal,
  type Participante,
  pesosDaRegra,
  saldoDoCasal,
  sumCents,
} from "@repo/core";

import { criarClienteServidor } from "@/lib/supabase/server";

import { TelaAportes } from "./form";

export default async function Aportes() {
  const supabase = await criarClienteServidor();
  const usuario = await usuarioAtual(supabase);

  const [membros, listaMetas, listaAportes, perfis, casal] = await Promise.all([
    membrosDoCasal(supabase),
    metas(supabase),
    aportes(supabase),
    perfisDoCasal(supabase),
    meuCasal(supabase),
  ]);

  // O consentimento com o uso da faixa mora no perfil de cada pessoa. Sem ele,
  // pesosDaRegra trata a faixa como se não existisse — que é como revogar
  // deixa de quebrar o app.
  const consentiuFaixa = new Map(
    perfis.map((perfil) => [perfil.user_id, perfil.consent_income_band_at !== null]),
  );

  // Quem está ativo no casal, na forma que o core entende. A regra não vem
  // daqui: ela é do casal, e chega por parâmetro logo abaixo.
  const participantes: Participante[] = membros.map((membro) => ({
    userId: membro.user_id,
    faixaRenda: membro.income_band,
    usoDaFaixaConsentido: consentiuFaixa.get(membro.user_id) ?? false,
    parteFixaCents: membro.fixed_share_cents,
  }));

  const aportadoPorPessoa: Record<string, number> = {};
  for (const aporte of listaAportes) {
    // user_id nulo é o "ex-membro" que leave_couple deixa. Ele não entra no
    // rateio, e saldoDoCasal ignora chave que não é participante.
    const chave = aporte.user_id ?? "ex-membro";
    aportadoPorPessoa[chave] = (aportadoPorPessoa[chave] ?? 0) + aporte.amount_cents;
  }

  const regra = casal?.split_rule ?? "igual";
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

  // A mesma cor que a pessoa tem na home e na jornada. Vem de coresDoCasal, e
  // nunca do índice do array da tela: verde tem que ser a MESMA pessoa em todo
  // lugar, senão nenhuma barra bicolor do app quer dizer nada.
  const cores = coresDoCasal(
    membros.map((membro) => ({ userId: membro.user_id, papel: membro.role })),
  );
  const corDe = (userId: string | null): CorDePessoa =>
    userId ? (cores.get(userId) ?? "fora") : "fora";

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
        cor: corDe(aporte.user_id),
        valorCents: aporte.amount_cents,
        quando: aporte.contributed_at,
      }))}
      saldo={saldo}
      nomes={nomes}
      cores={Object.fromEntries(membros.map((m) => [m.user_id, corDe(m.user_id)]))}
      totalDoPlanoCents={totalDoPlanoCents}
      doMesCents={centavosNoMes(
        listaAportes.map((aporte) => ({
          quandoISO: aporte.contributed_at,
          cents: aporte.amount_cents,
        })),
        new Date(),
      )}
      disponivel={disponivel}
      minhaRegra={regra}
      minhaFaixa={eu?.income_band ?? null}
      minhaParteFixaCents={eu?.fixed_share_cents ?? null}
    />
  );
}
