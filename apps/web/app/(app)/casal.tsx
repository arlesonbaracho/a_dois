"use client";

import { useEffect, useState } from "react";

import { meuCasal, useSupabase } from "@repo/api";

/**
 * Prova de ponta a ponta do arranjo de sessão: o cliente do browser não
 * enxerga o cookie httpOnly, recebeu o token em memória, e mesmo assim o RLS
 * deixou passar — só o casal de quem está logado.
 */
export function Casal() {
  const supabase = useSupabase();
  const [texto, setTexto] = useState("Carregando…");

  useEffect(() => {
    meuCasal(supabase)
      .then((casal) =>
        setTexto(
          casal
            ? `Vocês são um casal por aqui desde ${new Date(casal.created_at).toLocaleDateString("pt-BR")}.`
            : "Você ainda não tem um casal por aqui.",
        ),
      )
      .catch(() => setTexto("Não consegui carregar isso agora."));
  }, [supabase]);

  return <p>{texto}</p>;
}
