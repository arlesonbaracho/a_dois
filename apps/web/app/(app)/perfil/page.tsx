import { meuPerfil, usuarioAtual } from "@repo/api";

import { criarClienteServidor } from "@/lib/supabase/server";

import { acaoSair } from "../../(auth)/actions";

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

      {/* O e-mail e a saída moravam na home. O design não tem nenhum dos dois
          lá — e o lugar deles é aqui, que é para onde o disco de iniciais do
          cabeçalho leva. */}
      <section className="mx-auto flex max-w-sm flex-col items-start gap-3 p-5 pt-0 lg:max-w-2xl lg:p-10 lg:pt-0">
        <p className="font-corpo text-[12px] text-suave-forte">
          Você entrou como {usuario?.email}.
        </p>
        <form action={acaoSair}>
          <button
            type="submit"
            className="rounded-full border border-contorno/60 bg-white px-5 py-2.5 text-[12.5px] font-semibold text-tinta transition hover:border-contorno active:scale-[0.97]"
          >
            Sair
          </button>
        </form>
      </section>
    </>
  );
}
