"use client";

import Link from "next/link";
import { useActionState } from "react";

import { formatBRL, fromCents, type RegraDivisao, type Saldo } from "@repo/core";

import { Campo, Enviar, Recado, type EstadoForm } from "@/components/form-ui";

import { acaoCriarMeta, acaoRegistrarAporte, acaoSalvarDivisao } from "./actions";

type Meta = { id: string; titulo: string; alvoCents: number };
type Aporte = { id: string; quem: string; valorCents: number; quando: string };

const FAIXAS: [string, string][] = [
  ["ate_2_sm", "Até 2 salários mínimos"],
  ["de_2_a_5_sm", "De 2 a 5"],
  ["de_5_a_10_sm", "De 5 a 10"],
  ["acima_10_sm", "Mais de 10"],
];

// A explicação de cada modo, e o que falta quando ele não está disponível.
const MODOS: { valor: RegraDivisao; rotulo: string; comoFunciona: string; oQueFalta: string }[] = [
  {
    valor: "igual",
    rotulo: "Meio a meio",
    comoFunciona: "Cada um entra com a mesma parte.",
    oQueFalta: "",
  },
  {
    valor: "proporcional",
    rotulo: "Pela renda de cada um",
    comoFunciona: "Quem ganha mais entra com uma parte maior.",
    oQueFalta:
      "Para dividir assim, vocês dois precisam escolher uma faixa de renda ali embaixo. É opcional — e a gente nunca pergunta o valor exato, só a faixa.",
  },
  {
    valor: "fixo",
    rotulo: "Um valor combinado",
    comoFunciona: "Cada um diz quanto coloca, e a conta segue essa proporção.",
    oQueFalta: "Para dividir assim, cada um precisa dizer quanto coloca.",
  },
];

const dia = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

export function TelaAportes({
  metas,
  ultimos,
  saldo,
  nomes,
  totalDoPlanoCents,
  disponivel,
  minhaRegra,
  minhaFaixa,
  minhaParteFixaCents,
}: {
  metas: Meta[];
  ultimos: Aporte[];
  saldo: Saldo;
  nomes: Record<string, string>;
  totalDoPlanoCents: number;
  disponivel: Record<RegraDivisao, boolean>;
  minhaRegra: RegraDivisao;
  minhaFaixa: string | null;
  minhaParteFixaCents: number | null;
}) {
  const [estadoAporte, salvarAporte] = useActionState<EstadoForm, FormData>(
    acaoRegistrarAporte,
    {},
  );
  const [estadoMeta, salvarMeta] = useActionState<EstadoForm, FormData>(acaoCriarMeta, {});
  const [estadoDivisao, salvarDivisao] = useActionState<EstadoForm, FormData>(
    acaoSalvarDivisao,
    {},
  );

  const deQuemSaiu = totalDoPlanoCents - saldo.totalRateadoCents;
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">Aportes</h1>
        <p className="mt-1 text-stone-600">
          Quem colocou quanto, e como vocês combinaram de dividir.
        </p>
      </div>

      <Saldos saldo={saldo} nomes={nomes} deQuemSaiuCents={deQuemSaiu} />

      {metas.length === 0 ? (
        <p className="rounded-2xl bg-orange-50 p-4 text-sm text-orange-900">
          Antes do primeiro aporte, criem uma meta ali embaixo. Pode ser a viagem,
          a entrada do apê, ou só um &ldquo;fundo do sossego&rdquo;.
        </p>
      ) : (
        <form action={salvarAporte} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Coloquei um dinheiro</h2>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Em qual meta</span>
            <select
              name="meta"
              required
              className="rounded-xl border border-stone-300 px-3 py-2 text-base"
            >
              {metas.map((meta) => (
                <option key={meta.id} value={meta.id}>
                  {meta.titulo}
                </option>
              ))}
            </select>
          </label>

          <Campo
            rotulo="Quanto (R$)"
            name="valor"
            type="number"
            step="0.01"
            min="0.01"
            required
            inputMode="decimal"
            placeholder="0,00"
          />
          <Campo rotulo="Quando" name="quando" type="date" defaultValue={hoje} max={hoje} />

          <Recado erro={estadoAporte.erro} aviso={estadoAporte.aviso} />
          <Enviar>Anotar</Enviar>
        </form>
      )}

      <form action={salvarDivisao} className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Como vocês dividem</h2>
          <p className="text-sm text-stone-600">
            Isto muda só a conta de quanto cabia a cada um. Não mexe em nada que
            já foi colocado.
          </p>
        </div>

        <fieldset className="flex flex-col gap-3">
          {MODOS.map((modo) => {
            const podeUsar = disponivel[modo.valor];
            return (
              <label
                key={modo.valor}
                className={`flex items-start gap-3 ${podeUsar ? "" : "opacity-60"}`}
              >
                <input
                  type="radio"
                  name="regra"
                  value={modo.valor}
                  defaultChecked={minhaRegra === modo.valor}
                  disabled={!podeUsar}
                  className="mt-1 size-4"
                />
                <span>
                  <span className="block text-sm font-medium">{modo.rotulo}</span>
                  <span className="block text-sm text-stone-600">
                    {podeUsar ? modo.comoFunciona : modo.oQueFalta}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Sua faixa de renda (opcional)</span>
          <select
            name="faixa"
            defaultValue={minhaFaixa ?? ""}
            className="rounded-xl border border-stone-300 px-3 py-2 text-base"
          >
            <option value="">Prefiro não dizer</option>
            {FAIXAS.map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
          <span className="text-sm text-stone-600">
            Só a faixa, nunca o valor exato — e só a sua dupla enxerga.
          </span>
        </label>

        <Campo
          rotulo="Quanto você combina de colocar (R$, opcional)"
          name="parte_fixa"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          defaultValue={minhaParteFixaCents === null ? "" : fromCents(minhaParteFixaCents)}
          placeholder="0,00"
        />

        <Recado erro={estadoDivisao.erro} aviso={estadoDivisao.aviso} />
        <Enviar>Salvar</Enviar>
      </form>

      {ultimos.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Os últimos</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {ultimos.map((aporte) => (
              <li key={aporte.id} className="flex justify-between gap-2">
                <span>
                  {aporte.quem} · {dia(aporte.quando)}
                </span>
                <span className="font-medium">{formatBRL(aporte.valorCents)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <details className="text-sm">
        <summary className="cursor-pointer font-semibold">Criar uma meta nova</summary>
        <form action={salvarMeta} className="mt-4 flex flex-col gap-4">
          <Campo rotulo="Nome da meta" name="titulo" maxLength={120} required />
          <Campo
            rotulo="Quanto vocês querem juntar (R$)"
            name="alvo"
            type="number"
            step="0.01"
            min="0"
            required
            inputMode="decimal"
            placeholder="0,00"
          />
          <Recado erro={estadoMeta.erro} aviso={estadoMeta.aviso} />
          <Enviar>Criar meta</Enviar>
        </form>
      </details>

      <Link href="/" className="text-sm underline">
        Voltar
      </Link>
    </main>
  );
}

function Saldos({
  saldo,
  nomes,
  deQuemSaiuCents,
}: {
  saldo: Saldo;
  nomes: Record<string, string>;
  deQuemSaiuCents: number;
}) {
  if (saldo.linhas.length === 0) return null;

  // Quem está mais adiantado. A soma das diferenças é zero, então basta olhar
  // a maior — não existe caso em que os dois estão à frente.
  const adiantada = [...saldo.linhas].sort((a, b) => b.diferencaCents - a.diferencaCents)[0];
  const emDia = saldo.linhas.every((linha) => linha.diferencaCents === 0);

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-orange-50 p-4">
      <h2 className="text-lg font-semibold text-orange-900">Quanto vocês já juntaram</h2>
      <p className="text-2xl font-bold text-orange-900">
        {formatBRL(saldo.totalRateadoCents + deQuemSaiuCents)}
      </p>

      <ul className="flex flex-col gap-2 text-sm text-orange-900">
        {saldo.linhas.map((linha) => (
          <li key={linha.userId} className="flex justify-between gap-2">
            <span>{nomes[linha.userId] ?? "Sua dupla"}</span>
            <span>
              {formatBRL(linha.aportadoCents)}
              {saldo.aplicavel ? (
                <span className="text-orange-800">
                  {" "}
                  · cabia {formatBRL(linha.devidoCents)}
                </span>
              ) : null}
            </span>
          </li>
        ))}
        {deQuemSaiuCents > 0 ? (
          <li className="flex justify-between gap-2 text-orange-800">
            <span>De quem já saiu do plano</span>
            <span>{formatBRL(deQuemSaiuCents)}</span>
          </li>
        ) : null}
      </ul>

      <p className="text-sm text-orange-900">
        {!saldo.aplicavel
          ? "Escolham ali embaixo como querem dividir, e eu faço essa conta."
          : emDia
            ? "Vocês estão em dia. Nem um centavo de diferença."
            : `${nomes[adiantada.userId] ?? "Sua dupla"} colocou ${formatBRL(
                adiantada.diferencaCents,
              )} a mais até agora.`}
      </p>
    </section>
  );
}
