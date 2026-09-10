import type { Metadata } from "next";

import { APP_NAME } from "@repo/core";

import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Um plano de metas para vocês dois.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
