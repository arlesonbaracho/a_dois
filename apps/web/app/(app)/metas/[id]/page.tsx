import { Detalhe } from "./detalhe";

export default async function Meta({ params }: PageProps<"/metas/[id]">) {
  const { id } = await params;
  return <Detalhe goalId={id} />;
}
