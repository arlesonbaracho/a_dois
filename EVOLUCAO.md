# Evolução — A DOIS

Diário do projeto. Atualizado ao final de toda tarefa concluída.

**Última atualização:** 2026-09-10 (saída do casal)
**Fase atual:** Fase 1 — web-first
**Próximo passo:** Prompt 7 — metas e itens com Realtime

---

## Feito

Registre com data e hash curto do commit. Nunca reescreva, só acrescente.

| Data | O que foi entregue | Commit |
|---|---|---|
| 2026-09-09 | Monorepo Turborepo + npm workspaces; `apps/web` em Next.js 16 (App Router, TS strict, Tailwind 4, ESLint 9) rodando; `packages/core` em TS puro com `money.ts` (centavos inteiros, 13 testes), `constants.ts`, schemas zod e tipos inferidos; `packages/api` com `SupabaseProvider`/`useSupabase` recebendo o cliente por injeção | `aab890d` |
| 2026-09-09 | Schema inicial: 7 tabelas com `couple_id` e RLS, 28 policies contra a lista de casais do `auth.uid()`, `is_couple_member` e `create_couple` em security definer com `search_path` vazio, FK composta `(goal_id, couple_id)`, índices em toda FK, trigger de `updated_at`, `price_quotes` append-only. **Não executada** — falta Docker | `34d4db1` |
| 2026-09-09 | `database.types.ts` em `packages/api` (à mão, com teste que compara coluna a coluna contra a migration), `SupabaseClient<Database>` no provider, `packages/core/src/schemas.ts` reconciliado | `e8dae6d` |
| 2026-09-09 | Teste de isolamento entre casais em `supabase/tests/`: 2 casais, 4 pessoas, 7 tabelas, ~70 asserções cobrindo select/update/delete/insert cruzados, anônimo sem JWT e append-only de `price_quotes`. Roda sem Docker via Postgres descartável. Reprovação comprovada com 4 policies quebradas de propósito | `fb03204` |
| 2026-09-09 | Docker no ar: `supabase start` e `db reset` aplicando a migration do zero, `test:rls` aprovado contra o Supabase de verdade (auth, papéis e grants reais, sem stub), e `database.types.ts` gerado pela CLI — batia 100% com o escrito à mão. Reprovação recomprovada no stack real | `fb03204`+ |
| 2026-09-09 | PWA instalável: manifest em `app/manifest.ts`, ícones 192/512/maskable, service worker de 40 linhas com allowlist fechado de 5 arquivos do shell, tela `/offline`, meta tags do iOS e convite de instalação por `beforeinstallprompt` que só aparece depois da primeira meta. Verificado no navegador: cache com exatamente os 5 arquivos depois de navegar e de disparar fetch dinâmico, e servidor derrubado cai na tela offline | `e0984b4` |
| 2026-09-09 | Casal criado na mesma transação do cadastro: `create_couple_for(user_id)` fechada ao cliente, `create_couple()` virou invólucro, trigger `on_auth_user_created`. Teste novo em `supabase/tests/cadastro_cria_casal.sql` — reprovou a própria migration quando o revoke dizia só `from public` | `e37a84f` |
| 2026-09-09 | Autenticação com `@supabase/ssr`: cadastro, login, recuperação de senha e saída; sessão em cookie httpOnly + secure + sameSite=lax; middleware que renova o token e protege por negação padrão; `/auth/confirm` com `token_hash` e templates de e-mail próprios; erro de login genérico normalizado em `packages/api`. Verificado ponta a ponta no navegador, com `document.cookie` e `localStorage` vazios enquanto a sessão funciona | `ee79b5b` |
| 2026-09-10 | `profiles` com apelido pseudônimo: único case-insensitive, 3–20 em `[a-z0-9_]`, lista de reservados, recusa apelido igual ao prefixo do e-mail. Sem leitura ampla — a busca é `find_by_nickname`, match exato, 20/h. `rate_limit_hits` com RLS e zero policies | `7e424e7` |
| 2026-09-10 | Convite vira máquina de estados de seis estados: reivindicar cria um pedido e **não concede nada**; só `confirm_invite` cria o vínculo. Token de 32 bytes com hash SHA-256, TTL por canal (72h/72h/24h), teto de 3 em aberto e 5/h, e-mail mascarado na confirmação, expurgo por `pg_cron`. `supabase/tests/convite.sql` com ~40 asserções | `cdb08d0` |
| 2026-09-10 | Telas `/parceiro` (criar, revogar, confirmar, recusar) e `/convite` (reivindicar), aviso de pedido pendente na home, `Referrer-Policy: no-referrer` em `/convite`, e o `proxima` do middleware passou a guardar a query string. Verificado no navegador com duas contas: reivindicar não dá acesso, confirmar dá, e o casal vazio de quem entrou some | `7c9439f` |
| 2026-09-10 | Saída do casal: nome e faixa de renda apagados do vínculo, e-mail apagado dos convites, aportes viram "ex-membro" com o valor intacto, convites criados por quem saiu revogados, sessões derrubadas, e hard delete do plano só no último membro com confirmação explícita. `supabase/tests/saida.sql` | `2b50be0` |
| 2026-09-10 | Os seis itens que faltavam da lista obrigatória de testes: token revogado, link por conta aleatória com sete asserções de acesso zero, auto-convite, expurgo de 7 dias e de 48h, e busca por apelido escondido idêntica à de apelido inexistente. Reprovação comprovada abrindo `goals_select` | `82ce3ab` |

---

## Pendente

O que está na fila imediata, em ordem de execução.

- [ ] **Prompt 6b** — Saída do parceiro, com pseudonimização
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
- [ ] Instrução de instalação manual para iOS (Compartilhar → Adicionar à Tela de Início)
- [ ] `apple-touch-startup-image` por tamanho de tela, para matar a splash em branco no iOS
- [ ] Templates de e-mail de produção no painel do Supabase (os de `supabase/templates/` valem só no local)
- [ ] Avatar de verdade, via Storage, com a URL presa ao nosso bucket
- [ ] Mesclar dois planos quando quem entra já tem movimentação
- [ ] E-mail de convite de verdade (hoje o canal `email` gera o link, mas quem manda é quem convidou)

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
| 2026-09-09 | `is_couple_member` em security definer, não invoker | Em invoker a policy de `couple_members` chama a função que lê `couple_members`: recursão, `42P17`. Definer roda como dona da tabela e RLS não reaplica dentro |
| 2026-09-09 | Nenhuma tabela usa `force row level security` | As funções security definer precisam do desvio de dona da tabela; com `force` a `create_couple` quebraria |
| 2026-09-09 | `create_couple()` como único caminho de criação de casal | A policy de insert em `couples` nega sempre (ninguém é membro no instante do insert), e está certa em negar |
| 2026-09-09 | FK composta `(goal_id, couple_id)` em vez de trigger de consistência | O banco impede item e aporte de apontarem para meta de outro casal, sem código nosso |
| 2026-09-09 | `contributions.goal_id` com `on delete restrict` | Apagar meta não vaporiza histórico de dinheiro; para apagar, os aportes saem antes |
| 2026-09-09 | Enums do Postgres em vez de `text` + check | `gen types` transforma em união TypeScript de graça |
| 2026-09-09 | `couples` sem coluna `couple_id`; o `id` dela é o couple_id | Coluna gerada igual ao `id` só custaria coluna e índice redundantes |
| 2026-09-09 | Teste de RLS em SQL puro com asserções, não pgTAP | `supabase test db` exigiria a extensão e o stack no ar; SQL puro roda em qualquer Postgres e falha com exit != 0 |
| 2026-09-09 | Postgres 17 userland em `~/.local/pgsql` para rodar o teste sem Docker | Um teste de RLS que nunca rodou não vale nada; `run.sh` usa `DATABASE_URL` quando ela existe |
| 2026-09-09 | No update, a linha resultante passa pelo `with check` da policy de update E pelo `using` da de select; sem `with check`, o `using` do update serve de substituto | Comprovado em sonda isolada. O `with check` explícito fica assim mesmo: segurança não se apoia em fallback implícito |
| 2026-09-09 | `database.types.ts` é gerado, e o guarda é `npm run db:types:check` (regenera + `git diff --exit-code`) | Uma linha no lugar de um teste que interpretava o arquivo gerado por regex, e pega tipo e nulabilidade, não só nome |
| 2026-09-09 | `test:rls` prefere `DATABASE_URL` → stack local → Postgres stub, nessa ordem, e imprime o alvo | Rodar contra o stub achando que rodou contra o Supabase é pior que não rodar |
| 2026-09-09 | Service worker escrito à mão (~40 linhas), sem Serwist nem Workbox | Serwist é um motor de estratégias de cache, e a regra 10 proíbe cachear tudo que não seja shell estático. Ele entraria para ser desligado, com uma superfície de config onde um default errado cacheia resposta autenticada |
| 2026-09-09 | O cache é um allowlist fechado de 5 caminhos, preenchido só no `install` | Allowlist falha fechado. Estratégia com exceções falha aberto, e o modo de falha aqui é vazar dado de casal para o disco do navegador |
| 2026-09-09 | Sem precache dos chunks do Next | Offline o app não funciona por definição (nada de Supabase em cache), então cachear o shell só serviria para bootar uma tela que erra na primeira query. Os chunks já têm `immutable` no cache HTTP |
| 2026-09-09 | `apple-mobile-web-app-capable` escrito à mão em `metadata.other` | `appleWebApp.capable` no Next 16 emite só `mobile-web-app-capable`, que o Safari ignora. Conferido no HTML servido: as duas metas precisam existir |
| 2026-09-09 | `THEME_COLOR` e `BACKGROUND_COLOR` em `packages/core` | Manifest, meta `theme-color` e o `app.json` do Expo na fase 2 precisam do valor cru; o Tailwind não exporta isso |
| 2026-09-09 | Ícones gerados por script PIL descartável, e não versionado | A marca é provisória; quando houver designer, os PNGs são substituídos e nada mais muda |
| 2026-09-09 | Service worker só registra em produção | Em dev ele serve shell velho e faz a gente depurar um bug que não existe |
| 2026-09-09 | Cookie httpOnly de verdade, e o cliente do browser recebe o access token em memória | A regra 9 e o `createBrowserClient` se contradizem: ele existe para ler a sessão de `document.cookie`, que httpOnly esconde. Ganhou a regra 9. O token vem do Server Component e nunca toca cookie legível nem localStorage |
| 2026-09-09 | `lib/supabase/client.ts` usa `createClient` do supabase-js, não `createBrowserClient` | Sem cookie legível, o `createBrowserClient` não tem função nenhuma a cumprir. A própria doc do `@supabase/ssr` manda cair no `createClient` nesse caso |
| 2026-09-09 | Opção `accessToken` no cliente do browser | Além de injetar o token, ela desliga o namespace `auth` do supabase-js: login e logout não têm como escapar para o cliente nem por engano |
| 2026-09-09 | Casal criado por trigger em `auth.users`, não por chamada do app | Com `enable_confirmations` ligado o cadastro não devolve sessão, então não existe instante em que o app pudesse chamar `create_couple()`. A trigger ainda dá de graça o "mesma transação" e mata a corrida de duas requisições criando dois casais |
| 2026-09-09 | `create_couple_for` é security **invoker**, apesar de `create_couple` ser definer | Ela só roda de dentro de funções definer, onde o usuário corrente já é a dona das tabelas. Não precisa de definer, então não ganha: é uma superfície de escalação a menos. E se vazar um grant, RLS barra |
| 2026-09-09 | O revoke de `create_couple_for` nomeia `anon` e `authenticated`, não só `public` | O Supabase concede execute a eles por default privileges, e concessão direta não some quando se revoga de `public`. O teste reprovou a migration antes de a linha ficar assim |
| 2026-09-09 | Middleware protege por negação padrão, com lista de rotas públicas | `app/(app)` é route group e não aparece na URL: uma lista de protegidas seria uma lista que alguém esquece de atualizar, e o esquecimento publicaria a tela. Esquecer na lista de públicas só pede login demais |
| 2026-09-09 | Server Actions + `useActionState` no lugar de react-hook-form | Três formulários de auth não pagam duas dependências novas. A senha nem chega a passar por estado de cliente. react-hook-form volta quando entrar formulário de verdade (metas, aportes) |
| 2026-09-09 | Link de e-mail cai em `/auth/confirm?token_hash=`, com templates próprios | O padrão da Supabase devolve os tokens no fragmento da URL, que só JavaScript lê — incompatível com httpOnly. Conferido: o link funciona a partir de um cliente sem cookie nenhum, ou seja, abrir o e-mail no celular funciona |
| 2026-09-09 | Erro de login normalizado dentro de `packages/api`, não na tela | Se a decisão morasse na UI, o próximo chamador esqueceria e a tela viraria oráculo de "esse e-mail tem conta aqui". Conferido: senha errada, e-mail inexistente e e-mail malformado devolvem a mesma frase |
| 2026-09-09 | `proxima` do middleware passa por peneira de caminho interno | `/login?proxima=//site-falso` seria redirect aberto com a nossa cara. Conferido no navegador: cai em `/` |
| 2026-09-09 | App comprometido com tema claro em `globals.css` | Ainda não há paleta nem tokens; sem isso, navegador em modo escuro pinta o fundo de preto e as telas de auth ficam texto escuro sobre fundo escuro |
| 2026-09-09 | `email_sent` do rate limit local subido de 2 para 30 | Com 2 por hora, testar cadastro e recuperação na mesma hora já estoura. Vale só para o stack local; produção é o painel |
| 2026-09-09 | E-mails do seed dos testes em `@teste.invalid` | O banco de desenvolvimento tem conta de verdade dentro. `ana@exemplo.test` colidiu com uma conta criada à mão e derrubou o teste de RLS |
| 2026-09-10 | Aceitar convite não concede acesso: cria um pedido, e só a confirmação de quem convidou cria o vínculo | O canal de entrega (e-mail, apelido, link) pode ser interceptado, encaminhado ou colado no grupo errado. A autorização fica do lado que sabe quem convidou |
| 2026-09-10 | **Exceção desfaz a transação e leva junto a batida de rate limit.** `claim_invite` e `create_invite` devolvem código em vez de levantar | Descoberto pelo teste: como toda reivindicação malsucedida levantava, o limite de 10/h nunca contava nada — exatamente no caso para o qual existe, que é varrer tokens. Vale para qualquer limite que precise contar tentativas que falham |
| 2026-09-10 | `profiles` sem policy de leitura ampla; a busca por apelido é função definer | RLS filtra linha, não coluna. Liberar profiles para todo autenticado devolveria `select nickname from profiles`, ou seja, a lista de todo mundo que usa o app — a enumeração que a busca exata evita, entrando pela porta dos fundos. E exigiria `using (true)`, proibido pela regra 2 |
| 2026-09-10 | `profiles` e `couple_invites` negam insert, update e delete nas policies | Com escrita direta, as regras de apelido e a máquina de estados virariam decoração: bastaria um update para o apelido virar "suporte", ou o status virar `confirmed` |
| 2026-09-10 | Token gerado por `extensions.gen_random_bytes(32)` no Postgres, não por `crypto.getRandomValues` no cliente | `packages/core` continua sem Web Crypto, que o React Native não tem e que quebraria a portabilidade na fase 2; e o token em claro passa a existir só como valor de retorno da função |
| 2026-09-10 | Sem índice único para a corrida de dois cliques no mesmo convite | O convite é uma linha só: não existe segunda linha que um índice pudesse recusar. `update ... where id = ? and status = 'pending'` trava a linha e o perdedor volta com zero — garantia mais forte, não mais fraca |
| 2026-09-10 | Nenhuma função confia no status `expired` | Vitalidade é sempre `pending and expires_at > now()`, avaliada na hora. Se o `pg_cron` parar, o convite vencido continua recusado — o job é higiene para o expurgo, não fronteira de segurança |
| 2026-09-10 | Reivindicar é recusado quando o plano de quem reivindica tem qualquer movimentação | Entrar no plano de outra pessoa abandonaria o próprio. Na dúvida o convite para, e nada é apagado; mesclar dois planos é feature, não efeito colateral |
| 2026-09-10 | E-mail mascarado dentro do banco, não na UI | Mascarar na tela exigiria o e-mail em claro chegar até lá. `auth.users` não é exposta por policy nenhuma, e a função definer devolve `j••e@gm••l.com` já pronto |
| 2026-09-10 | `rate_limit_hits` com RLS ligado, zero policies e grants revogados | Uma tabela que registra "fulano fez tal coisa às tantas" é dado pessoal. Sem policy, `authenticated` enxerga zero linhas e escreve nenhuma; só as funções definer entram |
| 2026-09-10 | `avatar_url` existe na tabela, mas nenhuma função grava | URL livre faria o navegador de quem confirma buscar um endereço escolhido por terceiro, entregando IP e horário. Entra quando o Storage entrar, com a URL presa ao nosso bucket |
| 2026-09-10 | `proxima` do middleware passou a guardar `pathname + search` | Sem a query string, quem clicava no link do convite deslogado perdia o token na ida ao login. A peneira contra redirect aberto continua onde estava |
| 2026-09-10 | **O canal do convite é entrega; a autorização é sempre de quem convidou** | Link se encaminha, e-mail se intercepta, apelido se digita errado — nenhum dos três prova quem está do outro lado, e só quem convidou sabe quem esperava |
| 2026-09-10 | Na saída, quem corta o acesso é o `left_at`, não o delete de sessão | `is_couple_member` já exigia `left_at is null` desde a migration inicial: no instante em que ele é gravado, toda policy para de devolver linha. O delete de `auth.sessions` é a milha extra, e o access token continua sendo JWT válido até `jwt_expiry` |
| 2026-09-10 | Os aportes de quem sai ficam, com o valor intacto e sem dono | Apagar mentiria sobre quanto o casal juntou. Pseudonimizar é tirar a pessoa do dado, não tirar o dado |
| 2026-09-10 | Convite que carrega o e-mail de quem saiu é apagado, não anulado | O check de coerência de canal exige `invited_email` não-nulo quando `channel = 'email'`. E convite morto é dado pessoal parado, não histórico útil |
| 2026-09-10 | Hard delete do plano exige `p_confirmo_apagar` explícito | É irreversível e leva metas, itens, aportes e histórico de preço junto. Uma tela com bug não faz isso por acidente |

### Limitações de PWA no iOS que aceitamos na fase 1

Nenhuma delas tem contorno decente hoje. Estão aqui para ninguém tratar como bug.

- **Não existe `beforeinstallprompt` no iOS.** Nosso convite de instalação é Chromium-only. No iPhone a instalação é manual: Safari → Compartilhar → "Adicionar à Tela de Início". Só o Safari faz isso — Chrome e Firefox no iOS não instalam.
- **O app instalado tem armazenamento próprio, separado do Safari.** Quem já estava logado na aba vai precisar logar de novo depois de instalar. Importa a partir do prompt 5.
- **Dados podem ser apagados por inatividade.** O ITP limpa storage de site sem uso por ~7 dias. Como não guardamos estado local, o custo é só logar de novo.
- **Push notification exige o app instalado** (iOS 16.4+). Em aba do Safari não existe. Fica para a fase 2, junto do Expo.
- **Sem background sync e sem periodic sync.** Não usamos, e não vamos passar a usar no web.
- **Splash screen só com `apple-touch-startup-image`**, uma imagem por tamanho de tela. Sem isso, a abertura mostra uma tela em branco por um instante. Não vale a matriz de imagens agora.
- **`orientation: "portrait"` é ignorado.** O iOS gira do mesmo jeito. O manifest declara mesmo assim, porque o Android respeita.

---

## Dívidas

O que ficou pela metade, com gambiarra, ou sem teste. Registre sem vergonha — dívida escondida é a que cobra juros.

| Onde | O que está torto | Gravidade |
|---|---|---|
| `apps/web` × fase 2 | Tailwind 4 usa config CSS-first (`@theme`), e o NativeWind estável (4.2.6) ainda espera Tailwind 3 — só o 5.0 preview cobre v4. Enquanto usarmos só classes básicas não dói; um design system em `@theme` não porta | Média |
| `packages/*` | Sem ESLint — só `apps/web` tem config. Não vale um pacote `eslint-config` com um consumidor só | Baixa |
| `apps/web/app/page.tsx` | Home provisória, só prova de fumaça do workspace | Baixa |
| `contributions.user_id` | FK para `auth.users`, sem garantia de que o usuário é membro daquele casal. Um membro consegue registrar aporte atribuído a alguém de fora | Baixa |
| `packages/core/src/schemas.ts` × `database.types.ts` | Duas descrições da mesma forma. Devem divergir de propósito quando os formulários entrarem (schema de entrada × linha do banco); até lá é duplicação | Média |
| `apps/web/components/pwa.tsx` | `marcarPrimeiraMeta()` não é chamada por ninguém ainda. Até o prompt 7 criar metas, o convite de instalação é código morto na prática | Baixa |
| `apps/web/public/sw.js` | Sem teste automatizado. O allowlist do cache foi conferido à mão no navegador (5 arquivos antes e depois de navegar, e servidor derrubado caindo na tela offline). É regra de segurança sem rede de proteção no CI — deveria virar teste quando o Playwright entrar | Média |
| iOS | Nenhuma instrução de "Adicionar à Tela de Início" para quem abre no Safari. O convite de instalação simplesmente não aparece lá | Baixa |
| `apps/web/public/icon-*.png` | Ícones placeholder: dois anéis entrelaçados feitos por script. Serve para instalar, não para lançar | Baixa |
| `handle_new_user` | Todo cadastro ganha um casal, inclusive o abandonado antes de confirmar o e-mail. O caso do convidado foi resolvido: `confirm_invite` apaga o casal solo e vazio de quem entra. Sobra só o lixo do cadastro abandonado | Baixa |
| `components/cliente-supabase.tsx` | O access token fica em memória e só é trocado quando o servidor renderiza de novo. Numa aba aberta além de `jwt_expiry` (1h) sem navegar, o cliente do browser passa a usar token vencido até a próxima navegação. Só vai doer quando houver tela de longa permanência com Realtime (prompt 7) | Média |
| `apps/web/app/(auth)` | Nenhum teste automatizado das telas. Login, cadastro e recuperação foram conferidos à mão no navegador, incluindo o erro genérico e o redirect aberto. Isso deveria ser Playwright | Média |
| cadastro | Não pedimos nome. `couple_members.display_name` fica nulo, e o prompt 6 vai precisar dele para mostrar quem é quem | Baixa |
| `apps/web/app/globals.css` | Tema claro na marra, sem tokens e sem modo escuro | Baixa |
| `checar_limite` | Contagem sem trava: uma rajada simultânea pode passar de um do limite. Marcado com `ponytail:` no código; o conserto é advisory lock por chave | Baixa |
| `confirm_invite` | Quem já tem plano com movimentação não consegue entrar em outro, e não existe caminho para mesclar os dois. Hoje a saída é apagar o próprio plano à mão | Média |
| `pg_cron` | O expurgo depende da extensão estar habilitada. Local funciona; no projeto hospedado precisa ser ligada antes da migration rodar | Média |
| `apps/web/app/(app)/parceiro` × `/convite` | Sem teste automatizado das telas. O fluxo de duas contas foi conferido à mão no navegador, incluindo o e-mail mascarado e o token sobrevivendo ao login. Deveria ser Playwright, junto com o das telas de auth | Média |
| `leave_couple` | `auth.sessions` é de `supabase_auth_admin`. Local o `postgres` apaga; se o projeto hospedado recusar, o passo cai calado e só o `left_at` protege — que já é o corte real, mas a sessão sobreviveria até o token vencer | Média |
| `convite.sql` | Os dois claims simultâneos são testados em sequência, não em paralelo: `psql` roda numa conexão só e não há `dblink` nem `pg_background`. O predicado do update é o mesmo caminho, mas a concorrência de verdade não foi exercida | Baixa |

---

## Bloqueios

O que está travado esperando algo de fora (decisão sua, conta de terceiro, resposta de suporte).

| Desde | O que trava | Esperando |
|---|---|---|
| — | — | — |
