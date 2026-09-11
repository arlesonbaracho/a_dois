import type { Metadata, Viewport } from "next";
import { Manrope, Outfit } from "next/font/google";

import { APP_NAME, THEME_COLOR } from "@repo/core";

import { Pwa } from "@/components/pwa";

import "./globals.css";

/**
 * As duas faces do design. Via `next/font`, que baixa no build e serve da
 * nossa origem: nenhuma requisição a `fonts.googleapis.com` em runtime, ou
 * seja, nenhum IP de quem usa o app indo para terceiro a cada visita. Num
 * projeto que pôs o banco em sa-east-1 para não abrir o capítulo de
 * transferência internacional, um <link> para o Google desfaria isso pela
 * porta dos fundos.
 *
 * Outfit carrega estrutura e número; Manrope carrega o que é dito em voz
 * humana.
 */
const display = Outfit({
  subsets: ["latin"],
  variable: "--fonte-display",
  display: "swap",
});

const corpo = Manrope({
  subsets: ["latin"],
  variable: "--fonte-corpo",
  display: "swap",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Um plano de metas para vocês dois.",
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
  // `capable: true` no Next 16 emite só `mobile-web-app-capable`, que o Safari
  // ignora. O iOS continua lendo a versão com prefixo, então ela vai à mão.
  other: { "apple-mobile-web-app-capable": "yes" },
  icons: { apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${corpo.variable}`}>
      <body>
        {children}
        <Pwa />
      </body>
    </html>
  );
}
