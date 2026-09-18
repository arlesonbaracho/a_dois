"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent } from "react";

import { useAportes } from "@repo/api";
import { centavosNoMes, type Passo, rotuloDaCategoria } from "@repo/core";

import { BoasVindas } from "@/components/boas-vindas";
import { CHAVE_APORTE_ANOTADO, Odometro, useChuva } from "@/components/chuva";
import {
  AvataresDoCasal,
  CartaoHero,
  CartaoJornada,
  Chip,
  Explica,
  PontoDePessoa,
  campoDe,
} from "@/components/pecas";
import { DeckDeComeco, ProximoPasso } from "@/components/primeiros-passos";
import type { Fatia } from "@/components/progresso";

type Jornada = {
  id: string;
  criadaEmISO: string;
  titulo: string;
  categoria: string;
  capaUrl: string | null;
  aportadoCents: number;
  alvoCents: number;
  percentual: number;
  fatias: Fatia[];
  prazoISO: string | null;
};

type Pessoa = { chave: string; nome: string; cor: Fatia["cor"] };

const TUDO = "Tudo";
const GIRO_MS = 5000;
/** Até onde o dedo arrasta antes de a carta passar. */
const LIMIAR_PX = 90;
/** O quanto a carta de trás desce e encolhe, por camada. */
const CAMADA_PX = 17;
/** Cada carta tomba para um lado, por índice — nunca Math.random, que daria
 *  ângulo diferente no servidor e no cliente. */
const GIROS = [-2, 2.5, -1.5, 2];

/** "oi, Lucas e Ana" — e "oi, vocês" quando ninguém preencheu o nome. */
function saudacao(pessoas: Pessoa[]): string {
  const ditos = pessoas.map((pessoa) => pessoa.nome.trim()).filter(Boolean);
  if (ditos.length === 0) return "oi, vocês";
  return `oi, ${ditos.join(" e ")}`;
}

export function Inicio({
  passos,
  pessoas,
  minhaInicial,
  boasVindas,
  mes,
  doMesCents,
  jornadas,
  temPedido,
}: {
  /** Nulo quando o casal já passou dos primeiros passos. */
  passos: Passo[] | null;
  pessoas: Pessoa[];
  minhaInicial: string;
  /** Casal novo que ainda não viu a apresentação neste navegador. */
  boasVindas: boolean;
  mes: string;
  doMesCents: number;
  jornadas: Jornada[];
  temPedido: boolean;
}) {
  // Filtro e posição no mesmo estado: trocar o chip zera o deck na MESMA
  // atualização, sem efeito que escreve estado depois do render.
  const [{ filtro, indice }, setCena] = useState({ filtro: TUDO, indice: 0 });
  const setFiltro = (novo: string) => setCena({ filtro: novo, indice: 0 });
  const passar = () => setCena((antes) => ({ ...antes, indice: antes.indice + 1 }));
  // Quem arrastou uma carta assumiu o controle: o giro automático não volta.
  // É o mecanismo de parada que conteúdo em movimento precisa ter.
  const [automatico, setAutomatico] = useState(true);
  // Pausa enquanto houver foco de teclado aqui dentro — se a carta trocasse
  // com o foco num link dela, o foco cairia no vazio.
  const [comFoco, setComFoco] = useState(false);
  const [apresentando, setApresentando] = useState(boasVindas);

  const contagem = new Map<string, number>();
  for (const jornada of jornadas) {
    contagem.set(jornada.categoria, (contagem.get(jornada.categoria) ?? 0) + 1);
  }

  const visiveis =
    filtro === TUDO ? jornadas : jornadas.filter((jornada) => jornada.categoria === filtro);
  const total = visiveis.length;
  // O espaço embaixo do deck por onde as cartas de trás aparecem.
  const vao = Math.min(total - 1, 2) * CAMADA_PX;
  const atual = total > 0 ? indice % total : 0;
  const emCena = visiveis[atual];

  // A carta da frente, para o arrasto mexer nela sem re-renderizar o deck a
  // cada pixel.
  const frente = useRef<HTMLDivElement>(null);
  const arrasto = useRef<{ x: number; dx: number; id: number } | null>(null);
  const arrastou = useRef(false);

  /** Joga a carta da frente para fora e só então troca a cena. */
  function tirarDaFrente(sentido: number) {
    const carta = frente.current;
    if (!carta || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      passar();
      return;
    }
    carta.style.transition = "translate 360ms cubic-bezier(.16,1,.3,1), rotate 360ms cubic-bezier(.16,1,.3,1)";
    carta.style.translate = `${sentido * carta.offsetWidth * 1.25}px 0`;
    carta.style.rotate = `${sentido * 16}deg`;
    window.setTimeout(() => {
      carta.style.transition = "none";
      carta.style.translate = "";
      carta.style.rotate = "";
      passar();
    }, 360);
  }

  // Com uma jornada só, não há o que alternar: a carta fica parada.
  //
  // `prefers-reduced-motion` NÃO para o relógio, e isso é de propósito: a
  // regra proíbe movimento, não mudança de conteúdo. Quem pediu menos
  // movimento continua vendo as jornadas alternarem — sem o arremesso.
  useEffect(() => {
    if (!automatico || comFoco || total < 2) return;
    const relogio = setInterval(() => tirarDaFrente(-1), GIRO_MS);
    return () => clearInterval(relogio);
    // tirarDaFrente só lê refs e o setter estável do estado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [automatico, comFoco, total]);

  function pegar(evento: PointerEvent<HTMLDivElement>) {
    if (total < 2 || !frente.current) return;
    arrasto.current = { x: evento.clientX, dx: 0, id: evento.pointerId };
    arrastou.current = false;
    frente.current.style.transition = "none";
    frente.current.setPointerCapture(evento.pointerId);
  }

  function mover(evento: PointerEvent<HTMLDivElement>) {
    const gesto = arrasto.current;
    const carta = frente.current;
    if (!gesto || !carta || evento.pointerId !== gesto.id) return;
    const bruto = evento.clientX - gesto.x;
    if (Math.abs(bruto) > 6) arrastou.current = true;
    // Resistência: depois de 110px a carta segue o dedo a 40%.
    const abs = Math.abs(bruto);
    const dx = Math.sign(bruto) * (abs <= 110 ? abs : 110 + (abs - 110) * 0.4);
    carta.style.translate = `${dx}px 0`;
    carta.style.rotate = `${dx / 18}deg`;
    gesto.dx = bruto;
  }

  function soltar(evento: PointerEvent<HTMLDivElement>) {
    const gesto = arrasto.current;
    const carta = frente.current;
    if (!gesto || !carta || evento.pointerId !== gesto.id) return;
    arrasto.current = null;
    if (!arrastou.current) return;
    setAutomatico(false);
    if (Math.abs(gesto.dx) > LIMIAR_PX) {
      tirarDaFrente(Math.sign(gesto.dx));
      return;
    }
    carta.style.transition = "translate 420ms cubic-bezier(.16,1,.3,1), rotate 420ms cubic-bezier(.16,1,.3,1)";
    carta.style.translate = "";
    carta.style.rotate = "";
  }

  // ---- dinheiro que chega ----

  const { chuva, chover } = useChuva();
  const { data: vivos } = useAportes();
  const mesCard = useRef<HTMLDivElement>(null);
  const conhecidos = useRef<Set<string> | null>(null);
  const [agora] = useState(() => new Date());

  // O total do mês ao vivo: o realtime invalida `useAportes` quando a outra
  // pessoa anota, e a home deixa de mostrar o número de quando abriu.
  const doMes = vivos
    ? centavosNoMes(
        vivos.map((aporte) => ({ quandoISO: aporte.contributed_at, cents: aporte.amount_cents })),
        agora,
      )
    : doMesCents;

  useEffect(() => {
    if (!vivos) return;
    const ids = new Set(vivos.map((aporte) => aporte.id));
    const primeiraVez = conhecidos.current === null;
    const chegouOutro =
      !primeiraVez && vivos.some((aporte) => !conhecidos.current?.has(aporte.id));
    conhecidos.current = ids;

    // O aporte que esta pessoa acabou de anotar já vem na primeira carga, então
    // a marca que a tela de anotar deixou é o que diz que ele é novo.
    let chegouMeu = false;
    if (primeiraVez) {
      try {
        chegouMeu = sessionStorage.getItem(CHAVE_APORTE_ANOTADO) !== null;
        sessionStorage.removeItem(CHAVE_APORTE_ANOTADO);
      } catch {
        // Navegador sem sessionStorage (aba privada estrita): só não chove.
      }
    }

    if (!chegouOutro && !chegouMeu) return;
    chover();
    const cartao = mesCard.current;
    if (!cartao) return;
    const pulsar = window.setTimeout(() => {
      cartao.classList.remove("anima-receber");
      void cartao.offsetWidth;
      cartao.classList.add("anima-receber");
    }, 1100);
    return () => window.clearTimeout(pulsar);
  }, [vivos, chover]);

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 px-5 pt-5 lg:max-w-5xl lg:p-10">
      {chuva}
      {apresentando ? (
        <BoasVindas inicial={minhaInicial} aoTerminar={() => setApresentando(false)} />
      ) : null}

      <header className="flex flex-col gap-3">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <p className="text-[14px] text-suave">{saudacao(pessoas)}</p>
          <Link href="/perfil" className="flex-none rounded-full transition active:scale-95">
            <AvataresDoCasal pessoas={pessoas} />
            <span className="sr-only">Seu perfil</span>
          </Link>
        </div>
        <h1 className="text-[30px] font-medium leading-[1.1] tracking-[-0.03em]">Nossa jornada</h1>
      </header>

      {temPedido ? (
        <Link
          href="/parceiro"
          className="rounded-cartao bg-tinta p-4 text-[15px] font-medium text-creme transition active:scale-[0.99]"
        >
          Alguém pediu para entrar no plano de vocês. Toque para ver quem é.
        </Link>
      ) : null}

      {/* Com jornada no deck, o passo que falta vira uma linha; sem jornada,
          os passos SÃO o deck, mais abaixo. */}
      {passos && jornadas.length > 0 ? (
        <ProximoPasso passos={passos} inicial={minhaInicial} />
      ) : null}

      {jornadas.length > 1 ? (
        <div className="sem-barra -mx-5 flex gap-2 overflow-x-auto px-5 py-0.5 lg:mx-0 lg:flex-wrap lg:px-0">
          <Chip
            rotulo={TUDO}
            quantos={jornadas.length}
            ativo={filtro === TUDO}
            onClick={() => setFiltro(TUDO)}
          />
          {[...contagem].map(([categoria, quantos]) => (
            <Chip
              key={categoria}
              rotulo={rotuloDaCategoria(categoria)}
              quantos={quantos}
              ativo={filtro === categoria}
              onClick={() => setFiltro(categoria)}
            />
          ))}
        </div>
      ) : null}

      {emCena ? (
        /* No celular é o deck. No desktop o mesmo deck fica à esquerda e o resto
           do álbum abre à direita: uma carta só numa tela de 1280px deixava
           dois terços de superfície vazia. */
        <div className="lg:grid lg:grid-cols-[27rem_minmax(0,1fr)] lg:items-start lg:gap-8">
          <div className="flex flex-col gap-3">
            <div
              role="group"
              aria-roledescription="deck"
              aria-label="Jornadas de vocês"
              className="relative mt-1 touch-pan-y"
              style={{ paddingBottom: `${vao}px` }}
              onFocusCapture={() => setComFoco(true)}
              onBlurCapture={() => setComFoco(false)}
              // Um arrasto não pode terminar abrindo a jornada: o clique que o
              // navegador dispara ao soltar é engolido aqui.
              onClickCapture={(evento) => {
                if (arrastou.current) {
                  evento.preventDefault();
                  evento.stopPropagation();
                  arrastou.current = false;
                }
              }}
              onKeyDown={(evento) => {
                if (total < 2) return;
                if (evento.key === "ArrowRight" || evento.key === "ArrowLeft") {
                  evento.preventDefault();
                  setAutomatico(false);
                  tirarDaFrente(evento.key === "ArrowRight" ? -1 : 1);
                }
              }}
            >
              {visiveis.map((jornada, posicao) => {
                const camada = (posicao - atual + total) % total;
                const naFrente = camada === 0;
                const giro = GIROS[posicao % GIROS.length];
                return (
                  <div
                    key={jornada.id}
                    ref={naFrente ? frente : undefined}
                    data-frente={naFrente ? "" : undefined}
                    // `inert` tira do teclado; `aria-hidden` tira do leitor e
                    // da suíte, que ancora no papel de heading.
                    inert={!naFrente}
                    aria-hidden={!naFrente}
                    onPointerDown={naFrente ? pegar : undefined}
                    onPointerMove={naFrente ? mover : undefined}
                    onPointerUp={naFrente ? soltar : undefined}
                    onPointerCancel={naFrente ? soltar : undefined}
                    className={`rounded-carta transition-[transform,background-color,opacity] duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${
                      naFrente ? "relative" : `absolute inset-x-0 top-0 ${campoDe(jornada.categoria)}`
                    } ${camada > 2 ? "opacity-0" : ""}`}
                    style={{
                      zIndex: 10 - camada,
                      height: naFrente ? undefined : `calc(100% - ${vao}px)`,
                      transformOrigin: "50% 100%",
                      transform: naFrente
                        ? undefined
                        : `translateY(${camada * CAMADA_PX}px) scale(${1 - camada * 0.045}) rotate(${camada * giro}deg)`,
                    }}
                  >
                    <div className={naFrente ? "" : "invisible"}>
                      <CartaoHero {...jornada} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              ref={mesCard}
              className="mt-2 grid grid-cols-[1fr_auto] items-end gap-x-3 rounded-cartao border border-borda bg-white px-4 pb-3.5 pt-3"
            >
              <span className="col-span-2 text-[13px] text-suave">Guardado em {mes}</span>
              <Odometro cents={doMes} className="text-[24px] font-medium tracking-[-0.02em]" />
              <span className="flex gap-3 pb-1 text-[12px] text-suave">
                {pessoas.map((pessoa) => (
                  <span key={pessoa.chave} className="flex items-center gap-1.5">
                    <PontoDePessoa cor={pessoa.cor} />
                    {pessoa.nome.trim() || "Sem nome"}
                  </span>
                ))}
              </span>
            </div>
          </div>

          {/* O resto do álbum. Só no desktop: no celular ele é o deck, e
              repetir as mesmas jornadas embaixo desfaria a escolha. */}
          {total > 1 ? (
            <div className="mt-6 hidden grid-cols-2 gap-4 lg:mt-0 lg:grid">
              {visiveis
                .filter((jornada) => jornada.id !== emCena.id)
                .map((jornada) => (
                  <CartaoJornada key={jornada.id} {...jornada} />
                ))}
            </div>
          ) : null}
        </div>
      ) : jornadas.length > 0 ? (
        /* Filtro que não sobrou nada. Acontece quando a única jornada de uma
           categoria é apagada com o chip ainda selecionado. */
        <div className="flex flex-col items-start gap-3 py-6">
          <Explica>Nenhuma jornada nesta categoria.</Explica>
          <button
            type="button"
            onClick={() => setFiltro(TUDO)}
            className="h-11 rounded-full border border-contorno bg-white px-5 text-[14px] transition hover:bg-areia active:scale-[0.97]"
          >
            Ver todas
          </button>
        </div>
      ) : passos ? (
        <DeckDeComeco passos={passos} inicial={minhaInicial} />
      ) : (
        <div className="flex flex-col items-start gap-4 py-4">
          <p className="max-w-[22ch] text-[22px] font-medium leading-tight tracking-[-0.02em]">
            Vocês ainda não escolheram o que querem conquistar.
          </p>
          <Explica className="max-w-[40ch]">
            Começa por uma. Pode ser a viagem, a entrada do apê, ou só um fundo do
            sossego.
          </Explica>
          <Link
            href="/jornadas/nova"
            className="grid h-14 place-items-center rounded-full bg-tinta px-6 text-[16px] font-medium text-creme transition hover:opacity-90 active:scale-[0.97]"
          >
            Criar a primeira
          </Link>
        </div>
      )}
    </main>
  );
}
