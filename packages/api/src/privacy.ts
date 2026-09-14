import type { SupabaseClient } from "@supabase/supabase-js";

import { apagarCapasDoPlano, oPlanoVaiMorrer } from "./couple";
import type { Database } from "./database.types";

type Client = SupabaseClient<Database>;

export type TipoConsentimento = "analytics" | "marketing" | "income_band";

/** O que delete_account responde. Nenhum deles é erro: são respostas. */
export type ResultadoExclusao =
  | "ok"
  | "conta_e_plano_apagados"
  | "precisa_confirmar_apagar"
  | "confirmacao_invalida"
  | "sem_plano";

/** A palavra que o banco exige. Aqui só para a tela poder mostrá-la. */
export const PALAVRA_DE_EXCLUSAO = "EXCLUIR";

/**
 * Tudo que o app guarda sobre a pessoa e sobre o plano do casal.
 *
 * Vem como jsonb de uma função definer: nenhuma policy conseguiria montar isso,
 * porque parte dele mora em auth.users, que não é exposta a ninguém.
 */
export async function exportarMeusDados(client: Client): Promise<unknown> {
  const { data, error } = await client.rpc("export_my_data");
  if (error) throw error;
  return data;
}

/** Liga ou desliga UM consentimento. Os outros não são tocados. */
export async function salvarConsentimento(
  client: Client,
  tipo: TipoConsentimento,
  aceito: boolean,
): Promise<void> {
  const { error } = await client.rpc("set_consent", { p_tipo: tipo, p_aceito: aceito });
  if (error) throw error;
}

/**
 * Apaga a conta.
 *
 * A palavra vai para o banco e é conferida lá. Mandar errado devolve
 * `confirmacao_invalida` sem escrever nada — a proteção não mora na tela.
 */
export async function excluirConta(
  client: Client,
  confirmacao: string,
  confirmoApagarPlano = false,
): Promise<ResultadoExclusao> {
  // `delete_account` chama o `leave_couple` do BANCO, não o `sairDoCasal`
  // daqui — então a remoção das capas precisa acontecer nesta função também.
  //
  // As três condições importam, e a do meio é a que eu errei primeiro: com
  // parceiro no casal o plano SOBREVIVE à saída de um, e apagar as capas ali
  // seria destruir foto de quem fica. E a palavra vem antes de tudo, para não
  // apagar nada de quem digitou errado e vai receber `confirmacao_invalida`.
  if (
    confirmacao === PALAVRA_DE_EXCLUSAO &&
    (await oPlanoVaiMorrer(client, confirmoApagarPlano))
  ) {
    await apagarCapasDoPlano(client);
  }

  const { data, error } = await client.rpc("delete_account", {
    p_confirmacao: confirmacao,
    p_confirmo_apagar: confirmoApagarPlano,
  });
  if (error) throw error;
  return (data ?? "sem_plano") as ResultadoExclusao;
}
