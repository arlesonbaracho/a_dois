"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createContext, useContext, type ReactNode } from "react";

// A camada de dados nunca cria o cliente Supabase: ela recebe um pronto.
// O web injeta o de cookies (@supabase/ssr) e o mobile vai injetar o de
// expo-secure-store. Os hooks daqui não sabem a diferença — é isso que faz a
// fase 2 ser adição em vez de reescrita.
const SupabaseContext = createContext<SupabaseClient | null>(null);

export function SupabaseProvider({
  client,
  children,
}: {
  client: SupabaseClient;
  children: ReactNode;
}) {
  return (
    <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>
  );
}

export function useSupabase(): SupabaseClient {
  const client = useContext(SupabaseContext);
  if (!client) {
    throw new Error("useSupabase precisa estar dentro de <SupabaseProvider>");
  }
  return client;
}
