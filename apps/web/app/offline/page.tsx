// Server component puro, sem JS de cliente: offline os chunks do Next não
// carregam, então esta tela precisa se sustentar só com o HTML.
export default function Offline() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-[27px] font-bold tracking-[-0.04em]">Sem conexão</h1>
      <p className="max-w-xs text-balance">
        O plano de vocês mora na nuvem, então precisamos de internet para
        carregar. Assim que a conexão voltar, é só recarregar a página.
      </p>
    </main>
  );
}
