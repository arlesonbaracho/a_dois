import { meuPedido, usuarioAtual } from "@repo/api";

import { Recado } from "@/components/form-ui";
import { criarClienteServidor } from "@/lib/supabase/server";

import { NovaJornada } from "./form";

export default async function Nova() {
  const supabase = await criarClienteServidor();
  const usuario = await usuarioAtual(supabase);
  const pedido = usuario ? await meuPedido(supabase, usuario.id) : null;

  return (
    <>
      {/* Quem pediu para entrar no plano de alguém está num plano solo, e
          criar jornada nele é o único jeito de quebrar o próprio pedido:
          `confirm_invite` recusa plano com movimentação. O aviso vem antes do
          formulário, e não depois do erro, que apareceria para a OUTRA pessoa. */}
      {pedido ? (
        <div className="mx-auto max-w-sm px-5 pt-5 lg:max-w-md lg:px-10 lg:pt-10">
          <Recado erro="Você pediu para entrar no plano de outra pessoa. Se criar uma jornada aqui, esse pedido não vai poder ser confirmado — espere a confirmação primeiro." />
        </div>
      ) : null}
      <NovaJornada />
    </>
  );
}
