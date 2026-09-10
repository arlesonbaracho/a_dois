import { meuPerfil, usuarioAtual } from "@repo/api";

import { criarClienteServidor } from "@/lib/supabase/server";

import { FormPerfil } from "./form";
import { Privacidade } from "./privacidade";

export default async function Perfil() {
  const supabase = await criarClienteServidor();
  const usuario = await usuarioAtual(supabase);
  const perfil = usuario ? await meuPerfil(supabase, usuario.id) : null;

  return (
    <>
      <FormPerfil perfil={perfil} />
      {usuario ? <Privacidade userId={usuario.id} /> : null}
    </>
  );
}
