# Evolução — A DOIS

Diário do projeto. Atualizado ao final de toda tarefa concluída.

**Última atualização:** 2026-09-09
**Fase atual:** Fase 1 — web-first
**Próximo passo:** Prompt 2 — schema completo + policies de RLS

---

## Feito

Registre com data e hash curto do commit. Nunca reescreva, só acrescente.

| Data | O que foi entregue | Commit |
|---|---|---|
| 2026-09-09 | Monorepo Turborepo + npm workspaces; `apps/web` em Next.js 16 (App Router, TS strict, Tailwind 4, ESLint 9) rodando; `packages/core` em TS puro com `money.ts` (centavos inteiros, 13 testes), `constants.ts`, schemas zod e tipos inferidos; `packages/api` com `SupabaseProvider`/`useSupabase` recebendo o cliente por injeção | `aab890d` |

---

## Pendente

O que está na fila imediata, em ordem de execução.

- [ ] **Prompt 2** — Schema completo + policies de RLS
- [ ] **Prompt 3** — Testes de isolamento entre casais
- [ ] **Prompt 4** — Configuração de PWA (manifest, service worker, instalável)
- [ ] **Prompt 5** — Autenticação com `@supabase/ssr`
- [ ] **Prompt 6** — Convite e saída do parceiro
- [ ] **Prompt 7** — Metas e itens com Realtime
- [ ] **Prompt 8** — Aportes e divisão proporcional
- [ ] **Prompt 9** — Guard anti-SSRF e extração de link de produto
- [ ] **Prompt 10** — Direitos do titular (exportar, excluir, consentimentos)
- [ ] **Prompt 11** — CI no GitHub Actions

---

## Falta (backlog)

Sabemos que precisa existir, mas ainda não entrou na fila.

### Produto
- [ ] Simulador com slider ("R$ 800/mês → nov/2027")
- [ ] Histórico de preço com alerta de queda
- [ ] Comparador à vista com desconto × parcelado com juros
- [ ] Templates de meta: primeiro apê, casamento, bebê, viagem
- [ ] Aprovação a dois para compras acima de um valor
- [ ] Calendário brasileiro: Black Friday, 13º, restituição do IR
- [ ] Integração Mercado Livre e programas de afiliados

### Fase 2 — Expo
- [ ] Criar `apps/mobile` com Expo + Expo Router
- [ ] Adapter de sessão com `expo-secure-store`
- [ ] NativeWind e portagem das telas
- [ ] Push notification (sem valor no corpo)
- [ ] `FLAG_SECURE` no Android e blur em background
- [ ] Build via EAS e publicação nas lojas

### Conformidade e operação
- [ ] `docs/ROPA.md` preenchido
- [ ] `docs/PRIVACY.md` publicado e linkado no rodapé
- [ ] Plano de resposta a incidente escrito (prazo ANPD: 3 dias úteis)
- [ ] Canal `privacidade@` ativo
- [ ] Retenção automática de `price_quotes` via `pg_cron`
- [ ] Backup com restauração testada de verdade
- [ ] Sentry com `beforeSend` removendo PII
- [ ] Revisão com especialista em proteção de dados antes de monetizar

---

## Decisões

Decisão técnica relevante, com o motivo em uma linha. Serve para o "por que diabos fizemos assim" daqui a seis meses.

| Data | Decisão | Motivo |
|---|---|---|
| — | Web-first como PWA, Expo na fase 2 | Validar com casais reais sem review de loja |
| — | Monorepo com `core` em TS puro | Portar para Expo sem reescrever a lógica |
| — | Banco em `sa-east-1` | Evita o capítulo de transferência internacional da LGPD |
| — | Dinheiro em centavos como inteiro | Ponto flutuante em app de casal vira discussão |
| 2026-09-09 | Import por nome de workspace (`@repo/core`), não path alias `@core/*` | Alias exigiria espelhar config no Next, no Vitest e no Metro; nome de workspace resolve sozinho nos três |
| 2026-09-09 | Escopo `@repo/*` nos pacotes | Nome do app é provisório; evita renomear pacote junto com a marca |
| 2026-09-09 | `packages/core` com `lib: ["ES2022"]`, sem DOM | O compilador barra `window`/`document`/`localStorage` — regra virou erro de build, não convenção |
| 2026-09-09 | Pacotes publicam TS cru, sem build step | Next compila via `transpilePackages` e o Metro lê TS direto; zero tsup, zero `dist/` |
| 2026-09-09 | Node 24 LTS instalado em `~/.local/node` | Máquina não tinha Node; tarball oficial sem sudo, e LTS é o que o EAS espera na fase 2 |

---

## Dívidas

O que ficou pela metade, com gambiarra, ou sem teste. Registre sem vergonha — dívida escondida é a que cobra juros.

| Onde | O que está torto | Gravidade |
|---|---|---|
| `apps/web` × fase 2 | Tailwind 4 usa config CSS-first (`@theme`), e o NativeWind estável (4.2.6) ainda espera Tailwind 3 — só o 5.0 preview cobre v4. Enquanto usarmos só classes básicas não dói; um design system em `@theme` não porta | Média |
| `packages/*` | Sem ESLint — só `apps/web` tem config. Não vale um pacote `eslint-config` com um consumidor só | Baixa |
| `packages/core/src/schemas.ts` | Tipos de domínio escritos antes do schema existir. O Prompt 2 (migrations) é a fonte de verdade e vai reconciliar campos | Média |
| `apps/web/app/page.tsx` | Home provisória, só prova de fumaça do workspace | Baixa |

---

## Bloqueios

O que está travado esperando algo de fora (decisão sua, conta de terceiro, resposta de suporte).

| Desde | O que trava | Esperando |
|---|---|---|
| — | — | — |
