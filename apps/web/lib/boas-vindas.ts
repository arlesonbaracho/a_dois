/**
 * O cookie que diz que este navegador já viu as boas-vindas.
 *
 * Cookie, e não coluna no banco: é "já vi a apresentação", não um fato do
 * casal — e uma coluna "tutorial concluído" seria uma segunda verdade para
 * manter alinhada. Cookie e não localStorage: o servidor lê, então a home já
 * nasce sem os slides para quem viu, sem piscar. Não carrega valor nenhum.
 *
 * Mora aqui, e não em `boas-vindas.tsx`: constante exportada de um módulo
 * "use client" chega ao Server Component como referência de cliente, não como
 * o texto.
 */
export const COOKIE_BOAS_VINDAS = "jornada-boas-vindas";
