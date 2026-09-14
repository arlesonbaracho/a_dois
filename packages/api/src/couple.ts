import type { SupabaseClient } from "@supabase/supabase-js";

import { CAPA_BUCKET } from "@repo/core";

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
    .select("id, created_at, split_rule")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export type MembroDoCasal = Database["public"]["Tables"]["couple_members"]["Row"];

/**
 * Quem está no casal agora. Sem filtro por couple_id de novo: a policy de
 * select já reduz a tabela aos casais do auth.uid().
 */
export async function membrosDoCasal(client: Client): Promise<MembroDoCasal[]> {
  // O nome de exibição mora em DUAS tabelas, e a do vínculo é a incompleta:
  // `confirm_invite` insere em `couple_members` SEM display_name, então quem
  // entra por convite nunca tem o de lá; e `set_profile` grava só em
  // `profiles`, então quem edita o perfil depois do cadastro também não. Ler
  // só o do vínculo é o que fazia a outra pessoa aparecer como "Sua dupla"
  // para sempre, e a home dizer "oi, vocês" com os dois nomes preenchidos.
  //
  // O perfil ganha, e o do vínculo é a rede: ele existe para os casos em que
  // o perfil está vazio, e é o que a saída do casal apaga.
  const [membros, perfis] = await Promise.all([
    client.from("couple_members").select("*").is("left_at", null).order("created_at"),
    client.from("profiles").select("user_id, display_name"),
  ]);

  if (membros.error) throw membros.error;
  if (perfis.error) throw perfis.error;

  const doPerfil = new Map((perfis.data ?? []).map((perfil) => [perfil.user_id, perfil.display_name]));
  return (membros.data ?? []).map((membro) => ({
    ...membro,
    display_name: doPerfil.get(membro.user_id) ?? membro.display_name,
  }));
}

/**
 * Apaga as capas do plano ANTES de o plano deixar de existir.
 *
 * Foto é dado pessoal, e o Art. 18, VI dá o direito de eliminá-la. Sem isto
 * ela ficava no bucket para sempre depois que a conta sumia: inalcançável
 * (a policy pergunta por um casal que não existe mais), mas guardada — e
 * "ninguém consegue ver" não é o mesmo que "foi eliminado".
 *
 * Tem que ser ANTES, e não depois: assim que o casal sai do banco, a policy
 * `capas_delete` passa a negar, porque ela confere `is_couple_member` de um
 * casal que já era.
 *
 * Mora aqui, e não em capas.ts, por uma razão chata e real: capas.ts importa
 * `meuCasal` deste arquivo, e a volta fecharia um ciclo de módulos.
 *
 * ponytail: melhor esforço, e o teto é o órfão. Só alcança capa que alguma
 * jornada ainda referencia — arquivo que sobrou de uma troca malsucedida fica.
 * O varredor completo é Edge Function com service role, e está em Dívidas.
 */
export async function apagarCapasDoPlano(client: Client): Promise<void> {
  const { data } = await client
    .from("goals")
    .select("cover_path")
    .not("cover_path", "is", null);

  const caminhos = (data ?? [])
    .map((jornada) => jornada.cover_path)
    .filter((caminho): caminho is string => Boolean(caminho));

  if (caminhos.length === 0) return;

  // Sem `throw`: falhar aqui impediria a pessoa de apagar a conta dela, e o
  // direito de eliminação não pode depender de o Storage estar de bom humor.
  await client.storage.from(CAPA_BUCKET).remove(caminhos);
}

/**
 * O plano vai deixar de existir nesta chamada?
 *
 * Só quando quem está saindo é o último membro ativo E confirmou. Com parceiro
 * no casal, o plano sobrevive — e as capas são dele também, então não podem
 * sair junto.
 */
export async function oPlanoVaiMorrer(client: Client, confirmou: boolean): Promise<boolean> {
  if (!confirmou) return false;
  const membros = await membrosDoCasal(client);
  return membros.length === 1;
}

export type ResultadoSaida = "ok" | "plano_apagado" | "precisa_confirmar_apagar" | "sem_plano";

/**
 * Sai do casal.
 *
 * `confirmoApagar` só importa para quem está sozinho: nesse caso a saída apaga
 * o plano inteiro, e sem a confirmação a função devolve
 * `precisa_confirmar_apagar` sem escrever nada.
 *
 * A sessão morre junto, então quem chama isto vai ser deslogado na sequência.
 */
export async function sairDoCasal(
  client: Client,
  confirmoApagar = false,
): Promise<ResultadoSaida> {
  // As capas saem antes, e só quando o plano vai mesmo acabar.
  if (await oPlanoVaiMorrer(client, confirmoApagar)) {
    await apagarCapasDoPlano(client);
  }

  const { data, error } = await client.rpc("leave_couple", {
    p_confirmo_apagar: confirmoApagar,
  });
  if (error) throw error;
  return (data ?? "sem_plano") as ResultadoSaida;
}
