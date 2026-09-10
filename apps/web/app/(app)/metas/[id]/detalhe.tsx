"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  type Prioridade,
  useAportes,
  useApagarItem,
  useApagarMeta,
  useCriarItem,
  useItens,
  useMeta,
  useRegistrarAporte,
  useSalvarItem,
  useSalvarMeta,
} from "@repo/api";
import { formatBRL, progressoPercentual, sumCents } from "@repo/core";

import { Campo, Enviar, Recado } from "@/components/form-ui";
import { Progresso } from "@/components/progresso";
import { paraCampoData, paraCentavos, paraInstante } from "@/lib/dinheiro";

import { PRIORIDADES } from "../lista";

const dia = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

export function Detalhe({ goalId }: { goalId: string }) {
  const router = useRouter();

  const { data: meta, isPending, isError } = useMeta(goalId);
  const { data: itens } = useItens(goalId);
  const { data: aportes } = useAportes(goalId);

  const salvarMeta = useSalvarMeta(goalId);
  const apagarMeta = useApagarMeta(goalId);
  const criarItem = useCriarItem(goalId);
  const salvarItem = useSalvarItem(goalId);
  const apagarItem = useApagarItem(goalId);
  const registrarAporte = useRegistrarAporte(goalId);

  const [erro, setErro] = useState("");
  const [avisoApagar, setAvisoApagar] = useState("");

  if (isError) return <Aviso texto="Não consegui carregar essa meta agora." />;
  if (isPending) return <Aviso texto="Carregando…" />;
  if (!meta) return <Aviso texto="Essa meta não existe mais." />;

  const aportadoCents = sumCents((aportes ?? []).map((a) => a.amount_cents));
  const percentual = progressoPercentual(aportadoCents, meta.target_amount_cents);

  async function comErro(acao: () => Promise<unknown>, frase: string) {
    setErro("");
    try {
      await acao();
    } catch {
      setErro(frase);
    }
  }

  async function editarMeta(evento: React.FormEvent<HTMLFormElement>) {
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
        salvarMeta.mutateAsync({
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
      const resultado = await apagarMeta.mutateAsync(avisoApagar !== "");
      if (resultado === "precisa_confirmar") {
        setAvisoApagar(
          "Essa meta já tem dinheiro dentro. Apagar leva o histórico dos aportes junto. Toque de novo para confirmar.",
        );
        return;
      }
      router.push("/metas");
    }, "Não consegui apagar agora. Tenta de novo?");
  }

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">{meta.title}</h1>
        <p className="mt-1 text-stone-600">
          {meta.category}
          {meta.deadline_at ? <> · para {dia(meta.deadline_at)}</> : null}
        </p>
      </div>

      <Progresso
        percentual={percentual}
        aportadoCents={aportadoCents}
        alvoCents={meta.target_amount_cents}
      />

      <Recado erro={erro} />

      <form onSubmit={adicionarAporte} className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Coloquei um dinheiro aqui</h2>
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

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">O que falta comprar</h2>

        {itens && itens.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {itens.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={item.status === "comprado"}
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
                  className="mt-1 size-4"
                  aria-label={`Marcar ${item.name} como comprado`}
                />
                <span className="flex-1">
                  <span
                    className={`block text-sm font-medium ${
                      item.status === "comprado" ? "text-stone-400 line-through" : ""
                    }`}
                  >
                    {item.name}
                  </span>
                  <span className="block text-sm text-stone-600">
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
                <button
                  type="button"
                  onClick={() =>
                    void comErro(
                      () => apagarItem.mutateAsync(item.id),
                      "Não consegui apagar agora. Tenta de novo?",
                    )
                  }
                  className="text-sm text-stone-500 underline"
                  aria-label={`Tirar ${item.name} da lista`}
                >
                  tirar
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-stone-600">
            Nada anotado ainda. Vale listar o que vocês querem comprar com esse
            dinheiro.
          </p>
        )}

        <form onSubmit={adicionarItem} className="flex flex-col gap-4">
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
      </section>

      <details className="text-sm">
        <summary className="cursor-pointer font-semibold">Editar esta meta</summary>
        <form onSubmit={editarMeta} className="mt-4 flex flex-col gap-4">
          <Campo
            rotulo="O que vocês querem"
            name="titulo"
            maxLength={120}
            required
            defaultValue={meta.title}
          />
          <Campo
            rotulo="Quanto vocês querem juntar (R$)"
            name="alvo"
            type="text"
            required
            inputMode="decimal"
            defaultValue={meta.target_amount_cents / 100}
          />
          <Campo
            rotulo="Categoria"
            name="categoria"
            maxLength={40}
            defaultValue={meta.category}
          />
          <Campo
            rotulo="Para quando (opcional)"
            name="prazo"
            type="date"
            defaultValue={paraCampoData(meta.deadline_at)}
          />
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Quanto isso importa</span>
            <select
              name="prioridade"
              defaultValue={meta.priority}
              className="rounded-xl border border-stone-300 px-3 py-2 text-base"
            >
              {PRIORIDADES.map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </label>
          <Enviar pendente={salvarMeta.isPending}>Salvar</Enviar>
        </form>
      </details>

      <div className="flex flex-col gap-2">
        <Recado aviso={avisoApagar} />
        <button
          type="button"
          onClick={() => void tentarApagar()}
          disabled={apagarMeta.isPending}
          className="self-start text-sm text-red-800 underline disabled:opacity-60"
        >
          {avisoApagar ? "Apagar mesmo assim" : "Apagar esta meta"}
        </button>
      </div>

      <Link href="/metas" className="text-sm underline">
        Voltar para as metas
      </Link>
    </main>
  );
}

function Aviso({ texto }: { texto: string }) {
  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-6">
      <p className="text-stone-600">{texto}</p>
      <Link href="/metas" className="text-sm underline">
        Voltar para as metas
      </Link>
    </main>
  );
}
