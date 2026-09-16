# Evolução — A DOIS

Diário do projeto. Atualizado ao final de toda tarefa concluída.

**Última atualização:** 2026-09-13 (LGPD no banco, a promessa ligada, papelada)
**Última atualização:** 2026-09-15 (carrossel volta a girar com "Reduzir movimento" ligado)
**Fase atual:** Fase 1 — web-first
**Próximo passo:** o teste de fumaça em produção (8 itens, nenhum rodou) e a dívida **Alta** do `/auth/confirm` × PKCE. Depois, nome no cadastro — que é migration

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
| 2026-09-10 | `packages/core/src/split.ts`: `dividirCentavos` pelo método do maior resto, com a soma exata como invariante — negativo é dividido pelo módulo com o sinal reposto no fim, e o `-0` morre na saída. `pesosDaRegra` devolve `null` (não exceção) quando a regra não se aplica. 41 testes, incluindo 2000 combinações aleatórias | `7864a9c` |
| 2026-09-10 | Aportes: `add_goal` e `add_contribution` em security definer, `goals_insert` e `contributions_insert` passam a negar, `split_rule` ganha `'fixo'` e `couple_members` ganha `fixed_share_cents`. Tela `/aportes` com saldo entre os dois, meta mínima e as três formas de dividir. `supabase/tests/aportes.sql` com ~20 asserções | `deca884` |
| 2026-09-10 | `supabase/functions/_shared/ssrf-guard.ts`: protocolo, allowlist por rótulo e **DNS resolvido** com todo IP conferido, revalidado a cada redirect (máx. 3), timeout de 5s e corte em 2 MB. `supabase/functions` virou workspace npm para os 24 testes rodarem no Vitest, sem Deno. Reprovação comprovada com quatro mutações | `a551ac3` |
| 2026-09-10 | Edge Function `extract-product-link`: JWT antes de tudo, dono do item conferido antes do fetch, Open Graph por regex, sanitização com entidades decodificadas antes da marcação sair, preço em centavos sem float, e `add_price_quote` append-only. Conferida contra magazineluiza, mercadolivre e americanas de verdade | `33bd96f` |
| 2026-09-10 | `add_goal` cresce (categoria, prazo, prioridade), entram `add_goal_item` e `delete_goal`, e `goal_items` fecha o insert direto — nenhuma tabela de conteúdo aceita mais insert direto. `goals`, `goal_items` e `contributions` publicando para o Realtime. `supabase/tests/metas.sql` | `a8c05c1` |
| 2026-09-10 | `packages/api` com hooks do TanStack Query (um por operação) e `useRealtimeDoCasal`: um canal por casal, filtrado por `couple_id`, invalidando só a chave da tabela que mudou. Chaves de cache em raízes disjuntas, para o `invalidateQueries` por prefixo não arrastar o que não mudou. `progressoPercentual` em `core` | `3e3531e` |
| 2026-09-10 | Telas `/metas` e `/metas/[id]` (nomes que o Expo Router vai espelhar): CRUD de meta e de item, aporte pela própria meta, barra de progresso com `role="progressbar"`, e apagar em dois cliques. Conferido com duas contas: escrita do Beto por fora muda a tela da Ana sem reload, e um evento de aporte gera UMA requisição | `de255d5` |
| 2026-09-10 | `export_my_data` (plano inteiro em jsonb, e-mail do parceiro mascarado, `token_hash` nunca sai), `delete_account` exigindo a palavra EXCLUIR conferida no banco, e três consentimentos como colunas de `profiles`. `leave_couple` virou invólucro de `sair_do_casal_interno`. `supabase/tests/direitos.sql` | `bf517fa` |
| 2026-09-10 | Tela de privacidade no perfil: baixar JSON e CSV, três toggles independentes, e apagar a conta com a lista do que some e do que fica. `paraCsv` em `core` (formato longo, com BOM no download). Revogar o uso da faixa cai no caminho que já existia e não quebra nada | `ce24612` |
| 2026-09-10 | CI no GitHub Actions com cinco portões, dois deles em `scripts/` para rodarem antes do push (`npm run guardas`): RLS em toda tabela, e `packages/` sem API de navegador. Reprovação dos dois comprovada | `8cb9b96` |
| 2026-09-10 | Achado pelo Playwright: os três toggles de consentimento renderizavam **desligados** enquanto o perfil carregava, então um clique rápido CONCEDIA achando que revogava. Agora ficam desabilitados até o perfil chegar | `3a9a3f3` |
| 2026-09-10 | Playwright com 21 testes cobrindo auth, parceiro, metas, aportes e privacidade, contra o stack local de verdade. Contas com e-mail único por teste, sem estado compartilhado. Entrou no CI como sexto portão | `91a51a0` |
| 2026-09-10 | **Auditoria completa das 5 camadas**, com ambiente subido do zero: 272 verificações, 266 passaram, 5 falharam, 9 não testáveis. **Nenhum Bloqueador e nenhum Crítico.** Isolamento entre casais sem um único achado em 40 sondagens diretas de API; o teste central do convite passou nos três canais. 7 achados (1 Alto, 3 Médios, 3 Baixos) em `relatorios/auditoria-2026-09-10.md`. A suíte e2e foi de 21 para 36 testes | `(esta sessão)` |
| 2026-09-10 | Achado 1 (Alto) fechado: `cadastrar()` engole o `422 user_already_exists` do GoTrue, e a tela de cadastro devolve a mesma frase para e-mail novo e para e-mail que já tem conta | `7206812` |
| 2026-09-10 | Achado 2 (Médio) fechado: os seis campos de dinheiro viraram `type="text"` com `inputMode="decimal"`, e `centavosDeTexto` subiu para `packages/core` — o parser antigo lia "1.234" como R$ 1,23, valor mil vezes menor em silêncio | `205adba` |
| 2026-09-10 | Achados 3 e 5 (Médio + Baixo) fechados: `invited_email` e `token_hash` saíram do grant de `couple_invites` (grant por coluna, lista explícita), e a tela do parceiro passou a usar `active_invites()`, que mascara o e-mail | `62535f4` |
| 2026-09-10 | `e2e/auditoria.spec.ts` com 16 testes: Mailpit, recuperação de senha, cookie de sessão, recusas de apelido, validações, edição simultânea e reconexão. A suíte foi de 21 para 37 | `1c52786` |
| 2026-09-10 | Achado 4 (Médio) fechado: teto de R$ 100 milhões como **constraint de coluna** (vale para insert e update) e recusa de prazo vencido dentro de `add_goal` (só na criação). O relatório dizia "duas condições em `add_goal`" e estava errado — editar meta faz update direto pelo PostgREST e nunca passa pela função | `71cc465` |
| 2026-09-10 | Achado 6 (Baixo) fechado: `EstadoForm` ganha `email?` e errar a senha não apaga mais o endereço digitado. A senha nunca faz o caminho de volta | `7199c1e` |
| 2026-09-10 | Achado 7 (Médio) fechado: `useSalvarItem` e `useSalvarConsentimento` com estado otimista completo — `onMutate`, rollback no `onError` e `cancelQueries` contra o refetch em voo. O e2e voltou de `click()` para `check()` | `1065f2d` |
| 2026-09-10 | O teste de apelido longo passava **em vão**: `maxLength=20` cortava antes de enviar, então o banco nunca era perguntado. Virou sonda direta a `set_profile` | `2678bac` |
| 2026-09-10 | Corrida no teste do convite (a tela de quem convidou era lida antes do claim aterrissar) e prazo do Playwright de 60s para 90s — os testes de dois contextos estouravam como "Request context disposed", que não diz nada sobre a causa | `325eb28` |
| 2026-09-10 | **A auditoria tinha dado "reconexão" como aprovada, e estava errada.** O `postgres_changes` não reenvia evento perdido, e o `refetchOnReconnect` padrão respeita o `staleTime` — queda curta deixava a tela do parceiro mentindo. `refetchOnReconnect: "always"`, e o teste passa três de três | `6c39538` |
| 2026-09-11 | **No ar.** Supabase em `sa-east-1` (`qysekkewsrwtebpiowim`), 11 migrations aplicadas, 9 tabelas com RLS, cron do expurgo ativo. Web em `a-dois-web.vercel.app` | `6d0e3c0` |
| 2026-09-11 | `/auth/confirm` passa a aceitar `?code=` além de `?token_hash=`, e a recuperação de senha carrega `?type=recovery` no `redirect_to`. É o que faz o cadastro funcionar em produção sem SMTP próprio, porque o painel do Supabase só libera editar template de e-mail para quem tem remetente configurado | `(este commit)` |
| 2026-09-11 | **Visual novo, e o produto vira "Jornada".** Paleta e tipografia do design em tokens `@theme` do Tailwind 4; Outfit e Manrope self-hosted por `next/font`; 7 ícones desenhados em SVG; peças novas (polaroide, pílula do total, cartão limão, chip, dock); barra de progresso bicolor por pessoa; cartão "este mês". As 15 telas repintadas, `/metas` virou `/jornadas`, e `APP_NAME` virou "Jornada". `packages/core/src/album.ts` com as regras novas (cor estável por pessoa, total do mês, parcela mensal), 18 testes. Conferido nos dois tamanhos, com contraste medido | `(este commit)` |
| 2026-09-11 | Três rodadas de revisão de acabamento sobre o visual novo. Fechados: o kicker banido pelo piso de craft, `role="progressbar"` na barra do mês (era regressão de acessibilidade minha), o cartão escuro devolvido ao uso exclusivo do pedido do parceiro, a barra do mês bicolor por pessoa, o giro escalado à largura (a 690px a linha de item cisalhava sobre a vizinha), os rádios da divisão fora do azul de sistema, o grão do papel, o espaçamento do Manrope pequeno, e a home no desktop recomposta em três colunas com "Quem colocou" ancorando a direita | `(este commit)` |
| 2026-09-11 | **Capa da jornada via Storage.** Bucket `capas` privado, com teto de 2 MiB e `image/jpeg` na linha do bucket — os dois limites valem no servidor, aplicados pela API do Storage. `goals.cover_path` guarda caminho e nunca URL: a constraint compara o caminho contra o `couple_id` e o `id` da própria linha, então endereço de terceiro não entra na tabela. Quatro policies em `storage.objects` contra `is_couple_member`, e `casal_do_caminho` devolvendo null (não exceção) para caminho torto. `supabase/tests/capa.sql` com ~30 asserções, provado quebrando cada policy e a constraint uma a uma | `2c242cc` |
| 2026-09-11 | **A foto na polaroide.** A `Chapa` recebe a capa e o gradiente vira o estado de espera e de ausência — sem estado e sem efeito, porque o navegador pinta o fundo antes de baixar a imagem. Envio pelo detalhe, com o arquivo reduzido a 1280px e reencodado em JPEG no navegador, o que TIRA O EXIF e a coordenada de GPS junto. Home assina no servidor, lista e detalhe por hook. Um e2e atravessa a costura inteira e confere que a URL é do nosso bucket e assinada | `157407c` |
| 2026-09-12 | **Primeiros passos na home.** Lista de três passos obrigatórios (chamar o parceiro, criar a primeira jornada, anotar o primeiro aporte) mais a faixa de renda como opcional, no cartão escuro. Derivada inteira de dados que a home já carregava — nenhum estado de onboarding guardado, nenhuma tabela, nenhuma tela nova; uma consulta a mais (`convitesAtivos`). O passo do parceiro tem três estados, e o do meio (`esperando`) é o que impede a lista de cobrar convite de quem já mandou. Some sozinha quando os três fecham. `marcarPrimeiraMeta()` ganhou chamador e deixou de ser código morto | `(este commit)` |
| 2026-09-12 | **Nome no cadastro.** O nome viaja no `raw_user_meta_data` do `signUp` e a trigger `on_auth_user_created` grava nas duas tabelas que o mostram: `profiles` (campo Nome do cartão de pedido) e `couple_members` (saudação da home). Cortado em 80 dentro da trigger — sem isso o `check` da coluna estouraria na mesma transação do cadastro e derrubaria o próprio signup. `create_couple_for(uuid)` foi apagada em favor da de dois argumentos, senão as duas viravam sobrecarga ambígua | `affb53c` |
| 2026-09-12 | **A regra de divisão passa a ser do casal.** `split_rule` sobe de `couple_members` para `couples`, com backfill fazendo uma vez em SQL a escolha que `regraDoCasal` fazia a cada render. A função some, e com ela `Participante.papel` e `Participante.regra`. `salvarMinhaDivisao` vira duas escritas em duas tabelas | `cc692c5` |
| 2026-09-12 | **Cada um edita só a própria linha de vínculo.** `couple_members_update` ganha `user_id = auth.uid()` no `with check`; o `using` segue o casal inteiro, porque ler a linha do par é legítimo. Teste dentro do MESMO casal, com a varredura sem WHERE incluída | `5c41f6b` |
| 2026-09-12 | **Produção em dia.** As quatro migrations aditivas aplicadas no hospedado e o web em `2578b5e`. O `drop column` foi isolado numa quinta migration retida, e foi isso que tirou a necessidade de janela coordenada: `db push` e deploy deixaram de precisar acontecer juntos. Provado antes por `scripts/subir-producao.sh` (ensaio contra o estado exato de produção, com dados) e conferido depois por `migration list --linked`. Fica provado também que `postgres` cria policy em `storage.objects` no hospedado — era o único ponto que não dava para verificar local | `—` |
| 2026-09-13 | **LGPD no banco.** Revogar o consentimento da faixa de renda passa a APAGAR a faixa, não só o carimbo (Art. 18, IX); `price_quotes` ganha retenção de 180 dias no expurgo que já existia (Art. 15/16); e `contributions_update` deixa de aceitar `user_id` de fora do casal. Seis sabotagens, seis reprovações — duas delas acharam teste cego meu | `de074cb` |
| 2026-09-13 | **A capa sai junto com a conta.** Foto é dado pessoal e ficava no bucket depois de a conta sumir: inalcançável, mas guardada. Removida ANTES da RPC (depois a policy nega), nos dois caminhos que destroem o plano, e só quando ele vai mesmo morrer. O e2e confere pela API do Storage, não pela tabela | `6d663b9` |
| 2026-09-13 | **A promessa ligada.** O botão "buscar preço" chama a Edge Function que existia sem chamador desde o prompt 6; o histórico de `price_quotes` aparece no item; e a prioridade passa a ordenar o álbum (`.order` no banco, que o enum já vem na ordem certa). Três coisas construídas e desligadas, agora em uso | `20d6c89` |
| 2026-09-13 | **Papelada da LGPD.** `docs/ROPA.md` (Art. 37) tirado do schema real, `docs/SECURITY.md` com o plano de resposta a incidente e o prazo da ANPD, e a política de privacidade como PÁGINA pública do app, linkada do cadastro e do perfil. O que depende do controlador vai marcado `<<PREENCHER>>` | `(este commit)` |
| 2026-09-12 | **Varredura de design em todo o app.** A chapa da polaroide ganha marca de categoria desenhada (mesmo grid de 24 e traço 1.75 dos ícones) e duotone mais quente — seis retângulos de gradiente dessaturado lado a lado liam como galeria de imagem que não carregou. `rotuloDaCategoria` em `packages/core` tira o valor cru do banco da tela ("bebe" virava chip). Peças novas: `Secao`, `Explica`, `Saida`, `Perigo`, `DiscoDePessoa`, `PontoDePessoa`, `LinhaAporte` e `esqueleto.tsx`. `Cartao` passa a carregar a marca | `5ba9371` |
| 2026-09-12 | **Relatório da varredura de design** em `relatorios/design-2026-09-12.md`: 39 achados, 32 corrigidos, 7 adiados com motivo. Detector do design system de 26 avisos para 1 | `06210af` |
| 2026-09-12 | **As telas param de inventar tipografia.** `text-sm`/`text-xs`/`text-base` sumiram de `apps/web` — eram a escala do Tailwind, e como o `body` fixa a fonte de display entregavam conversa na voz de afirmação. Em /aportes dava para ver no mesmo formulário. Todo `<select>` vem de `Escolha`. Junto: /parceiro passa a dizer quem divide o plano, /aportes ganha as cores das pessoas e perde os links que duplicavam o dock, /jornadas e a jornada aberta abrem com esqueleto em vez de "Carregando…", a legenda da barra quebra num ponto só, e no desktop a chapa dobra de altura. 41 e2e, RLS e guardas verdes | `89f5bb2` |
| 2026-09-13 | **Redesenho v2: o mundo visual inteiro.** Paleta trocada pelo protótipo do autor — superfície `#FDFBF7`, tinta `#070001`, verde `#33605A` como ação e primeira pessoa, marrom `#68462B` como segunda. Creme deixa de ser fundo e vira o texto sobre escuro. Grão do papel sai; cartão se separa por contorno, não por sombra. Três contrastes medidos mudaram o brief: sálvia vira só superfície (2.57:1 como texto), texto sobre escuro é creme e nunca verde (2.93:1), e nasce a segunda borda `contorno` #7E8F84 porque a `#EDE5D8` do protótipo mede 1.25:1 e em campo o limite é informação. Rampa enxugada para oito degraus e seis raios. `ordemDoAlbum` em `packages/core`, com teste. DESIGN.md reescrito | `1f76698` |
| 2026-09-13 | **Home vira carrossel.** Uma jornada por vez no celular, como o v2 desenha: cartão de 268px de foto, porcentagem e categoria em pílula sobre a imagem, disco de seta sangrando para fora. Pausa sob ponteiro e sob foco, para de vez ao toque num ponto, e não começa com `prefers-reduced-motion` — conteúdo que anda sozinho precisa de como parar. No desktop o protótipo não desenhou nada, e um cartão só numa tela de 1280px deixava dois terços vazios: vira destaque à esquerda e o resto do álbum à direita. `/jornadas` vira o segundo destino do dock, que passa a ter três | `1f76698` |
| 2026-09-13 | **Convite completo.** `/parceiro` ganha as duas abas do protótipo ("No plano" e "Convidar"), etiqueta de estado por pessoa, e o cartão sálvia **"O que essa pessoa vai ver"** — o escopo do acesso dito ANTES de convidar, e não só no cartão de confirmação, que é quando quem lê já decidiu. Compartilhar sai do input `readOnly`: WhatsApp por `wa.me`, folha do sistema por `navigator.share` e copiar por `navigator.clipboard`. A aba que abre é a que tem o que fazer | `(este commit)` |
| 2026-09-13 | **Nova jornada em dois passos**, em rota própria. Chips de categoria, controle deslizante MAIS campo de texto para o valor, prazo em pílulas, e o cartão verde recalculando ao vivo quanto cabe por mês — que é a pergunta que o casal tem, e que o formulário lateral antigo não respondia. Passo 2 traz a jornada criada e três links de verdade para o que falta. O formulário de `/jornadas` some | `(este commit)` |
| 2026-09-13 | **Telas de porta e jornada aberta.** Olho de mostrar a senha (com rótulo que NÃO contém a palavra "senha", senão `getByLabel("Senha")` acharia dois controles), rodapé colado embaixo, "Esqueci minha senha" junto do campo, e a promessa do produto dita na porta. Na jornada: avatares do casal empilhados, "desde março de 2024", item com caixa de 44px desenhada no próprio `<input>` e etiqueta de preço | `(este commit)` |
| 2026-09-13 | **A capa entra no passo 2, e o carrossel desliza.** A foto deixa de ser um link para outra tela: a polaroide inteira do passo 2 é o alvo, o convite fica em pílula sobre a chapa, e o envio é o mesmo caminho do detalhe (reduz e reencoda no navegador, o que tira o EXIF junto). O carrossel virou trilho: todos os cartões lado a lado e o que muda é o deslocamento, 500ms em `ease-out` a cada 5s — o cartão que sai e o que entra se movem juntos, em vez de um sumir e outro aparecer. Com uma jornada só ele fica parado. A pausa por ponteiro saiu, porque no desktop o mouse repousa em cima sem intenção e o giro parava até alguém mexer nele; ficam a pausa por foco de teclado, a parada definitiva ao tocar num ponto e o respeito a `prefers-reduced-motion`. Teste novo no e2e, provado com três sabotagens | `(este commit)` |
| 2026-09-14 | **O nome da outra pessoa finalmente aparece.** `display_name` mora em duas tabelas e a do vínculo é a incompleta: `confirm_invite` insere em `couple_members` SEM display_name, então quem entra por convite nunca teve o de lá, e `set_profile` grava só em `profiles`, então quem edita o perfil depois do cadastro também não. As quatro telas liam a incompleta — daí "Sua dupla" para sempre e "oi, vocês" com os dois nomes preenchidos. `membrosDoCasal` passa a resolver pelo perfil, com o do vínculo como rede; um lugar, quatro telas, nenhuma migration. Junto: a etiqueta "você" em /parceiro seguia o índice da lista, que começa pelo dono — quem entrou por convite via "você" na linha da outra pessoa | `(este commit)` |
| 2026-09-14 | **O link da loja sai do formulário de item.** Quem vai preencher a coluna `url` é a indicação de afiliado, não o casal. O campo some; a coluna e a exibição ficam, para os itens que já têm link e para o link de afiliado | `(este commit)` |
| 2026-09-14 | **Métodos de juntar dinheiro.** O prazo em pílulas vira uma escolha de dois níveis: o método, e só então o tamanho dele. Seis métodos — por mês, por semana, semana crescente (o desafio das 52 semanas), semana decrescente, por dia (o dos envelopes) e "quando der". Todos são a MESMA conta com pesos diferentes, então existe uma função `cronograma` em `packages/core` e não um motor por método; quem fecha é `dividirCentavos`, que já garante que as 52 parcelas somam exatamente o alvo. O cartão verde passa a mostrar a primeira parcela, que é o número que decide, e para onde ela vai ("R$ 8,71 na 1ª semana, subindo até R$ 452,83"). 8 testes unitários, e o e2e cobre a troca de método | `(este commit)` |
| 2026-09-14 | **O link do item, fechado na coluna.** `add_goal_item` peneirava o esquema da URL desde o começo, mas era UM escritor: a policy `goal_items_update` libera update de qualquer coluna para quem é do casal, e o PostgREST é API pública com a anon key embarcada no cliente. Sonda contra o stack local, com JWT de membro: a função recusa `javascript:` com 400, e o `PATCH` direto **gravava com 200** — e `url` vira `href` na jornada aberta. Uma das duas pessoas grava, a outra clica em "ver na loja", e o script roda na sessão dela. A peneira desceu para `goal_items_url_http`, que pega todo escritor de uma vez. Provado quebrando: sem a constraint, o teste reprova em "update direto para javascript:" | `(este commit)` |
| 2026-09-14 | **Merge do branch `claude/gallant-jones-20abbc`**, que estava parado desde 12/09 com trabalho real. Entram: a política de privacidade como **página** (`/privacidade`, não arquivo em `docs/` — política que o titular não consegue abrir não está publicada), `docs/ROPA.md` e `docs/SECURITY.md`, `price_quotes` finalmente com leitor (`prices.ts`, `precos.ts` e a peça `PrecoDoItem`), a Edge Function `extract-product-link` com o primeiro chamador da vida dela, revogar consentimento apagando a faixa de renda, e a capa saindo junto com a conta. Quatro conflitos, todos resolvidos mantendo o mundo v2 e enxertando o que o branch trouxe. Dois consertos no caminho: `prices.ts` tipava `Response` (DOM) dentro de `packages/api`, que compila sem DOM por portabilidade; e a página `/privacidade` nasceu antes do v2, com dois degraus da rampa antiga | `(este commit)` |
| 2026-09-14 | **A ordem do álbum concilia os dois critérios.** O branch ordenava por prioridade no SQL; `main` ordenava por progresso no cliente, desfazendo. Agora `ordemDoAlbum` respeita a prioridade declarada primeiro e usa o progresso como desempate — fecha a dívida de `goals.priority` ser gravada e nunca lida, sem perder o motivo de existir da ordenação por progresso (num carrossel de uma por vez, abrir na recém-criada é abrir na que tem 0%) | `(este commit)` |
| 2026-09-14 | **A indicação de afiliado, colada no item.** Tabela `offers` — conteúdo global, **sem `couple_id`**, com a exceção declarada no cabeçalho da migration (precedente: `couples` e `rate_limit_hits`). A policy de leitura **não é `using (true)`**: ela carrega a janela de publicação, então oferta agendada ou vencida não vaza nem por consulta direta ao PostgREST. As três de escrita negam por escrito, mais `revoke`. O casamento é pelo NOME do item, com `to_tsquery` OU e o dicionário `portuguese` nativo — sem serviço de busca e sem dependência nova; a categoria da jornada é a rede. `termosDeBusca` em `packages/core`, com teste: `plainto_tsquery` liga com E, e "Geladeira 375L" exigiria os dois tokens. **Sem coluna de imagem de propósito**: `<img>` para o CDN da loja entregaria a ela o IP e o horário de quem só ABRIU a tela. **Sem tabela de cliques**: o painel do afiliado já conta, e um `subId` por oferta separa. Divulgação em texto na própria linha (CDC art. 36; o guia CONAR diz que o link sozinho não basta), e `rel="sponsored noopener noreferrer"` | `(este commit)` |
| 2026-09-15 | **O carrossel voltou a girar em quem tem "Reduzir movimento" ligado.** O relógio parava com `prefers-reduced-motion: reduce`, e no iPhone isso é ajuste comum — o cartão ficava congelado para sempre. A regra proíbe **movimento**, não troca de conteúdo: o relógio segue, e o deslize some sozinho porque o bloco de `globals.css` já zera toda transição. O e2e do carrossel passou a rodar com `reducedMotion: "reduce"`, que é justamente o caso que falhava, num `describe` próprio para a opção não vazar para os testes vizinhos. Provado quebrando: repondo o `return`, o teste reprova | `(este commit)` |
| 2026-09-15 | **A frase sob as sugestões deixa de falar de comissão.** Vira "Estas são as ofertas que a gente encontrou para os itens de vocês" — sem "as melhores", que seria afirmação de superioridade sem como provar (CDC, art. 37). A identificação obrigatória não estava nessa frase e continua onde estava: a palavra **Publicidade** em cada sugestão, lida junto com o preço | `(este commit)` |

---
| 2026-09-16 | **A política para de negar a publicidade que o app já mostra.** A página dizia, publicada, *"Não há propaganda no app"* com a sugestão de afiliado na tela da jornada; `perfil/privacidade.tsx` prometia "Nada de propaganda de terceiro" sem dizer de quê. Seção nova declarando a comissão, que a busca roda no nosso banco, que a loja só sabe de alguém no clique, e que a ordem nunca é por comissão; a promessa do interruptor ficou restrita ao e-mail. Teste e2e que reprova se a frase antiga voltar, provado por sabotagem | `3ce9a66` |

## Pendente

O que está na fila imediata, em ordem de execução.

**1. Varrer a capa órfã.** Apagar jornada ou plano não apaga o arquivo do
bucket: o `protect_delete` do Storage barra delete por SQL de propósito, para
a API não ficar com blob sem dono. Ver Dívidas.

Fora isso, a fila dos prompts acabou e a da auditoria também: os sete achados
estão fechados. O resto está em **Falta (backlog)** e em **Dívidas**.

A próxima que eu pegaria é `contributions_update`, que é a mesma classe de
buraco que `couple_members_update` acabou de fechar, e custa uma cláusula.


---

## Deploy

**No ar desde 2026-09-11**, em `https://a-dois-web.vercel.app`. O runbook, a
análise de risco e o teste de fumaça estão em `relatorios/deploy-2026-09-11.md`.

### Migrations: repositório × produção

O número mais perigoso do projeto, porque nada na tela avisa quando ele
diverge. Atualize as duas linhas ao criar migration e ao rodar `db push`.

| Onde | Quantas | Última |
|---|---|---|
| Repositório (`supabase/migrations/`) | **19** | `20260914210000_ofertas_de_parceiro` |
| Produção (`qysekkewsrwtebpiowim`) | **15** | `20260912042341_minha_linha_so_minha` |

> **A ordem mudou em 2026-09-16.** O `9fa8a74` (vitrine de afiliado) **já
> está no `origin/main`**, contra um banco sem a tabela `offers`. Não quebra
> tela — `detalhe.tsx:762` cai em `return null` — mas é a armadilha 9 já
> acionada, com a feature morta em produção. O efeito colateral é que as
> frases da política sobre propaganda continuavam **verdade** lá, e virariam
> mentira no instante do push. Por isso o texto foi corrigido **antes**
> (2026-09-16). Agora o push está liberado.

**Quatro pendentes em 2026-09-14:** a destrutiva retida, a `lgpd_revogar_e_reter` (veio do merge), a `ofertas_de_parceiro` e a `link_de_item_so_http`, que **fecha um buraco em produção** e deve subir na frente de todas. As quatro anteriores subiram pelo
`scripts/subir-producao.sh`, e o web foi para `2578b5e` na sequência.
Conferido por `supabase migration list --linked`.

**Falta uma, de propósito:** `20260912150948_regra_do_casal_contrai`, a única
destrutiva do lote — ela apaga `couple_members.split_rule`. Ficou retida
enquanto o web antigo estava no ar, e **agora já pode subir**, porque o web
publicado lê a regra de `couples`.

Foi separá-la que tirou a janela coordenada: enquanto as duas colunas
convivem, o web antigo lê `couple_members.split_rule` e o novo lê
`couples.split_rule`, os dois contra o mesmo banco. Aplicada cedo ela não
derrubaria a tela antiga — faria pior, `regraDoCasal` cairia no `?? "igual"`
e **todo casal apareceria dividindo meio a meio**, em silêncio.

O runbook está em `relatorios/subir-pendentes-2026-09-12.md` e o ensaio que o
valida em `scripts/ensaio-producao.sh`.

- [x] Projeto em **`sa-east-1`** (`qysekkewsrwtebpiowim`), Postgres 17.6.
- [x] **`pg_cron` antes do `db push`** — as 11 migrations entraram inteiras.
- [x] **Vercel**: Root Directory `apps/web`, e as duas `NEXT_PUBLIC_*` em Production.
- [x] **Site URL e Redirect URLs** apontando para o domínio `.vercel.app`.
- [ ] **Redirect URL de recuperação**: falta acrescentar
      `https://a-dois-web.vercel.app/auth/confirm?type=recovery`.
- [ ] **Teste de fumaça**, os 8 itens. Nenhum rodou ainda.
- [ ] **SMTP próprio**, com SPF, DKIM e DMARC. Segue de pé, e agora vale dobrado —
      ver a decisão sobre template de e-mail abaixo.

Duas armadilhas que custaram tempo e valem ficar escritas:

- **Não rodar `supabase config push`**. O `config.toml` descreve o ambiente local, e
  ele sobrescreveria o painel com `site_url = "http://localhost:3000"`.
- Variável de ambiente na Vercel nasce no escopo da **página em que você está**. As
  duas foram criadas em `/settings/environments/development`, e todo build de
  produção morreu em `Falta NEXT_PUBLIC_SUPABASE_URL` sem dizer por quê.

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
- [ ] Foto de capa da jornada, via Storage, com a URL presa ao nosso bucket (o design mostra polaroide com foto; hoje é hachura em CSS)
- [ ] "Recado no álbum": o bilhete que o design mostra na home. Tabela nova, logo RLS e as 4 policies
- [ ] QR do convite — **gerado no cliente**. Uma API tipo `api.qrserver.com/?data=<link>` mandaria o token do convite para um servidor estranho
- [ ] Compartilhar convite por WhatsApp — decidir antes se vale entregar o token ao histórico da conversa
- [ ] Tela "Nova jornada" em dois passos, como no design

### Fase 2 — Expo
- [ ] Criar `apps/mobile` com Expo + Expo Router
- [ ] Adapter de sessão com `expo-secure-store`
- [ ] NativeWind e portagem das telas
- [ ] Push notification (sem valor no corpo)
- [ ] `FLAG_SECURE` no Android e blur em background
- [ ] Build via EAS e publicação nas lojas
- [ ] **Reescrever as 13 Server Actions como mutations.** Expo não tem
      Server Action, `FormData` de formulário nem `revalidatePath`. São 476
      linhas em 5 `actions.ts` mais 8 telas com `useActionState` — a maior
      portagem do lote, e a que não estava escrita em lugar nenhum
- [ ] **Trocar o `radial-gradient` do `Chapa` por `react-native-svg`.** Ver
      Dívidas: é o bloqueador visual real da fase 2
- [ ] Componente para os acordeões: `<details>`/`summary::before` não existe
      em RN (4 pontos no `globals.css`)

### Conformidade e operação
- [ ] Canal `privacidade@` ativo — é o que fecha os `<<PREENCHER>>` do ROPA,
      do plano de incidente e da página de privacidade
- [ ] Identificação do controlador e do encarregado (DPO), Art. 41
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
| 2026-09-10 | Divisão pelo método do maior resto, e não por cumulativo arredondado | Os dois fecham a soma; o maior resto é determinístico e explicável para quem reclamar do centavo ("quem tinha a maior fração levou"), e o empate resolve pela ordem da lista |
| 2026-09-10 | Total negativo é dividido pelo módulo, com o sinal reposto no fim | `Math.floor` com negativo arredonda para longe do zero e o resto muda de sinal: seriam dois caminhos, e o segundo é o que ninguém testa. Assim é um caminho só |
| 2026-09-10 | `dividirCentavos` recusa `total * somaPesos` acima do inteiro seguro | Acima disso o produto passa a mentir e a divisão devolve conta errada em silêncio. Erro é melhor que resposta errada quando o assunto é dinheiro |
| 2026-09-10 | `pesosDaRegra` devolve `null` quando a regra não se aplica, em vez de levantar | A faixa de renda é opcional e não informar é resposta legítima. Exceção obrigaria a tela a tratar caso normal como falha, e é assim que nasce tela de erro para quem não fez nada de errado |
| 2026-09-10 | `regraDoCasal` desempata pelo papel `dono` | `split_rule` é coluna por pessoa, então as duas linhas podem discordar. A função existe só para consertar o modelo — está em Dívidas |
| 2026-09-10 | Peso da faixa é o ponto médio dela em salários mínimos, ×2 | Precisa ser inteiro para a divisão em centavos, e o que importa é a proporção entre as faixas, não o valor absoluto. A faixa aberta do topo entra como 15 SM, que é chute honesto |
| 2026-09-10 | O rateio ignora o dinheiro de quem saiu do casal | `contributions.user_id` nulo não tem a quem cobrar. Incluir esse valor inflaria o que os dois que ficaram devem um ao outro, por uma conta que ninguém pode acertar |
| 2026-09-10 | `goals`, `contributions` e `price_quotes` passam a negar insert nas policies | A policy antiga aceitava o `couple_id` do corpo e só conferia se era um dos seus. Barra IDOR, mas deixa o cliente escolher o casal e o `user_id` do aporte. As funções definer tiram as duas escolhas da mão de quem chama — regra 3 |
| 2026-09-10 | A data do aporte vem do cliente, o resto não | Aporte de ontem é caso normal, e a data não é fronteira de segurança. `couple_id` e `user_id` são, e esses saem do JWT |
| 2026-09-10 | Data do formulário vira `T12:00:00Z`, e não meia-noite | Meia-noite UTC é 21h do dia anterior no Brasil: o aporte "andaria" um dia para trás na tela. Meio-dia sobrevive a qualquer fuso do país |
| 2026-09-10 | Meta mínima (título e valor alvo, categoria `'geral'`) entrou junto dos aportes | Aporte é vinculado a meta e o prompt 7 ainda não rodou. Sem isso não havia como usar nem conferir o que o commit dos aportes entrega |
| 2026-09-10 | `ssrf-guard.ts` é TS puro com o resolvedor de DNS injetável | É o que deixa as 24 recusas rodarem no Vitest que já existe. Instalar o Deno na máquina para rodar teste de guard não se paga, e guard sem teste é decoração |
| 2026-09-10 | `ipReservado` falha fechada: o que não dá para classificar volta como reservado | Numa peneira de segurança, "não entendi" e "não pode" têm que dar na mesma coisa. A alternativa é deixar passar o que ninguém previu |
| 2026-09-10 | A allowlist compara por rótulo, não por sufixo de texto | `amazon.com.br.malvado.com` termina com `amazon.com.br` no meio do nome. Comparação por sufixo deixaria passar, e o teste que prova isso reprova a versão ingênua |
| 2026-09-10 | `redirect: "manual"` com laço próprio, em vez de deixar o `fetch` seguir | Com `follow`, o guard rodaria uma vez, na URL que não importa: o 302 para a rede interna passaria por baixo. Há um teste que reprova só a troca desse flag |
| 2026-09-10 | Um `AbortSignal.timeout` para a operação inteira, não por salto | Cinco segundos por salto com três redirects seriam vinte segundos de janela aberta |
| 2026-09-10 | `sanitizarTexto` decodifica entidades ANTES de tirar a marcação | Na ordem contrária, `&lt;script&gt;` sai daqui como `<script>` inteiro. A ordem é a peneira |
| 2026-09-10 | Sem parser de DOM na Edge Function; regex sobre `<meta>` | `deno-dom` seria dependência inteira para ler quatro tags, num runtime onde ela não se paga — e um parser completo tem muito mais superfície do que a regex que só olha `<meta>` |
| 2026-09-10 | A URL da imagem só volta se for `https` em nome, nunca em IP cru | Ela vira `src` numa tela nossa, e quem escolheu o endereço foi o site de terceiro. Mesma razão pela qual `profiles.avatar_url` existe e ninguém grava nela |
| 2026-09-10 | A Edge Function confere o dono do item ANTES de buscar a página | Descoberto rodando: página sem preço nunca chegava ao insert, então item de outro casal recebia 200 — e a gente saía buscando na internet a mando de quem não tinha o que guardar |
| 2026-09-10 | A Edge Function usa a anon key com o token de quem chamou, nunca service role | Assim ela roda como a pessoa e o RLS continua valendo. Service role aqui seria a regra 4 pela metade: a chave não vazaria, mas o efeito dela sim |
| 2026-09-10 | **Não ligamos `replica identity full`.** Eu ia ligar; a sonda no navegador derrubou a teoria | O Realtime entrega o DELETE com `old` contendo só a chave primária mesmo com replica identity full. Ligar custaria a linha velha inteira no WAL para não mudar payload nenhum |
| 2026-09-10 | No DELETE, o cliente invalida a raiz `["itens"]` em vez da meta específica | O payload não diz de qual meta era a linha apagada. Numa tela de meta aberta a raiz é exatamente uma consulta — muito menos que recarregar tudo, e com a garantia de que o item some da tela do outro |
| 2026-09-10 | Chaves de cache em raízes disjuntas (`["metas"]` × `["meta", id]`, `["aportes-do-casal"]` × `["aportes-da-meta", id]`) | `invalidateQueries` casa por PREFIXO. Com o detalhe em `["metas", id]`, invalidar a lista arrastaria junto toda meta aberta, e "invalide as queries certas" viraria "invalide quase tudo" sem ninguém notar |
| 2026-09-10 | O `QueryClient` nasce dentro do `SupabaseProvider`, em `useState` | Em módulo ele seria compartilhado entre requisições no servidor, e o cache de um casal vazaria para a renderização do outro. E os dois juntos num provider só porque são a mesma pergunta: "de onde vêm os dados desta árvore" |
| 2026-09-10 | `refetchOnWindowFocus: false` com `staleTime` de 30s | Quem avisa que os dados mudaram é o Realtime. Sem isso, cada volta para a aba refaria tudo por cima do que já chegou ao vivo |
| 2026-09-10 | Mutations invalidam mesmo com o Realtime invalidando também | Tirar a invalidação da mutation deixaria a escrita dependente do websocket estar de pé: com ele caído, o app pareceria não salvar. O custo é uma recarga a mais por escrita nossa — está em Dívidas |
| 2026-09-10 | Um `<RealtimeDoCasal />` no layout de `(app)`, e não um por tela | Um canal só para o app inteiro. Por tela, cada uma teria que lembrar de assinar, e a que esquecesse ficaria parada no tempo sem ninguém perceber |
| 2026-09-10 | Barra de progresso com `role="progressbar"` e `aria-value*` | Sem isso a informação principal da tela é uma div colorida, e some inteira para quem usa leitor de tela |
| 2026-09-10 | Meta com alvo zero mostra 100% quando já tem dinheiro | É divisão por zero. A alternativa honesta seria proibir alvo zero, mas "juntar sem meta definida" é caso real — e o que não pode é "NaN%" na tela das duas pessoas |
| 2026-09-10 | Apagar meta são dois cliques, e quem decide é o banco | `delete_goal` só devolve `precisa_confirmar` quando há aporte. A tela não sabe a regra: ela mostra o que o banco respondeu, e assim as duas não podem divergir |
| 2026-09-10 | Update e delete de `goals` e `goal_items` continuam por PostgREST | As policies já conferem o casal nos dois lados e nenhum `couple_id` novo atravessa a rede. Função definer aqui seria cerimônia sem fronteira nova |
| 2026-09-10 | Consentimento em três colunas de `profiles`, não em tabela de eventos | O timestamp é o registro E a flag: nulo é "nunca", data é "consentiu nesta hora". Tabela de histórico guardaria dado pessoal que ninguém vai ler antes de existir auditoria, e guardar por precaução é o oposto de minimizar |
| 2026-09-10 | Escolher a faixa de renda no formulário É o ato de consentir, e um gatilho registra | Um toggle escondido em outra tela não é consentimento informado, e o padrão opt-in desligaria o modo proporcional para quem já usava. Como é gatilho e não chamada da UI, vale para qualquer caminho de escrita que exista amanhã |
| 2026-09-10 | O gatilho do consentimento é `security definer` | `profiles` nega update nas policies desde a migration dos perfis, e gatilho roda como quem chamou. Sem o definer ele atualizava zero linhas em silêncio — foi o teste que pegou |
| 2026-09-10 | A palavra EXCLUIR é conferida no banco, não na tela | Proteção que mora no cliente é proteção que quem chama a API direto não tem |
| 2026-09-10 | O corpo de `leave_couple` virou `sair_do_casal_interno`, com as duas entrando por ele | A exclusão de conta é os mesmos sete passos menos o último. Duplicar noventa linhas com uma diferença no fim é garantir que elas divirjam |
| 2026-09-10 | Na exclusão de conta, a linha de `couple_members` **some** (diferente da saída do casal, onde ela fica pseudonimizada) | Depois de pseudonimizar, o que sobra na linha é o `user_id`, que é identificador de pessoa. Os aportes já viraram "ex-membro" com o valor intacto, que é o que a regra protege |
| 2026-09-10 | O e-mail do parceiro sai **mascarado** no export, mesmo com "tudo do parceiro" escolhido | Faixa e nome ela já enxerga pela policy, então o export não dá acesso novo. `auth.users` não é exposta a ninguém, e a tela de convite já mostra `j••e@gm••l.com` de propósito: cru aqui desfaria essa decisão por outra porta |
| 2026-09-10 | Revogar o consentimento da faixa **não apaga** a faixa; quem para de usar é `pesosDaRegra` | Escolha sua. Eu disse que exigiria um branch em toda leitura e estava errado: a leitura é uma só. Fica a ressalva de que guardar dado que não se pode usar contraria o Art. 6º, III — está em Dívidas |
| 2026-09-10 | CSV em formato longo (`tabela,linha,campo,valor`), num arquivo só | Um arquivo por tabela viraria zip, e zip precisa de biblioteca. O formato longo é CSV de verdade, abre no Excel, e aguenta o schema mudar sem ninguém mexer nele |
| 2026-09-10 | BOM no CSV baixado, e só nele | Sem o BOM o Excel em português abre "Apê" como "ApÃª". O arquivo é para a pessoa ler |
| 2026-09-10 | Os guardas do CI moram em `scripts/`, não inline no YAML | Guarda que só existe no CI é guarda que a pessoa descobre dez minutos depois de mandar. `npm run guardas` roda os dois na máquina |
| 2026-09-10 | O guarda de portabilidade ignora comentário | Senão ele proíbe explicar por que a regra existe. E pega o que o compilador não pega: `core` já barra `window` pelo `lib` sem DOM, mas `packages/api` tem `@types/react` e passaria batido |
| 2026-09-10 | CI roda em pull request **e** no push para a principal | Um PR verde que vira merge quebrado por causa de outro PR verde é o modo de falha que só rodar em PR não pega |
| 2026-09-10 | Coluna sensível fecha por **grant de coluna**, não por policy | RLS filtra linha, não coluna. `invited_email` e `token_hash` saíram da lista do `grant select (...)`, e a lista é explícita: coluna nova nasce ilegível até alguém liberar. Falha fechada, como o allowlist do service worker |
| 2026-09-10 | `anon` recebe a mesma lista de colunas de `couple_invites` | O modelo do projeto é "anon tem grant e nenhuma policy, logo zero linhas". Sem o grant, zero linha passaria a vir de permissão negada, e o teste de isolamento deixaria de provar que quem barra é o RLS |
| 2026-09-10 | `exige_grant` do teste de RLS passou a usar `has_any_column_privilege` | Ele conferia `has_table_privilege` e reprovou na hora em que o grant virou por coluna — fez o trabalho dele. A pergunta que importa continua a mesma: sobrou alguma coluna legível para "zero linhas" significar RLS? |
| 2026-09-10 | O erro de cadastro é normalizado em `packages/api`, não em `acaoCadastrar` | Mesmo motivo já registrado para o erro de login: com a decisão na tela, o próximo chamador esquece e o oráculo volta por outra porta |
| 2026-09-10 | `centavosDeTexto` mora em `packages/core` e é a regra canônica de ler dinheiro digitado | Um parser ingênuo lê "1.234" como 123 centavos e grava valor mil vezes menor sem erro na tela. A regra existia testada em `open-graph.ts`; subiu para onde é pura, portável e usada pelo app |
| 2026-09-10 | O e-mail do stack local morre no **Mailpit**, em <http://127.0.0.1:54324> | `[local_smtp] enabled = true` no `config.toml` captura tudo e não entrega a ninguém. Não é defeito: é o desenvolvimento funcionando. Caixa de entrada de verdade só depois de SMTP configurado no painel do projeto hospedado — e aí sem SPF + DKIM + DMARC no domínio o Gmail manda para spam |
| 2026-09-10 | Teto de valor da meta é **constraint**; prazo vencido é **condição em `add_goal`** | Não é inconsistência. O teto vale nos dois caminhos de escrita, e editar meta não passa por `add_goal`. Já o prazo não pode valer no update: meta vencida é estado legítimo, e constraint tornaria impossível trocar o título de uma meta que venceu — defeito pior que o consertado |
| 2026-09-10 | `refetchOnReconnect: "always"`, e não o `true` padrão | O `true` só refaz consulta velha, e com `staleTime` de 30s uma queda de dez segundos não refaz nada. Como o Realtime não reenvia o que passou, reconectar é o único instante em que se SABE que pode ter faltado evento — e é o instante em que se relê sempre |
| 2026-09-11 | `/auth/confirm` aceita os DOIS formatos de link (`?token_hash=` e `?code=`), em vez de trocar de um para o outro | O painel do Supabase só libera editar template de e-mail para projeto com SMTP próprio, então produção recebe o template padrão, que passa por `/auth/v1/verify` e volta com `?code=`. Manter o ramo do `token_hash` significa que, no dia em que o SMTP entrar, colar os templates no painel devolve o caminho bom sem novo commit |
| 2026-09-11 | Não contratamos SMTP para destravar os templates | Medido: o tier gratuito do Resend sem domínio próprio só entrega para o e-mail do dono da conta, e isso quebraria o item 4 do teste de fumaça (segunda conta). O remetente compartilhado do Supabase, que já está ligado, entrega para qualquer endereço — pior em volume, melhor em alcance |
| 2026-09-11 | O tipo do fluxo viaja como `?type=recovery` no `redirect_to`, valor fixo | Sondado contra o stack local: parâmetro nosso sobrevive ao redirect do `/auth/v1/verify`. Fixo e não caminho vindo da URL, senão seria o redirect aberto que `destinoSeguro()` fecha no login, entrando por outra porta |
| 2026-09-11 | O mundo visual foi **fixado pelo brief**, e nenhum sorteio de direção rodou | O autor do produto entregou o design pronto, com hex, fontes, raios e quatro telas. O playbook do Impeccable manda o pin vencer o roll — inventar uma direção por cima seria trocar a decisão dele pela minha |
| 2026-09-11 | Outfit e "fundo creme" aceitos apesar de o skill listar os dois como padrão de IA a evitar | A regra do próprio skill é que o brief vence a advertência de padrão saturado. Ficam registrados como escolha consciente, não como descuido |
| 2026-09-11 | Fontes por `next/font`, e **não** por `<link>` para o Google | O `<link>` manda o IP de cada visita para o Google — transferência para terceiro num projeto que pôs o banco em `sa-east-1` justamente para não abrir esse capítulo. O `next/font` baixa no build e serve da nossa origem: zero requisição externa em runtime, e menos código |
| 2026-09-11 | Os 7 ícones são SVG nosso, e não `lucide-react` | O design usa glifo Unicode (`◎ ▤ ✓ ‹`), que muda de peso conforme a fonte do sistema e no Android vira emoji colorido. Sete desenhos num arquivo custam menos que uma dependência — e dependência nova exige sua autorização |
| 2026-09-11 | Os dois tons apagados do design foram **escurecidos**: `#8A8C7C`→`#63695D` e `#6E7566`→`#4C5345` | Medidos sobre o papel creme davam 3.02:1 e 4.21:1, abaixo do piso de 4.5:1 — e é neles que estão preço, data e toda explicação. Passam agora com 4.99 e 7.29, na mesma família sálvia. Acessibilidade não entra na conta do "o brief vence" |
| 2026-09-11 | A cor de cada pessoa sai de `ordemEstavel` em `packages/core`, não da tela | Se cada componente ordenasse do seu jeito, a mesma pessoa seria verde na home e âmbar na jornada, e a barra bicolor deixaria de querer dizer alguma coisa. Desempate: papel `dono` primeiro, depois `user_id`, que não muda |
| 2026-09-11 | A tela de detalhe tem **exatamente uma** `role="progressbar"` | O e2e usa `getByRole("progressbar")` sem `.first()`: uma segunda barra não é escolha estética, é teste quebrado por strict mode |
| 2026-09-11 | Categoria continua campo de texto, e não os chips do design | O e2e faz `.fill()` nela, e chip fechado tiraria a categoria livre que o banco aceita. Os chips do design entraram onde ele de fato os usa: filtrar o álbum na home |
| 2026-09-11 | "Sair" e o e-mail da conta saíram da home e foram para o perfil | O design não tem nenhum dos dois na home, e o perfil é para onde o disco de iniciais do cabeçalho leva. Foram dois testes atualizados — mudança de produto, não conserto de teste |
| 2026-09-11 | No detalhe, "por mês" no lugar de "já juntaram" | "Já juntaram" repetia palavra por palavra o que a barra diz logo acima, e virava segundo casamento em `getByText`. "Por mês, a dois" é o que o design pede ali, e some quando não há prazo — inventar horizonte seria mentir com número redondo |
| 2026-09-11 | O desktop foi derivado por mim; o design só desenhou o celular | Você pediu responsivo de verdade. A derivação é literal ao tema: o mesmo álbum, aberto sobre a mesa em vez de na mão — dock vira trilho à esquerda, total e "este mês" sobem para uma coluna à direita |
| 2026-09-11 | Bucket de capas **privado**, com URL assinada, em vez de público | Bucket público entrega a foto do casal a qualquer um com o link; o preço é uma assinatura por visita, e o Storage só assina o que a policy de select deixa ver |
| 2026-09-11 | `goals.cover_path` guarda **caminho**, com constraint contra o `couple_id` e o `id` da linha | Mesma razão de `profiles.avatar_url`: URL livre faz o navegador de quem abre buscar endereço escolhido por outra pessoa. Constraint e não RPC, porque editar jornada é update direto pelo PostgREST |
| 2026-09-11 | Reduzir e reencodar a foto no navegador antes de subir | O canvas não copia metadado: sai o EXIF e a coordenada de GPS junto, que é dado que o projeto declara não coletar. Sem isso, subir a foto do celular seria coletá-la sem querer |
| 2026-09-11 | Um tipo (`image/jpeg`) e uma extensão em todo o caminho | Como tudo é reencodado, aceitar mais tipos só aumentaria a superfície do regex, da policy e do bucket sem ninguém ganhar nada |
| 2026-09-11 | `casal_do_caminho` devolve `null` para caminho torto, não exceção | Erro em policy daria mensagem diferente para "não é seu" e "não existe", e diferença de resposta vira oráculo para quem varre |
| 2026-09-11 | Porta do Playwright vinda de `PORT`, com 3000 de padrão | `reuseExistingServer` aproveita o `next dev` de QUALQUER checkout na porta; a suíte rodou verde contra outra branch antes de alguém perceber |
| 2026-09-12 | Onboarding é **lista derivada**, não gate obrigatório nem tour guiado | Gate trava em coisa que a pessoa não termina agora (o convite depende do parceiro aparecer e de ela confirmar, dias depois), contradiz o casal solo que o `handle_new_user` cria, e reprovaria `auth.spec.ts:32` e `auditoria.spec.ts:134`/`:151`, que afirmam `toHaveURL("/")` logo após o login |
| 2026-09-12 | Nenhum estado de onboarding guardado | Cada passo é pergunta que os dados já respondem; uma coluna "tutorial concluído" seria uma segunda verdade para manter alinhada, e mentiria quando alguém apagasse a última jornada |
| 2026-09-12 | Permissão não vira passo do onboarding | O produto vende minimização como argumento; empurrar alguém a LIGAR métricas e marketing na primeira tela contradiz isso. O bloco só diz onde se desliga |
| 2026-09-12 | O nome do cadastro entra pela trigger, não por `set_profile` | `set_profile` exige sessão, e com confirmação de e-mail ligada não há sessão logo depois do cadastro. `raw_user_meta_data` é o único dado que chega na mesma transação |
| 2026-09-12 | A trigger CORTA o nome em 80 em vez de recusar | O metadata vem de quem se cadastra e a coluna tem check de 80; recusar dentro da trigger derrubaria o próprio cadastro, que é DoS de uma linha. Cortar não perde ninguém |
| 2026-09-12 | `split_rule` sai de `couple_members` e vai para `couples` | Substitui a decisão de 2026-09-10: com uma coluna por casal não há o que desempatar, e `regraDoCasal` deixa de existir |
| 2026-09-12 | `salvarRegraDoCasal` busca o casal em vez de recebê-lo | PostgREST recusa update sem WHERE (`21000`), e couple_id vindo do cliente é a regra 3 do CLAUDE.md. Buscar por `meuCasal` resolve os dois |
| 2026-09-12 | O e2e espera a resposta da Server Action, não o recado na tela | O recado do salvamento anterior continua visível enquanto o novo não volta: esperar por ele passa na hora e não espera nada |
| 2026-09-13 | Revogar consentimento apaga o DADO, não só o carimbo | Art. 18, IX. Guardar a faixa de renda depois da revogação é guardar sem base legal — e o app já parava de usar, o que dava a impressão de estar resolvido |
| 2026-09-13 | Retenção de cotação em 180 dias, dentro do expurgo existente | Curto demais mata o histórico de preço, que é a razão de a tabela ser append-only; e um job a menos é um agendamento a menos para descobrir que parou |
| 2026-09-13 | A política de privacidade é PÁGINA do app, não arquivo em `docs/` | Política que o titular não consegue abrir não está publicada. `docs/` fica com o que é interno: ROPA e plano de incidente |
| 2026-09-13 | A prioridade ordena pelo `.order` do banco, sem função em `core` | O enum `goal_priority` foi declarado ('baixa','media','alta') e o Postgres ordena enum pela ordem de declaração. Uma função de comparação no cliente seria código para repetir o que o banco já sabe |
| 2026-09-13 | O mapeamento de código de erro da Edge Function mora em `packages/core` | É regra de negócio (quais falhas o produto distingue) e é a única forma de testá-la sem subir o runtime de Edge Functions |
| 2026-09-12 | A marca de categoria dentro da chapa, em vez de esperar a foto do Storage | O gradiente sozinho lia como imagem quebrada; a capa de verdade continua entrando por cima quando existe, e o desenho é o que fica quando não existe |
| 2026-09-12 | Um degrau de 17px com nome (`Secao`) em vez de proibir tamanhos novos | O degrau já existia em quatro variantes; dar nome a ele é o que impede a quinta |
| 2026-09-12 | `key={aportadoCents}` na barra de progresso | É o que faz a animação repetir quando o valor muda pelo Realtime; sem ele o gesto só rodaria na primeira montagem e o valor mudaria num salto |
| 2026-09-12 | `prefers-reduced-motion` num bloco global em `globals.css`, não peça a peça | Uma declaração cobre toda animação e transição do app, inclusive as que ainda não existem |
| 2026-09-13 | Adotar o protótipo v2 inteiro, e não misturar com o creme+limão | Os três protótipos eram três mundos; "igual às três" não existe. A troca custou um arquivo de tokens, que é exatamente o que o DESIGN.md prometia |
| 2026-09-13 | Duas bordas: `borda` para cartão, `contorno` para controle | A do protótipo mede 1.25:1. Em cartão é decoração; em campo é o que diz onde o controle começa, e aí o piso de 3:1 vale |
| 2026-09-13 | Carrossel para de vez ao toque num ponto, em vez de ganhar botão de pausa | Conteúdo que anda sozinho precisa de mecanismo de parada; assumir o controle já É a parada, e não custa um botão que ninguém entenderia |
| 2026-09-13 | Home no desktop: destaque + álbum, e não o carrossel puro | Esconder cinco de seis num espaço que cabe todas não é o mesmo gesto que fazê-lo no celular |
| 2026-09-13 | O deslizante de valor convive com o campo de texto | Só o deslizante deixaria de fora todo valor que não cai num degrau de R$ 500, e "R$ 12.450" é um alvo tão legítimo quanto os outros |
| 2026-09-13 | A caixa de item é o próprio `<input>` desenhado, e não um input escondido | Escondido com `sr-only`, o alvo de clique vira 1px e o `check()` do Playwright erra o toque |
| 2026-09-13 | QR do convite ficou de fora | Exige biblioteca nova, e isso é pergunta, não decisão minha. WhatsApp e folha do sistema cobrem o caso sem dependência |
| 2026-09-13 | O carrossel é trilho deslizante, e não entrada por opacidade | O cartão precisa ir embora para o de trás poder chegar; sem isso a troca lê como pisca. E `gap` no trilho exige somar o vão ao passo, senão ele para meio cartão adiantado a cada volta |
| 2026-09-13 | Carrossel não pausa mais sob o ponteiro | No desktop o mouse repousa sobre o cartão sem intenção, e o giro ficava parado até alguém mexer nele — indistinguível de estar quebrado. A parada continua existindo pelos pontos, pelo foco e por `prefers-reduced-motion` |
| 2026-09-13 | Cartão fora de cena leva `inert`, não `aria-hidden` | Ele continua no DOM, e precisa sair do caminho do teclado também; `aria-hidden` num elemento focável é defeito, não conserto |
| 2026-09-13 | A capa é pedida no passo 2, e não no checklist | O cartão da home é 268px de foto contra quarenta de texto. Pedir a foto três telas depois é não pedir |
| 2026-09-14 | O nome de exibição é resolvido em `membrosDoCasal`, e não com migration | O dado certo já estava em `profiles` e a policy já o entregava; corrigir a leitura na única função por onde as quatro telas passam custou oito linhas, contra uma migration em função `security definer` mais backfill |
| 2026-09-14 | `profiles.display_name` ganha do `couple_members.display_name` | O perfil é o que a pessoa edita e o único preenchido nos dois caminhos de entrada. O do vínculo continua sendo a rede quando o perfil está vazio, e é ele que a saída do casal apaga |
| 2026-09-14 | Um `cronograma(total, forma, períodos)` com vetor de pesos, e não um método por classe | Parcela igual, crescente e decrescente são o mesmo cálculo com pesos [1,1,…], [1,2,…,n] e [n,…,1]. `dividirCentavos` já existia e já garante soma exata |
| 2026-09-14 | O método NÃO é persistido: só o prazo que ele gera | `goals` não tem onde guardá-lo, e o cronograma é derivável de alvo + períodos. Guardar exigiria migration, e o valor imediato é a decisão na criação |
| 2026-09-14 | O plural entra em `nomeDoRitmo`, não na tela | `nomeDoRitmo(ritmo) + "s"` dá "mêss". Foi o e2e que pegou |
| 2026-09-14 | A peneira da URL do item desce da função para a COLUNA | A função é um escritor; a coluna pega todos. O update direto pelo PostgREST gravava `javascript:` e o app renderiza `url` como `href` |
| 2026-09-14 | `not valid` + `validate constraint` em comandos separados | A armadilha do `goals_target_amount_cents_teto`: separados, a validação das linhas existentes falha sozinha e diz que é ela |
| 2026-09-14 | A ordem do álbum é prioridade primeiro, progresso como desempate | Os dois critérios são legítimos e vinham de lados diferentes do merge. Prioridade é o que o casal declarou; progresso é o que decide qual cartão abre o carrossel |
| 2026-09-14 | `prices.ts` tipa o contexto do erro pela FORMA, não como `Response` | `packages/api` compila com `lib: ["ES2022"]` sem DOM, porque a fase 2 roda o mesmo código no React Native |
| 2026-09-14 | `offers` sem `couple_id`, e a exceção escrita no cabeçalho | Oferta é conteúdo global: a mesma linha vale para todo casal, e ninguém é dono dela. O que a regra 1 protege — linha de um casal vazando para outro — não existe aqui |
| 2026-09-14 | A policy de leitura de `offers` carrega a janela de publicação | A regra 2 proíbe `using (true)`, e com razão: o predicado de vigência é o que impede oferta agendada ou vencida de sair pelo PostgREST. Filtro na consulta do cliente é sugestão, policy é regra |
| 2026-09-14 | Busca com `to_tsquery` OU, e não `plainto_tsquery` | `plainto` liga com E: "Geladeira 375L" exigiria os dois tokens e não acharia "geladeira frost free 375 litros", que é justamente o que a pessoa quer ver |
| 2026-09-14 | Nenhuma tabela de cliques | O painel do programa de afiliado já conta clique, conversão e comissão. Medir de novo seria duplicar o trabalho do parceiro e guardar dado de comportamento sem precisar |
| 2026-09-14 | `offers` sem coluna de imagem | Hotlink do CDN da loja entrega a ela o IP e o horário de quem só abriu a tela, sem clicar. A coluna entra quando houver cópia no nosso bucket |
| 2026-09-15 | `prefers-reduced-motion` não para o carrossel, só o deslize | A regra é sobre movimento, não sobre conteúdo. Parar o relógio congelava o cartão em quem tem o ajuste ligado, que no iPhone é comum — e o CSS já zera a transição sozinho |

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
| `apps/web/public/sw.js` | Sem teste automatizado. O allowlist do cache foi conferido à mão no navegador (5 arquivos antes e depois de navegar, e servidor derrubado caindo na tela offline). É regra de segurança sem rede de proteção no CI — deveria virar teste quando o Playwright entrar | Média |
| iOS | Nenhuma instrução de "Adicionar à Tela de Início" para quem abre no Safari. O convite de instalação simplesmente não aparece lá | Baixa |
| `apps/web/public/icon-*.png` | Ícones placeholder: dois anéis entrelaçados feitos por script. Serve para instalar, não para lançar | Baixa |
| `handle_new_user` | Todo cadastro ganha um casal, inclusive o abandonado antes de confirmar o e-mail. O caso do convidado foi resolvido: `confirm_invite` apaga o casal solo e vazio de quem entra. Sobra só o lixo do cadastro abandonado | Baixa |
| `components/cliente-supabase.tsx` | O access token fica em memória e só é trocado quando o servidor renderiza de novo. Numa aba aberta além de `jwt_expiry` (1h) sem navegar, o cliente do browser passa a usar token vencido até a próxima navegação. Só vai doer quando houver tela de longa permanência com Realtime (prompt 7) | Média |
| `apps/web/app/globals.css` | Tema claro na marra, sem tokens e sem modo escuro | Baixa |
| `checar_limite` | Contagem sem trava: uma rajada simultânea pode passar de um do limite. Marcado com `ponytail:` no código; o conserto é advisory lock por chave | Baixa |
| `confirm_invite` | Quem já tem plano com movimentação não consegue entrar em outro, e não existe caminho para mesclar os dois. Hoje a saída é apagar o próprio plano à mão | Média |
| `pg_cron` | O expurgo depende da extensão estar habilitada. Local funciona; no projeto hospedado precisa ser ligada antes da migration rodar | Média |
| `apps/web/app/(app)/aportes/form.tsx` | Um botão Salvar escreve três fatos independentes (regra, faixa de renda, valor fixo). Se o formulário estiver desatualizado quando alguém envia, salvar a REGRA apaga a FAIXA. Não é alcançável clicando (o botão desabilita durante o envio, e o caminho de gente foi conferido no navegador), mas é forma frágil para dado pessoal — deviam ser três escritas separadas | Média |
| `contributions_update` | Insert agora é só pela função, mas o update continua aberto ao casal: dá para inserir um centavo e depois reatribuir o `user_id` para alguém de fora. Fecha a mesma dívida antiga por outro caminho | Baixa |
| `supabase/functions/_shared/ssrf-guard.ts` | O guard resolve o DNS e o `fetch` resolve de novo: existe janela de DNS rebinding entre as duas. Fechar exigiria conectar no IP fixado, que o `fetch` não oferece. Marcado com `ponytail:` no código | Média |
| `supabase/functions/_shared/open-graph.ts` | `precoParaCentavos` é a MESMA regra de `centavosDeTexto`, que agora mora em `packages/core/src/money.ts` e é a canônica. O Deno não importa do workspace npm sem passo de bundle, então a cópia continua — e agora com a obrigação de andar junto | Média |
| `extract-product-link` | O caminho de gravação da função não foi exercido ponta a ponta: as páginas de loja que conseguimos alcançar não publicam `og:price:amount`, então o preço voltou nulo e o `add_price_quote` não chegou a ser chamado POR ELA. A RPC foi conferida pela mesma porta (anon key + JWT), e a extração tem 17 testes — falta só a emenda entre as duas | Média |
| `supabase/functions/extract-product-link/index.ts` | Fora do `tsc`: o arquivo importa APIs do Deno e `npm:`, então só o `deno check` do `functions serve` e do deploy o confere. `_shared` continua no typecheck do monorepo | Baixa |
| `extract-product-link` × app | Nenhuma tela chama a função ainda. Ela entra quando o prompt 7 criar os itens da meta, que é onde o link de produto vive | Baixa |
| Realtime × DELETE | O evento de DELETE chega mesmo com `filter: couple_id=eq.X`, e o `old` só tem a chave primária — ou seja, o filtro não é aplicado a deletes. Na prática um parceiro de OUTRO casal, assinando a mesma tabela, receberia o uuid de linhas nossas apagadas. É um uuid e nada mais, mas é informação que não devia sair. O conserto é broadcast por trigger, com canal privado | Média |
| escrita × Realtime | Toda escrita nossa recarrega duas vezes: a mutation invalida, e o eco do próprio evento no canal invalida de novo. É o preço de não depender do websocket para a tela responder | Baixa |
| `components/cliente-supabase.tsx` | Em desenvolvimento, o Fast Refresh inspeciona o cliente e esbarra no proxy da opção `accessToken`, que levanta em qualquer acesso a `auth.*`. Vira um warning "Failed to re-render" no console. Só em dev, mas confunde quem está depurando outra coisa | Baixa |
| `/metas` × `/aportes` | Duas entradas para registrar aporte (a meta e a tela de saldo). Chamam a mesma função de `packages/api`, então não são duas regras — mas são duas telas para manter quando o formulário mudar | Baixa |
| lista de metas | A lista busca TODOS os aportes do casal para somar por meta no cliente. Com centenas de aportes isso vira payload à toa; o certo é uma view com o total por meta | Baixa |
| `couple_members.income_band` | Revogar o consentimento não apaga a faixa guardada: o app para de usar, mas o dado fica. Contraria o Art. 6º, III (minimização) — o certo é apagar junto com a revogação. Decisão sua, registrada aqui | Média |
| consentimento | Sem histórico: a coluna guarda só a última resposta. Se alguém consentiu, revogou e consentiu de novo, o banco lembra só da última data. Vira problema quando houver auditoria de verdade | Baixa |
| analytics e marketing | Os dois toggles guardam a resposta e mais nada — não existe Sentry nem medição no projeto. O texto da tela diz isso. Quando entrar, alguém precisa lembrar de LER a coluna antes de disparar qualquer evento | Média |
| `delete_account` | O e-mail apagado some de `auth.users`, mas o Supabase pode ter cópia em log de auth e em backup. Eliminação de verdade exige combinar retenção com o provedor — entra no plano de resposta a incidente | Média |
| CI | Nunca rodou: não existe remote no GitHub ainda. O workflow foi escrito contra a documentação, e os dois guardas foram provados localmente, mas os passos de `supabase start` e do gitleaks só serão exercidos no primeiro PR | Média |
| Realtime × edição simultânea | Não há resolução de conflito: os dois updates passam, o banco fica com o último e as telas convergem para ele. Quem escreveu primeiro não é avisado de que foi sobrescrito. Comportamento observado na auditoria; não existe regra definida | Média |
| `apps/web/public/sw.js` | O navegador da auditoria recusa registrar service worker, então o Cache Storage **não foi inspecionado em execução**. A leitura do código mostra que só o `install` popula o cache, com allowlist fechado, sem nenhum `cache.put` em runtime — mas isso é revisão estática, não prova | Média |
| e2e × servidor de desenvolvimento | A suíte roda contra `next dev`, que compila cada rota na primeira visita — daí o teto de 4 workers e os 90s de prazo por teste. Contra build de produção seria estável e rápida, ao custo de um build por rodada | Baixa |
| `apps/web/public/sw.js` | Continua sem teste: o service worker só registra em produção, e a suíte roda em desenvolvimento. É a única regra de segurança da fase 1 ainda sem rede de proteção | Média |
| `leave_couple` | `auth.sessions` é de `supabase_auth_admin`. Local o `postgres` apaga; se o projeto hospedado recusar, o passo cai calado e só o `left_at` protege — que já é o corte real, mas a sessão sobreviveria até o token vencer | Média |
| `goals_target_amount_cents_teto` | A constraint é validada contra as linhas existentes. Local não dói, porque `db reset` sobe do zero — mas um `db push` para banco que já tenha meta acima de R$ 100 milhões vai falhar na hora, e a mensagem não diz qual linha | Baixa |
| `convite.sql` | Os dois claims simultâneos são testados em sequência, não em paralelo: `psql` roda numa conexão só e não há `dblink` nem `pg_background`. O predicado do update é o mesmo caminho, mas a concorrência de verdade não foi exercida | Baixa |
| `/auth/confirm` × PKCE | Enquanto produção usar o template padrão, confirmar cadastro só funciona **no mesmo navegador** que se cadastrou: o `code` só vale junto do cookie `code_verifier`. Quem se cadastra no computador e abre o e-mail no celular não confirma, e a tela só diz "link inválido". Acaba no dia em que o SMTP entrar e os templates próprios subirem | **Alta** |
| `/auth/confirm` × `?code=` | O caminho feliz do `?code=` não tem teste de suíte — o stack local usa os templates próprios, e trocá-los quebraria os outros 37 testes. Só a recusa (código inventado não vira sessão) está coberta; o sucesso foi provado por sonda manual e pelo teste de fumaça | Média |
| identificadores × produto | Produto e rota dizem "jornada"; o código ainda diz `useMetas`, `criarMeta`, `DadosMeta`, `Meta`. Um `s/Meta/Jornada/` cego quebra `Metadata` e `MetadataRoute`, então o rename exige lista explícita de identificadores | Média |
| `apps/web/public/icon-*.png` | Os anéis placeholder agora destoam da paleta creme e limão, e a marca mudou de nome. Trocar é trabalho de marca, não de restyle | Média |
| desktop com pouca jornada | A chapa dobrando de altura no `lg` resolveu o caso de seis jornadas — a composição ia até 45% da altura e agora enche a tela. Com uma ou duas jornadas continua visivelmente vazio, e aí o conserto é outro: a coluna da direita teria que descer para junto do álbum | Baixa |
| `contributions_update` | Mesma classe do `couple_members_update` que acabou de fechar: o update segue aberto ao casal, então dá para inserir um centavo e depois reatribuir o `user_id` para alguém de fora. Custa uma cláusula no `with check` | Baixa |
| `<<PREENCHER>>` na papelada | ROPA, plano de incidente e página de privacidade estão escritos e **não valem como documento** até o controlador, o encarregado e o canal de contato serem preenchidos. A página já está no ar com as lacunas visíveis em vermelho — é melhor que lacuna escondida, e pior que documento pronto | **Alta** |
| busca de preço × e2e | O caminho feliz do botão não é exercido de ponta a ponta: o runtime de Edge Functions não sobe com `supabase start` neste ambiente e, servido à mão, não resolve o host interno do Supabase. O mapeamento de erro tem teste puro em `core`, e a função tem 17 unitários — falta a emenda | Média |
| capa × exclusão | Apagar jornada, sair do casal ou apagar a conta **não apaga o arquivo** do bucket. O `protect_delete` do Storage barra delete por SQL de propósito (senão sobra blob sem linha), então a limpeza de verdade exige a API do Storage. Hoje a foto fica inalcançável — a policy nega a todo mundo, porque o casal deixou de existir — mas continua guardada | Média |
| capa × tamanho | Sem transformação de imagem (recurso do plano Pro), a mesma foto de 1280px serve a polaroide de 96px da lista e a do detalhe. Some quando o plano mudar, ou com uma segunda versão gerada no envio | Baixa |
| `supabase/tests/run.sh` × sem Docker | O caminho do Postgres descartável já não aplica todas as migrations: `extensions.gen_random_bytes` e a publication `supabase_realtime` não existem num Postgres pelado, e o `set -e` derruba a rodada antes dos testes. Vem de antes da capa; o `capa.sql` foi conferido nesse caminho à mão e passa. O conserto é o bootstrap stubar os dois | Média |
| `apps/web/components/pecas.tsx` × fase 2 | **`Chapa` desenha com `radial-gradient` dentro de `style={{ backgroundImage }}` — React Native não tem nenhum dos dois.** São os seis duotones de categoria, o miolo da identidade v2, e aparecem em toda polaroide, cartão e linha de oferta. `expo-linear-gradient` só faz linear; o caminho é `react-native-svg` com `radialGradient`. **É maior que a dívida do NativeWind, e foi descoberto só em 2026-09-16.** A boa notícia ao lado: os ícones de `icones.tsx` são `circle`/`path` escritos à mão e portam quase literalmente | **Alta** |
| `apps/web/lib` × fase 2 | `mensagemDoBanco` (`erro.ts`, lógica pura) e a regra do meio-dia UTC (`dinheiro.ts:17`) moram no `apps/web` e serão reimplementadas no Expo. A do meio-dia **já está duplicada hoje**: `aportes/actions.ts:48` escreve `${quando}T12:00:00Z` na mão em vez de chamar `paraInstante`. ~30 linhas para mover ao `core` | Média |
| `apps/web/app/globals.css` × fase 2 | A dívida do Tailwind 4 `@theme` × NativeWind agora pesa mais: o tema inteiro (paleta, tipografia, raios, sombras) mora num bloco que o NativeWind estável não lê. As telas portam; o tema é reescrito | Média |
| ~~tela "Nova jornada"~~ | **Fechada em 2026-09-13.** A tela em dois passos existe em `/jornadas/nova`, com chips, deslizante, prazo em pílulas e o checklist do passo 2 | — |
| dock no desktop | O trilho da esquerda é uma pílula de 3 discos mais o botão verde, flutuando sozinha numa faixa de 6rem. Funciona e é o mesmo dock deitado, mas lê como peça solta, não como barra | Baixa |
| `iniciaisDoCasal` × "Você" | A mesma pessoa aparece como "Ana" na jornada e como "Você" em /aportes, então o disco colorido mostra "A" numa tela e "V" na outra. O nome está certo nas duas (uma é lista compartilhada, a outra é a conta de cada um), mas o disco é a mesma peça e diverge. Ficou visível justamente porque as duas telas passaram a usar `LinhaAporte` | Baixa |
| ~~ordem do álbum~~ | **Fechada em 2026-09-13** por `ordemDoAlbum`: mais adiantada primeiro, empate pela mais nova. `goals.priority` continua órfã — ver a linha própria | — |
| chapa × foto | **Encolheu em 2026-09-13:** a capa passou a ser pedida no passo 2 da criação, então toda jornada nova tem a chance de nascer com foto. Fica de pé só para as jornadas ANTIGAS, onde pôr foto continua sendo um clique dentro do detalhe | Baixa |
| home × carrossel | No celular a home mostra UMA jornada de seis. Foi decisão explícita, e a lista cobre o resto — mas é uma aposta: se o casal tiver muitas jornadas, o caminho para a terceira passou a ter dois toques em vez de um | Média |
| convite × QR | Os três botões do protótipo eram WhatsApp, Link e QR. O QR saiu porque exige biblioteca nova (`qrcode`, que roda em React Native também). Enquanto não entrar, quem está do lado da pessoa precisa mandar o link por algum app | Baixa |
| `price_quotes` × tela | A tabela existe, a Edge Function existe, os 17 testes de extração existem — e NENHUMA tela mostra histórico de preço. É a peça mais pronta e mais invisível do projeto | Média |
| aporte × jornada em foco | O "+" do dock leva a `/aportes`, que pede para escolher a jornada. No cartão em destaque a jornada já é conhecida, e registrar ali economizaria dois toques na ação mais frequente do produto | Média |
| `goals.priority` | Continua gravada e nunca lida. Com `ordemDoAlbum` ordenando por progresso, ela ficou ainda mais órfã: ou vira critério de ordem, ou sai | Baixa |
| Realtime × recado | O evento do parceiro chega e invalida a consulta, mas nada na tela diz que chegou. "Lucas colocou R$ 400 hoje" é informação que o app já tem em mãos e joga fora | Média |
| `display_name` em duas tabelas | A leitura foi corrigida, mas as duas colunas continuam existindo e podendo divergir. O conserto de raiz é `set_profile` propagar para `couple_members`, ou `couple_members.display_name` sumir — as duas exigem migration, e a segunda mexe em `leave_couple`, `delete_account` e no export | Média |
| `goal_items.url` × afiliado | O campo saiu do formulário e a coluna ficou esperando a indicação de afiliado. Enquanto ela não chega, nenhum item novo tem link e o "ver na loja" só aparece para os itens antigos | Baixa |
| método × jornada aberta | O método escolhido na criação não é guardado: a jornada nasce só com o prazo que ele gerou. A tabela semana a semana com os quadradinhos — que é o que a referência mostra — precisa que o método seja persistido, e os quadradinhos já são os aportes. Migration de uma coluna em `goals` mais uma tela | Média |
| `offers` sem fonte automática | A tabela é o contrato e as linhas entram à mão, com a service role, até haver conta aprovada em programa de afiliado. Nenhuma linha do lado de leitura muda quando a API entrar — mas até lá não monetiza nada | Média |
| oferta × home | A faixa de ofertas na home não foi construída: só a sugestão colada no item. Na jornada o casal já declarou o que quer; na home seria anúncio sem contexto, e o custo em confiança é maior | Baixa |
| ~~política × publicidade~~ | **Fechada em 2026-09-16.** A página declara a relação comercial numa seção própria, e o interruptor de e-mail promete só sobre e-mail. O que sobrou na seção "Métricas e e-mail" — "hoje eles não fazem nada" — segue verdade: nenhum dos dois consentimentos é lido por nada | — |
| sugestão × texto do casal | A oferta põe título de produto no meio da lista de itens, e isso já quebrou três asserções de e2e que casavam por substring ("Geladeira" achava o item E "Geladeira frost free 375L"). Consertado com `exact`, mas é sinal: conteúdo de terceiro na lista deles tem custo, e a próxima busca por texto nessa tela precisa ser específica | Baixa |
| comissão × termos do afiliado | A frase que mencionava a comissão saiu a pedido. Vários programas exigem redação específica de divulgação no material do afiliado — quando a conta for aprovada, os termos precisam ser lidos e a frase pode ter que voltar | Média |

---

## Bloqueios

O que está travado esperando algo de fora (decisão sua, conta de terceiro, resposta de suporte).

| Desde | O que trava | Esperando |
|---|---|---|
| — | — | — |
