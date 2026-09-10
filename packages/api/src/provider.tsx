"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useContext, useState, type ReactNode } from "react";

import type { Database } from "./database.types";

// Tipado no schema: toda consulta feita a partir daqui já sai conferida contra
// as tabelas da migration.
type Client = SupabaseClient<Database>;

// A camada de dados nunca cria o cliente Supabase: ela recebe um pronto.
// O web injeta o de cookies (@supabase/ssr) e o mobile vai injetar o de
// expo-secure-store. Os hooks daqui não sabem a diferença — é isso que faz a
// fase 2 ser adição em vez de reescrita.
const SupabaseContext = createContext<Client | null>(null);

/**
 * Monta o cliente Supabase E o cache do TanStack Query.
 *
 * Os dois juntos num provider só porque são a mesma coisa vista de dois
 * ângulos — "de onde vêm os dados desta árvore". Um segundo componente que só
 * envolvesse o primeiro seria um nome novo para um consumidor só.
 *
 * O QueryClient nasce em useState e não em módulo: em módulo ele seria
 * compartilhado entre requisições no servidor, e o cache de um casal vazaria
 * para a renderização do outro.
 */
export function SupabaseProvider({
  client,
  children,
}: {
  client: Client;
  children: ReactNode;
}) {
  const [cache] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // O Realtime é quem avisa que os dados mudaram. Sem isso, cada volta
            // para a aba dispararia refetch de tudo por cima do que já chegou ao
            // vivo — trabalho dobrado para mostrar a mesma tela.
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={cache}>
      <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>
    </QueryClientProvider>
  );
}

export function useSupabase(): Client {
  const client = useContext(SupabaseContext);
  if (!client) {
    throw new Error("useSupabase precisa estar dentro de <SupabaseProvider>");
  }
  return client;
}
