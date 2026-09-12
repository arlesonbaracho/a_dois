"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  type CorDePessoa,
  formatBRL,
  fromCents,
  type RegraDivisao,
  type Saldo,
} from "@repo/core";

import { Campo, Enviar, Escolha, Recado, type EstadoForm } from "@/components/form-ui";
import { Explica, LinhaAporte, PontoDePessoa, Secao } from "@/components/pecas";

import { acaoRegistrarAporte, acaoSalvarDivisao } from "./actions";

type Meta = { id: string; titulo: string; alvoCents: number };
type Aporte = {
  id: string;
  quem: string;
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

const dia = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

export function TelaAportes({
  metas,
  ultimos,
  saldo,
  nomes,
  cores,
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
  cores: Record<string, CorDePessoa>;
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
  const [estadoDivisao, salvarDivisao] = useActionState<EstadoForm, FormData>(
    acaoSalvarDivisao,
    {},
  );

  const deQuemSaiu = totalDoPlanoCents - saldo.totalRateadoCents;
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-5 p-5 lg:max-w-2xl lg:p-10">
      <div>
        <h1 className="text-[27px] font-bold tracking-[-0.04em] lg:text-4xl">Aportes</h1>
        <Explica className="mt-1">
          Quem colocou quanto, e como vocês combinaram de dividir.
        </Explica>
      </div>

      <Saldos saldo={saldo} nomes={nomes} cores={cores} deQuemSaiuCents={deQuemSaiu} />

      {metas.length === 0 ? (
        <p className="rounded-cartao bg-white p-4 font-corpo text-[12.5px] leading-relaxed text-corpo">
          Antes do primeiro aporte, criem uma jornada em{" "}
          <Link href="/jornadas" className="font-semibold underline">
            jornadas de vocês
          </Link>
          .
        </p>
      ) : (
        <form action={salvarAporte} className="flex flex-col gap-4">
          <Secao>Coloquei um dinheiro</Secao>

          {/* Era um <label> com <select> montado à mão bem ao lado de campos
              que vêm de form-ui — e dava para ver: o rótulo "Em qual jornada"
              saía 14px em Outfit e o "Quanto (R$)" logo abaixo saía 11.5px em
              Manrope, no mesmo formulário. */}
          <Escolha rotulo="Em qual jornada" name="meta" required>
            {metas.map((meta) => (
              <option key={meta.id} value={meta.id}>
                {meta.titulo}
              </option>
            ))}
          </Escolha>

          <Campo
            rotulo="Quanto (R$)"
            name="valor"
            type="text"
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
                  className="mt-0.5 size-4 accent-tinta"
                />
                <span>
                  <span className="block text-[13.5px] font-semibold">{modo.rotulo}</span>
                  <span className="mt-0.5 block font-corpo text-[12px] leading-relaxed text-suave-forte">
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
        <Enviar>Salvar</Enviar>
      </form>

      {ultimos.length > 0 ? (
        <section className="flex flex-col gap-2">
          <Secao>Os últimos</Secao>
          {/* A mesma linha da aba "Aportes" da jornada. Era duas colunas de
              texto pelado aqui e bloco branco com disco colorido lá — o mesmo
              fato desenhado duas vezes, e por isso desenhado diferente. */}
          <ul className="flex flex-col gap-2">
            {ultimos.map((aporte) => (
              <li key={aporte.id}>
                <LinhaAporte
                  nome={aporte.quem}
                  legenda={dia(aporte.quando)}
                  cor={aporte.cor}
                  valorCents={aporte.valorCents}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
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
    <section className="flex flex-col gap-3 rounded-cartao bg-white p-4">
      {/* h2, total, lista e frase como filhos diretos: o e2e ancora em
          heading.locator("..") e um invólucro tiraria as linhas do pai. */}
      <h2 className="text-[17px] font-bold tracking-[-0.03em]">Quanto vocês já juntaram</h2>
      <p className="-mt-2 text-[27px] font-extrabold tracking-[-0.04em] tabular-nums">
        {formatBRL(saldo.totalRateadoCents + deQuemSaiuCents)}
      </p>

      <ul className="flex flex-col gap-2 border-t border-divisa pt-3 font-corpo text-[11.5px]">
        {saldo.linhas.map((linha) => (
          <li key={linha.userId} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <PontoDePessoa cor={cores[linha.userId] ?? "fora"} />
              <span className="truncate text-suave">{nomes[linha.userId] ?? "Sua dupla"}</span>
            </span>
            <span className="font-semibold tabular-nums text-tinta">
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

      <p className="border-t border-divisa pt-3 font-corpo text-[12.5px] font-medium leading-relaxed text-corpo">
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
