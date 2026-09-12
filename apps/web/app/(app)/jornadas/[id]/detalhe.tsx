"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  type Prioridade,
  useAportes,
  useApagarItem,
  useApagarMeta,
  useCapas,
  useCasal,
  useCriarItem,
  useEnviarCapa,
  useItens,
  useMembros,
  useMeta,
  useRegistrarAporte,
  useSalvarItem,
  useSalvarMeta,
} from "@repo/api";
import {
  coresDoCasal,
  formatBRL,
  iniciaisDoCasal,
  ordemEstavel,
  parcelaMensalCents,
  progressoPercentual,
  rotuloDaCategoria,
  sumCents,
} from "@repo/core";

import { EsqueletoJornada } from "@/components/esqueleto";
import { Campo, Enviar, Escolha, Perigo, Recado } from "@/components/form-ui";
import { IconeVoltar } from "@/components/icones";
import {
  Bloco,
  Chapa,
  Chip,
  CartaoLimao,
  DiscoDePessoa,
  Explica,
  LinhaAporte,
  Polaroide,
  Secao,
} from "@/components/pecas";
import { Progresso, type Fatia } from "@/components/progresso";
import { prepararCapa } from "@/lib/capa";
import { paraCampoData, paraCentavos, paraInstante } from "@/lib/dinheiro";

import { PRIORIDADES } from "../lista";

const dia = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");
const ABAS = ["Itens", "Aportes", "Quem colocou"] as const;
type Aba = (typeof ABAS)[number];

export function Detalhe({ goalId }: { goalId: string }) {
  const router = useRouter();

  const { data: jornada, isPending, isError } = useMeta(goalId);
  const { data: itens } = useItens(goalId);
  const { data: aportes } = useAportes(goalId);
  const { data: membros } = useMembros();
  const { data: casal } = useCasal();
  const { data: capas } = useCapas([jornada?.cover_path ?? null]);

  const salvarJornada = useSalvarMeta(goalId);
  const enviarCapa = useEnviarCapa(goalId);
  const apagarJornada = useApagarMeta(goalId);
  const criarItem = useCriarItem(goalId);
  const salvarItem = useSalvarItem(goalId);
  const apagarItem = useApagarItem(goalId);
  const registrarAporte = useRegistrarAporte(goalId);

  const [erro, setErro] = useState("");
  const [erroCapa, setErroCapa] = useState("");
  const [avisoApagar, setAvisoApagar] = useState("");
  const [aba, setAba] = useState<Aba>("Itens");
  // Inicializador de estado, e não `Date.now()` solto: o render precisa ser
  // puro, e o instante precisa ser o mesmo em toda re-renderização.
  const [agora] = useState(() => new Date());

  if (isError) return <Aviso texto="Não consegui carregar essa jornada agora." />;
  if (isPending) {
    return (
      <main className="mx-auto max-w-sm p-5 lg:max-w-3xl lg:p-10">
        <EsqueletoJornada />
      </main>
    );
  }
  if (!jornada) return <Aviso texto="Essa jornada não existe mais." />;

  const aportadoCents = sumCents((aportes ?? []).map((a) => a.amount_cents));
  const percentual = progressoPercentual(aportadoCents, jornada.target_amount_cents);
  const faltamCents = Math.max(0, jornada.target_amount_cents - aportadoCents);

  // Quanto ainda cabe por mês até o prazo. Repetir aqui o total já aportado,
  // que a barra acima diz por extenso, não acrescentaria nada.
  const porMesCents = parcelaMensalCents(faltamCents, jornada.deadline_at, agora);

  const pessoas = (membros ?? []).map((m) => ({ userId: m.user_id, papel: m.role }));
  const cores = coresDoCasal(pessoas);
  const nomePor = new Map((membros ?? []).map((m) => [m.user_id, m.display_name]));

  const porPessoa = new Map<string, number>();
  for (const aporte of aportes ?? []) {
    const chave = aporte.user_id ?? "fora";
    porPessoa.set(chave, (porPessoa.get(chave) ?? 0) + aporte.amount_cents);
  }

  const fatias: Fatia[] = [
    ...ordemEstavel(pessoas).map((p) => ({
      chave: p.userId,
      cents: porPessoa.get(p.userId) ?? 0,
      cor: cores.get(p.userId) ?? ("fora" as const),
    })),
    ...(porPessoa.has("fora")
      ? [{ chave: "fora", cents: porPessoa.get("fora") ?? 0, cor: "fora" as const }]
      : []),
  ].filter((fatia) => fatia.cents > 0);

  const comprados = (itens ?? []).filter((item) => item.status === "comprado").length;

  async function comErro(acao: () => Promise<unknown>, frase: string) {
    setErro("");
    try {
      await acao();
    } catch {
      setErro(frase);
    }
  }

  /**
   * Trocar a capa.
   *
   * O caminho é montado com o couple_id que o app já tem em mãos, e o banco
   * confere de novo: a constraint `goals_cover_path_do_nosso_bucket` compara o
   * caminho contra o couple_id e o id da própria linha. Não existe forma de
   * esta tela gravar um endereço de fora, mesmo que alguém tentasse.
   */
  async function trocarCapa(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    // O input guarda o arquivo escolhido; limpar aqui deixa escolher a MESMA
    // foto de novo depois de um erro — senão o segundo "change" não dispara.
    evento.target.value = "";
    // `jornada` já foi conferida acima, mas esta função é declarada no corpo do
    // componente e o TypeScript não carrega a checagem para dentro dela — e
    // ele tem razão: quem chama é o navegador, depois.
    if (!arquivo || !casal || !jornada) return;

    setErroCapa("");
    try {
      const blob = await prepararCapa(arquivo);
      await enviarCapa.mutateAsync({
        coupleId: casal.id,
        blob,
        id: crypto.randomUUID(),
        anterior: jornada.cover_path,
      });
    } catch {
      setErroCapa("Não consegui usar essa foto. Tenta outra?");
    }
  }

  async function editarJornada(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = new FormData(evento.currentTarget);
    const campo = (nome: string) => String(form.get(nome) ?? "").trim();

    const alvo = paraCentavos(campo("alvo"));
    if (alvo === null) {
      setErro("Escreva quanto vocês querem juntar, em reais.");
      return;
    }

    await comErro(
      () =>
        salvarJornada.mutateAsync({
          titulo: campo("titulo"),
          alvoCents: alvo,
          categoria: campo("categoria") || "geral",
          prazoISO: paraInstante(campo("prazo")),
          prioridade: campo("prioridade") as Prioridade,
        }),
      "Não consegui salvar agora. Tenta de novo?",
    );
  }

  async function adicionarItem(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const form = new FormData(formulario);
    const campo = (nome: string) => String(form.get(nome) ?? "").trim();

    await comErro(async () => {
      await criarItem.mutateAsync({
        nome: campo("nome"),
        precoCents: paraCentavos(campo("preco")),
        url: campo("url") || null,
      });
      formulario.reset();
    }, "Não consegui adicionar. O link precisa começar com http ou https.");
  }

  async function adicionarAporte(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const form = new FormData(formulario);
    const valor = paraCentavos(String(form.get("valor") ?? ""));

    if (valor === null) {
      setErro("Escreva quanto você colocou, em reais.");
      return;
    }

    await comErro(async () => {
      await registrarAporte.mutateAsync({
        valorCents: valor,
        quandoISO: paraInstante(String(form.get("quando") ?? "")) ?? undefined,
      });
      formulario.reset();
    }, "Não consegui registrar agora. Tenta de novo?");
  }

  // Dois cliques, e o primeiro só explica. O banco é quem decide: sem aporte
  // dentro, ele apaga de primeira e nem chega a pedir confirmação.
  async function tentarApagar() {
    await comErro(async () => {
      const resultado = await apagarJornada.mutateAsync(avisoApagar !== "");
      if (resultado === "precisa_confirmar") {
        setAvisoApagar(
          "Essa jornada já tem dinheiro dentro. Apagar leva o histórico dos aportes junto. Toque de novo para confirmar.",
        );
        return;
      }
      router.push("/jornadas");
    }, "Não consegui apagar agora. Tenta de novo?");
  }

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-3.5 p-5 lg:max-w-3xl lg:p-10">
      <header className="flex items-center gap-2.5">
        <Link
          href="/jornadas"
          className="grid size-9 flex-none place-items-center rounded-full bg-white text-tinta"
        >
          <IconeVoltar className="size-4" />
          <span className="sr-only">Voltar para as jornadas</span>
        </Link>
        {/* Sem kicker: a linha pequena vai ABAIXO do título. Rótulo acima de
            cabeçalho é proibido pelo piso de craft, e a categoria já aparece
            no material da chapa. */}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[22px] font-bold leading-tight tracking-[-0.03em] lg:text-3xl">
            {jornada.title}
          </h1>
          <p className="mt-0.5 font-corpo text-[10.5px] text-suave">
            {rotuloDaCategoria(jornada.category)}
            {jornada.deadline_at ? <> · para {dia(jornada.deadline_at)}</> : null}
          </p>
        </div>
        {itens && itens.length > 0 ? (
          <span className="flex-none rounded-full bg-tinta px-2.5 py-1.5 font-corpo text-[10.5px] font-bold text-limao">
            {comprados}/{itens.length} ok
          </span>
        ) : null}
      </header>

      <div className="flex gap-3">
        <div className="flex-1">
          <Polaroide indice={1}>
            <Chapa
              categoria={jornada.category}
              capaUrl={jornada.cover_path ? capas?.get(jornada.cover_path) : null}
              className="h-20"
            />
            <div className="mt-2">
              <Progresso
                percentual={percentual}
                aportadoCents={aportadoCents}
                alvoCents={jornada.target_amount_cents}
                fatias={fatias}
              />
            </div>
          </Polaroide>

          {/* O input fica escondido e o label é o botão: o controle nativo tem
              rótulo associado de verdade (é o mesmo elemento), então continua
              alcançável por teclado e por leitor de tela — e a suíte e2e o
              encontra por getByLabel, que aqui é contrato. */}
          <label className="mt-2 block cursor-pointer rounded-full border border-tinta/15 bg-white px-3 py-1.5 text-center font-corpo text-[11.5px] text-suave-forte transition-colors hover:border-tinta/30 has-[:focus-visible]:border-tinta">
            {enviarCapa.isPending
              ? "Guardando a foto…"
              : jornada.cover_path
                ? "Trocar a foto"
                : "Pôr uma foto"}
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
        </div>
        <div className="flex flex-1 flex-col gap-2.5">
          <CartaoLimao
            rotulo="faltam"
            valorCents={faltamCents}
            className="flex flex-1 flex-col justify-center"
          />
          {porMesCents === null ? null : (
            <div className="flex flex-1 flex-col justify-center rounded-bloco bg-white p-3">
              <span className="font-corpo text-[10.5px] text-suave">por mês, a dois</span>
              <b className="block text-[17px] font-bold tracking-[-0.03em] tabular-nums">
                {formatBRL(porMesCents)}
              </b>
            </div>
          )}
        </div>
      </div>

      <Recado erro={erro} />

      <div className="flex gap-1.5">
        {ABAS.map((nome) => (
          <Chip key={nome} rotulo={nome} ativo={aba === nome} onClick={() => setAba(nome)} />
        ))}
      </div>

      {aba === "Itens" ? (
        <section className="flex flex-col gap-3">
          {itens && itens.length > 0 ? (
            <ul className="flex flex-col gap-2.5">
              {itens.map((item, indice) => {
                const comprado = item.status === "comprado";
                return (
                  <li key={item.id}>
                    <Polaroide indice={indice} endireitada={comprado} sutil className="!p-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={comprado}
                          onChange={(evento) =>
                            void comErro(
                              () =>
                                salvarItem.mutateAsync({
                                  itemId: item.id,
                                  status: evento.target.checked ? "comprado" : "desejado",
                                }),
                              "Não consegui salvar agora. Tenta de novo?",
                            )
                          }
                          className="size-4 flex-none accent-tinta"
                          aria-label={`Marcar ${item.name} como comprado`}
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-[13.5px] font-semibold tracking-[-0.02em] ${
                              comprado ? "text-suave line-through" : ""
                            }`}
                          >
                            {item.name}
                          </span>
                          <span className="block font-corpo text-[10.5px] text-suave">
                            {item.estimated_price_cents === null
                              ? "sem preço ainda"
                              : formatBRL(item.estimated_price_cents)}
                            {item.url ? (
                              <>
                                {" · "}
                                {/* noreferrer para a loja não descobrir de onde veio a
                                    visita, que é uma pista sobre o plano do casal. */}
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="underline"
                                >
                                  ver na loja
                                </a>
                              </>
                            ) : null}
                          </span>
                        </span>
                        {comprado ? (
                          <span className="flex-none rounded-full bg-tinta px-2 py-1 font-corpo text-[10.5px] font-bold text-limao">
                            comprado
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() =>
                            void comErro(
                              () => apagarItem.mutateAsync(item.id),
                              "Não consegui apagar agora. Tenta de novo?",
                            )
                          }
                          className="flex-none font-corpo text-[11px] text-suave underline"
                          aria-label={`Tirar ${item.name} da lista`}
                        >
                          tirar
                        </button>
                      </div>
                    </Polaroide>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Explica>
              Nada anotado ainda. Vale listar o que vocês querem comprar com esse
              dinheiro.
            </Explica>
          )}

          <Bloco>
            <form onSubmit={adicionarItem} className="flex flex-col gap-3.5">
              <Campo rotulo="O que" name="nome" maxLength={120} required />
              <Campo
                rotulo="Quanto deve custar (R$, opcional)"
                name="preco"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
              />
              <Campo
                rotulo="Link da loja (opcional)"
                name="url"
                type="url"
                inputMode="url"
                placeholder="https://"
              />
              <Enviar pendente={criarItem.isPending}>Adicionar item</Enviar>
            </form>
          </Bloco>
        </section>
      ) : null}

      {aba === "Aportes" ? (
        <section className="flex flex-col gap-2">
          {aportes && aportes.length > 0 ? (
            aportes.map((aporte) => {
              const cor = aporte.user_id ? (cores.get(aporte.user_id) ?? "fora") : "fora";
              const nome = aporte.user_id
                ? (nomePor.get(aporte.user_id) ?? "Sua dupla")
                : "Ex-membro";
              return (
                <LinhaAporte
                  key={aporte.id}
                  nome={nome}
                  legenda={dia(aporte.contributed_at)}
                  cor={cor}
                  valorCents={aporte.amount_cents}
                />
              );
            })
          ) : (
            <Explica>Ninguém colocou dinheiro nesta jornada ainda.</Explica>
          )}
        </section>
      ) : null}

      {aba === "Quem colocou" ? (
        <Bloco>
          {fatias.length === 0 ? (
            <Explica>
              Quando vocês começarem a colocar dinheiro aqui, esta parte mostra
              quanto foi de cada um.
            </Explica>
          ) : (
            <div className="flex flex-col gap-3">
              {fatias.map((fatia) => {
                const nome =
                  fatia.chave === "fora"
                    ? "Quem já saiu do plano"
                    : (nomePor.get(fatia.chave) ?? "Sua dupla");
                const parte = aportadoCents > 0 ? Math.round((fatia.cents / aportadoCents) * 100) : 0;
                return (
                  <div key={fatia.chave} className="flex items-center gap-3">
                    <DiscoDePessoa iniciais={iniciaisDoCasal([nome])} cor={fatia.cor} />
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-[13px] font-semibold">{nome}</b>
                      <i className="block font-corpo text-[10.5px] not-italic text-suave">
                        {parte}% do que já entrou
                      </i>
                    </span>
                    <b className="flex-none text-[13.5px] font-bold tabular-nums">
                      {formatBRL(fatia.cents)}
                    </b>
                  </div>
                );
              })}
            </div>
          )}
        </Bloco>
      ) : null}

      <Bloco>
        <Secao>Coloquei um dinheiro aqui</Secao>
        <form onSubmit={adicionarAporte} className="mt-3 flex flex-col gap-3.5">
          <Campo
            rotulo="Quanto (R$)"
            name="valor"
            type="text"
            required
            inputMode="decimal"
            placeholder="0,00"
          />
          <Campo rotulo="Quando" name="quando" type="date" defaultValue={hoje} max={hoje} />
          <Enviar pendente={registrarAporte.isPending}>Anotar</Enviar>
        </form>
      </Bloco>

      <details className="rounded-cartao bg-white p-4">
        <summary className="cursor-pointer text-[13.5px] font-semibold">
          Editar esta jornada
        </summary>
        <form onSubmit={editarJornada} className="mt-3.5 flex flex-col gap-3.5">
          <Campo
            rotulo="O que vocês querem"
            name="titulo"
            maxLength={120}
            required
            defaultValue={jornada.title}
          />
          <Campo
            rotulo="Quanto vocês querem juntar (R$)"
            name="alvo"
            type="text"
            required
            inputMode="decimal"
            defaultValue={jornada.target_amount_cents / 100}
          />
          <Campo
            rotulo="Categoria"
            name="categoria"
            maxLength={40}
            defaultValue={jornada.category}
          />
          <Campo
            rotulo="Para quando (opcional)"
            name="prazo"
            type="date"
            defaultValue={paraCampoData(jornada.deadline_at)}
          />
          <Escolha rotulo="Quanto isso importa" name="prioridade" defaultValue={jornada.priority}>
            {PRIORIDADES.map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </Escolha>
          <Enviar pendente={salvarJornada.isPending}>Salvar</Enviar>
        </form>
      </details>

      <div className="flex flex-col gap-2">
        <Recado aviso={avisoApagar} />
        <Perigo onClick={() => void tentarApagar()} disabled={apagarJornada.isPending}>
          {avisoApagar ? "Apagar mesmo assim" : "Apagar esta jornada"}
        </Perigo>
      </div>
    </main>
  );
}

function Aviso({ texto }: { texto: string }) {
  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-5">
      <Explica>{texto}</Explica>
      <Link href="/jornadas" className="text-[12.5px] font-semibold underline">
        Voltar para as jornadas
      </Link>
    </main>
  );
}
