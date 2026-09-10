"use client";

import { useMemo, type ReactNode } from "react";

import { SupabaseProvider } from "@repo/api";

import { criarClienteBrowser } from "@/lib/supabase/client";

/**
 * Entrega o cliente do browser para a árvore de componentes.
 *
 * O token chega do Server Component e fica só aqui, em memória. Quando o
 * middleware renova a sessão, o próximo render do servidor traz um token novo
 * e o useMemo monta outro cliente.
 */
export function ClienteSupabase({
  accessToken,
  children,
}: {
  accessToken: string;
  children: ReactNode;
}) {
  const client = useMemo(() => criarClienteBrowser(accessToken), [accessToken]);
  return <SupabaseProvider client={client}>{children}</SupabaseProvider>;
}
