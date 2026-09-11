# Product

<!-- impeccable:product-schema 1 -->

<!-- Mora na raiz, junto de CLAUDE.md e EVOLUCAO.md, porque a verdade do
     produto vale para o monorepo inteiro (apps/web, packages, supabase e o
     apps/mobile da fase 2), não só para apps/web. -->

## Platform

web

## Users

Casais brasileiros — duas pessoas, nunca mais — que dividem dinheiro e querem
planejar compras e objetivos juntos. O plano é de dois: o modelo trava em dois
membros por casal.

Situação de uso: no celular, fora do horário de trabalho, geralmente com as
duas pessoas em momentos diferentes (uma anota o aporte, a outra vê depois).
Por isso a sincronização em tempo real é parte do produto, não enfeite.

O trabalho que estão fazendo: acordar quanto cada um coloca, acompanhar quanto
já juntaram, e decidir o que comprar e quando.

## Product Purpose

Um plano de metas compartilhado entre duas pessoas, sincronizado em tempo real,
com sugestão de onde comprar cada item.

Sucesso é o casal conseguir conversar sobre dinheiro sem planilha e sem
discussão de centavo: os dois veem o mesmo número, ao mesmo tempo, e a divisão
é explicável.

## Positioning

Três mecanismos que um app de finanças vizinho não copiaria de graça:

1. **Convite é pedido, não concessão.** Aceitar um convite não dá acesso a
   nada: cria um pedido. Quem convidou vê quem apareceu (nome, apelido, e-mail
   mascarado, idade da conta) e só a confirmação cria o vínculo. O canal é
   entrega; a autorização é sempre de quem convidou.
2. **Divisão explicável.** Meio a meio, pela faixa de renda, ou por valor
   combinado — com o rateio pelo método do maior resto, que fecha a soma exata
   e tem resposta para quem reclamar do centavo.
3. **Minimização levada a sério como produto.** Não se coleta CPF, endereço
   completo, geolocalização, renda exata nem data de nascimento. Isso é
   argumento de confiança, não só conformidade.

## Operating Context

- Uso predominante no celular; o app é instalável como PWA.
- As duas pessoas raramente estão no app ao mesmo tempo, mas precisam ver o
  mesmo estado quando abrirem.
- Quem sai do casal é pseudonimizado: nome e faixa de renda somem, os aportes
  ficam com o valor intacto como "ex-membro". Hard delete do plano só quando o
  último membro sai, e só com confirmação explícita.
- Dinheiro em português do Brasil: vírgula decimal, ponto de milhar, R$.

## Capabilities and Constraints

Funciona hoje: cadastro/login/recuperação de senha, criação e edição de metas,
itens de meta com link de loja e histórico de preço, aportes, três regras de
divisão, convite em três canais (e-mail, apelido, link) com máquina de seis
estados, saída do casal, exportação de dados (JSON e CSV), exclusão de conta,
três consentimentos, e tempo real entre as duas pessoas.

Restrições que não se negociam (detalhadas em CLAUDE.md):

- Toda tabela com `couple_id` e RLS; nenhuma policy com `using (true)`.
- `couple_id` sempre do JWT, nunca do corpo da requisição.
- Dinheiro é `integer` em centavos; formatação só na UI.
- Nenhum log, breadcrumb ou evento carrega valor monetário, e-mail ou
  `couple_id`.
- Sessão em cookie `httpOnly` + `secure` + `sameSite=lax`; nunca `localStorage`.
- Service worker não cacheia resposta autenticada.
- Banco em `sa-east-1`.

Restrição de portabilidade: `packages/core` é TypeScript puro e `packages/api`
não cria o cliente Supabase, porque o app nativo em Expo é fase 2 e precisa ser
adição, não reescrita.

Terminologia: o que o banco chama de `goals` o produto passa a chamar de
**jornada** (decisão de 2026-09-11). A tabela continua `goals`; a rota vira
`/jornadas`.

## Brand Commitments

- **Nome: "Jornada".** Decidido em 2026-09-11, substituindo o provisório
  "A DOIS". O nome vive em `APP_NAME` (`packages/core/src/constants.ts`) e
  nunca é escrito à mão no código.
- **Voz:** português do Brasil, informal e caloroso, sem jargão de banco.
  "Quanto vocês já juntaram", não "Saldo acumulado do período". A segunda
  pessoa do plural ("vocês") é a voz padrão, porque o produto é de dois.
- **Franqueza em tela de risco.** Onde a ação é irreversível ou concede acesso
  a dado financeiro de outra pessoa, o texto diz o que acontece sem eufemismo,
  e o aviso vem antes dos botões.
- Ícones atuais são placeholder (dois anéis por script) e não representam a
  marca; substituí-los é trabalho em aberto.

## Evidence on Hand

- Aplicação **em produção** desde 2026-09-11: `a-dois-web.vercel.app`,
  Supabase em `sa-east-1`.
- `EVOLUCAO.md` na raiz: diário do projeto, com Feito, Dívidas e Decisões.
- `relatorios/auditoria-2026-09-10.md`: auditoria de 5 camadas, 272
  verificações, nenhum bloqueador ou crítico.
- `relatorios/deploy-2026-09-11.md`: runbook de deploy.
- Suíte e2e com 37 testes (Playwright) e testes de isolamento RLS em SQL.
- Design de referência: `A DOIS - Jornada.dc.html`, fornecido pelo autor do
  produto e vinculante para o mundo visual.

**Não existe e não deve ser inventado:** nenhum depoimento, número de usuários,
métrica de uso, caso de sucesso, preço ou plano pago. Não há analytics nem
Sentry ligados — os consentimentos de métricas e marketing guardam a resposta e
mais nada, e a tela diz isso.

## Product Principles

1. **A autorização é de quem já está dentro.** Nenhum canal de entrega prova
   quem está do outro lado; só a confirmação humana concede acesso.
2. **Minimizar é decisão de produto.** Se um pedido exige dado pessoal novo,
   ele é questionado antes de implementado.
3. **O dinheiro tem que fechar.** Centavos inteiros, soma exata, e a conta é
   explicável para quem discorda dela.
4. **A tela não pode mentir sobre risco.** Ação irreversível se explica antes
   de acontecer, e o banco é quem decide, não o cliente.
5. **Hoje web, amanhã nativo, sem reescrever.** Lógica pura e acesso a dados
   ficam fora da camada que sabe o que é DOM.

## Accessibility & Inclusion

Sem padrão formal declarado. Reflexos já estabelecidos e que não regridem:

- A barra de progresso é `role="progressbar"` com `aria-value*` — sem isso a
  informação principal da tela some para quem usa leitor de tela.
- Recados de erro e aviso são `role="status"`.
- Controles de formulário sempre com rótulo associado; a suíte e2e ancora em
  `getByRole`/`getByLabel`, então nome acessível é contrato, não decoração.
- Campos de dinheiro são `type="text"` com `inputMode="decimal"`, porque
  `type="number"` lia "1.234" como R$ 1,23.

## Open Decisions

- **Nome no cadastro.** O design mostra "oi, Lucas e Ana" e avatar com
  iniciais, mas `display_name` nasce nulo e só é gravado por `set_profile`,
  que exige sessão — e com confirmação de e-mail ligada não há sessão logo após
  o cadastro. Capturar o nome no cadastro exige `raw_user_meta_data` lido pelo
  gatilho `handle_new_user`, ou seja, **migration**. Decidido em 2026-09-11 que
  vai acontecer; ainda não planejado nem implementado.
- Ícones e splash da marca "Jornada".
