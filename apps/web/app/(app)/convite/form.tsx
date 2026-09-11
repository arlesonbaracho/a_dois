"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Campo, Enviar, Recado, type EstadoForm } from "@/components/form-ui";

import { acaoReivindicar } from "./actions";

export function FormConvite({ token, nome }: { token: string; nome: string }) {
  const [estado, acao] = useActionState<EstadoForm, FormData>(acaoReivindicar, {});

  if (estado.aviso) return <Esperando />;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-[27px] font-bold tracking-[-0.04em]">Alguém quer dividir um plano com você</h1>
        <p className="mt-2">
          Este convite ainda <strong>não dá acesso a nada</strong>. Ao pedir para
          entrar, a pessoa que te convidou vê que foi você que apareceu e decide
          se confirma. Só depois disso vocês passam a ver o mesmo plano.
        </p>
      </div>

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

      <Link href="/" className="text-sm underline">
        Agora não
      </Link>
    </main>
  );
}

export function Esperando() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-[27px] font-bold tracking-[-0.04em]">Pedido enviado</h1>
      <p>
        Agora é com a outra pessoa: ela precisa confirmar que foi você mesmo que
        apareceu. Enquanto isso você continua sem ver o plano dela — e ela,
        sem ver o seu.
      </p>
      <Link href="/" className="text-sm underline">
        Voltar
      </Link>
    </main>
  );
}
