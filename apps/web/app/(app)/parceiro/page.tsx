import { convitesAtivos, membrosDoCasal, pedidosPendentes, usuarioAtual } from "@repo/api";
import { type CorDePessoa, coresDoCasal, ordemEstavel } from "@repo/core";

import { criarClienteServidor } from "@/lib/supabase/server";

import { TelaParceiro } from "./form";

export default async function Parceiro() {
  const supabase = await criarClienteServidor();

  const usuario = await usuarioAtual(supabase);
  const [membros, pedidos, ativos] = await Promise.all([
    membrosDoCasal(supabase),
    pedidosPendentes(supabase),
    convitesAtivos(supabase),
  ]);

  // Uma tela chamada "Quem divide o plano" que nunca dizia quem divide o plano.
  // As cores vêm de coresDoCasal, como em toda tela: a mesma pessoa é sempre a
  // mesma cor.
  const cores = coresDoCasal(
    membros.map((membro) => ({ userId: membro.user_id, papel: membro.role })),
  );

  const dupla = ordemEstavel(
    membros.map((membro) => ({
      userId: membro.user_id,
      papel: membro.role,
      nome: membro.display_name,
    })),
  ).map((membro) => ({
    chave: membro.userId,
    nome: membro.userId === usuario?.id ? "Você" : (membro.nome ?? "Sua dupla"),
    papel: membro.papel === "dono" ? "criou o plano" : "entrou por convite",
    cor: (cores.get(membro.userId) ?? "fora") as CorDePessoa,
  }));

  return (
    <TelaParceiro
      pedidos={pedidos}
      ativos={ativos}
      membros={membros.length}
      dupla={dupla}
    />
  );
}
