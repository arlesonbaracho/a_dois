"use client";

import { useActionState, useState } from "react";

import type { CanalConvite, ConviteAberto, PedidoPendente } from "@repo/api";

import { Campo, Enviar, Interruptor, Recado, type EstadoForm } from "@/components/form-ui";

import { acaoCriarConvite, acaoPedido, acaoSair, type EstadoConvite } from "./actions";

const NOME_DO_CANAL: Record<CanalConvite, string> = {
  email: "por e-mail",
  nickname: "por apelido",
  link: "por link",
};

/**
 * O cartão de confirmação.
 *
 * É a única tela do app que concede acesso a dado financeiro de outra pessoa,
 * então o aviso vem antes dos botões, e sem eufemismo.
 */
function CartaoPedido({ pedido }: { pedido: PedidoPendente }) {
  const [estado, acao] = useActionState<EstadoForm, FormData>(acaoPedido, {});

  return (
    <form action={acao} className="flex flex-col gap-3 rounded-cartao bg-tinta p-4 text-papel">
      <input type="hidden" name="id" value={pedido.invite_id} />

      {/* Irmãos, não aninhados: o e2e mede o pai deste <p> para conferir que o
          e-mail sai mascarado, e um invólucro o deixaria de fora. */}
      <span className="-mb-2 font-corpo text-[10.5px] text-noite-suave">pedido pendente</span>
      <p className="text-[16px] font-bold tracking-[-0.03em]">
        Alguém pediu para entrar no plano de vocês
      </p>

      {/* Rótulo apagado, valor aceso: é a leitura que o design pede, e é a que
          deixa o e-mail mascarado saltar — ele é a informação que decide. */}
      <dl className="flex flex-col gap-1.5 font-corpo text-[11.5px]">
        {[
          ["Nome", pedido.display_name ?? "não informou"],
          ...(pedido.nickname ? [["Apelido", pedido.nickname]] : []),
          ["E-mail", pedido.email_mascarado],
          ["Conta criada há", `${pedido.conta_criada_ha_dias} dia(s)`],
          ["Chegou", NOME_DO_CANAL[pedido.channel]],
        ].map(([rotulo, valor]) => (
          <div key={rotulo} className="flex justify-between gap-3">
            <dt className="text-noite-suave">{rotulo}</dt>
            <dd className="font-semibold text-papel">{valor}</dd>
          </div>
        ))}
      </dl>

      <p className="font-corpo text-[11.5px] leading-relaxed text-noite-corpo">
        Confirmando, essa pessoa passa a ver <strong className="text-papel">todo o
        histórico financeiro do plano</strong> — jornadas, valores e aportes,
        inclusive o que vocês registraram antes de ela entrar. Só confirme se
        reconhece quem está do outro lado.
      </p>

      <Recado erro={estado.erro} aviso={estado.aviso} />

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          name="acao"
          value="confirmar"
          className="flex-1 rounded-full bg-limao px-4 py-3 text-[13px] font-bold text-tinta"
        >
          Confirmar
        </button>
        <button
          type="submit"
          name="acao"
          value="recusar"
          className="flex-1 rounded-full border border-papel/25 px-4 py-3 text-[13px] font-semibold text-noite-corpo"
        >
          Não é quem eu convidei
        </button>
        <button
          type="submit"
          name="acao"
          value="revogar"
          className="w-full rounded-full px-4 py-2 font-corpo text-[11.5px] text-noite-suave underline"
        >
          Cancelar o convite
        </button>
      </div>
    </form>
  );
}

function FormCriar() {
  const [canal, setCanal] = useState<CanalConvite>("link");
  const [estado, acao] = useActionState<EstadoConvite, FormData>(acaoCriarConvite, {});

  return (
    <form action={acao} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Como você quer convidar</span>
        <select
          name="canal"
          value={canal}
          onChange={(e) => setCanal(e.target.value as CanalConvite)}
          className="rounded-bloco border border-borda bg-white px-3.5 py-2.5 text-base"
        >
          <option value="link">Um link que eu mesmo mando</option>
          <option value="email">Pelo e-mail da pessoa</option>
          <option value="nickname">Pelo apelido dela aqui no app</option>
        </select>
      </label>

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

      <p className="text-sm text-suave-forte">
        {canal === "link"
          ? "O link vale 24 horas, e serve para quem estiver com ele."
          : "O convite vale 72 horas e só funciona para essa pessoa — mas quem manda o link é você, não a gente."}{" "}
        Em qualquer um dos casos, quem receber ainda vai depender da sua
        confirmação para ver alguma coisa.
      </p>

      <Recado erro={estado.erro} aviso={estado.aviso} />

      {estado.link ? (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Link do convite</span>
          <input
            readOnly
            value={estado.link}
            onFocus={(e) => e.currentTarget.select()}
            className="rounded-bloco border border-borda px-3 py-2 font-mono text-xs"
          />
        </label>
      ) : null}

      <Enviar>Criar convite</Enviar>
    </form>
  );
}

function ConviteAtivo({ convite }: { convite: ConviteAberto }) {
  const [estado, acao] = useActionState<EstadoForm, FormData>(acaoPedido, {});

  return (
    <form action={acao} className="flex flex-col gap-2 border-t border-divisa pt-3">
      <input type="hidden" name="id" value={convite.invite_id} />
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm">
          {NOME_DO_CANAL[convite.channel]}
          {convite.email_mascarado ? ` — ${convite.email_mascarado}` : ""}
        </span>
        <button type="submit" name="acao" value="revogar" className="text-sm underline">
          Cancelar
        </button>
      </div>
      <span className="text-xs text-suave-forte">
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
      <h2 className="text-sm font-semibold">Sair do plano</h2>

      {sozinho ? (
        <>
          <p className="text-sm">
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
        <p className="text-sm">
          Seus aportes continuam no plano, com os valores intactos, mas passam a
          aparecer como <strong>ex-membro</strong>. Seu nome e sua faixa de renda
          somem daqui, e sua sessão cai na hora.
        </p>
      )}

      <Recado erro={estado.erro} aviso={estado.aviso} />

      <button type="submit" className="self-start rounded-bloco px-4 py-2 text-sm underline">
        {sozinho ? "Sair e apagar o plano" : "Sair do plano"}
      </button>
    </form>
  );
}

export function TelaParceiro({
  pedidos,
  ativos,
  membros,
}: {
  pedidos: PedidoPendente[];
  ativos: ConviteAberto[];
  membros: number;
}) {
  const planoCheio = membros >= 2;

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-5 lg:max-w-2xl lg:p-10">
      <div>
        <h1 className="text-[27px] font-bold tracking-[-0.04em]">Quem divide o plano</h1>
        <p className="mt-1 text-suave-forte">
          Convidar é só o começo: ninguém entra sem você confirmar.
        </p>
      </div>

      {pedidos.map((pedido) => (
        <CartaoPedido key={pedido.invite_id} pedido={pedido} />
      ))}

      {planoCheio ? (
        <p className="rounded-cartao bg-white p-4 font-corpo text-[12.5px] leading-relaxed text-corpo">
          O plano já é de duas pessoas. Nada mais a convidar por aqui.
        </p>
      ) : (
        <FormCriar />
      )}

      {ativos.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Convites em aberto</h2>
          {ativos.map((convite) => (
            <ConviteAtivo key={convite.invite_id} convite={convite} />
          ))}
        </section>
      ) : null}

      <SairDoPlano sozinho={membros < 2} />
    </main>
  );
}
