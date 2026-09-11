import { Detalhe } from "./detalhe";

export default async function Meta({ params }: PageProps<"/jornadas/[id]">) {
  const { id } = await params;
  return <Detalhe goalId={id} />;
}
