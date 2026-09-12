import type { SVGProps } from "react";

/**
 * Os ícones do app, desenhados aqui.
 *
 * O design usa glifos Unicode (◎ ▤ ✓ ‹) como ícones. Glifo não é ícone: o
 * traço muda de peso conforme a fonte que o sistema tiver, e no Android alguns
 * viram emoji colorido. São sete desenhos — menos código que instalar uma
 * biblioteca, e nenhuma dependência nova.
 *
 * Todos no mesmo grid de 24, mesmo traço de 1.75, mesmas pontas arredondadas.
 * É isso que faz um conjunto parecer um conjunto.
 */
type Props = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconeCasa = (props: Props) => (
  <Base {...props}>
    <path d="M3.5 10.2 12 3.8l8.5 6.4V19a1.4 1.4 0 0 1-1.4 1.4H4.9A1.4 1.4 0 0 1 3.5 19z" />
    <path d="M9.4 20.4v-6.2h5.2v6.2" />
  </Base>
);

/** A pilha de polaroides: é o álbum, e é a lista de jornadas. */
export const IconePilha = (props: Props) => (
  <Base {...props}>
    <rect x="7.4" y="3.6" width="13" height="13" rx="1.8" />
    <path d="M16.4 20.4H5.4a1.8 1.8 0 0 1-1.8-1.8V7.6" />
    <path d="M10.6 12.4l2.1-2.1 3.1 3.1" />
  </Base>
);

export const IconeMais = (props: Props) => (
  <Base {...props}>
    <path d="M12 5.5v13M5.5 12h13" />
  </Base>
);

export const IconeVoltar = (props: Props) => (
  <Base {...props}>
    <path d="M14.5 5.5 8 12l6.5 6.5" />
  </Base>
);

export const IconeAvancar = (props: Props) => (
  <Base {...props}>
    <path d="M9.5 5.5 16 12l-6.5 6.5" />
  </Base>
);

export const IconeCheck = (props: Props) => (
  <Base {...props}>
    <path d="M5 12.5 9.8 17 19 6.8" />
  </Base>
);

export const IconeCirculo = (props: Props) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="7.4" />
  </Base>
);

/** Só para o disco do cabeçalho quando ninguém preencheu o nome ainda. */
export const IconePessoa = (props: Props) => (
  <Base {...props}>
    <circle cx="12" cy="8.4" r="3.6" />
    <path d="M5.2 20.2a6.8 6.8 0 0 1 13.6 0" />
  </Base>
);

/**
 * As marcas de categoria.
 *
 * Vivem na chapa da polaroide, grandes e em tom claro: é o desenho que estava
 * faltando para um retângulo de gradiente parar de parecer imagem que não
 * carregou. Mesmo grid de 24 e mesmo traço de 1.75 dos ícones de interface —
 * ampliadas, o traço engrossa junto, que é o que dá o ar de desenho à mão.
 */
export const MarcaCasa = IconeCasa;

/** Serra e sol: a paisagem que estaria na foto, e não o ícone de "enviar". */
export const MarcaViagem = (props: Props) => (
  <Base {...props}>
    <circle cx="16.9" cy="6.6" r="2.4" />
    <path d="M2.6 19.4 8.5 10.5l3.7 5.4" />
    <path d="M9.6 19.4 14.3 12.6l6.9 6.8" />
  </Base>
);

/** Reserva é o que cresce parado: um broto, não um cofre. */
export const MarcaReserva = (props: Props) => (
  <Base {...props}>
    <path d="M12 20.6v-8.2" />
    <path d="M12 12.4C12 8.9 14.6 6 18.2 6c0 3.5-2.6 6.4-6.2 6.4z" />
    <path d="M12 15.1C12 12.4 9.9 10 6.9 10c0 2.8 2.2 5.1 5.1 5.1z" />
  </Base>
);

export const MarcaCasamento = (props: Props) => (
  <Base {...props}>
    <circle cx="9.2" cy="14.4" r="5.4" />
    <circle cx="15.6" cy="10.4" r="5.4" />
  </Base>
);

/** Ursinho: cabeça e duas orelhas encaixadas, nunca soltas. */
export const MarcaBebe = (props: Props) => (
  <Base {...props}>
    <circle cx="12" cy="13.8" r="5.9" />
    <circle cx="6.9" cy="7.6" r="2.5" />
    <circle cx="17.1" cy="7.6" r="2.5" />
  </Base>
);

/** O brilho de quando ainda não se sabe o que é — e de quando dá certo. */
export const MarcaGeral = (props: Props) => (
  <Base {...props}>
    <path d="M12 3.2c0 4.4 2.2 8.8 8.8 8.8-6.6 0-8.8 4.4-8.8 8.8 0-4.4-2.2-8.8-8.8-8.8 6.6 0 8.8-4.4 8.8-8.8z" />
  </Base>
);
