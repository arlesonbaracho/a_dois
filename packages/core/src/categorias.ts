/**
 * O vocabulário de categoria.
 *
 * O banco guarda texto livre em `goals.category`, e a tela mostrava o valor
 * cru: "bebe" sem acento, "geral" em minúscula, no meio de uma interface que
 * escreve em português de gente. Valor de coluna não é rótulo — a tradução
 * mora aqui, como função pura, porque a fase 2 vai precisar da mesma.
 *
 * As seis conhecidas são as que têm material desenhado na chapa da polaroide.
 * Qualquer outra continua valendo: ela só ganha a primeira letra maiúscula e
 * cai no material `geral`.
 */

export const CATEGORIAS = [
  "casa",
  "viagem",
  "reserva",
  "casamento",
  "bebe",
  "geral",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

const ROTULOS: Record<Categoria, string> = {
  casa: "Casa",
  viagem: "Viagem",
  reserva: "Reserva",
  casamento: "Casamento",
  bebe: "Bebê",
  geral: "Geral",
};

/** A forma canônica, ou nulo quando a categoria é livre. */
export function categoriaConhecida(bruta: string): Categoria | null {
  const limpa = bruta.trim().toLowerCase();
  return (CATEGORIAS as readonly string[]).includes(limpa) ? (limpa as Categoria) : null;
}

/**
 * Como a categoria aparece na tela.
 *
 * Só a primeira letra sobe: "casa do mar" vira "Casa do mar", e não
 * "Casa Do Mar" — quem escreveu escolheu as maiúsculas do resto.
 */
export function rotuloDaCategoria(bruta: string): string {
  const conhecida = categoriaConhecida(bruta);
  if (conhecida) return ROTULOS[conhecida];

  const limpa = bruta.trim();
  if (limpa === "") return ROTULOS.geral;
  return limpa[0].toUpperCase() + limpa.slice(1);
}
