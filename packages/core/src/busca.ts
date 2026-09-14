/**
 * O nome que o casal anotou, virado em consulta de busca.
 *
 * `plainto_tsquery` liga os termos com E: "Geladeira 375L" exigiria os dois
 * tokens, e não acharia "geladeira frost free 375 litros" — que é justamente o
 * que a pessoa quer ver. Sugestão é OU, com o ranking do Postgres decidindo
 * quem vem primeiro.
 *
 * Mora aqui e não na consulta porque é regra, e regra se testa: uma string mal
 * montada não devolve zero resultado, ela quebra o `to_tsquery` com erro de
 * sintaxe.
 */
export function termosDeBusca(nome: string): string {
  return (
    nome
      .toLowerCase()
      // Só letra, número e espaço: `&`, `|`, `!`, `(` e `:` são operadores do
      // to_tsquery, e chegariam lá como sintaxe em vez de texto.
      .replace(/[^\p{L}\p{N}\s]+/gu, " ")
      .split(/\s+/)
      // Abaixo de três letras é preposição ou número solto: "de", "e", "3"
      // casam com meio catálogo e só atrapalham o ranking.
      .filter((termo) => termo.length >= 3)
      // Seis basta. Nome de item não é frase, e query gigante só custa tempo.
      .slice(0, 6)
      .join(" | ")
  );
}
