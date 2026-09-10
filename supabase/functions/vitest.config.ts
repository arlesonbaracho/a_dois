import { defineConfig } from "vitest/config";

// Só os testes de _shared. As Edge Functions em si importam APIs do Deno e não
// rodam aqui — a lógica que merece teste mora em _shared justamente por isso.
export default defineConfig({
  test: { include: ["_shared/**/*.test.ts"] },
});
