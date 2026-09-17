"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  type Prioridade,
  useAportes,
  useApagarItem,
  useApagarMeta,
  useBuscarPreco,
  useCapas,
  useCasal,
  useCriarItem,
  useEnviarCapa,
  useItens,
  useMembros,
  useMeta,
  useOfertasParaItem,
  useSalvarItem,
  useSalvarMeta,
} from "@repo/api";
import {
  centavosDeTexto,
  coresDoCasal,
  formatBRL,
  iniciaisDoCasal,
  ordemEstavel,
  paraCampoData,
  paraInstante,
  parcelaMensalCents,
  progressoPercentual,
  CONVITE_DAS_OFERTAS,
  rotuloDaCategoria,
  sumCents,
} from "@repo/core";

import { EsqueletoJornada } from "@/components/esqueleto";
import { Campo, Enviar, Escolha, Perigo, Recado } from "@/components/form-ui";
import { IconeVoltar } from "@/components/icones";
import {
  AvataresDoCasal,
  Bloco,
  Chapa,
  Chip,
  DiscoDePessoa,
  Etiqueta,
  Explica,
  LinhaAporte,
  LinhaOferta,
  PontoDePessoa,
} from "@/components/pecas";
import { Progresso, type Fatia } from "@/components/progresso";
import { PrecoDoItem } from "@/components/preco-do-item";
import { prepararCapa } from "@/lib/capa";

const dia = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");
/** "março de 2024" — a idade da jornada, dita como gente diz. */
const desde = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
/** "até março de 2027". */
const ate = desde;
/** As três respostas de "quanto isso importa", na voz do produto. */
const PRIORIDADES: [Prioridade, string][] = [
  ["alta", "É o que a gente mais quer"],
  ["media", "Importante, sem pressa"],
  ["baixa", "Um dia"],
];

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
  const buscarPreco = useBuscarPreco(goalId);
  const apagarJornada = useApagarMeta(goalId);
  const criarItem = useCriarItem(goalId);
  const salvarItem = useSalvarItem(goalId);
  const apagarItem = useApagarItem(goalId);

  const [erro, setErro] = useState("");
  const [erroCapa, setErroCapa] = useState("");
  const [avisoApagar, setAvisoApagar] = useState("");
  const [aba, setAba] = useState<Aba>("Itens");
  // Inicializador de estado, e não `Date.now()` solto: o render precisa ser
  // puro, e o instante precisa ser o mesmo em toda re-renderização.
  const [agora] = useState(() => new Date());

  if (isError)
    return <Aviso texto="Não consegui carregar essa jornada agora." />;
  if (isPending) {
    return (
      <main className="mx-auto max-w-sm p-5 lg:max-w-3xl lg:p-10">
        <EsqueletoJornada />
      </main>
    );
  }
  if (!jornada) return <Aviso texto="Essa jornada não existe mais." />;

  const aportadoCents = sumCents((aportes ?? []).map((a) => a.amount_cents));
  const percentual = progressoPercentual(
    aportadoCents,
    jornada.target_amount_cents,
  );
  const faltamCents = Math.max(0, jornada.target_amount_cents - aportadoCents);

  // Quanto ainda cabe por mês até o prazo. Repetir aqui o total já aportado,
  // que a barra acima diz por extenso, não acrescentaria nada.
  const porMesCents = parcelaMensalCents(
    faltamCents,
    jornada.deadline_at,
    agora,
  );

  const pessoas = (membros ?? []).map((m) => ({
    userId: m.user_id,
    papel: m.role,
  }));
  const cores = coresDoCasal(pessoas);
  const nomePor = new Map(
    (membros ?? []).map((m) => [m.user_id, m.display_name]),
  );

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
      ? [
          {
            chave: "fora",
            cents: porPessoa.get("fora") ?? 0,
            cor: "fora" as const,
          },
        ]
      : []),
  ].filter((fatia) => fatia.cents > 0);

  const aComprar = (itens ?? []).filter((item) => item.status !== "comprado");
  const faltaComprarCents = aComprar.reduce(
    (total, item) => total + (item.estimated_price_cents ?? 0),
    0,
  );

  const dupla = ordemEstavel(pessoas).map((pessoa) => ({
    chave: pessoa.userId,
    nome: nomePor.get(pessoa.userId) ?? "Sua dupla",
    cor: cores.get(pessoa.userId) ?? ("fora" as const),
  }));

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

  /**
   * Vai à loja pelo link do item e guarda o preço.
   *
   * Os motivos de recusa viram frase em pt-BR aqui, e não no `packages/api`:
   * lá eles são código, porque a camada de dados não sabe em que idioma a tela
   * fala. Nenhuma das frases repete o detalhe técnico — "url_recusada" é sobre
   * a nossa infraestrutura, não sobre o que a pessoa fez.
   */
  async function verPreco(itemId: string, url: string) {
    setErro("");
    try {
      const resultado = await buscarPreco.mutateAsync({ itemId, url });
      if (resultado.ok) {
        setErro(
          resultado.precoCents === null
            ? "Achei a página, mas ela não diz o preço em lugar nenhum."
            : "",
        );
        return;
      }
      setErro(
        resultado.motivo === "endereco_recusado"
          ? "Esse endereço a gente não abre. Tenta o link direto do produto?"
          : resultado.motivo === "loja_nao_respondeu"
            ? "A loja não respondeu agora. Tenta de novo daqui a pouco?"
            : "Não consegui ler essa página. Tenta outro link?",
      );
    } catch {
      setErro("Não consegui buscar o preço agora. Tenta de novo?");
    }
  }

  async function editarJornada(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = new FormData(evento.currentTarget);
    const campo = (nome: string) => String(form.get(nome) ?? "").trim();

    const alvo = centavosDeTexto(campo("alvo"));
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
        precoCents: centavosDeTexto(campo("preco")),
        // Sem campo de link: quem vai pôr o endereço da loja é a indicação de
        // afiliado, não o casal. A coluna continua, e é onde esse link entra.
        url: null,
      });
      formulario.reset();
    }, "Não consegui adicionar agora. Tenta de novo?");
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

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-3.5 p-5 lg:max-w-3xl lg:p-10">
      <header className="flex min-h-11 items-center justify-between gap-3">
        <Link
          href="/jornadas"
          className="grid size-11 flex-none place-items-center rounded-full border border-borda bg-white text-tinta transition hover:bg-areia active:scale-95"
        >
          <IconeVoltar className="size-5" />
          <span className="sr-only">Voltar para as jornadas</span>
        </Link>
        {/* De quem é esta jornada, sem gastar uma linha de texto. */}
        <AvataresDoCasal pessoas={dupla} />
      </header>

      <Chapa
        categoria={jornada.category}
        capaUrl={jornada.cover_path ? capas?.get(jornada.cover_path) : null}
        arte="h-[64%]"
        className="h-[188px] rounded-carta lg:h-[260px]"
      >
        <span className="absolute left-3.5 top-3.5 rounded-full bg-white px-3 py-1.5 text-[13px] text-suave">
          {rotuloDaCategoria(jornada.category)}
        </span>
        <span className="num absolute right-3.5 top-3.5 rounded-full bg-white px-3 py-1.5 text-[13px] font-medium">
          {percentual}%
        </span>
        {/* O input fica escondido e o label é o botão: o controle nativo tem
            rótulo associado de verdade (é o mesmo elemento), então continua
            alcançável por teclado e por leitor de tela — e a suíte e2e o
            encontra por getByLabel, que aqui é contrato. */}
        <label className="absolute bottom-3.5 left-3.5 cursor-pointer rounded-full bg-white px-3 py-1.5 text-[13px] transition hover:bg-areia has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-tinta">
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
      </Chapa>
      <Recado erro={erroCapa} />

      {/* Sem kicker: a linha pequena vai ABAIXO do título. */}
      <div>
        <h1 className="text-[26px] font-medium leading-tight tracking-[-0.03em] lg:text-[30px]">
          {jornada.title}
        </h1>
        <p className="num mt-1 text-[14px] text-suave">
          {formatBRL(jornada.target_amount_cents)}
          {jornada.deadline_at ? <> até {ate(jornada.deadline_at)}</> : null} · desde{" "}
          {desde(jornada.created_at)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="block text-[12px] text-suave">Já juntaram</span>
          <b className="num text-[20px] font-medium tracking-[-0.02em]">{formatBRL(aportadoCents)}</b>
        </div>
        <div>
          <span className="block text-[12px] text-suave">Faltam</span>
          <b className="num text-[20px] font-medium tracking-[-0.02em]">{formatBRL(faltamCents)}</b>
        </div>
      </div>

      <div>
        <Progresso
          percentual={percentual}
          aportadoCents={aportadoCents}
          alvoCents={jornada.target_amount_cents}
          fatias={fatias}
          semLegenda
        />
        {/* Verde e marrom têm quase a mesma luz (1.18:1): a cor de cada pessoa
            nunca aparece sem o nome dela ao lado. */}
        {fatias.length > 0 ? (
          <p className="num mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-[12px] text-suave">
            {fatias.map((fatia) => (
              <span key={fatia.chave} className="flex items-center gap-1.5">
                <PontoDePessoa cor={fatia.cor} />
                {fatia.chave === "fora"
                  ? "Ex-membro"
                  : (nomePor.get(fatia.chave) ?? "Sua dupla")}{" "}
                {formatBRL(fatia.cents)}
              </span>
            ))}
          </p>
        ) : null}
      </div>

      {/* Quanto ainda cabe por mês até o prazo. */}
      {porMesCents === null ? null : (
        <p className="num text-[14px] text-suave">
          <b className="font-medium text-tinta">{formatBRL(porMesCents)}</b> por mês, a dois
        </p>
      )}

      <Link
        href={`/aportes/novo?jornada=${goalId}`}
        className="grid h-14 place-items-center rounded-full bg-tinta px-6 text-[16px] font-medium text-creme transition hover:opacity-90 active:scale-[0.98]"
      >
        Anotar aporte nesta jornada
      </Link>

      <Recado erro={erro} />

      <div className="flex gap-1.5">
        {ABAS.map((nome) => (
          <Chip
            key={nome}
            rotulo={nome}
            quantos={
              nome === "Itens" && itens && itens.length > 0
                ? itens.length
                : undefined
            }
            ativo={aba === nome}
            onClick={() => setAba(nome)}
          />
        ))}
      </div>

      {aba === "Itens" ? (
        <section className="flex flex-col gap-3">
          {itens && itens.length > 0 ? (
            <ul className="flex flex-col gap-2.5">
              {itens.map((item) => {
                const comprado = item.status === "comprado";
                return (
                  <li key={item.id} className="py-1">
                    <div className="flex items-center gap-3">
                      {/* O <input> é o próprio quadrado de 44px: é ele que recebe
                        o clique, o foco e o rótulo. O <label> ao lado estende o
                        alvo para o nome, que é o gesto do design — tocar no
                        item marca o item. */}
                      <input
                        id={`item-${item.id}`}
                        type="checkbox"
                        checked={comprado}
                        onChange={(evento) =>
                          void comErro(
                            () =>
                              salvarItem.mutateAsync({
                                itemId: item.id,
                                status: evento.target.checked
                                  ? "comprado"
                                  : "desejado",
                              }),
                            "Não consegui salvar agora. Tenta de novo?",
                          )
                        }
                        className="caixa-item"
                        aria-label={`Marcar ${item.name} como comprado`}
                      />
                      <label
                        htmlFor={`item-${item.id}`}
                        className="min-w-0 flex-1 cursor-pointer"
                      >
                        <b
                          className={`block truncate text-[15px] font-medium tracking-[-0.02em] ${
                            comprado ? "text-suave line-through" : ""
                          }`}
                        >
                          {item.name}
                        </b>
                        <i className="block font-corpo text-[12px] not-italic text-suave">
                          {comprado
                            ? "comprado, guardado no álbum"
                            : item.estimated_price_cents === null
                              ? "sem preço ainda"
                              : "preço estimado"}
                        </i>
                      </label>
                      {item.estimated_price_cents === null ? null : (
                        <Etiqueta forte={comprado}>
                          {comprado
                            ? "comprado"
                            : formatBRL(item.estimated_price_cents)}
                        </Etiqueta>
                      )}
                      {/* ponytail: fica para os itens que já têm link e para a
                        indicação de afiliado, que é quem vai preencher a
                        coluna daqui em diante. Ninguém digita mais.
                        noreferrer para a loja não descobrir de onde veio a
                        visita, que é uma pista sobre o plano do casal. */}
                      {item.url ? (
                        <>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="flex-none font-corpo text-[12px] font-medium text-tinta underline"
                          >
                            ver na loja
                          </a>
                          {/* Quem vai à loja é a Edge Function, com o guard
                            anti-SSRF em cada salto — nunca o navegador de quem
                            está olhando. */}
                          <button
                            type="button"
                            disabled={buscarPreco.isPending}
                            onClick={() =>
                              void verPreco(item.id, item.url as string)
                            }
                            className="flex-none font-corpo text-[12px] font-medium text-tinta underline disabled:opacity-50"
                          >
                            {buscarPreco.isPending ? "buscando…" : "ver preço"}
                          </button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        onClick={() =>
                          void comErro(
                            () => apagarItem.mutateAsync(item.id),
                            "Não consegui apagar agora. Tenta de novo?",
                          )
                        }
                        className="flex-none font-corpo text-[12px] text-suave underline transition-colors hover:text-alerta"
                        aria-label={`Tirar ${item.name} da lista`}
                      >
                        tirar
                      </button>
                    </div>
                    {/* `price_quotes` guardava a série desde o prompt 6 e nada
                        no app lia. Some sozinho com menos de duas cotações. */}
                    <PrecoDoItem itemId={item.id} />
                    {/* Item comprado não precisa de sugestão de compra. */}
                    {comprado ? null : (
                      <SugestaoDoItem nome={item.name} categoria={jornada.category} />
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <Explica>
              Nada anotado ainda. Vale listar o que vocês querem comprar com
              esse dinheiro.
            </Explica>
          )}

          {itens && itens.some((item) => item.status !== "comprado") ? (
            <Explica className="px-1">{CONVITE_DAS_OFERTAS}</Explica>
          ) : null}

          {itens && itens.length > 0 ? (
            <Explica className="px-1">
              Toque para marcar comprado
              {/* A soma só entra com dois ou mais itens na frente: com um só,
                  ela repetiria o número que a etiqueta ao lado já mostra. */}
              {aComprar.length > 1 && faltaComprarCents > 0 ? (
                <> · falta comprar {formatBRL(faltaComprarCents)}</>
              ) : null}
            </Explica>
          ) : null}

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
              <Enviar pendente={criarItem.isPending} largo>
                Adicionar item
              </Enviar>
            </form>
          </Bloco>
        </section>
      ) : null}

      {aba === "Aportes" ? (
        <section className="flex flex-col gap-2">
          {aportes && aportes.length > 0 ? (
            aportes.map((aporte) => {
              const cor = aporte.user_id
                ? (cores.get(aporte.user_id) ?? "fora")
                : "fora";
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
                const parte =
                  aportadoCents > 0
                    ? Math.round((fatia.cents / aportadoCents) * 100)
                    : 0;
                return (
                  <div key={fatia.chave} className="flex items-center gap-3">
                    <DiscoDePessoa
                      iniciais={iniciaisDoCasal([nome])}
                      cor={fatia.cor}
                    />
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-[13px] font-medium">
                        {nome}
                      </b>
                      <i className="block font-corpo text-[12px] not-italic text-suave">
                        {parte}% do que já entrou
                      </i>
                    </span>
                    <b className="flex-none text-[15px] font-medium tabular-nums">
                      {formatBRL(fatia.cents)}
                    </b>
                  </div>
                );
              })}
            </div>
          )}
        </Bloco>
      ) : null}

      <details className="rounded-cartao border border-borda bg-white p-4">
        <summary className="cursor-pointer text-[15px] font-medium">
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
          <Escolha
            rotulo="Quanto isso importa"
            name="prioridade"
            defaultValue={jornada.priority}
          >
            {PRIORIDADES.map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </Escolha>
          <Enviar pendente={salvarJornada.isPending} largo>
            Salvar
          </Enviar>
        </form>
      </details>

      <div className="flex flex-col gap-2">
        <Recado aviso={avisoApagar} />
        <Perigo
          onClick={() => void tentarApagar()}
          disabled={apagarJornada.isPending}
        >
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
      <Link href="/jornadas" className="text-[14px] font-medium underline">
        Voltar para as jornadas
      </Link>
    </main>
  );
}

/**
 * A sugestão de compra de um item.
 *
 * Componente próprio porque o hook é por item, e hook não vive em laço. Some
 * inteiro quando não há o que sugerir — vitrine vazia é pior que vitrine
 * nenhuma.
 *
 * Uma sugestão, nunca uma lista: o item é do casal, a oferta é convidada.
 */
function SugestaoDoItem({ nome, categoria }: { nome: string; categoria: string }) {
  const { data: ofertas } = useOfertasParaItem(nome, categoria);
  const oferta = ofertas?.[0];
  if (!oferta) return null;

  return (
    <LinhaOferta
      titulo={oferta.title}
      categoria={oferta.category}
      loja={oferta.merchant}
      precoCents={oferta.price_cents}
      vistoEmISO={oferta.price_seen_at}
      url={oferta.target_url}
    />
  );
}
