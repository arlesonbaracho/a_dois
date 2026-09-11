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
