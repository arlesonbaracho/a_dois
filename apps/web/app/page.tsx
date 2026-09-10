import { APP_NAME, formatBRL, sumCents } from "@repo/core";

// Página provisória. Serve de prova de fumaça: se ela renderiza, o workspace
// está resolvendo @repo/core dentro do Next. As telas de verdade entram nos
// prompts de metas e aportes.
const aportes = [120000, 85000, 45000];

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">{APP_NAME}</h1>
      <p className="mt-2">
        Quanto vocês já juntaram: {formatBRL(sumCents(aportes))}
      </p>
    </main>
  );
}
