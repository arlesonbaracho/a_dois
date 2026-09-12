"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  exportarMeusDados,
  PALAVRA_DE_EXCLUSAO,
  type TipoConsentimento,
  useMeuPerfil,
  useSalvarConsentimento,
  useSupabase,
} from "@repo/api";
import { paraCsv } from "@repo/core";

import { Campo, Interruptor, Recado, Secundario } from "@/components/form-ui";
import { Explica, Secao } from "@/components/pecas";
import { baixar, nomeDoArquivo } from "@/lib/baixar";

import { acaoExcluirConta } from "./actions";

const CONSENTIMENTOS: {
  tipo: TipoConsentimento;
  coluna: "consent_analytics_at" | "consent_marketing_at" | "consent_income_band_at";
  rotulo: string;
  descricao: string;
}[] = [
  {
    tipo: "analytics",
    coluna: "consent_analytics_at",
    rotulo: "Métricas de uso",
    descricao:
      "Contar quais telas vocês usam, para a gente saber o que melhorar. Nunca acompanha valor, e-mail nem o conteúdo do plano. Hoje isto está só guardado: não existe nenhuma medição ligada no app.",
  },
  {
    tipo: "marketing",
    coluna: "consent_marketing_at",
    rotulo: "Novidades por e-mail",
    descricao:
      "Receber e-mail quando algo novo entrar no app. Nada de propaganda de terceiro, e seu e-mail não vai para lugar nenhum. Hoje isto está só guardado: a gente ainda não manda e-mail nenhum.",
  },
  {
    tipo: "income_band",
    coluna: "consent_income_band_at",
    rotulo: "Usar minha faixa de renda no cálculo",
    descricao:
      "Deixa o modo “pela renda de cada um” dividir as jornadas na proporção das faixas de vocês. Desligando, o modo fica indisponível e a divisão volta para meio a meio ou valor combinado — nada mais muda, e nada é apagado.",
  },
];

const dia = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

export function Privacidade({ userId }: { userId: string }) {
  const client = useSupabase();
  const router = useRouter();

  const { data: perfil, isPending: carregandoPerfil } = useMeuPerfil(userId);
  const salvarConsentimento = useSalvarConsentimento(userId);

  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [baixando, setBaixando] = useState<"json" | "csv" | null>(null);
  const [palavra, setPalavra] = useState("");
  const [confirmoPlano, setConfirmoPlano] = useState(false);

  async function exportar(formato: "json" | "csv") {
    setErro("");
    setAviso("");
    setBaixando(formato);
    try {
      const dados = await exportarMeusDados(client);
      if (formato === "json") {
        baixar(nomeDoArquivo("json"), JSON.stringify(dados, null, 2), "application/json");
      } else {
        baixar(nomeDoArquivo("csv"), paraCsv(dados), "text/csv;charset=utf-8");
      }
      setAviso("Pronto, o arquivo está na sua pasta de downloads.");
    } catch {
      setErro("Não consegui montar o arquivo agora. Tenta de novo?");
    } finally {
      setBaixando(null);
    }
  }

  async function alternar(tipo: TipoConsentimento, aceito: boolean) {
    setErro("");
    setAviso("");
    try {
      await salvarConsentimento.mutateAsync({ tipo, aceito });
    } catch {
      setErro("Não consegui salvar essa escolha agora. Tenta de novo?");
    }
  }

  async function excluir() {
    setErro("");
    const resultado = await acaoExcluirConta(palavra, confirmoPlano);

    if (resultado === "confirmacao_invalida") {
      setErro(`Escreva ${PALAVRA_DE_EXCLUSAO}, em maiúsculas, para confirmar.`);
      return;
    }
    if (resultado === "precisa_confirmar_apagar") {
      setErro(
        "Você é a única pessoa neste plano, então apagar sua conta apaga o plano inteiro. Marque a confirmação abaixo.",
      );
      setConfirmoPlano(false);
      return;
    }
    if (resultado === "erro") {
      setErro("Não consegui apagar agora. Tenta de novo?");
      return;
    }
    router.push("/login?aviso=conta_apagada");
  }

  const podeExcluir = palavra === PALAVRA_DE_EXCLUSAO;

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-8 p-5 pt-0 lg:max-w-2xl lg:p-10 lg:pt-0">
      <Recado erro={erro} aviso={aviso} />

      <section className="flex flex-col gap-3">
        <Secao>Levar seus dados</Secao>
        <Explica>
          Baixa um arquivo com tudo que a gente guarda: seu perfil, suas escolhas
          de privacidade, e o plano de vocês inteiro — jornadas, itens, aportes e os
          preços que a gente consultou. Como o plano é de duas pessoas, o arquivo
          leva junto o nome e os aportes de quem divide ele com você;{" "}
          <strong>o e-mail dessa pessoa sai escondido</strong>, e o token dos
          convites nunca sai.
        </Explica>
        <Explica>O JSON serve para outro aplicativo ler. O CSV abre no Excel.</Explica>
        <div className="flex gap-3">
          {/* Pílula, como todo controle do app: estes dois eram os únicos
              botões com canto de 18px, e destoavam de qualquer outra tela. */}
          <Secundario
            type="button"
            onClick={() => void exportar("json")}
            disabled={baixando !== null}
          >
            {baixando === "json" ? "Montando…" : "Baixar JSON"}
          </Secundario>
          <Secundario
            type="button"
            onClick={() => void exportar("csv")}
            disabled={baixando !== null}
          >
            {baixando === "csv" ? "Montando…" : "Baixar CSV"}
          </Secundario>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <Secao>O que você deixa a gente fazer</Secao>
          <Explica className="mt-1">
            Cada um destes é independente. Desligar um não desliga os outros, e
            desligar qualquer um não tira nenhuma função do app.
          </Explica>
        </div>

        {CONSENTIMENTOS.map((item) => {
          const desde = perfil?.[item.coluna] ?? null;
          return (
            <div key={item.tipo} className="flex flex-col gap-1">
              <Interruptor
                name={item.tipo}
                checked={desde !== null}
                onChange={(evento) => void alternar(item.tipo, evento.target.checked)}
                // Enquanto o perfil não chegou, `desde` é nulo e a caixa
                // aparece DESLIGADA — indistinguível de um "não" de verdade.
                // Quem clicasse nesse instante concederia achando que estava
                // revogando. Consentimento não pode depender de quem clica
                // devagar.
                disabled={carregandoPerfil || salvarConsentimento.isPending}
                rotulo={item.rotulo}
                descricao={item.descricao}
              />
              <p className="pl-7 font-corpo text-[11px] text-suave">
                {carregandoPerfil
                  ? "Carregando…"
                  : desde
                    ? `Você disse sim em ${dia(desde)}.`
                    : "Você não disse sim."}
              </p>
            </div>
          );
        })}
      </section>

      <section className="flex flex-col gap-3">
        <Secao className="text-alerta">Apagar minha conta</Secao>

        <div className="flex flex-col gap-2 rounded-cartao bg-alerta-suave p-4 font-corpo text-[12.5px] leading-relaxed text-alerta">
          <p className="font-semibold">O que some, e não volta:</p>
          <ul className="list-disc pl-5">
            <li>seu login, seu e-mail e sua senha</li>
            <li>seu nome, seu apelido e sua faixa de renda</li>
            <li>seu vínculo com este plano</li>
          </ul>
          <p className="font-semibold">O que fica:</p>
          <ul className="list-disc pl-5">
            <li>
              o dinheiro que você já colocou, com o valor intacto, mas sem o seu
              nome — vira “ex-membro”
            </li>
            <li>as jornadas, os itens e o histórico do plano, para quem fica</li>
          </ul>
          <p>
            Se você for a única pessoa do plano, ele é apagado inteiro junto com a
            sua conta. Nesse caso a gente pede mais uma confirmação.
          </p>
        </div>

        <Campo
          rotulo={`Para confirmar, escreva ${PALAVRA_DE_EXCLUSAO}`}
          name="confirmacao"
          value={palavra}
          onChange={(evento) => setPalavra(evento.target.value)}
          autoComplete="off"
          placeholder={PALAVRA_DE_EXCLUSAO}
        />

        <Interruptor
          name="confirmo_plano"
          checked={confirmoPlano}
          onChange={(evento) => setConfirmoPlano(evento.target.checked)}
          rotulo="Se eu for a única pessoa, apague o plano também"
          descricao="Só precisa marcar se você estiver sozinha no plano. Apaga jornadas, itens, aportes e histórico de preço."
        />

        <button
          type="button"
          onClick={() => void excluir()}
          disabled={!podeExcluir}
          className="self-start rounded-full bg-alerta px-5 py-3 text-[13px] font-semibold text-white transition hover:opacity-90 active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100"
        >
          Apagar minha conta
        </button>
      </section>
    </div>
  );
}
