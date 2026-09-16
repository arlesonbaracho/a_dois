"use client";

import Link from "next/link";
import { useState } from "react";

import { useCapas, useCasal, useCriarMeta, useEnviarCapa, useMeta } from "@repo/api";
import {
  CATEGORIAS,
  centavosDeTexto,
  cronograma,
  fimDoPrazo,
  formatBRL,
  METODOS,
  nomeDoRitmo,
  rotuloDaCategoria,
} from "@repo/core";

import { Campo, Enviar, Recado } from "@/components/form-ui";
import { IconeAvancar, IconeFechar } from "@/components/icones";
import { Chapa, Chip, Explica, Polaroide } from "@/components/pecas";
import { marcarPrimeiraMeta } from "@/components/pwa";
import { prepararCapa } from "@/lib/capa";

/**
 * Criar uma jornada, em dois passos.
 *
 * Antes era um formulário encostado na lateral de /jornadas: seis campos
 * empilhados, e nenhum deles respondia à pergunta que o casal realmente tem,
 * que não é "quanto custa" — é "dá pra fazer?". O passo 1 responde isso a
 * cada toque, porque o cartão verde recalcula quanto cabe por mês enquanto o
 * valor e o prazo mudam.
 */
const MINIMO = 50000; // R$ 500
const MAXIMO = 10000000; // R$ 100.000
const PASSO = 50000; // R$ 500

export function NovaJornada() {
  const criar = useCriarMeta();

  const [categoria, setCategoria] = useState<string>("casa");
  const [titulo, setTitulo] = useState("");
  const [alvoTexto, setAlvoTexto] = useState("12.000,00");
  // Método e períodos no mesmo estado: trocar de método zera a escolha de
  // tamanho na MESMA atualização, senão "52" sobreviveria a uma troca para
  // "Por mês" e viraria 52 meses.
  const [plano, setPlano] = useState({ metodo: METODOS[0], periodos: 24 });
  const [erro, setErro] = useState("");
  const [criada, setCriada] = useState<string | null>(null);

  const alvoCents = centavosDeTexto(alvoTexto) ?? 0;
  const { metodo, periodos } = plano;
  const temPrazo = metodo.opcoes.length > 0;

  // As parcelas do método escolhido. Igual devolve tudo igual; crescente e
  // decrescente devolvem a curva — e a primeira parcela é o número que decide,
  // porque é o que precisa existir no bolso já.
  const parcelas =
    temPrazo && alvoCents > 0 ? cronograma(alvoCents, metodo.forma, periodos) : [];
  const primeira = parcelas[0] ?? null;
  const ultima = parcelas[parcelas.length - 1] ?? null;
  // O nome cai no rótulo da categoria enquanto ninguém digitar o próprio.
  const nome = titulo.trim() || rotuloDaCategoria(categoria);

  async function criarJornada(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const alvo = centavosDeTexto(alvoTexto);
    if (alvo === null || alvo <= 0) {
      setErro("Escreva quanto vocês querem juntar, em reais.");
      return;
    }

    setErro("");
    try {
      const id = await criar.mutateAsync({
        titulo: nome,
        alvoCents: alvo,
        categoria,
        prazoISO: temPrazo ? fimDoPrazo(metodo.ritmo, periodos).toISOString() : null,
        prioridade: "media",
      });
      // Libera o convite de instalar o PWA.
      marcarPrimeiraMeta();
      setCriada(id);
    } catch {
      setErro("Não consegui criar agora. Tenta de novo?");
    }
  }

  if (criada) return <Pronto id={criada} nome={nome} categoria={categoria} />;

  return (
    <form
      onSubmit={criarJornada}
      className="mx-auto flex max-w-sm flex-col gap-3.5 p-5 lg:max-w-md lg:p-10"
    >
      <header className="flex items-end justify-between gap-3">
        <div>
          <span className="font-corpo text-[10.5px] text-suave">passo 1 de 2</span>
          <h1 className="text-[21px] font-semibold leading-tight tracking-[-0.03em]">
            Nova jornada
          </h1>
        </div>
        <Link
          href="/jornadas"
          className="grid size-9 flex-none place-items-center rounded-full border border-borda bg-white text-suave-forte transition active:scale-95"
        >
          <IconeFechar className="size-4" />
          <span className="sr-only">Sair sem criar</span>
        </Link>
      </header>

      <div className="flex gap-3">
        <div className="flex-1">
          <Polaroide indice={0}>
            <Chapa categoria={categoria} className="h-[86px] rounded-chapa" />
            <b className="mt-2 block truncate text-[12.5px] font-semibold leading-tight">
              {nome}
            </b>
            <span className="font-corpo text-[10.5px] text-suave">
              {temPrazo
                ? `em ${periodos} ${nomeDoRitmo(metodo.ritmo, periodos > 1)}`
                : "sem prazo"}
            </span>
          </Polaroide>
        </div>
        {/* Responde "dá pra fazer?" a cada toque no valor, no método e no
            tamanho. É a peça que o formulário antigo não tinha, e é por ela
            que a tela existe. */}
        <div className="flex flex-1 flex-col justify-center rounded-bloco bg-verde p-3.5 text-creme">
          <span className="font-corpo text-[10.5px] text-creme/90">
            {temPrazo ? "precisam guardar" : "vocês querem juntar"}
          </span>
          <b className="mt-0.5 block text-[21px] font-semibold tabular-nums tracking-[-0.035em]">
            {formatBRL(primeira ?? alvoCents)}
          </b>
          <span className="font-corpo text-[10.5px] text-creme/90">
            {!temPrazo
              ? "quando der"
              : metodo.forma === "igual"
                ? `por ${nomeDoRitmo(metodo.ritmo)}, a dois`
                : `na 1ª ${nomeDoRitmo(metodo.ritmo)}, ${
                    metodo.forma === "crescente" ? "subindo até" : "caindo até"
                  } ${formatBRL(ultima ?? 0)}`}
          </span>
        </div>
      </div>

      <span className="mt-1 font-corpo text-[10.5px] text-suave">
        o que vocês querem conquistar
      </span>
      <div className="flex flex-wrap gap-2">
        {CATEGORIAS.map((valor) => (
          <Chip
            key={valor}
            rotulo={rotuloDaCategoria(valor)}
            ativo={categoria === valor}
            onClick={() => setCategoria(valor)}
          />
        ))}
      </div>

      <Campo
        rotulo="O que vocês querem"
        name="titulo"
        maxLength={120}
        value={titulo}
        onChange={(evento) => setTitulo(evento.target.value)}
        placeholder={rotuloDaCategoria(categoria)}
        className="mt-1"
      />

      <div className="rounded-cartao border border-borda bg-white p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-corpo text-[10.5px] text-suave">quanto custa</span>
          <b className="text-[21px] font-semibold tabular-nums tracking-[-0.035em]">
            {formatBRL(alvoCents)}
          </b>
        </div>
        {/* O controle deslizante é para explorar; o campo é para acertar. Só
            o slider deixaria de fora todo valor que não cai num degrau de
            R$ 500 — e "R$ 12.450" é um alvo tão legítimo quanto os outros. */}
        <input
          type="range"
          min={MINIMO}
          max={MAXIMO}
          step={PASSO}
          value={Math.min(MAXIMO, Math.max(MINIMO, alvoCents))}
          onChange={(evento) =>
            setAlvoTexto((Number(evento.target.value) / 100).toFixed(2).replace(".", ","))
          }
          aria-label="Arrastar para escolher quanto vocês querem juntar"
          className="mt-3.5"
        />
        <div className="mt-3.5">
          <Campo
            rotulo="Quanto vocês querem juntar (R$)"
            name="alvo"
            type="text"
            inputMode="decimal"
            required
            value={alvoTexto}
            onChange={(evento) => setAlvoTexto(evento.target.value)}
            placeholder="0,00"
          />
        </div>
        <span className="mt-4 block font-corpo text-[10.5px] text-suave">como vão juntar</span>
        {/* Dois níveis: o método, e só então o tamanho dele. Um nível só
            obrigaria a listar "12 meses, 26 semanas, 52 semanas crescente…"
            numa faixa que ninguém leria até o fim. */}
        <div className="sem-barra -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
          {METODOS.map((opcao) => (
            <Chip
              key={opcao.id}
              rotulo={opcao.rotulo}
              ativo={metodo.id === opcao.id}
              onClick={() =>
                setPlano({ metodo: opcao, periodos: opcao.opcoes.at(-1) ?? 0 })
              }
            />
          ))}
        </div>
        <Explica className="mt-2">{metodo.dica}</Explica>

        {temPrazo ? (
          <div className="mt-3 flex gap-2">
            {metodo.opcoes.map((quantos) => (
              <button
                key={quantos}
                type="button"
                aria-pressed={periodos === quantos}
                onClick={() => setPlano({ metodo, periodos: quantos })}
                className={`flex-1 whitespace-nowrap rounded-full border px-1 py-2.5 text-[11.5px] font-semibold transition active:scale-95 ${
                  periodos === quantos
                    ? "border-tinta bg-tinta text-creme"
                    : "border-contorno/60 bg-white text-suave-forte hover:border-contorno"
                }`}
              >
                {quantos} {nomeDoRitmo(metodo.ritmo, quantos > 1)}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <Recado erro={erro} />

      <div className="pt-2">
        <Enviar pendente={criar.isPending} largo>
          Criar jornada
        </Enviar>
      </div>
    </form>
  );
}

/**
 * Passo 2: a jornada existe, e o que falta é o que a faz valer.
 *
 * A foto entra AQUI, e não num link para outra tela. O mundo v2 inteiro se
 * apoia nela — no cartão da home são 268px de foto contra quarenta de texto —
 * e pedir a capa três telas depois é o mesmo que não pedir. A polaroide toda é
 * o alvo: tocar em qualquer parte dela abre o seletor do aparelho.
 *
 * O envio é o mesmo caminho do detalhe: a foto é reduzida e reencodada no
 * navegador antes de subir, o que TIRA O EXIF e a coordenada de GPS junto. O
 * caminho é montado com o couple_id que o app tem em mãos, e o banco confere
 * de novo pela constraint.
 */
function Pronto({ id, nome, categoria }: { id: string; nome: string; categoria: string }) {
  const { data: jornada } = useMeta(id);
  const { data: casal } = useCasal();
  const { data: capas } = useCapas([jornada?.cover_path ?? null]);
  const enviarCapa = useEnviarCapa(id);
  const [erroCapa, setErroCapa] = useState("");

  const capaUrl = jornada?.cover_path ? (capas?.get(jornada.cover_path) ?? null) : null;

  async function trocarCapa(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    // Limpar aqui deixa escolher a MESMA foto de novo depois de um erro —
    // senão o segundo "change" não dispara.
    evento.target.value = "";
    if (!arquivo || !casal) return;

    setErroCapa("");
    try {
      const blob = await prepararCapa(arquivo);
      await enviarCapa.mutateAsync({
        coupleId: casal.id,
        blob,
        id: crypto.randomUUID(),
        anterior: jornada?.cover_path ?? null,
      });
    } catch {
      setErroCapa("Não consegui usar essa foto. Tenta outra?");
    }
  }

  const comecos: [string, string, string][] = [
    [`/jornadas/${id}`, "Adicionar o primeiro item", "com link, dá para acompanhar o preço"],
    ["/parceiro", "Chamar quem divide o plano", "ninguém entra sem você confirmar"],
  ];

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-3.5 p-5 lg:max-w-md lg:p-10">
      <header>
        <span className="font-corpo text-[10.5px] text-suave">passo 2 de 2</span>
        <h1 className="text-[21px] font-semibold leading-tight tracking-[-0.03em]">
          Jornada criada
        </h1>
      </header>

      <label className="block cursor-pointer">
        <Polaroide indice={0} className="transition-transform hover:-translate-y-1">
          <div className="relative">
            <Chapa categoria={categoria} capaUrl={capaUrl} className="h-[124px] rounded-chapa" />
            {capaUrl ? null : (
              <span className="absolute inset-0 grid place-items-center">
                <span className="rounded-full bg-papel/90 px-3.5 py-2 font-corpo text-[11.5px] font-semibold text-tinta">
                  {enviarCapa.isPending ? "Guardando a foto…" : "Escolher a foto"}
                </span>
              </span>
            )}
          </div>
          <b className="mt-2.5 block text-[13.5px] font-semibold tracking-[-0.02em]">{nome}</b>
          <span className="font-corpo text-[11px] text-suave">
            {capaUrl
              ? "toque para trocar a foto"
              : enviarCapa.isPending
                ? "guardando…"
                : "a foto que abre a jornada"}
          </span>
        </Polaroide>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Capa da jornada"
          disabled={enviarCapa.isPending || !casal}
          onChange={trocarCapa}
        />
      </label>

      <Recado erro={erroCapa} />

      <span className="mt-2 font-corpo text-[10.5px] text-suave">para começar</span>
      <ul className="flex flex-col gap-2">
        {comecos.map(([href, rotulo, dica]) => (
          <li key={rotulo}>
            <Link
              href={href}
              className="flex items-center gap-3 rounded-cartao border border-borda bg-white p-3 transition hover:border-contorno/60 active:scale-[0.99]"
            >
              <span className="min-w-0 flex-1">
                <b className="block text-[13px] font-semibold tracking-[-0.02em]">{rotulo}</b>
                <i className="block font-corpo text-[10.5px] not-italic text-suave">{dica}</i>
              </span>
              <IconeAvancar aria-hidden="true" className="size-4 flex-none text-suave" />
            </Link>
          </li>
        ))}
      </ul>

      <Explica className="mt-1">
        A jornada só aparece para quem divide o plano depois que essa pessoa
        aceitar o convite e você confirmar.
      </Explica>

      <div className="pt-2">
        <Link
          href={`/jornadas/${id}`}
          className="block rounded-full bg-verde px-5 py-4 text-center text-[13.5px] font-semibold text-creme transition hover:opacity-90 active:scale-[0.98]"
        >
          Abrir a jornada
        </Link>
      </div>
    </main>
  );
}
