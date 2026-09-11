import { Lista } from "./lista";

// Fino de propósito: metas, itens e aportes chegam por hook do TanStack Query,
// e o Realtime precisa de um componente de cliente para ouvir o canal. O nome
// do arquivo é o que o Expo Router vai espelhar na fase 2.
export default function Metas() {
  return <Lista />;
}
