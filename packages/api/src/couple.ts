import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

type Client = SupabaseClient<Database>;

/**
 * O casal de quem está autenticado.
 *
 * Sem filtro por couple_id na consulta, e isso é intencional: a policy
 * couples_select já reduz a tabela à lista de casais do auth.uid(). Mandar o
 * couple_id daqui seria aceitar do cliente um dado que o JWT já responde.
 */
export async function meuCasal(client: Client) {
  const { data, error } = await client
    .from("couples")
    .select("id, created_at")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}
