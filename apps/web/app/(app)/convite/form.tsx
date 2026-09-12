"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Campo, Cartao, Enviar, Recado, Saida, type EstadoForm } from "@/components/form-ui";

import { acaoReivindicar } from "./actions";

export function FormConvite({ token, nome }: { token: string; nome: string }) {
  const [estado, acao] = useActionState<EstadoForm, FormData>(acaoReivindicar, {});

  if (estado.aviso) return <Esperando />;

  return (
    <Cartao
      titulo="Alguém quer dividir um plano com você"
      subtitulo={
        <>
          Este convite ainda <strong className="font-semibold text-tinta">não dá acesso a
          nada</strong>. Ao pedir para entrar, a pessoa que te convidou vê que foi você que
          apareceu e decide se confirma. Só depois disso vocês passam a ver o mesmo plano.
        </>
      }
    >
      <form action={acao} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <Campo
          rotulo="Como você quer aparecer para ela"
          name="display_name"
          defaultValue={nome}
          maxLength={80}
          required
        />
        <Recado erro={estado.erro} />
        <Enviar>Pedir para entrar</Enviar>
      </form>

      <Link href="/" className="self-start">
        <Saida>Agora não</Saida>
      </Link>
    </Cartao>
  );
}

export function Esperando() {
  return (
    <Cartao
      titulo="Pedido enviado"
      subtitulo="Agora é com a outra pessoa: ela precisa confirmar que foi você mesmo que apareceu. Enquanto isso você continua sem ver o plano dela — e ela, sem ver o seu."
    >
      <Link href="/" className="self-start">
        <Saida>Voltar</Saida>
      </Link>
    </Cartao>
  );
}
