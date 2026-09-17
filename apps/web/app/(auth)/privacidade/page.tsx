import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { APP_NAME } from "@repo/core";

/**
 * A política de privacidade, pública.
 *
 * É página do app, e não arquivo em `docs/`, porque política que o titular não
 * consegue abrir não está publicada. Mora no grupo `(auth)` e na lista de
 * rotas públicas do middleware: quem ainda não tem conta precisa ler antes de
 * criar uma, e quem já tem precisa poder voltar aqui.
 *
 * O registro interno das operações (Art. 37) fica em `docs/ROPA.md`, com mais
 * detalhe técnico. Esta página é a mesma verdade, na voz de quem usa.
 *
 * Server Component: não tem interatividade nenhuma, e assim ela abre sem
 * JavaScript.
 */
export const metadata: Metadata = {
  title: `Privacidade · ${APP_NAME}`,
  description: "O que o Jornada guarda, por quê, e como você apaga.",
};

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[18px] font-semibold tracking-[-0.03em]">{titulo}</h2>
      <div className="flex flex-col gap-2 font-corpo text-[14px] leading-relaxed text-suave">
        {children}
      </div>
    </section>
  );
}

/** Lacuna que o controlador precisa preencher antes de valer como documento. */
function Falta({ children }: { children: ReactNode }) {
  return (
    <mark className="rounded bg-alerta-suave px-1.5 py-0.5 font-medium text-alerta">
      {children}
    </mark>
  );
}

export default function Privacidade() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-7 p-6 py-12">
      <header className="flex flex-col gap-2">
        <Link href="/login" className="font-corpo text-[14px] text-suave underline">
          voltar
        </Link>
        <h1 className="text-[30px] font-medium leading-tight tracking-[-0.03em]">
          O que a gente guarda, e o que não guarda
        </h1>
        <p className="font-corpo text-[15px] leading-relaxed text-suave-forte">
          Atualizada em 16 de setembro de 2026. Escrita para ser lida, não para
          proteger a gente de você.
        </p>
      </header>

      <Secao titulo="Quem é responsável">
        <p>
          O controlador dos dados é <Falta>a preencher</Falta>, e o encarregado
          de falar com você sobre privacidade é <Falta>a preencher</Falta>.
        </p>
        <p>
          Para qualquer pedido — ver, corrigir, levar embora ou apagar — escreva
          para <Falta>a preencher</Falta>. Enquanto esse endereço não existir,
          tudo que está nesta página você consegue fazer sozinho, pelo próprio
          app, em <strong>Perfil</strong>.
        </p>
      </Secao>

      <Secao titulo="O que a gente NÃO pede">
        <p>
          Esta lista vem primeiro de propósito. A gente não coleta, e não
          pretende coletar:
        </p>
        <ul className="ml-4 list-disc marker:text-suave">
          <li>CPF, RG ou qualquer documento</li>
          <li>seu endereço</li>
          <li>sua localização</li>
          <li>quanto você ganha exatamente</li>
          <li>sua data de nascimento</li>
        </ul>
      </Secao>

      <Secao titulo="O que a gente guarda">
        <p>
          <strong>Para você entrar:</strong> seu e-mail e sua senha. A senha
          fica com o Supabase, em hash — o app nunca vê ela.
        </p>
        <p>
          <strong>Para o plano funcionar:</strong> o nome que você escolheu (se
          escolheu), suas jornadas, os itens, e quanto cada um de vocês colocou.
          Isso é o produto.
        </p>
        <p>
          <strong>Se vocês quiserem dividir pela renda:</strong> a{" "}
          <strong>faixa</strong> de renda que você marcar. Nunca o valor exato.
          É opcional, e desligar no Perfil <strong>apaga o dado</strong>, não só
          a permissão de usá-lo.
        </p>
        <p>
          <strong>Se vocês puserem foto na jornada:</strong> a imagem, num
          espaço privado onde só vocês dois entram. Antes de subir, o app
          reprocessa a foto no seu próprio aparelho e{" "}
          <strong>joga fora todos os metadados</strong> — inclusive a
          coordenada de GPS que a câmera do celular costuma gravar.
        </p>
        <p>
          <strong>Se vocês puserem link de loja num item:</strong> o endereço da
          página e o preço que a gente leu. Quem vai até a loja é o nosso
          servidor, sem levar nada seu junto: a loja não fica sabendo que foi
          você. Esse histórico é apagado depois de{" "}
          <strong>180 dias</strong>.
        </p>
      </Secao>

      <Secao titulo="Quem vê o quê">
        <p>
          <strong>A outra pessoa do seu plano vê o plano inteiro</strong> —
          jornadas, valores e aportes, inclusive o que foi registrado antes de
          ela entrar. É por isso que entrar num plano não acontece só com um
          link: quem convidou precisa confirmar quem apareceu, olhando nome,
          apelido e o e-mail <strong>mascarado</strong> de quem pediu.
        </p>
        <p>
          <strong>Ninguém de fora do casal vê nada.</strong> Isso não é
          promessa: é regra no banco, em todas as tabelas, com teste automático
          que roda a cada mudança.
        </p>
        <p>
          <strong>A gente não vende e não compartilha seus dados, e nenhum
          anúncio é escolhido pelo que você é.</strong> Existe propaganda no
          app — sugestão de loja para os itens que vocês anotaram — e a seção
          seguinte conta exatamente como ela funciona.
        </p>
      </Secao>

      <Secao titulo="As sugestões de loja, e a nossa comissão">
        <p>
          Dentro de uma jornada, embaixo de cada item, o app pode mostrar uma
          sugestão de loja parceira. Ela vem marcada com a palavra{" "}
          <strong>Publicidade</strong> e com o nome da loja, sempre.{" "}
          <strong>É publicidade, e a gente ganha comissão</strong> se vocês
          comprarem por ali. O preço para vocês é o mesmo.
        </p>
        <p>
          <strong>A busca roda dentro do nosso banco, aqui no Brasil.</strong>{" "}
          O nome do item não sai daqui, e a loja não fica sabendo de você
          enquanto ninguém clicar — nem o seu endereço de internet. É por isso
          que o cartão não tem foto do produto: imagem buscada no servidor da
          loja entregaria o seu IP a ela só por você ter aberto a tela.
        </p>
        <p>
          Quando alguém clica, aí sim vira uma visita comum à loja, e o link
          vai <strong>sem dizer de onde você veio</strong>.
        </p>
        <p>
          A ordem do que aparece <strong>nunca é por comissão</strong>: a
          sugestão casa pelo nome que vocês escreveram, e nada do plano —
          quanto já juntaram, quanto falta, quem colocou — entra nessa conta.
        </p>
      </Secao>

      <Secao titulo="Métricas e e-mail de novidades">
        <p>
          Existem dois interruptores no Perfil para isso, e os dois nascem
          desligados. <strong>Hoje eles não fazem nada</strong>: não existe
          medição de uso ligada no app e a gente não manda e-mail de novidade.
          Eles guardam sua resposta, e só. Quando passarem a valer, esta página
          muda antes.
        </p>
      </Secao>

      <Secao titulo="Onde os dados ficam">
        <p>
          Em servidores <strong>no Brasil</strong> — região de São Paulo, no
          Supabase. Não há transferência para fora do país. A escolha foi feita
          na criação do projeto e não muda depois.
        </p>
        <p>
          O site é servido pela Vercel, que entrega as telas mas não guarda seus
          dados.
        </p>
      </Secao>

      <Secao titulo="Por quanto tempo">
        <ul className="ml-4 list-disc marker:text-suave">
          <li>Conta e plano: enquanto você quiser</li>
          <li>Convite não usado: 24h ou 72h, conforme o jeito de convidar</li>
          <li>Histórico de preço: 180 dias</li>
          <li>Registro de tentativas em excesso: 2 horas</li>
        </ul>
        <p>
          Quando você sai de um plano e a outra pessoa fica, seu nome e sua
          faixa de renda somem do vínculo, e seus aportes continuam lá com o
          valor intacto, como <strong>ex-membro</strong> — senão a conta do
          casal deixaria de fechar.
        </p>
      </Secao>

      <Secao titulo="O que você pode fazer, agora">
        <p>Tudo isto está em <strong>Perfil</strong>, e funciona na hora:</p>
        <ul className="ml-4 list-disc marker:text-suave">
          <li>
            <strong>Levar embora:</strong> baixar tudo em JSON ou em planilha
          </li>
          <li>
            <strong>Corrigir:</strong> editar nome, apelido, faixa, jornadas e
            aportes
          </li>
          <li>
            <strong>Revogar:</strong> desligar qualquer um dos três
            consentimentos
          </li>
          <li>
            <strong>Apagar a conta:</strong> some tudo que é seu, e as fotos
            saem junto
          </li>
        </ul>
        <p>
          No arquivo que você baixa, o e-mail da outra pessoa aparece mascarado.
          Os dados do plano são de dois, mas o endereço dela é dela.
        </p>
      </Secao>

      <Secao titulo="O que ainda não está pronto">
        <p>
          A gente prefere dizer: o app <strong>não tem monitoramento de
          erro</strong> ligado, o e-mail de confirmação sai por um remetente
          compartilhado do Supabase, e o backup do banco nunca foi restaurado em
          teste. Nada disso expõe seus dados, e todos estão na fila.
        </p>
      </Secao>

      <footer className="mt-2 border-t border-borda pt-5 font-corpo text-[13px] leading-relaxed text-suave">
        <p>
          Se algo aqui mudar de um jeito que importe para você, a gente avisa
          antes de a mudança valer.
        </p>
      </footer>
    </main>
  );
}
