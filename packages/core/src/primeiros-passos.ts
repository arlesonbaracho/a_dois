/**
 * Os primeiros passos do casal, derivados do que já aconteceu.
 *
 * Não existe estado de onboarding guardado em lugar nenhum, e é de propósito:
 * cada passo é uma pergunta que os dados já respondem. Sem coluna "tutorial
 * concluído" para ficar mentindo quando alguém apagar a última jornada, e sem
 * uma segunda verdade para manter alinhada com a primeira.
 */

export type EstadoDoPasso = "a-fazer" | "esperando" | "feito";

export type Passo = {
  id: "parceiro" | "jornada" | "aporte" | "faixa";
  titulo: string;
  dica: string;
  href: string;
  estado: EstadoDoPasso;
  /** Opcional não segura o bloco aceso, e não cobra nada de ninguém. */
  opcional: boolean;
};

export type FatosDoComeco = {
  /** Quantas pessoas ativas no casal. 1 = ainda sozinho. */
  membros: number;
  /** Já existe convite em aberto, ou alguém já pediu para entrar. */
  conviteEmAndamento: boolean;
  jornadas: number;
  totalCents: number;
  /** A faixa de renda de quem está olhando. Nula é o normal: é opcional. */
  minhaFaixa: string | null;
};

export function primeirosPassos(fatos: FatosDoComeco): Passo[] {
  return [
    {
      id: "parceiro",
      titulo: "Chamar quem divide o plano com você",
      // O terceiro estado é o que separa ajudar de cobrar: sem ele, quem já
      // mandou o convite continua sendo lembrado de mandar o convite.
      dica:
        fatos.membros >= 2
          ? "Vocês dois estão aqui."
          : fatos.conviteEmAndamento
            ? "Convite enviado. Falta a outra pessoa aparecer — e você confirmar quem é."
            : "O plano é de dois. Dá para chamar por link, e-mail ou apelido.",
      href: "/parceiro",
      estado:
        fatos.membros >= 2 ? "feito" : fatos.conviteEmAndamento ? "esperando" : "a-fazer",
      opcional: false,
    },
    {
      id: "jornada",
      titulo: "Criar a primeira jornada",
      dica: "A viagem, a entrada do apê, ou só um fundo do sossego.",
      href: "/jornadas",
      estado: fatos.jornadas > 0 ? "feito" : "a-fazer",
      opcional: false,
    },
    {
      id: "aporte",
      titulo: "Anotar o primeiro aporte",
      dica: "É o que faz a barra sair do zero e os dois verem o mesmo número.",
      href: "/aportes",
      estado: fatos.totalCents > 0 ? "feito" : "a-fazer",
      opcional: false,
    },
    {
      id: "faixa",
      titulo: "Dizer sua faixa de renda",
      dica:
        "Só se vocês quiserem dividir pela renda de cada um. Nunca pedimos o valor exato, só a faixa.",
      href: "/aportes",
      estado: fatos.minhaFaixa ? "feito" : "a-fazer",
      opcional: true,
    },
  ];
}

/**
 * O bloco fica aceso enquanto algum passo OBRIGATÓRIO estiver pendente.
 *
 * O opcional de fora: se ele contasse, quem nunca quis dividir pela renda
 * carregaria a lista na home para sempre — e uma lista que não acaba deixa de
 * ser primeiro passo e vira moldura.
 */
export function faltaComecar(passos: readonly Passo[]): boolean {
  return passos.some((passo) => !passo.opcional && passo.estado !== "feito");
}
