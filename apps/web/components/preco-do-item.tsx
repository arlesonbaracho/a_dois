"use client";

import { useCotacoes } from "@repo/api";
import { formatBRL, variacaoDePreco } from "@repo/core";

/**
 * A linha de histórico de preço de um item.
 *
 * `price_quotes` já guardava a série desde o prompt 6, append-only e com RLS —
 * e nada no app lia. É esta peça que faz a tabela existir para alguém.
 *
 * Some sozinha com menos de duas cotações: uma consulta só não é histórico, e
 * "0% em 0 dias" não diz nada a ninguém.
 */
export function PrecoDoItem({ itemId }: { itemId: string }) {
  const { data: cotacoes } = useCotacoes(itemId);
  const variacao = variacaoDePreco(cotacoes ?? []);
  if (!variacao) return null;

  const caiu = variacao.diferencaCents < 0;
  const parado = variacao.diferencaCents === 0;

  return (
    <span className="mt-0.5 flex items-center gap-1.5 font-corpo text-[10.5px]">
      <span className="text-suave">
        {formatBRL(variacao.deCents)} → {formatBRL(variacao.paraCents)}
      </span>
      {parado ? (
        <span className="text-suave">sem mudar em {variacao.dias} dias</span>
      ) : (
        <span
          className={`rounded-full px-1.5 py-px font-semibold ${
            caiu ? "bg-verde text-creme" : "bg-alerta-suave text-alerta"
          }`}
        >
          {caiu ? "caiu" : "subiu"} {Math.abs(variacao.percentual)}% em {variacao.dias} dias
        </span>
      )}
    </span>
  );
}
