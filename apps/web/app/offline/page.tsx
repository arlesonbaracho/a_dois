// Server component puro, sem JS de cliente: offline os chunks do Next não
// carregam, então esta tela precisa se sustentar só com o HTML — e por isso
// ela não usa nenhuma peça que dependa de "use client".
export default function Offline() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-[22px] font-medium tracking-[-0.03em]">Sem conexão</h1>
      <p className="max-w-[30ch] font-corpo text-[14px] leading-relaxed text-suave">
        O plano de vocês mora na nuvem, então precisamos de internet para
        carregar. Assim que a conexão voltar, é só recarregar a página.
      </p>
    </main>
  );
}
