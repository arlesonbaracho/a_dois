/**
 * O que o histórico de preço quer dizer.
 *
 * `price_quotes` é append-only: cada consulta a uma loja vira uma linha. A
 * pergunta que o casal faz olhando isso é sempre a mesma — "está caindo ou
 * está subindo, e quanto?". Aqui mora a conta; a tela só formata.
 */

export type Cotacao = {
  precoCents: number;
  quandoISO: string;
};

export type Variacao = {
  deCents: number;
  paraCents: number;
  /** Negativo quando caiu. Em centavos, como todo dinheiro daqui. */
  diferencaCents: number;
  /** Inteiro, já arredondado. Negativo quando caiu. */
  percentual: number;
  dias: number;
};

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * A variação entre a cotação mais antiga e a mais nova.
 *
 * `null` com menos de duas cotações, e isso não é erro: uma consulta só não é
 * histórico, e a tela não mostra linha nenhuma em vez de mostrar "0%".
 *
 * Ordena por data aqui em vez de confiar em quem chamou — a consulta pode vir
 * em qualquer ordem, e uma variação invertida diria ao casal que o preço subiu
 * quando ele caiu.
 */
export function variacaoDePreco(cotacoes: readonly Cotacao[]): Variacao | null {
  if (cotacoes.length < 2) return null;

  const ordenadas = [...cotacoes].sort(
    (a, b) => Date.parse(a.quandoISO) - Date.parse(b.quandoISO),
  );
  const primeira = ordenadas[0];
  const ultima = ordenadas[ordenadas.length - 1];

  const diferencaCents = ultima.precoCents - primeira.precoCents;

  // Preço zero não divide. Acontece com loja que devolve "0" em promoção mal
  // marcada, e virar Infinity na tela é pior que não mostrar porcentagem.
  const percentual =
    primeira.precoCents === 0
      ? 0
      : Math.round((diferencaCents / primeira.precoCents) * 100);

  return {
    deCents: primeira.precoCents,
    paraCents: ultima.precoCents,
    diferencaCents,
    percentual,
    dias: Math.max(
      0,
      Math.round((Date.parse(ultima.quandoISO) - Date.parse(primeira.quandoISO)) / DIA_MS),
    ),
  };
}

/** Por que a busca na loja não deu certo. */
export type MotivoDaFalha = "endereco_recusado" | "loja_nao_respondeu" | "outro";

/**
 * Traduz o código que a Edge Function devolve para o motivo que a tela conhece.
 *
 * Mora aqui, e não no `packages/api`, por dois motivos: é regra de negócio
 * (quais falhas o produto distingue), e é o único jeito de testá-la sem subir
 * o runtime de Edge Functions.
 *
 * Desconhecido cai em "outro" de propósito: código novo na função não pode
 * virar tela branca no app antigo.
 */
export function motivoDaFalha(codigo: string): MotivoDaFalha {
  if (codigo === "url_recusada") return "endereco_recusado";
  if (codigo === "nao_consegui_ler") return "loja_nao_respondeu";
  return "outro";
}
