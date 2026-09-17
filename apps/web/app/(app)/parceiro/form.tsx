"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import type { CanalConvite, ConviteAberto, PedidoPendente } from "@repo/api";
import { APP_NAME, type CorDePessoa, iniciaisDoCasal } from "@repo/core";

import {
  Campo,
  Enviar,
  Escolha,
  Interruptor,
  Perigo,
  Recado,
  type EstadoForm,
} from "@/components/form-ui";
import { IconeConversa, IconeCopiar, IconeLink, IconeVoltar } from "@/components/icones";
import { Bloco, DiscoDePessoa, Etiqueta, Explica, Secao } from "@/components/pecas";

import { acaoCriarConvite, acaoPedido, acaoSair, type EstadoConvite } from "./actions";

const NOME_DO_CANAL: Record<CanalConvite, string> = {
  email: "por e-mail",
  nickname: "por apelido",
  link: "por link",
};

type Membro = { chave: string; souEu: boolean; nome: string; papel: string; cor: CorDePessoa };

/**
 * O cartão de confirmação.
 *
 * É a única tela do app que concede acesso a dado financeiro de outra pessoa,
 * então o aviso vem antes dos botões, e sem eufemismo. É também o único cartão
 * escuro do app — um segundo faria este parar de significar.
 */
function CartaoPedido({ pedido }: { pedido: PedidoPendente }) {
  const [estado, acao] = useActionState<EstadoForm, FormData>(acaoPedido, {});

  return (
    <form action={acao} className="flex flex-col gap-3 rounded-cartao bg-tinta p-4 text-creme">
      <input type="hidden" name="id" value={pedido.invite_id} />

      {/* Irmãos, não aninhados: o e2e mede o pai deste <p> para conferir que o
          e-mail sai mascarado, e um invólucro o deixaria de fora. */}
      <span className="-mb-2 font-corpo text-[12px] text-creme/70">pedido pendente</span>
      <p className="text-[18px] font-medium tracking-[-0.03em]">
        Alguém pediu para entrar no plano de vocês
      </p>

      {/* Rótulo apagado, valor aceso: é a leitura que o design pede, e é a que
          deixa o e-mail mascarado saltar — ele é a informação que decide. */}
      <dl className="flex flex-col gap-2 font-corpo text-[13px]">
        {[
          ["Nome", pedido.display_name ?? "não informou"],
          ...(pedido.nickname ? [["Apelido", pedido.nickname]] : []),
          ["E-mail", pedido.email_mascarado],
          ["Conta criada há", `${pedido.conta_criada_ha_dias} dia(s)`],
          ["Chegou", NOME_DO_CANAL[pedido.channel]],
        ].map(([rotulo, valor]) => (
          <div key={rotulo} className="flex justify-between gap-3">
            <dt className="text-creme/70">{rotulo}</dt>
            <dd className="font-medium">{valor}</dd>
          </div>
        ))}
      </dl>

      <p className="font-corpo text-[13px] leading-relaxed text-creme/85">
        Confirmando, essa pessoa passa a ver{" "}
        <strong className="font-medium text-creme">todo o histórico financeiro do plano</strong>{" "}
        — jornadas, valores e aportes, inclusive o que vocês registraram antes de
        ela entrar. Só confirme se reconhece quem está do outro lado.
      </p>

      <Recado erro={estado.erro} aviso={estado.aviso} />

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          name="acao"
          value="confirmar"
          className="flex-1 rounded-full bg-creme px-4 py-3.5 text-[14px] font-medium text-tinta transition hover:opacity-90 active:scale-[0.97]"
        >
          Confirmar
        </button>
        <button
          type="submit"
          name="acao"
          value="recusar"
          className="flex-1 rounded-full border border-creme/30 px-4 py-3.5 text-[14px] font-medium text-creme/85 transition hover:bg-creme/10 active:scale-[0.97]"
        >
          Não é quem eu convidei
        </button>
        <button
          type="submit"
          name="acao"
          value="revogar"
          className="w-full rounded-full px-4 py-2 font-corpo text-[13px] text-creme/70 underline"
        >
          Cancelar o convite
        </button>
      </div>
    </form>
  );
}

/**
 * Como o convite sai daqui.
 *
 * O protótipo mostrava três botões fixos (WhatsApp, Link, QR). Dois deles
 * existem sem dependência nova: o `wa.me` é só uma URL, e a folha de
 * compartilhamento do sistema é `navigator.share`, que num PWA instalado abre
 * a lista inteira de apps — mais do que os três juntos. O QR ficou de fora
 * porque exige biblioteca nova, e isso é uma pergunta, não uma decisão minha.
 */
function Compartilhar({ link }: { link: string }) {
  const [copiado, setCopiado] = useState(false);
  const [podeCompartilhar] = useState(() => typeof navigator !== "undefined" && "share" in navigator);

  const recado = `Vamos montar nosso plano no ${APP_NAME}? ${link}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Sem permissão de área de transferência: o campo acima continua lá para
      // selecionar à mão, então não há nada a dizer.
    }
  }

  const casca =
    "flex flex-1 items-center justify-center gap-2 rounded-bloco border border-borda bg-white px-3 py-3.5 text-[13px] font-medium transition hover:border-contorno active:scale-[0.97]";

  return (
    <div className="flex gap-2">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(recado)}`}
        target="_blank"
        rel="noreferrer noopener"
        className={casca}
      >
        <IconeConversa aria-hidden="true" className="size-4 text-tinta" />
        WhatsApp
      </a>
      {podeCompartilhar ? (
        <button
          type="button"
          onClick={() => void navigator.share({ text: recado }).catch(() => {})}
          className={casca}
        >
          <IconeLink aria-hidden="true" className="size-4 text-tinta" />
          Enviar
        </button>
      ) : null}
      <button type="button" onClick={() => void copiar()} className={casca}>
        <IconeCopiar aria-hidden="true" className="size-4 text-tinta" />
        {copiado ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

function FormCriar() {
  const [canal, setCanal] = useState<CanalConvite>("link");
  const [estado, acao] = useActionState<EstadoConvite, FormData>(acaoCriarConvite, {});

  return (
    <div className="flex flex-col gap-4">
      <form action={acao} className="flex flex-col gap-4">
        <Escolha
          rotulo="Como você quer convidar"
          name="canal"
          value={canal}
          onChange={(e) => setCanal(e.target.value as CanalConvite)}
        >
          <option value="link">Um link que eu mesmo mando</option>
          <option value="email">Pelo e-mail da pessoa</option>
          <option value="nickname">Pelo apelido dela aqui no app</option>
        </Escolha>

        {canal === "email" ? (
          <Campo rotulo="E-mail da pessoa" name="email" type="email" required />
        ) : null}

        {canal === "nickname" ? (
          <Campo
            rotulo="Apelido da pessoa"
            name="apelido"
            placeholder="exatamente como ela escreveu"
            required
          />
        ) : null}

        <Explica>
          {canal === "link"
            ? "O link vale 24 horas, e serve para quem estiver com ele."
            : "O convite vale 72 horas e só funciona para essa pessoa — mas quem manda o link é você, não a gente."}{" "}
          Em qualquer um dos casos, quem receber ainda vai depender da sua
          confirmação para ver alguma coisa.
        </Explica>

        <Recado erro={estado.erro} aviso={estado.aviso} />

        {estado.link ? (
          <Campo
            rotulo="Link do convite"
            readOnly
            value={estado.link}
            onFocus={(e) => e.currentTarget.select()}
          />
        ) : null}

        <Enviar largo>Criar convite</Enviar>
      </form>

      {estado.link ? <Compartilhar link={estado.link} /> : null}

      {/* O escopo do acesso, dito ANTES de convidar. Estava só no cartão de
          confirmação — ou seja, só aparecia para quem já tinha decidido. */}
      <div className="rounded-cartao bg-salvia p-4 text-tinta">
        <b className="block text-[14px] font-medium tracking-[-0.02em]">
          O que essa pessoa vai ver
        </b>
        <p className="mt-1.5 font-corpo text-[13px] leading-relaxed">
          As jornadas de vocês, os aportes dos dois e a divisão — inclusive o que
          já estava aqui antes dela entrar. Não vê sua senha, seu e-mail nem nada
          fora deste plano.
        </p>
      </div>

      <Bloco>
        <b className="block text-[14px] font-medium tracking-[-0.02em]">
          Sem parceiro ainda?
        </b>
        <Explica className="mt-1.5">
          Dá para usar sozinho e convidar depois. Nada do que vocês guardarem se
          perde no caminho.
        </Explica>
      </Bloco>
    </div>
  );
}

function ConviteAtivo({ convite }: { convite: ConviteAberto }) {
  const [estado, acao] = useActionState<EstadoForm, FormData>(acaoPedido, {});

  return (
    <form action={acao} className="flex flex-col gap-2 rounded-cartao border border-borda bg-white p-3.5">
      <input type="hidden" name="id" value={convite.invite_id} />
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[15px] font-medium tracking-[-0.02em]">
          {NOME_DO_CANAL[convite.channel]}
          {convite.email_mascarado ? ` — ${convite.email_mascarado}` : ""}
        </span>
        <button
          type="submit"
          name="acao"
          value="revogar"
          className="font-corpo text-[13px] text-suave underline transition-colors hover:text-alerta"
        >
          Cancelar
        </button>
      </div>
      <span className="font-corpo text-[12px] text-suave">
        vale até {new Date(convite.expires_at).toLocaleString("pt-BR")}
      </span>
      <Recado erro={estado.erro} aviso={estado.aviso} />
    </form>
  );
}

/**
 * Sair do plano.
 *
 * Sozinho, sair é um delete irreversível do plano inteiro — daí a caixa de
 * confirmação obrigatória. Acompanhado, é pseudonimização: o dinheiro fica, o
 * nome sai.
 */
function SairDoPlano({ sozinho }: { sozinho: boolean }) {
  const [estado, acao] = useActionState<EstadoForm, FormData>(acaoSair, {});

  return (
    <form action={acao} className="flex flex-col gap-3 border-t border-divisa pt-6">
      <Secao>Sair do plano</Secao>

      {sozinho ? (
        <>
          <p className="font-corpo text-[14px] leading-relaxed text-suave-forte">
            Você está sozinho aqui, então sair <strong>apaga o plano inteiro</strong>:
            jornadas, itens, aportes e histórico de preço. Não dá para desfazer, e a
            gente não guarda cópia.
          </p>
          <Interruptor
            name="confirmo"
            required
            rotulo="Eu entendo que o plano será apagado"
            descricao="Sem isto marcado, nada acontece."
          />
        </>
      ) : (
        <p className="font-corpo text-[14px] leading-relaxed text-suave-forte">
          Seus aportes continuam no plano, com os valores intactos, mas passam a
          aparecer como <strong>ex-membro</strong>. Seu nome e sua faixa de renda
          somem daqui, e sua sessão cai na hora.
        </p>
      )}

      <Recado erro={estado.erro} aviso={estado.aviso} />

      <Perigo type="submit">{sozinho ? "Sair e apagar o plano" : "Sair do plano"}</Perigo>
    </form>
  );
}

export function TelaParceiro({
  pedidos,
  ativos,
  membros,
  dupla,
}: {
  pedidos: PedidoPendente[];
  ativos: ConviteAberto[];
  membros: number;
  dupla: Membro[];
}) {
  const planoCheio = membros >= 2;
  // A aba que abre é a que tem o que fazer: com pedido na mesa ou plano cheio,
  // quem chega vem decidir, não convidar.
  const [aba, setAba] = useState<"No plano" | "Convidar">(
    pedidos.length > 0 || planoCheio ? "No plano" : "Convidar",
  );

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-3.5 p-5 lg:max-w-2xl lg:p-10">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="grid size-9 flex-none place-items-center rounded-full border border-borda bg-white text-tinta transition active:scale-95"
        >
          <IconeVoltar className="size-4" />
          <span className="sr-only">Voltar para o início</span>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-medium leading-tight tracking-[-0.03em] lg:text-2xl">
            Quem está no plano
          </h1>
          <p className="mt-0.5 font-corpo text-[12px] text-suave">
            a jornada é de duas pessoas
          </p>
        </div>
      </header>

      <div className="flex gap-2">
        {(["No plano", "Convidar"] as const).map((nome) => (
          <button
            key={nome}
            type="button"
            aria-pressed={aba === nome}
            onClick={() => setAba(nome)}
            className={`flex-1 rounded-full border px-4 py-2.5 text-[14px] font-medium transition active:scale-[0.97] ${
              aba === nome
                ? "border-tinta bg-tinta text-creme"
                : "border-contorno bg-white text-suave-forte hover:border-contorno"
            }`}
          >
            {nome}
          </button>
        ))}
      </div>

      {aba === "No plano" ? (
        <div className="flex flex-col gap-3.5">
          {/* Quem já está dentro, com a cor que a pessoa tem no resto do app. A
              tela se chamava "Quem divide o plano" e não dizia quem era. */}
          <Bloco className="flex flex-col gap-3 p-3.5">
            {dupla.map((membro, indice) => (
              <div
                key={membro.chave}
                className={`flex items-center gap-3 ${
                  indice > 0 ? "border-t border-divisa pt-3" : ""
                }`}
              >
                <DiscoDePessoa iniciais={iniciaisDoCasal([membro.nome])} cor={membro.cor} />
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[15px] font-medium">{membro.nome}</b>
                  <i className="block font-corpo text-[12px] not-italic text-suave">
                    {membro.papel}
                  </i>
                </span>
                {/* Quem está olhando, e não quem está no topo da lista: a
                    ordem começa pelo dono, que nem sempre é você. */}
                {membro.souEu ? <Etiqueta>você</Etiqueta> : <Etiqueta forte>no plano</Etiqueta>}
              </div>
            ))}
          </Bloco>

          {pedidos.map((pedido) => (
            <CartaoPedido key={pedido.invite_id} pedido={pedido} />
          ))}

          {ativos.length > 0 ? (
            <section className="flex flex-col gap-2.5">
              <Secao>Convites em aberto</Secao>
              {ativos.map((convite) => (
                <ConviteAtivo key={convite.invite_id} convite={convite} />
              ))}
            </section>
          ) : null}

          <SairDoPlano sozinho={membros < 2} />
        </div>
      ) : planoCheio ? (
        <Bloco>
          <Explica>O plano já é de duas pessoas. Nada mais a convidar por aqui.</Explica>
        </Bloco>
      ) : (
        <FormCriar />
      )}
    </main>
  );
}
