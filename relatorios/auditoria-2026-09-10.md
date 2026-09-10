# Auditoria — A DOIS

**Data:** 2026-09-10 · **Commit:** `6238d43` · **Ambiente:** stack local do Supabase,
parado e subido do zero, `db reset` com as 8 migrations · **Nada foi corrigido nesta
sessão.**

---

## 1. Resumo

Dá para usar com um casal real hoje, com uma ressalva de privacidade e uma de usabilidade.
O que protege dinheiro e separa um casal do outro está sólido: **zero achados** nas 40
sondagens diretas de API, e o teste central do convite passou nos três canais — quem
reivindica não lê uma linha sequer antes da confirmação. Não há Bloqueador nem Crítico.
O que impede recomendar sem ressalva são dois defeitos de médio porte: a tela de cadastro
**revela se um e-mail já tem conta**, e os campos de dinheiro **recusam vírgula**, que é
como brasileiro escreve valor. Os dois têm conserto pequeno e localizado.

---

## 2. Placar por área

| Área | Testados | Passou | Falhou | Não testável |
|---|---|---|---|---|
| 1 · Estático (typecheck, lint, build, guardas) | 6 | 6 | 0 | 0 |
| 2 · Unitários (`core` + `functions`) | 94 | 94 | 0 | 0 |
| 3 · RLS (7 arquivos SQL + 3 mutações) | 10 | 10 | 0 | 0 |
| 4.1 · Cadastro | 5 | 4 | 1 | 0 |
| 4.2 · Login e sessão | 9 | 9 | 0 | 1 |
| 4.3 · Perfil e apelido | 10 | 10 | 0 | 0 |
| 4.4 · Convite, claim e confirmação | 32 | 32 | 0 | 1 |
| 4.5 · Metas e itens | 14 | 12 | 2 | 0 |
| 4.6 · Aportes e divisão | 11 | 10 | 1 | 0 |
| 4.7 · Tempo real | 5 | 5 | 0 | 0 |
| 4.8 · Extração de link e preços | 12 | 12 | 0 | 3 |
| 4.9 · PWA | 6 | 4 | 0 | 2 |
| 4.10 · LGPD | 18 | 18 | 0 | 1 |
| 5 · Sondagens de segurança | 40 | 40 | 0 | 0 |
| **Total** | **272** | **266** | **5** | **9** |

Suíte Playwright: **36 testes, 36 verdes** (o de cadastro duplicado está marcado
`test.fail()` — vermelho enquanto o defeito existir, verde no dia em que for consertado).

---

## 3. Achados

| # | Severidade | Área | O que acontece | O que deveria acontecer | Como reproduzir | Arquivo suspeito |
|---|---|---|---|---|---|---|
| 1 | **Alto** | Cadastro | Cadastrar com e-mail que já tem conta mostra *"Não rolou agora. Tenta de novo daqui a pouco?"*; com e-mail novo mostra *"Se esse e-mail for novo por aqui, o link de confirmação já está a caminho."* Duas frases diferentes = dá para descobrir quem usa o app | A mesma frase nos dois casos, como já acontece no login | `POST /auth/v1/signup` com e-mail existente devolve `422 user_already_exists`; com e-mail novo, `200`. Confirmado com 12s entre as chamadas, fora de qualquer rate limit | `apps/web/app/(auth)/actions.ts` (`acaoCadastrar`, cai em `ERRO_GENERICO`) e `packages/api/src/auth.ts` (o comentário afirma que o Supabase devolve sucesso com usuário fantasma — não devolve) |
| 2 | **Médio** | Dinheiro / UX | Os campos de valor são `<input type="number">` e o Chromium **recusa a vírgula**. Quem digita `1250,50` não consegue registrar o aporte | Aceitar vírgula, que é a notação em português. `paraCentavos` já sabe ler as duas | Abrir `/aportes`, digitar `1250,50` no campo "Quanto (R$)". O caractere não entra | `apps/web/app/(app)/aportes/form.tsx`, `apps/web/app/(app)/metas/lista.tsx`, `apps/web/app/(app)/metas/[id]/detalhe.tsx` (4 campos) |
| 3 | **Médio** | Privacidade | Qualquer membro do casal lê `couple_invites.invited_email` **em claro** pelo PostgREST. Se A convida alguém por e-mail, B vê o endereço dessa terceira pessoa | Coerência com a decisão de 2026-09-10: e-mail sai mascarado do banco, como `pending_claim` já faz | `GET /rest/v1/couple_invites?select=invited_email` autenticado como o parceiro | `supabase/migrations/20260910075048_convite_com_confirmacao.sql` (policy `couple_invites_select`) |
| 4 | **Médio** | Metas | Meta aceita prazo no passado (`2020-01-01`) e valor alvo de R$ 90 trilhões, sem nenhuma recusa | Recusar prazo anterior a hoje; ter um teto de valor que caiba na tela | `add_goal` com `p_deadline_at` no passado → `200`; com `p_target_amount_cents: 9e15` → `200` | `supabase/migrations/20260910151014_metas_e_itens.sql` (`add_goal`) |
| 5 | **Baixo** | Privacidade | `couple_invites.token_hash` é devolvido ao cliente. É SHA-256 de 32 bytes aleatórios — não dá para reverter — mas o projeto trata esse campo como segredo e o remove do export | Não expor a coluna; o cliente não tem uso para ela | `GET /rest/v1/couple_invites?select=token_hash` autenticado | mesma policy do achado 3 |
| 6 | **Baixo** | Login | Depois de errar a senha, o formulário limpa **os dois** campos. A pessoa redigita o e-mail a cada tentativa | Manter o e-mail preenchido | Errar a senha em `/login` e olhar o campo de e-mail | Comportamento do React 19 ao submeter Server Action; `apps/web/app/(auth)/login/form.tsx` |
| 7 | **Baixo** | Itens / consentimento | Caixas de marcar são controladas sem estado otimista: só marcam quando a escrita volta do servidor. Em rede ruim parece que o clique não pegou | Marcar na hora e reverter se falhar | Marcar um item como comprado em `/metas/[id]` com rede lenta | `apps/web/app/(app)/metas/[id]/detalhe.tsx` |

**Nenhum Bloqueador. Nenhum Crítico.**

### O que passou, e vale dizer que passou

- **Teste central do convite (Bloqueador se falhasse):** nos três canais, depois de
  reivindicar e antes da confirmação, quem reivindicou lê **0 linhas** de `goals`,
  `goal_items`, `contributions`, `price_quotes`, `couples` e `couple_members` — consultado
  direto no banco como aquele usuário, não pela UI.
- **Isolamento entre casais:** 9 tabelas lidas, 9 escritas cruzadas, 8 inserts com
  `couple_id` de outro casal no corpo, 4 funções definer com alvo de fora. Tudo recusado,
  0 linhas afetadas.
- **Sem oráculo no convite:** inexistente, revogado, vencido, já usado, auto-convite,
  e-mail divergente e apelido divergente devolvem todos `indisponivel`.
- **Sem oráculo no login:** senha errada, e-mail inexistente e e-mail malformado devolvem
  a mesma frase.
- **A suíte de RLS reprova quando deve:** três policies quebradas de propósito
  (`goals_select` com `using(true)`, `contributions_insert` aceitando o corpo,
  `price_quotes_update` deixando de negar) fizeram o teste falhar nomeando o problema.
- **Dinheiro:** `money.ts` e `split.ts` com 100% de cobertura de statements. Na tela,
  R$ 617,28 de R$ 12.345,67 — nenhum valor 100x maior ou menor em lugar nenhum.
- **Sessão:** cookie `httpOnly=true secure=true sameSite=Lax`, nada em `localStorage` nem
  `sessionStorage`, logout invalida de verdade, `/metas` sem sessão vai para o login.
- **Saída do casal:** nome e faixa apagados, aportes com valor intacto e sem dono,
  convites de quem saiu revogados, refresh token invalidado (HTTP 400), o access token
  antigo já não enxerga o plano, e o parceiro continua com tudo. Último membro: hard
  delete, sem casal órfão.
- **Guard anti-SSRF:** `file://`, IP privado, `169.254.169.254`, loopback, domínio fora da
  allowlist, allowlist usada como prefixo e credencial embutida — todos recusados pela
  Edge Function rodando de verdade.
- **`price_quotes` é append-only:** duas cotações do mesmo item viram duas linhas, e
  update e delete não pegam linha nenhuma nem no próprio casal.

### Tempo real: o que foi observado

- Meta criada por A aparece na tela de B sem refresh; aporte de B move a barra de A.
- **Edição simultânea:** não há resolução de conflito. Os dois updates são aceitos e o
  banco fica com o último a gravar; as duas telas convergem para ele pelo Realtime. Nada
  se perde silenciosamente do ponto de vista do banco, mas quem escreveu primeiro não é
  avisado de que foi sobrescrito. Não há regra definida, e este relatório não propõe uma.
- **Reconexão:** B offline, A escreve, B volta — B converge sozinho, sem refresh.

  > **CORREÇÃO, feita ao consertar o achado 7.** Este item foi dado como aprovado e
  > **passou por sorte**. O `postgres_changes` não reenvia o que passou enquanto a
  > conexão esteve fora, e o `refetchOnReconnect: true` padrão só refaz a consulta se
  > ela estiver velha — com `staleTime` de 30s, uma queda curta deixava a tela do
  > parceiro mentindo até alguém navegar. Rodando o mesmo teste três vezes, ele
  > falhava. Corrigido com `refetchOnReconnect: "always"`; o teste passa três de três.
  > Fica o aprendizado: teste de convergência que roda uma vez só não prova
  > convergência.

---

## 4. O que NÃO consegui testar

| Item | Por quê |
|---|---|
| **Cache Storage do service worker em execução** | O navegador embutido recusa registrar service worker (`Failed to register a ServiceWorker ... unknown error`), mesmo com `/sw.js` servido em 200 e contexto seguro. **Substituí por leitura do código:** `apps/web/public/sw.js` só popula o cache no `install`, a partir de um allowlist fechado de 5 arquivos estáticos, e não tem nenhum `cache.put` em tempo de execução — não existe caminho que cacheie resposta autenticada. Isso é revisão estática, **não é prova de execução**. |
| **Tela offline e prompt de instalação em execução** | Mesma limitação do service worker. `/offline` responde 200 e o manifest é válido, mas o comportamento offline não foi exercido. |
| **Guard anti-SSRF: redirect para rede interna, resposta acima de 2 MB e timeout** | Exigiriam um servidor controlado dentro da allowlist (`amazon.com.br` e companhia). Estão cobertos pelos 24 testes unitários de `ssrf-guard.test.ts` com `fetch` injetado, mas **não** contra a Edge Function rodando. |
| **Extração de preço de uma página de produto real** | As lojas alcançáveis não publicam `og:price:amount` na home, e não achei URL de produto estável. Título e imagem foram extraídos de verdade da Americanas; o caminho que grava em `price_quotes` a partir da função não foi exercido ponta a ponta. |
| **Rate limit de 20 buscas de apelido/hora** | Bateu em 4 recusas de 24 tentativas, e não consegui isolar se o corte foi exatamente no 21º ou se outro limite entrou junto. O limite existe e funciona; o número exato não foi confirmado. |
| **`secure` do cookie em produção** | Medido em `http://localhost`, onde o valor observado foi `true`. Em HTTPS de verdade não foi verificado. |
| **CI no GitHub Actions** | Não existe remote. O workflow nunca rodou: `supabase start`, `playwright install` e o gitleaks só serão exercidos no primeiro PR. |
| **Arquivar meta** | A funcionalidade não existe no app. Não é falha de teste, é escopo que nunca entrou. |
| **Senha sem confirmação (campo "repita a senha")** | Não existe campo de confirmação em nenhum formulário. Não há o que testar. |
| **JWT expirado de verdade** | Usei um JWT com `exp` no passado e assinatura inválida, que o GoTrue recusa com 401. Um token legítimo já vencido exigiria esperar `jwt_expiry` (1h). |

---

## 5. Ordem de correção sugerida

1. **Achado 1 (Alto) — enumeração no cadastro.** É o único com consequência de segurança
   e o conserto é uma linha: tratar `user_already_exists` como sucesso em
   `acaoCadastrar`, devolvendo a mesma frase do caminho feliz. Corrigir junto o comentário
   de `packages/api/src/auth.ts`, que hoje afirma o contrário do que o GoTrue faz. O teste
   `test.fail()` já está no lugar e fica verde sozinho.
2. **Achado 2 (Médio) — vírgula no dinheiro.** Trocar `type="number"` por `type="text"`
   com `inputMode="decimal"` nos 4 campos. `paraCentavos` já aceita vírgula; some a
   validação nativa de `min`/`step`, que o banco já faz.
3. **Achado 3 (Médio) — e-mail do convidado em claro.** Fechar a leitura de
   `invited_email` (e do `token_hash`, achado 5, na mesma mexida) e servir a tela por
   função definer que devolve o e-mail mascarado, como `pending_claim` já faz.
4. **Achado 4 (Médio) — meta sem validação de prazo e de teto.** Duas condições em
   `add_goal`.
5. **Achado 5 (Baixo) — `token_hash` exposto.** Sai junto com o 3.
6. **Achado 6 (Baixo) — formulário de login limpa o e-mail.** Devolver o e-mail no estado
   da Server Action e usar como `defaultValue`.
7. **Achado 7 (Baixo) — caixas sem estado otimista.** `onMutate` do TanStack Query nas
   duas mutações de marcar.

Depois disso, as duas dívidas de cobertura que sobraram: **service worker sem teste de
execução** e **CI que nunca rodou**.
