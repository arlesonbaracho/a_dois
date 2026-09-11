import { redirect } from "next/navigation";

import { ClienteSupabase } from "@/components/cliente-supabase";
import { Dock } from "@/components/dock";
import { RealtimeDoCasal } from "@/components/realtime";
import { criarClienteServidor } from "@/lib/supabase/server";

export default async function LayoutApp({ children }: LayoutProps<"/">) {
  const supabase = await criarClienteServidor();

  // getSession, e não getUser, porque aqui o que interessa é o access token em
  // si — o cliente do browser vai precisar dele. Quem confere se o token vale
  // é o middleware, que já rodou, e o PostgREST, que confere de novo a cada
  // consulta. O redirect abaixo é cinto e suspensório.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  return (
    <ClienteSupabase accessToken={session.access_token}>
      <RealtimeDoCasal />
      {/* O respiro embaixo (e à esquerda no desktop) é o espaço do dock, que é
          fixo: sem isto ele cobriria a última linha de toda tela. */}
      <div className="pb-28 lg:pb-0 lg:pl-24">{children}</div>
      <Dock />
    </ClienteSupabase>
  );
}
