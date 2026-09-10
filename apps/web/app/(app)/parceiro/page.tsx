import { convitesAtivos, membrosDoCasal, meuCasal, pedidosPendentes } from "@repo/api";

import { criarClienteServidor } from "@/lib/supabase/server";

import { TelaParceiro } from "./form";

export default async function Parceiro() {
  const supabase = await criarClienteServidor();
  const casal = await meuCasal(supabase);

  const [membros, pedidos, ativos] = await Promise.all([
    membrosDoCasal(supabase),
    pedidosPendentes(supabase),
    casal ? convitesAtivos(supabase, casal.id) : Promise.resolve([]),
  ]);

  return (
    <TelaParceiro pedidos={pedidos} ativos={ativos} membros={membros.length} />
  );
}
