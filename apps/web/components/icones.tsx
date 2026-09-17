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

/** Mostrar/esconder o que foi digitado. O corte é um traço com opacidade. */
export const IconeOlho = ({ cortado = false, ...props }: Props & { cortado?: boolean }) => (
  <Base {...props}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3.1" />
    {cortado ? <path d="M4 20 20 4" /> : null}
  </Base>
);

/** As jornadas: a carta da frente e a borda da que vem atrás — o deck. */
export const IconeDeck = (props: Props) => (
  <Base {...props}>
    <rect x="4.6" y="3.6" width="14.8" height="12.8" rx="3.4" />
    <path d="M6.6 20.4h10.8" />
  </Base>
);

/** Apagar o último dígito do teclado de valor. */
export const IconeApagar = (props: Props) => (
  <Base {...props}>
    <path d="M9 5.5h10.5v13H9L3.5 12z" />
    <path d="m12 9.5 5 5M17 9.5l-5 5" />
  </Base>
);

export const IconeCompartilhar = (props: Props) => (
  <Base {...props}>
    <path d="M12 15V3.8M7.6 8.2 12 3.8l4.4 4.4" />
    <path d="M5 12.6v5.9A2 2 0 0 0 7 20.5h10a2 2 0 0 0 2-2v-5.9" />
  </Base>
);

export const IconeFechar = (props: Props) => (
  <Base {...props}>
    <path d="M6.8 6.8 17.2 17.2" />
    <path d="M17.2 6.8 6.8 17.2" />
  </Base>
);

export const IconeCopiar = (props: Props) => (
  <Base {...props}>
    <rect x="8.6" y="8.6" width="11.4" height="11.4" rx="2.4" />
    <path d="M15.4 5.4H6.4a2.4 2.4 0 0 0-2.4 2.4v9" />
  </Base>
);

/** O QR: quatro cantos e um miolo. Ninguém precisa ler, só reconhecer. */
export const IconeQr = (props: Props) => (
  <Base {...props}>
    <rect x="4" y="4" width="6.4" height="6.4" rx="1.4" />
    <rect x="13.6" y="4" width="6.4" height="6.4" rx="1.4" />
    <rect x="4" y="13.6" width="6.4" height="6.4" rx="1.4" />
    <path d="M13.6 13.6h3.2v3.2h3.2V20" />
  </Base>
);

export const IconeLink = (props: Props) => (
  <Base {...props}>
    <path d="M10.2 13.8a3.6 3.6 0 0 0 5.1 0l3-3a3.6 3.6 0 0 0-5.1-5.1l-1.2 1.2" />
    <path d="M13.8 10.2a3.6 3.6 0 0 0-5.1 0l-3 3a3.6 3.6 0 0 0 5.1 5.1l1.2-1.2" />
  </Base>
);

/** Conversa — o convite que sai por mensagem. Não é o logo de ninguém. */
export const IconeConversa = (props: Props) => (
  <Base {...props}>
    <path d="M20.4 12.2c0 3.9-3.8 7-8.4 7-1 0-2-.15-2.9-.43L4 20.4l1.7-4.2A6.6 6.6 0 0 1 3.6 12.2c0-3.9 3.8-7 8.4-7s8.4 3.1 8.4 7Z" />
  </Base>
);
