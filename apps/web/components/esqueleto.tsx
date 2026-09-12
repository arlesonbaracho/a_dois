import { Polaroide } from "./pecas";

/**
 * O que a tela mostra enquanto os dados não chegaram.
 *
 * Antes era a palavra "Carregando…" em cinza claro no canto de uma tela
 * inteira de creme vazio — a primeira coisa que se via em /jornadas, na
 * jornada aberta e no perfil. Agora é a forma do que vem: polaroides em
 * branco, na grade certa, com a chapa listrada. A tela não muda de layout
 * quando os dados chegam, e o carregamento para de parecer erro.
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
      className={`block rounded-[3px] bg-[repeating-linear-gradient(115deg,var(--color-areia)_0_7px,var(--color-borda)_7px_14px)] ${className}`}
    />
  );
}

export function EsqueletoAlbum({ quantos = 4 }: { quantos?: number }) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="gap-3 columns-2 lg:columns-3 lg:gap-4"
    >
      <span className="sr-only">Carregando as jornadas de vocês…</span>
      {Array.from({ length: quantos }, (_, indice) => (
        <div key={indice} className="mb-3 block break-inside-avoid lg:mb-4">
          <Polaroide indice={indice} className="animate-pulse">
            <ChapaVazia className="h-24 lg:h-40" />
            <Barra className="mt-2 h-3 w-3/4" />
            <Barra className="mt-1.5 h-2 w-1/3" />
            <Barra className="mt-2 h-1.5 w-full" />
            <Barra className="mt-1.5 h-2 w-2/3" />
          </Polaroide>
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
      <div className="flex items-center gap-2.5">
        <span className="size-9 flex-none rounded-full bg-white" />
        <span className="min-w-0 flex-1">
          <Barra className="h-4 w-2/3" />
          <Barra className="mt-1.5 h-2 w-1/3" />
        </span>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <Polaroide indice={1}>
            <ChapaVazia className="h-20" />
            <Barra className="mt-2 h-1.5 w-full" />
            <Barra className="mt-1.5 h-2 w-2/3" />
          </Polaroide>
        </div>
        <div className="flex flex-1 flex-col gap-2.5">
          <span className="flex-1 rounded-bloco bg-areia" />
          <span className="flex-1 rounded-bloco bg-white" />
        </div>
      </div>
      <div className="flex gap-1.5">
        <Barra className="h-8 w-20" />
        <Barra className="h-8 w-24" />
        <Barra className="h-8 w-28" />
      </div>
      <span className="h-40 rounded-cartao bg-white" />
    </div>
  );
}
