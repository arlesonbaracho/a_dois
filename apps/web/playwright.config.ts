import { defineConfig, devices } from "@playwright/test";

/**
 * Os testes de ponta a ponta.
 *
 * Rodam contra o stack local do Supabase de verdade — auth, RLS, Realtime e
 * Edge Runtime reais. Um e2e contra mock provaria que o mock funciona.
 *
 *   npx supabase start && npm run test:e2e
 */
export default defineConfig({
  testDir: "./e2e",

  // Cada teste cria as próprias contas, com e-mail único. Sem estado
  // compartilhado, sem ordem obrigatória, sem teste que só passa sozinho.
  fullyParallel: true,

  // O servidor de desenvolvimento compila cada rota na primeira visita, e com
  // a suíte inteira em paralelo várias caem na mesma rota fria ao mesmo tempo.
  // Não é lentidão do app: é o preço de não fazer um build de produção por
  // rodada. Daí o teto de workers e o minuto de fôlego por teste.
  workers: 4,
  timeout: 60_000,

  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",

  // Os 5s padrão não bastam: em modo dev o Next compila a rota na PRIMEIRA
  // visita, e a primeira ida a /metas ou /aportes leva alguns segundos. Não é
  // lentidão do app, é o servidor de desenvolvimento — e rodar contra build de
  // produção custaria um build inteiro por rodada.
  expect: { timeout: 15_000 },

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    // O app é em português e mostra data e dinheiro formatados. Sem fixar
    // isso, o teste passa na sua máquina e falha na de quem tem outro fuso.
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
