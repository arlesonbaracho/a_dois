"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAportes, useRegistrarAporte } from "@repo/api";
import {
  APP_NAME,
  categoriaConhecida,
  formatBRL,
  mensagemDoBanco,
  paraInstante,
  sumCents,
} from "@repo/core";

import { CHAVE_APORTE_ANOTADO } from "@/components/chuva";
import { Recado } from "@/components/form-ui";
import { IconeApagar, IconeCompartilhar, IconeFechar } from "@/components/icones";
import { Explica, PontoDePessoa } from "@/components/pecas";
import type { Fatia } from "@/components/progresso";

type Jornada = { id: string; titulo: string; categoria: string; alvoCents: number };
type Quem = { nome: string; cor: Fatia["cor"] };
type Anotado = { id: string; valorCents: number; jornadaId: string; quandoISO: string };

/** Até R$ 9.999.999,99. Mais que isso é dedo escorregando, não aporte. */
const DIGITOS_MAX = 9;
const TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "apagar"] as const;

/** A data de hoje no fuso de quem está anotando, no formato do `<input type=date>`. */
const hojeAqui = () => new Date().toLocaleDateString("sv-SE");

/**
 * Anotar um aporte.
 *
 * Um teclado grande, como quem faz um Pix: os dígitos entram pela direita e o
 * valor já é centavo inteiro desde o primeiro toque. Não existe texto para
 * interpretar — "1.234,56" nunca vira R$ 1,23, porque ninguém digita vírgula.
 *
 * Deu certo, a tela vira o comprovante.
 */
export function Anotar({
  jornadas,
  inicial,
  quem,
}: {
  jornadas: Jornada[];
  inicial: string | null;
  quem: Quem;
}) {
  const [jornadaId, setJornadaId] = useState(inicial ?? "");
  const [digitos, setDigitos] = useState("");
  // Lido uma vez: o render precisa ser puro, e "hoje" não muda durante a anotação.
  const [hoje] = useState(hojeAqui);
  const [quando, setQuando] = useState(hoje);
  const [erro, setErro] = useState("");
  const [anotado, setAnotado] = useState<Anotado | null>(null);

  const registrar = useRegistrarAporte(jornadaId);
  const valorCents = Number(digitos || "0");
  const pronto = valorCents > 0 && jornadaId !== "" && !registrar.isPending;

  function teclar(tecla: (typeof TECLAS)[number]) {
    setErro("");
    setDigitos((atual) => {
      if (tecla === "apagar") return atual.slice(0, -1);
      const novo = (atual + tecla).replace(/^0+/, "");
      return novo.length > DIGITOS_MAX ? atual : novo;
    });
  }

  async function anotar() {
    if (!pronto) return;
    setErro("");
    try {
      const quandoISO = paraInstante(quando) ?? new Date().toISOString();
      const id = await registrar.mutateAsync({ valorCents, quandoISO });
      try {
        // Só a presença da chave: a home faz chover quando a encontra.
        sessionStorage.setItem(CHAVE_APORTE_ANOTADO, "1");
      } catch {
        // Sem sessionStorage a home só não faz chover.
      }
      setAnotado({ id, valorCents, jornadaId, quandoISO });
    } catch (falha) {
      setErro(mensagemDoBanco(falha, "Não consegui anotar agora. Tenta de novo?"));
    }
  }

  // O teclado físico também vale: no computador ninguém quer clicar em dígito.
  const acoes = useRef({ anotar, teclar });
  useEffect(() => {
    acoes.current = { anotar, teclar };
  });
  useEffect(() => {
    if (anotado) return;
    function aoTeclar(evento: KeyboardEvent) {
      const alvo = evento.target as HTMLElement | null;
      if (alvo?.closest("input, select, textarea")) return;
      if (/^\d$/.test(evento.key)) acoes.current.teclar(evento.key as (typeof TECLAS)[number]);
      else if (evento.key === "Backspace") acoes.current.teclar("apagar");
      else if (evento.key === "Enter") void acoes.current.anotar();
      else return;
      evento.preventDefault();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [anotado]);

  const jornada = jornadas.find((item) => item.id === (anotado?.jornadaId ?? jornadaId));

  if (anotado && jornada) {
    return <Comprovante anotado={anotado} jornada={jornada} quem={quem} />;
  }

  return (
    // -mb-28 devolve o respiro que o layout reserva para o dock, que aqui não aparece.
    <main className="mx-auto -mb-28 flex min-h-dvh max-w-sm flex-col px-5 pb-6 pt-5 lg:mb-0">
      <header className="grid min-h-11 grid-cols-[2.75rem_1fr_2.75rem] items-center">
        <Link
          href="/"
          className="grid size-11 place-items-center rounded-full border border-borda bg-white transition hover:bg-areia active:scale-95"
        >
          <IconeFechar className="size-5" />
          <span className="sr-only">Fechar sem anotar</span>
        </Link>
        <h1 className="text-center text-[17px] font-medium">Anotar aporte</h1>
      </header>

      {jornadas.length === 0 ? (
        <div className="flex flex-1 flex-col justify-center gap-4">
          <Explica>
            Antes do primeiro aporte, criem uma jornada — é nela que o dinheiro entra.
          </Explica>
          <Link
            href="/jornadas/nova"
            className="grid h-14 place-items-center rounded-full bg-tinta text-[16px] font-medium text-creme transition hover:opacity-90 active:scale-[0.98]"
          >
            Criar uma jornada
          </Link>
        </div>
      ) : (
        <>
          <p id="para-qual" className="mb-2.5 mt-5 text-[14px] text-suave">
            Para qual jornada?
          </p>
          <div
            role="radiogroup"
            aria-labelledby="para-qual"
            className="sem-barra faixa-que-rola -mx-5 flex gap-2 overflow-x-auto px-5 py-0.5"
          >
            {jornadas.map((item) => {
              const escolhida = item.id === jornadaId;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={escolhida}
                  onClick={() => setJornadaId(item.id)}
                  className={`flex h-10 flex-none items-center gap-2 rounded-full border pl-2.5 pr-4 text-[14px] transition active:scale-95 ${
                    escolhida
                      ? "border-tinta bg-tinta text-creme"
                      : "border-borda bg-white text-tinta hover:bg-areia"
                  }`}
                >
                  <Image
                    src={`/arte/${categoriaConhecida(item.categoria) ?? "geral"}.png`}
                    alt=""
                    width={22}
                    height={22}
                    unoptimized
                  />
                  {item.titulo}
                </button>
              );
            })}
          </div>

          <div className="my-auto py-6 text-center">
            <output
              aria-label="Quanto (R$)"
              aria-live="polite"
              className={`num block text-[52px] font-medium leading-none tracking-[-0.04em] ${
                valorCents === 0 ? "text-suave" : ""
              }`}
            >
              {formatBRL(valorCents)}
            </output>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[14px] text-suave">
              <PontoDePessoa cor={quem.cor} />
              de {quem.nome} ·
              <label className="inline-flex">
                <span className="sr-only">Quando</span>
                <input
                  type="date"
                  value={quando}
                  max={hoje}
                  onChange={(evento) => setQuando(evento.target.value || hoje)}
                  // O dia de hoje no servidor pode não ser o do celular perto da
                  // meia-noite; o que vale é o do celular.
                  suppressHydrationWarning
                  className="rounded-full bg-transparent px-1 text-[14px] text-tinta underline underline-offset-4"
                />
              </label>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-x-3 gap-y-1" aria-label="Teclado" role="group">
            {TECLAS.map((tecla) => (
              <button
                key={tecla}
                type="button"
                onClick={() => teclar(tecla)}
                aria-label={tecla === "apagar" ? "Apagar" : undefined}
                className="num grid h-16 place-items-center rounded-full text-[26px] transition hover:bg-areia active:scale-95 active:bg-creme"
              >
                {tecla === "apagar" ? <IconeApagar className="size-[26px]" /> : tecla}
              </button>
            ))}
          </div>

          <p className="my-3 text-center text-[12px] text-suave">
            É uma anotação: o dinheiro não sai daqui.
          </p>
          <Recado erro={erro} />
          <button
            type="button"
            onClick={() => void anotar()}
            disabled={!pronto}
            className="mt-2 h-14 w-full rounded-full bg-tinta text-[16px] font-medium text-creme transition hover:opacity-90 active:scale-[0.98] disabled:opacity-35 disabled:active:scale-100"
          >
            {registrar.isPending
              ? "Um instante…"
              : valorCents > 0
                ? `Anotar ${formatBRL(valorCents)}`
                : "Anotar"}
          </button>
        </>
      )}
    </main>
  );
}

/**
 * O comprovante.
 *
 * Sobe da base, e o selo encaixa. Diz de volta tudo que foi gravado — quanto,
 * onde, quem, quando — e o rodapé deixa claro que é anotação: nenhum dinheiro
 * foi transferido.
 */
function Comprovante({
  anotado,
  jornada,
  quem,
}: {
  anotado: Anotado;
  jornada: Jornada;
  quem: Quem;
}) {
  const router = useRouter();
  const titulo = useRef<HTMLHeadingElement>(null);
  const { data: aportes } = useAportes(anotado.jornadaId);
  const temCents = sumCents((aportes ?? []).map((aporte) => aporte.amount_cents));
  const [copiado, setCopiado] = useState(false);

  // Quem usa leitor de tela precisa ouvir que deu certo: o foco vai ao título.
  useEffect(() => {
    titulo.current?.focus();
  }, []);

  // No celular abre a folha de compartilhar; onde ela não existe (quase todo
  // navegador de computador), copia o texto.
  function compartilhar() {
    const texto = `Anotei ${formatBRL(anotado.valorCents)} para ${jornada.titulo} no ${APP_NAME}.`;
    if (typeof navigator.share === "function") {
      void navigator.share({ text: texto }).catch(() => {
        // Fechar a folha de compartilhar não é erro.
      });
      return;
    }
    void navigator.clipboard
      .writeText(texto)
      .then(() => setCopiado(true))
      .catch(() => {});
  }

  const linhas: [string, React.ReactNode][] = [
    [
      "Quem colocou",
      <span key="quem" className="inline-flex items-center gap-1.5">
        <PontoDePessoa cor={quem.cor} />
        {quem.nome}
      </span>,
    ],
    [
      "Quando",
      new Date(anotado.quandoISO).toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    ],
    [
      "Agora vocês têm",
      jornada.alvoCents > 0
        ? `${formatBRL(temCents)} de ${formatBRL(jornada.alvoCents)}`
        : formatBRL(temCents),
    ],
    ["Código", `JRN-${anotado.id.slice(0, 4).toUpperCase()}`],
  ];

  return (
    <div className="-mb-28 min-h-dvh bg-areia lg:mb-0">
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col px-5 pb-8 pt-5">
        <Link
          href="/"
          className="grid size-11 place-items-center rounded-full border border-borda bg-white transition hover:bg-papel active:scale-95"
        >
          <IconeFechar className="size-5" />
          <span className="sr-only">Fechar</span>
        </Link>

        <section className="anima-subir mt-4 rounded-carta bg-white px-5 pb-5 pt-6 text-center shadow-carta">
          <Image
            src="/arte/comprovante.png"
            alt=""
            width={84}
            height={84}
            unoptimized
            className="anima-encaixar mx-auto drop-shadow-[0_12px_16px_rgb(7_0_1/0.14)]"
          />
          <h2 ref={titulo} tabIndex={-1} className="mt-3 text-[20px] font-medium outline-none">
            Anotado!
          </h2>
          <p className="num mt-1.5 text-[44px] font-medium leading-tight tracking-[-0.04em]">
            {formatBRL(anotado.valorCents)}
          </p>
          <p className="text-[14px] text-suave">para {jornada.titulo}</p>

          {/* O picote: dois recortes da cor do fundo e a linha tracejada. */}
          <div aria-hidden="true" className="relative -mx-5 my-4 h-9">
            <span className="absolute -left-3.5 top-1 size-7 rounded-full bg-areia" />
            <span className="absolute -right-3.5 top-1 size-7 rounded-full bg-areia" />
            <span className="absolute inset-x-6 top-[18px] border-t-2 border-dashed border-cinza/60" />
          </div>

          <dl className="text-left">
            {linhas.map(([rotulo, valor]) => (
              <div key={rotulo} className="flex justify-between gap-3 py-2 text-[14px]">
                <dt className="text-suave">{rotulo}</dt>
                <dd className="num text-right font-medium">{valor}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[12px] text-suave">
            Comprovante de anotação. Nenhum dinheiro foi transferido.
          </p>
        </section>

        <div className="mt-auto grid grid-cols-2 gap-2.5 pt-6">
          <button
            type="button"
            onClick={compartilhar}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-contorno bg-white text-[16px] transition hover:bg-papel active:scale-[0.98]"
          >
            <IconeCompartilhar className="size-5" />
            <span aria-live="polite">{copiado ? "Copiado" : "Compartilhar"}</span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="h-14 rounded-full bg-tinta text-[16px] font-medium text-creme transition hover:opacity-90 active:scale-[0.98]"
          >
            Pronto
          </button>
        </div>
      </main>
    </div>
  );
}
