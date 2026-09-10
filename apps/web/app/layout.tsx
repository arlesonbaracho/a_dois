import type { Metadata, Viewport } from "next";

import { APP_NAME, THEME_COLOR } from "@repo/core";

import { Pwa } from "@/components/pwa";

import "./globals.css";

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
    <html lang="pt-BR">
      <body>
        {children}
        <Pwa />
      </body>
    </html>
  );
}
