-- O link do item, fechado na COLUNA e não só na função.
--
-- `add_goal_item` peneira o esquema da URL desde 20260910151014 — mas ela é um
-- escritor, não o único. A policy `goal_items_update` libera update de
-- qualquer coluna para quem é do casal, e o PostgREST é API pública com a anon
-- key embarcada no cliente. Sonda contra o stack local, com JWT de membro de
-- verdade:
--
--     add_goal_item(p_url => 'javascript:alert(1)')            -> 400, recusado
--     PATCH /rest/v1/goal_items?id=eq.<id> {"url":"javascript:…"} -> 200, gravou
--
-- E `goal_items.url` vira `href` na jornada aberta. Ou seja: uma das duas
-- pessoas do casal grava, a outra clica em "ver na loja", e o script roda na
-- sessão dela. O alcance é pequeno — o plano é de dois — mas o caminho estava
-- aberto, e a indicação de afiliado vai fazer o app gravar URL nesta coluna,
-- o que amplia a superfície em vez de reduzi-la.
--
-- A peneira desce para a coluna, que é onde ela pega TODO escritor de uma vez:
-- a função de hoje, a policy de update, e o que vier gravar amanhã. Mesma
-- regra de `add_goal_item`, para a constraint não recusar o que a função
-- aceita.
--
-- `not valid` e `validate` em comandos separados de propósito: é a armadilha
-- do `goals_target_amount_cents_teto` já registrada no EVOLUCAO. Assim a
-- constraint entra sem varrer a tabela, e a validação das linhas existentes
-- falha sozinha — dizendo que é ela, e não a migration inteira.

alter table public.goal_items
  add constraint goal_items_url_http
  check (url is null or (url ~* '^https?://' and length(url) <= 2000))
  not valid;

alter table public.goal_items validate constraint goal_items_url_http;

comment on constraint goal_items_url_http on public.goal_items is
  'Esquema executável (javascript:, data:, vbscript:) não entra em coluna que vira href.';
