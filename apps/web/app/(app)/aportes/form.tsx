"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  type CorDePessoa,
  formatBRL,
  fromCents,
  type RegraDivisao,
  type Saldo,
} from "@repo/core";

import { Campo, Enviar, Escolha, Recado, type EstadoForm } from "@/components/form-ui";
import { Chip, Explica, LinhaAporte, PontoDePessoa, Secao } from "@/components/pecas";
import { Progresso } from "@/components/progresso";

import { acaoSalvarDivisao } from "./actions";

type Aporte = {
  id: string;
  quem: string;
  jornada: string;
  cor: CorDePessoa;
  valorCents: number;
  quando: string;
};

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
    // Cobre os dois motivos de indisponibilidade: faixa em branco, e faixa
    // preenchida com o consentimento revogado no perfil. Mencionar só o
    // primeiro deixaria quem revogou procurando um campo que já está cheio.
    oQueFalta:
      "Para dividir assim, cada um precisa escolher uma faixa de renda ali embaixo e deixar o uso dela ligado no perfil. É opcional — e a gente nunca pergunta o valor exato, só a faixa.",
  },
  {
    valor: "fixo",
    rotulo: "Um valor combinado",
    comoFunciona: "Cada um diz quanto coloca, e a conta segue essa proporção.",
    oQueFalta: "Para dividir assim, cada um precisa dizer quanto coloca.",
  },
];

/** "Hoje", "Ontem", "12 de setembro" — o dia dito como gente diz. */
function nomeDoDia(iso: string, agora: Date): string {
  const dia = new Date(iso).toDateString();
  if (dia === agora.toDateString()) return "Hoje";
  const ontem = new Date(agora);
  ontem.setDate(agora.getDate() - 1);
  if (dia === ontem.toDateString()) return "Ontem";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
}

export function TelaAportes({
  temJornada,
  mes,
  ultimos,
  saldo,
  nomes,
  cores,
  totalDoPlanoCents,
  doMesCents,
  doMesPorPessoa,
  disponivel,
  minhaRegra,
  minhaFaixa,
  minhaParteFixaCents,
}: {
  temJornada: boolean;
  mes: string;
  ultimos: Aporte[];
  saldo: Saldo;
  nomes: Record<string, string>;
  cores: Record<string, CorDePessoa>;
  totalDoPlanoCents: number;
  doMesCents: number;
  doMesPorPessoa: { chave: string; cor: CorDePessoa; cents: number }[];
  disponivel: Record<RegraDivisao, boolean>;
  minhaRegra: RegraDivisao;
  minhaFaixa: string | null;
  minhaParteFixaCents: number | null;
}) {
  const [estadoDivisao, salvarDivisao] = useActionState<EstadoForm, FormData>(
    acaoSalvarDivisao,
    {},
  );

  const deQuemSaiu = totalDoPlanoCents - saldo.totalRateadoCents;
  const [agora] = useState(() => new Date());
  // Filtro por pessoa: a chave é o nome como aparece na linha.
  const [deQuem, setDeQuem] = useState<string | null>(null);
  const contagem = new Map<string, number>();
  for (const aporte of ultimos) contagem.set(aporte.quem, (contagem.get(aporte.quem) ?? 0) + 1);
  // Os últimos, agrupados por dia, na ordem em que chegaram.
  const porDia = new Map<string, Aporte[]>();
  for (const aporte of ultimos.filter((item) => deQuem === null || item.quem === deQuem)) {
    const nome = nomeDoDia(aporte.quando, agora);
    porDia.set(nome, [...(porDia.get(nome) ?? []), aporte]);
  }

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-5 px-5 pt-5 lg:max-w-2xl lg:p-10">
      <div>
        <h1 className="text-[30px] font-medium leading-none tracking-[-0.03em]">Aportes</h1>
        <Explica className="mt-1.5">
          Quem colocou quanto, e como vocês combinaram de dividir.
        </Explica>
      </div>

      {/* O mês, com a barra de quem colocou. A barra mede a parte de cada um
          no que entrou este mês, e não contra um alvo — mês não tem alvo. */}
      <section className="rounded-cartao border border-borda bg-white px-4 pb-3.5 pt-3">
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <h2 className="text-[13px] font-normal capitalize text-suave">{mes}</h2>
          <b className="num text-[22px] font-medium tracking-[-0.02em]">{formatBRL(doMesCents)}</b>
        </div>
        <Progresso
          percentual={doMesCents > 0 ? 100 : 0}
          aportadoCents={doMesCents}
          alvoCents={0}
          fatias={doMesPorPessoa
            .filter((pessoa) => pessoa.cents > 0)
            .map((pessoa) => ({ chave: pessoa.chave, cents: pessoa.cents, cor: pessoa.cor }))}
          semLegenda
        />
        <p className="num mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-[12px] text-suave">
          {doMesPorPessoa.map((pessoa) => (
            <span key={pessoa.chave} className="flex items-center gap-1.5">
              <PontoDePessoa cor={pessoa.cor} />
              {nomes[pessoa.chave] ?? "Sua dupla"} {formatBRL(pessoa.cents)}
            </span>
          ))}
        </p>
      </section>

      {!temJornada ? (
        <p className="rounded-cartao border border-borda bg-white p-4 text-[14px] leading-relaxed text-suave">
          Antes do primeiro aporte, criem uma jornada em{" "}
          <Link href="/jornadas" className="font-medium text-tinta underline">
            jornadas de vocês
          </Link>
          .
        </p>
      ) : ultimos.length === 0 ? (
        <Explica>Nenhum aporte ainda. O + lá embaixo anota o primeiro.</Explica>
      ) : (
        /* Cada linha é um comprovante, na cor de quem colocou. */
        <section className="flex flex-col" aria-label="Os últimos aportes">
          {contagem.size > 1 ? (
            <div className="sem-barra -mx-5 flex gap-2 overflow-x-auto px-5 py-0.5 lg:mx-0 lg:px-0">
              <Chip
                rotulo="Todos"
                quantos={ultimos.length}
                ativo={deQuem === null}
                onClick={() => setDeQuem(null)}
              />
              {[...contagem].map(([quem, quantos]) => (
                <Chip
                  key={quem}
                  rotulo={quem}
                  quantos={quantos}
                  ativo={deQuem === quem}
                  onClick={() => setDeQuem(quem)}
                />
              ))}
            </div>
          ) : null}
          {[...porDia].map(([dia, doDia]) => (
            <div key={dia}>
              <h2 className="mb-1 mt-3 text-[13px] font-normal text-suave">{dia}</h2>
              <ul>
                {doDia.map((aporte) => (
                  <li key={aporte.id}>
                    <LinhaAporte
                      nome={aporte.quem}
                      acao="anotou"
                      legenda={aporte.jornada}
                      cor={aporte.cor}
                      valorCents={aporte.valorCents}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      <Saldos saldo={saldo} nomes={nomes} cores={cores} deQuemSaiuCents={deQuemSaiu} />

      <form action={salvarDivisao} className="flex flex-col gap-4">
        <div>
          <Secao>Como vocês dividem</Secao>
          <Explica className="mt-1">
            Isto muda só a conta de quanto cabia a cada um. Não mexe em nada que
            já foi colocado.
          </Explica>
        </div>

        <fieldset className="flex flex-col gap-3">
          {MODOS.map((modo) => {
            const podeUsar = disponivel[modo.valor];
            return (
              <label
                key={modo.valor}
                // Sem opacity: a opção indisponível é justamente a que precisa
                // ser LIDA, porque o texto dela explica o que fazer para
                // liberá-la. Quem sinaliza o estado é o rádio desabilitado.
                className="flex items-start gap-3"
              >
                <input
                  type="radio"
                  name="regra"
                  value={modo.valor}
                  defaultChecked={minhaRegra === modo.valor}
                  disabled={!podeUsar}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-[15px] font-medium">{modo.rotulo}</span>
                  <span className="mt-0.5 block font-corpo text-[13px] leading-relaxed text-suave-forte">
                    {podeUsar ? modo.comoFunciona : modo.oQueFalta}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <Escolha
            rotulo="Sua faixa de renda (opcional)"
            name="faixa"
            defaultValue={minhaFaixa ?? ""}
          >
            <option value="">Prefiro não dizer</option>
            {FAIXAS.map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </Escolha>
          <Explica>Só a faixa, nunca o valor exato — e só a sua dupla enxerga.</Explica>
        </div>

        <Campo
          rotulo="Quanto você combina de colocar (R$, opcional)"
          name="parte_fixa"
          type="text"
          inputMode="decimal"
          defaultValue={minhaParteFixaCents === null ? "" : fromCents(minhaParteFixaCents)}
          placeholder="0,00"
        />

        <Recado erro={estadoDivisao.erro} aviso={estadoDivisao.aviso} />
        <Enviar largo>Salvar</Enviar>
      </form>

    </main>
  );
}

function Saldos({
  saldo,
  nomes,
  cores,
  deQuemSaiuCents,
}: {
  saldo: Saldo;
  nomes: Record<string, string>;
  cores: Record<string, CorDePessoa>;
  deQuemSaiuCents: number;
}) {
  if (saldo.linhas.length === 0) return null;

  // Quem está mais adiantado. A soma das diferenças é zero, então basta olhar
  // a maior — não existe caso em que os dois estão à frente.
  const adiantada = [...saldo.linhas].sort((a, b) => b.diferencaCents - a.diferencaCents)[0];
  const emDia = saldo.linhas.every((linha) => linha.diferencaCents === 0);

  return (
    // Cartão claro: o #16170F é reservado ao pedido do parceiro, que é o único
    // momento do app que concede acesso a dado financeiro de outra pessoa. Um
    // segundo cartão escuro aqui faria o primeiro parar de significar.
    //
    // E o número deixa de ser herói: quem lidera é a frase do rodapé, que é o
    // que a pessoa veio saber. O total é referência, não troféu.
    <section className="flex flex-col gap-3 rounded-cartao border border-borda bg-white p-4">
      {/* h2, total, lista e frase como filhos diretos: o e2e ancora em
          heading.locator("..") e um invólucro tiraria as linhas do pai. */}
      <h2 className="text-[18px] font-medium tracking-[-0.03em]">Quanto vocês já juntaram</h2>
      <p className="-mt-2 text-[30px] font-medium tracking-[-0.035em] tabular-nums">
        {formatBRL(saldo.totalRateadoCents + deQuemSaiuCents)}
      </p>

      <ul className="flex flex-col gap-2 border-t border-divisa pt-3 font-corpo text-[13px]">
        {saldo.linhas.map((linha) => (
          <li key={linha.userId} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <PontoDePessoa cor={cores[linha.userId] ?? "fora"} />
              <span className="truncate text-suave">{nomes[linha.userId] ?? "Sua dupla"}</span>
            </span>
            <span className="font-medium tabular-nums text-tinta">
              {formatBRL(linha.aportadoCents)}
              {saldo.aplicavel ? (
                <span className="font-normal text-suave">
                  {" "}
                  · cabia {formatBRL(linha.devidoCents)}
                </span>
              ) : null}
            </span>
          </li>
        ))}
        {deQuemSaiuCents > 0 ? (
          <li className="flex justify-between gap-2 text-suave">
            <span>De quem já saiu do plano</span>
            <span className="tabular-nums">{formatBRL(deQuemSaiuCents)}</span>
          </li>
        ) : null}
      </ul>

      <p className="border-t border-divisa pt-3 font-corpo text-[14px] font-medium leading-relaxed text-suave-forte">
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
