# A DOIS

App de planejamento de metas para casais. Duas pessoas, um plano compartilhado, sincronizado em tempo real, com sugestão de onde comprar cada item.

Nome provisório. Não espalhe "A DOIS" pelo código — use `APP_NAME` de `packages/core/src/constants.ts`.

## Estratégia

Começamos **web**, como PWA em Next.js, para validar com casais reais sem passar pela review das lojas. O app nativo em Expo vem depois, e **precisa ser uma adição, não uma reescrita**. Por isso o monorepo e as regras de portabilidade abaixo não são negociáveis.

## Stack

- **Monorepo**: Turborepo + npm workspaces
- **Web**: Next.js (App Router) + TypeScript strict + Tailwind, instalável como PWA
- **Mobile (fase 2)**: Expo + Expo Router + NativeWind
- **Backend**: Supabase (Postgres, Auth, Realtime, Storage, Edge Functions em Deno)
- **Região do banco**: `sa-east-1` (São Paulo) — requisito de LGPD do projeto
- **Dados**: TanStack Query. Estado de UI: Zustand. Formulários: react-hook-form + zod
- **Testes**: Vitest (unitário), script SQL (RLS), Playwright (e2e web)
- **Deploy**: Vercel (web) + Supabase Cloud

## Estrutura

```
apps/
  web/                  Next.js PWA — única pasta que pode tocar em DOM
    app/                App Router
      (auth)/           login, cadastro, aceitar-convite
      (app)/            metas, aportes, perfil
    components/         UI web (Tailwind)
    lib/supabase/       client browser + server (@supabase/ssr)
  mobile/               vazio até a fase 2 (Expo entra aqui)
packages/
  core/                 lógica pura: money, split, tipos, zod schemas, constants
  api/                  acesso a dados Supabase + hooks TanStack Query
supabase/
  migrations/           SQL versionado (schema + policies)
  functions/            Edge Functions
    _shared/            ssrf-guard.ts, auth.ts
  tests/                isolamento RLS
docs/                   SECURITY.md, PRIVACY.md, ROPA.md
EVOLUCAO.md             diário do projeto (ver seção própria)
```

## Regras de portabilidade

O objetivo é que 70% do código já esteja pronto quando o Expo entrar.

1. **`packages/core` é TypeScript puro.** Zero import de React, `next/*`, `expo-*`, `window`, `document` ou `localStorage`. Se precisar de algo do ambiente, receba por parâmetro.
2. **`packages/api` não cria o cliente Supabase.** Ele recebe uma instância pronta via provider. Web injeta o cliente de `@supabase/ssr` (cookies); mobile vai injetar o de `expo-secure-store`. A camada de dados não sabe a diferença.
3. **Nenhum acesso a `window`, `document`, `localStorage` ou `navigator` fora de `apps/web`.**
4. **Toda regra de negócio vive em `packages/core`**, como função pura e testada. Componente não calcula: ele chama.
5. **Espelhe a estrutura de rotas.** `app/(app)/metas/[id]/page.tsx` no web vira `app/(app)/metas/[id].tsx` no Expo Router. Manter os mesmos nomes torna a portagem mecânica.
6. **Só bibliotecas que rodam nos dois lados** em `core` e `api`: zod, date-fns, TanStack Query, supabase-js. Nada de biblioteca só-web nesses pacotes.
7. **Ícones com `lucide-react`** no web (o equivalente `lucide-react-native` tem os mesmos nomes).
8. **Tailwind com classes básicas.** Evite seletores e utilitários que o NativeWind não suporta, para que as strings de classe portem depois.

## Regras invioláveis de segurança

Um PR que viole qualquer uma delas está errado.

1. **Toda tabela tem `couple_id` e RLS habilitado.** Tabela sem `enable row level security` é vazamento público, porque a `anon key` fica embarcada no cliente.
2. **Nenhuma policy usa `using (true)`** nem se contenta com `auth.uid() is not null`.
3. **`couple_id` sempre vem do JWT**, nunca do corpo da requisição. Aceitar do cliente é IDOR.
4. **`SUPABASE_SERVICE_ROLE_KEY` nunca sai do servidor.** Nunca em variável com prefixo `NEXT_PUBLIC_`, nunca importada em Client Component. Só em Route Handler, Server Action ou Edge Function.
5. **Toda Edge Function e Route Handler valida o JWT antes de qualquer lógica.**
6. **Fetch de URL externa passa pelo guard anti-SSRF** em `supabase/functions/_shared/ssrf-guard.ts`. Nunca `fetch` direto com URL vinda do usuário.
7. **Dinheiro é `integer` em centavos.** Nunca float. Formatação só na UI, via `formatBRL()` de `packages/core`.
8. **Nenhum log, breadcrumb ou evento de Sentry carrega valor monetário, e-mail ou `couple_id`.**
9. **Sessão em cookie `httpOnly` + `secure` + `sameSite=lax`**, via `@supabase/ssr`. Nunca token em `localStorage`.
10. **Service worker não faz cache de resposta autenticada.** Só do shell estático.

## Modelo de dados

| Tabela | Conteúdo |
|---|---|
| `couples` | O espaço compartilhado |
| `couple_members` | Vínculo usuário ↔ casal, papel, regra de divisão, faixa de renda |
| `profiles` | Perfil mínimo por pessoa: nome de exibição, apelido, avatar. **Sem leitura ampla** — só a própria linha e a de quem divide casal |
| `couple_invites` | Convites como **máquina de estados**. Ver abaixo |
| `goals` | Metas: título, categoria, `target_amount_cents`, prazo, prioridade |
| `goal_items` | Itens da meta: nome, `estimated_price_cents`, status, URL escolhida |
| `contributions` | Aportes: `user_id`, `amount_cents`, data, meta |
| `price_quotes` | Histórico de preço. **Append-only: nunca update, nunca delete.** |
| `rate_limit_hits` | Batidas de rate limit. RLS ligado e **zero policies**: só funções `security definer` alcançam |

### `couple_invites`: reivindicar não concede, confirmar concede

Aceitar um convite **não dá acesso a nada**: cria um pedido. Quem convidou vê
quem apareceu do outro lado — nome, apelido, e-mail **mascarado** e idade da
conta — e só a confirmação cria o vínculo em `couple_members`. O canal é
entrega; a autorização é sempre do lado de quem convidou.

Seis estados, e só estas transições:

```
pending  -> claimed | revoked | expired
claimed  -> confirmed | rejected | revoked | expired
confirmed, rejected, revoked, expired  são terminais
```

Três canais, com prazo proporcional à exposição: `email` e `nickname` amarram o
convite a alguém e valem 72h; `link` não amarra a ninguém e vale 24h. Token de
32 bytes, guardado só como **SHA-256**. Máximo 3 em aberto por casal e 5 por
hora.

Regras que não se negociam nesta tabela:

- **A tabela nega insert, update e delete nas policies.** Toda transição passa
  por função `security definer` que confere o estado de origem. Update direto
  de `status` seria a máquina de estados inteira pela porta dos fundos.
- **Nenhuma função confia no status `expired`.** Vitalidade é sempre
  `pending and expires_at > now()`, avaliada na hora. Se o `pg_cron` do expurgo
  parar, o convite vencido continua recusado.
- **Recusa, revogação, token inventado, vencido, já usado e de canal errado
  devolvem todos a mesma resposta.** Qualquer diferença vira oráculo para quem
  estiver varrendo tokens.
- **Funções de convite devolvem código, não levantam exceção.** Exceção desfaz
  a transação e leva junto a batida de rate limit que a função acabou de
  gravar — o limite deixaria de contar justamente as tentativas que falham.

Saída do casal: quem sai é **pseudonimizado** (nome e faixa de renda apagados
do vínculo, e-mail apagado dos convites, aportes viram "ex-membro" com o valor
intacto). O que corta o acesso é o `left_at`, que `is_couple_member` já confere.
Hard delete do plano só quando o último membro sai, e só com confirmação
explícita.

## Dados que NÃO coletamos

Minimização (LGPD, Art. 6º, III). Se um pedido meu envolver algum destes, questione antes de implementar:

- CPF, RG ou qualquer documento
- Endereço completo (só UF, e só se houver cálculo de frete)
- Geolocalização precisa
- Renda em valor exato (guardamos **faixa**, campo opcional)
- Data de nascimento (guardamos o booleano `is_adult`)

## Convenções

- TypeScript `strict: true`. Nada de `any`; use `unknown` e estreite.
- Tabela e coluna em `snake_case`; TypeScript em `camelCase`.
- Coluna monetária termina em `_cents`; coluna de data em `_at`.
- Server Component por padrão. `"use client"` só quando houver interatividade real.
- Textos em português do Brasil, informal e caloroso, sem jargão de banco. "Quanto vocês já juntaram", não "Saldo acumulado do período".
- Conventional Commits em português: `feat: adiciona divisão proporcional`.

## Comandos

```bash
npm install              # instala todo o workspace
supabase start           # Postgres, Auth e Storage locais em Docker
supabase db reset        # aplica todas as migrations do zero
npm run dev              # sobe o app web
npm run typecheck        # tsc --noEmit em todos os pacotes
npm run lint
npm test                 # unitários
npm run test:rls         # isolamento entre casais (obrigatório no CI)
```

Migrations sempre em arquivo, nunca pelo painel do Supabase. Toda migration que cria tabela precisa, no mesmo arquivo, do `enable row level security` e das quatro policies.

## EVOLUCAO.md

O arquivo `EVOLUCAO.md` na raiz é o diário do projeto. **Atualize ele ao final de toda tarefa concluída**, antes de dizer que terminou. É o que me permite retomar o contexto depois de dias sem mexer, e o que te permite saber onde parou numa sessão nova.

Ao atualizar:
- Mova o item de **Pendente** para **Feito**, com a data e o hash curto do commit.
- Se durante a tarefa apareceu trabalho novo, adicione em **Pendente** ou **Backlog**.
- Se você tomou uma decisão técnica relevante, registre em **Decisões** com o motivo em uma linha.
- Se deixou algo pela metade ou com gambiarra, registre em **Dívidas**. Não esconda.
- Não reescreva o histórico de **Feito**. Só acrescente.

Seja específico e curto. "Auth funcionando" não serve; "login, cadastro e recuperação de senha com @supabase/ssr, sessão em cookie httpOnly" serve.

## Como quero trabalhar com você

- Tarefa que toque em schema, RLS, autenticação ou dado pessoal: **entre em plan mode e me mostre o plano antes de escrever código.**
- Mudanças pequenas e revisáveis. Dois commits claros valem mais que um grande.
- Se um pedido meu contradiz as regras acima, **não obedeça em silêncio** — aponte a contradição e proponha a alternativa segura.
- Não instale dependência nova sem perguntar. Justifique por que o que já existe não resolve, e confirme que ela roda também em React Native se for para `core` ou `api`.
- Não crie arquivo `.md` por conta própria, exceto o `EVOLUCAO.md`.

## Checklist antes de dizer que acabou

- [ ] `npm run typecheck`, `npm run lint`, `npm test` e `npm run test:rls` passam
- [ ] Tabela nova tem RLS e as 4 policies
- [ ] Nenhum segredo em variável `NEXT_PUBLIC_`
- [ ] Nada de `window`/`document`/`localStorage` fora de `apps/web`
- [ ] Valores monetários em centavos, como inteiro
- [ ] Nenhum dado pessoal em log ou breadcrumb
- [ ] `EVOLUCAO.md` atualizado
