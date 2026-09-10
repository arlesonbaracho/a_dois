"use client";

import { useRealtimeDoCasal } from "@repo/api";

/**
 * Um ponto só de subscrição para o app inteiro. Não desenha nada — está no
 * layout de (app) para que qualquer tela lá dentro já receba o que a outra
 * pessoa escreveu, sem cada uma ter que lembrar de assinar o canal.
 */
export function RealtimeDoCasal() {
  useRealtimeDoCasal();
  return null;
}
