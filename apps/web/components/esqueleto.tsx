/**
 * O que a tela mostra enquanto os dados não chegaram.
 *
 * Antes era a palavra "Carregando…" em cinza claro no canto de uma tela
 * inteira vazia — a primeira coisa que se via em /jornadas, na jornada aberta
 * e no perfil. Agora é a forma do que vem: os mesmos cartões, na mesma grade,
 * com a chapa listrada. A tela não muda de layout quando os dados chegam.
 *
 * `aria-live` e não `role="status"`: quem usa leitor de tela ouve "Carregando"
 * uma vez, e as caixas vazias ficam mudas.
 */
function Barra({ className = "" }: { className?: string }) {
  return <span className={`block rounded-full bg-areia ${className}`} />;
}

function ChapaVazia({ className }: { className: string }) {
  return (
    <span
      className={`block bg-[repeating-linear-gradient(115deg,var(--color-areia)_0_7px,var(--color-listra)_7px_14px)] ${className}`}
    />
  );
}

export function EsqueletoAlbum({ quantos = 4 }: { quantos?: number }) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="grid animate-pulse grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4"
    >
      <span className="sr-only">Carregando as jornadas de vocês…</span>
      {Array.from({ length: quantos }, (_, indice) => (
        <div key={indice} className="rounded-cartao border border-borda bg-white p-2">
          <ChapaVazia className="h-32 rounded-bloco lg:h-44" />
          <div className="px-1.5 pb-1 pt-2.5">
            <Barra className="h-3 w-3/4" />
            <Barra className="mt-1.5 h-2 w-1/3" />
            <Barra className="mt-2.5 h-1.5 w-full" />
            <Barra className="mt-1.5 h-2 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** A jornada aberta, com a mesma cabeça e o mesmo par de cartões da de verdade. */
export function EsqueletoJornada() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex animate-pulse flex-col gap-3.5">
      <span className="sr-only">Carregando esta jornada…</span>
      <div className="flex items-center gap-3">
        <span className="size-11 flex-none rounded-full border border-borda bg-white" />
        <span className="min-w-0 flex-1">
          <Barra className="h-4 w-2/3" />
          <Barra className="mt-1.5 h-2 w-1/3" />
        </span>
      </div>
      <ChapaVazia className="h-[188px] rounded-carta" />
      <Barra className="h-6 w-1/2" />
      <div className="flex gap-3">
        <Barra className="h-10 flex-1" />
        <Barra className="h-10 flex-1" />
      </div>
      <Barra className="h-2 w-full" />
      <div className="flex gap-2">
        <Barra className="h-9 w-20" />
        <Barra className="h-9 w-24" />
        <Barra className="h-9 w-28" />
      </div>
      <span className="h-40 rounded-cartao border border-borda bg-white" />
    </div>
  );
}
