import { convitesAtivos, membrosDoCasal, pedidosPendentes } from "@repo/api";

import { criarClienteServidor } from "@/lib/supabase/server";

import { TelaParceiro } from "./form";

export default async function Parceiro() {
  const supabase = await criarClienteServidor();

  const [membros, pedidos, ativos] = await Promise.all([
    membrosDoCasal(supabase),
    pedidosPendentes(supabase),
    convitesAtivos(supabase),
  ]);

  return (
    <TelaParceiro pedidos={pedidos} ativos={ativos} membros={membros.length} />
  );
}
