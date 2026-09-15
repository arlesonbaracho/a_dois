/**
 * Nome do produto. Decidido em 2026-09-11, substituindo o provisório "A DOIS".
 * Vive aqui e é importado — nunca escrito à mão numa tela.
 */
export const APP_NAME = "Jornada";

/**
 * Cores da marca. Vivem aqui, e não no Tailwind, porque o manifest do PWA, a
 * meta `theme-color` e o `app.json` do Expo na fase 2 precisam do valor cru.
 *
 * São a superfície do design v2. As duas coincidem de propósito: a barra do
 * sistema e a splash têm que sumir dentro da tela. O verde é ação, nunca
 * fundo de página — daí não estar aqui.
 */
export const THEME_COLOR = "#FDFBF7";
export const BACKGROUND_COLOR = "#FDFBF7";

/**
 * A identificação da publicidade.
 *
 * Link de afiliado é publicidade: o CDC (art. 36) exige que o consumidor a
 * identifique como tal, e o guia do CONAR diz que o link sozinho NÃO basta
 * para esclarecer a relação comercial. Então a palavra aparece como TEXTO, em
 * cada sugestão — não como ícone, não como cor, não só na política.
 *
 * Vive aqui pelo mesmo motivo que APP_NAME e as cores de marca: a fase 2
 * precisa do valor cru, e duas telas não podem divergir no que declaram.
 *
 * O que a frase NÃO diz, de propósito: "o preço para vocês é o mesmo". É
 * afirmação de fato sobre o programa de afiliado, e só dá para sustentar
 * depois de ler os termos dele.
 */
export const AVISO_DE_PUBLICIDADE = "Publicidade";

/**
 * O convite das sugestões.
 *
 * Não diz "as melhores ofertas": a gente mostra o que encontrou na nossa
 * tabela, não o menor preço do mercado — e afirmar superioridade que não dá
 * para provar é publicidade enganosa (CDC, art. 37), o que sairia mais caro
 * que a frase.
 *
 * A identificação obrigatória não está aqui: ela é a palavra "Publicidade" em
 * CADA sugestão, onde ela é lida junto com o preço.
 */
export const CONVITE_DAS_OFERTAS =
  "Estas são as ofertas que a gente encontrou para os itens de vocês.";
