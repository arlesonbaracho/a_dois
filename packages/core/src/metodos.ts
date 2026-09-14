import { dividirCentavos } from "./split";

/**
 * Os métodos de juntar dinheiro.
 *
 * Todos são a mesma conta com pesos diferentes, então não existe um motor por
 * método: existe `cronograma`, e o que muda é o vetor de pesos. Parcela igual
 * é peso 1 em todo período; o desafio das 52 semanas é peso 1, 2, 3… n; o
 * decrescente é o mesmo vetor ao contrário.
 *
 * Quem fecha a conta é `dividirCentavos`, que já garante que a soma das
 * parcelas é exatamente o alvo — sem isso, 52 arredondamentos deixariam a
 * última semana com alguns centavos de diferença, que é justamente o tipo de
 * erro que um app de casal não pode ter.
 */
export type Ritmo = "mes" | "semana" | "dia";
export type Forma = "igual" | "crescente" | "decrescente";

export type Metodo = {
  id: string;
  rotulo: string;
  dica: string;
  ritmo: Ritmo;
  forma: Forma;
  /** Quantos períodos oferecer. Vazio significa sem prazo. */
  opcoes: number[];
};

export const METODOS: readonly Metodo[] = [
  {
    id: "mes",
    rotulo: "Por mês",
    dica: "O mesmo valor todo mês, na data que vocês escolherem.",
    ritmo: "mes",
    forma: "igual",
    opcoes: [6, 12, 24, 36],
  },
  {
    id: "semana",
    rotulo: "Por semana",
    dica: "O mesmo valor toda semana. Some menos de cada vez, e some mais vezes.",
    ritmo: "semana",
    forma: "igual",
    opcoes: [12, 26, 52],
  },
  {
    id: "crescente",
    rotulo: "Semana crescente",
    dica: "Começa leve e vai subindo. É o desafio das 52 semanas, do jeito clássico.",
    ritmo: "semana",
    forma: "crescente",
    opcoes: [26, 52],
  },
  {
    id: "decrescente",
    rotulo: "Semana decrescente",
    dica: "Começa pesado e vai aliviando — enquanto a empolgação do começo ainda está alta.",
    ritmo: "semana",
    forma: "decrescente",
    opcoes: [26, 52],
  },
  {
    id: "dia",
    rotulo: "Por dia",
    dica: "Um pouquinho todo dia, subindo. É o desafio dos envelopes.",
    ritmo: "dia",
    forma: "crescente",
    opcoes: [100, 365],
  },
  {
    id: "livre",
    rotulo: "Quando der",
    dica: "Sem prazo e sem parcela. Vocês colocam quando puder.",
    ritmo: "mes",
    forma: "igual",
    opcoes: [],
  },
];

/** As parcelas de um método, em centavos, da primeira à última. */
export function cronograma(totalCents: number, forma: Forma, periodos: number): number[] {
  if (periodos < 1) throw new RangeError("Um cronograma precisa de pelo menos um período");

  const pesos = Array.from({ length: periodos }, (_, indice) =>
    forma === "igual" ? 1 : forma === "crescente" ? indice + 1 : periodos - indice,
  );
  return dividirCentavos(totalCents, pesos);
}

/**
 * A data em que o prazo termina.
 *
 * Mês é `setMonth`, e não trinta dias: doze meses a partir de 31 de janeiro é
 * 31 de janeiro, não 26 de dezembro.
 */
export function fimDoPrazo(ritmo: Ritmo, periodos: number, de: Date = new Date()): Date {
  const fim = new Date(de.getTime());
  if (ritmo === "mes") fim.setMonth(fim.getMonth() + periodos);
  else fim.setDate(fim.getDate() + periodos * (ritmo === "semana" ? 7 : 1));
  return fim;
}

/**
 * "mês"/"meses", "semana"/"semanas", "dia"/"dias".
 *
 * O plural entra aqui e não na tela: `nomeDoRitmo(ritmo) + "s"` dá "mêss", e
 * foi o que o e2e pegou.
 */
export function nomeDoRitmo(ritmo: Ritmo, plural = false): string {
  if (ritmo === "mes") return plural ? "meses" : "mês";
  if (ritmo === "semana") return plural ? "semanas" : "semana";
  return plural ? "dias" : "dia";
}
