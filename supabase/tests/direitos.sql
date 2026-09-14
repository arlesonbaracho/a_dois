-- Direitos do titular: acesso, portabilidade, eliminação e consentimento.
--
-- O que este arquivo existe para provar:
--
--   1. os três consentimentos são independentes — ligar um não move os outros;
--   2. o export leva o plano inteiro, mas NÃO leva token de convite, e o
--      e-mail do parceiro sai mascarado;
--   3. sem a palavra EXCLUIR, nada é apagado;
--   4. excluir a conta pseudonimiza: o dinheiro fica, com o valor intacto, e
--      quem fica continua com o plano inteiro.
--
-- Roda dentro de uma transação que termina em rollback.
--
--   npm run test:rls

\set ON_ERROR_STOP on

begin;

create schema direito_teste;

create function direito_teste.igual(rotulo text, obtido bigint, esperado bigint)
returns void language plpgsql as $$
begin
  if obtido <> esperado then
    raise exception 'FALHOU em "%": %, esperava %', rotulo, obtido, esperado;
  end if;
end $$;

create function direito_teste.texto(rotulo text, obtido text, esperado text)
returns void language plpgsql as $$
begin
  if obtido is distinct from esperado then
    raise exception 'FALHOU em "%": "%", esperava "%"', rotulo, obtido, esperado;
  end if;
end $$;

create function direito_teste.certo(rotulo text, obtido boolean)
returns void language plpgsql as $$
begin
  if obtido is distinct from true then
    raise exception 'FALHOU em "%"', rotulo;
  end if;
end $$;

create function direito_teste.recusa(rotulo text, comando text)
returns void language plpgsql as $$
begin
  execute comando;
  raise exception 'FALHOU: "%" deveria ter sido recusado, e passou', rotulo;
exception
  when others then
    if sqlerrm like 'FALHOU:%' then raise; end if;
    if sqlstate in ('42883', '42601', '42P01') then
      raise exception 'TESTE INVÁLIDO em "%": % (%)', rotulo, sqlerrm, sqlstate;
    end if;
end $$;

grant usage on schema direito_teste to authenticated, anon;
grant execute on all functions in schema direito_teste to authenticated, anon;


-- ===========================================================================
-- Seed: Ana e Beto num casal, com plano cheio. Cida sozinha no dela.
-- ===========================================================================

insert into auth.users (id, email, created_at) values
  ('d1000001-0000-0000-0000-000000000001', 'direito-ana@teste.invalid', now() - interval '90 days'),
  ('d1000002-0000-0000-0000-000000000002', 'direito-beto@teste.invalid', now() - interval '80 days'),
  ('d1000003-0000-0000-0000-000000000003', 'direito-cida@teste.invalid', now() - interval '70 days');

create temp table cenario (chave text primary key, valor uuid);
grant all on cenario to authenticated;

do $$
declare
  ana constant uuid := 'd1000001-0000-0000-0000-000000000001';
  beto constant uuid := 'd1000002-0000-0000-0000-000000000002';
  casal uuid;
  meta uuid;
  item uuid;
begin
  select couple_id into casal from public.couple_members where user_id = ana;

  delete from public.couples
  where id = (select couple_id from public.couple_members where user_id = beto);
  insert into public.couple_members (couple_id, user_id, role, display_name, income_band)
  values (casal, beto, 'parceiro', 'Beto', 'de_2_a_5_sm');

  update public.couple_members set display_name = 'Ana' where user_id = ana;

  insert into public.goals (id, couple_id, title, category, target_amount_cents)
  values (gen_random_uuid(), casal, 'Entrada do apê', 'casa', 12000000)
  returning id into meta;

  insert into public.goal_items (id, couple_id, goal_id, name, estimated_price_cents)
  values (gen_random_uuid(), casal, meta, 'Geladeira', 419900)
  returning id into item;

  insert into public.price_quotes (couple_id, goal_item_id, price_cents, source_url)
  values (casal, item, 399000, 'https://amazon.com.br/dp/1');

  insert into public.contributions (couple_id, goal_id, user_id, amount_cents) values
    (casal, meta, ana, 150000),
    (casal, meta, beto, 90000);

  insert into public.couple_invites
    (couple_id, created_by, channel, invited_email, token_hash, expires_at)
  values (casal, ana, 'email', 'alguem@teste.invalid', 'hash-secretissimo',
          now() + interval '72 hours');

  insert into cenario values
    ('ana', ana), ('beto', beto), ('casal', casal), ('meta', meta), ('item', item);

  raise notice 'seed ok: Ana e Beto com plano cheio, e um convite em aberto';
end $$;


-- ===========================================================================
-- 1. Os três consentimentos são independentes
-- ===========================================================================

set local role authenticated;
set local request.jwt.claims = '{"sub":"d1000001-0000-0000-0000-000000000001","role":"authenticated"}';

do $$
declare ana uuid := 'd1000001-0000-0000-0000-000000000001';
begin
  -- A faixa da Ana ainda não foi escolhida por ela, então nada de consentimento.
  perform direito_teste.igual('começa sem consentimento nenhum',
    (select count(*) from public.profiles
     where user_id = ana
       and consent_analytics_at is null
       and consent_marketing_at is null
       and consent_income_band_at is null), 1);

  perform public.set_consent('analytics', true);

  perform direito_teste.certo('ligar analytics grava a data',
    (select consent_analytics_at is not null from public.profiles where user_id = ana));
  perform direito_teste.certo('e NÃO liga marketing',
    (select consent_marketing_at is null from public.profiles where user_id = ana));
  perform direito_teste.certo('nem a faixa de renda',
    (select consent_income_band_at is null from public.profiles where user_id = ana));

  perform public.set_consent('marketing', true);
  perform public.set_consent('analytics', false);

  perform direito_teste.certo('revogar analytics apaga só a data dele',
    (select consent_analytics_at is null and consent_marketing_at is not null
     from public.profiles where user_id = ana));

  perform direito_teste.recusa('tipo inventado',
    'select public.set_consent(''vender_dados'', true)');

  raise notice 'consentimentos independentes';
end $$;

-- Escolher a faixa é o ato afirmativo: o consentimento nasce do gesto, não de
-- um toggle escondido em outra tela.
do $$
declare ana uuid := 'd1000001-0000-0000-0000-000000000001';
begin
  update public.couple_members set income_band = 'de_5_a_10_sm' where user_id = ana;

  perform direito_teste.certo('escolher a faixa registra o consentimento',
    (select consent_income_band_at is not null from public.profiles where user_id = ana));

  -- Revogar o consentimento de OUTRA coisa não pode encostar na faixa. É o
  -- erro clássico de mexer no `case` errado, e ele passaria despercebido:
  -- ninguém olha a faixa depois de desligar métricas.
  perform public.set_consent('analytics', false);
  perform direito_teste.texto('revogar analytics não apaga a faixa',
    (select income_band::text from public.couple_members where user_id = ana),
    'de_5_a_10_sm');

  perform public.set_consent('income_band', false);
  perform direito_teste.certo('revogar apaga o registro',
    (select consent_income_band_at is null from public.profiles where user_id = ana));

  -- O ponto da mudança: revogação é sobre o DADO, não sobre o carimbo.
  -- Art. 18, IX. Antes daqui o toggle só tirava a data e a faixa ficava no
  -- banco indefinidamente, sem base legal sustentando a guarda.
  perform direito_teste.texto('e apaga a faixa junto',
    (select income_band::text from public.couple_members where user_id = ana),
    null);

  -- E não reconsente sozinho: o gatilho de escrita só carimba quando a faixa
  -- NOVA não é nula, então apagá-la não pode acender o consentimento de volta.
  perform direito_teste.certo('e não reconsente pelo próprio apagamento',
    (select consent_income_band_at is null from public.profiles where user_id = ana));

  -- Escolher de novo volta a consentir — a revogação não é uma porta trancada.
  update public.couple_members set income_band = 'ate_2_sm' where user_id = ana;
  perform direito_teste.certo('escolher de novo reconsente',
    (select consent_income_band_at is not null from public.profiles where user_id = ana));
end $$;


-- ===========================================================================
-- 1b. O aporte não pode ser reatribuído para fora do casal
-- ===========================================================================

-- `contributions_insert` nega e `add_contribution` tira o user_id do JWT — mas
-- o UPDATE ficava aberto ao casal sem olhar para quem o aporte aponta.
do $$
declare
  ana      constant uuid := 'd1000001-0000-0000-0000-000000000001';
  -- A Cida, que EXISTE em auth.users e não é do casal da Ana. Um uuid
  -- inventado passaria o teste pelo motivo errado: quem recusaria seria a
  -- chave estrangeira, não a policy — e a policy poderia estar aberta.
  de_fora  constant uuid := 'd1000003-0000-0000-0000-000000000003';
  aporte   uuid;
  n integer;
begin
  select id into aporte from public.contributions where user_id = ana limit 1;
  if aporte is null then
    raise exception 'SEED QUEBRADO: a Ana não tem aporte para este teste';
  end if;

  perform direito_teste.recusa('reatribuir o aporte para alguém de fora', format($q$
    update public.contributions set user_id = %L where id = %L
  $q$, de_fora, aporte));

  -- A varredura sem WHERE é a forma que escapa quando só o `using` segura:
  -- sem linha citada, o Postgres não exige a policy de select. Armadilha 5.
  perform direito_teste.recusa('varrer os aportes reatribuindo para fora', format($q$
    update public.contributions set user_id = %L
  $q$, de_fora));

  -- `null` continua valendo: é o "ex-membro" que a saída do casal deixa.
  execute format('update public.contributions set user_id = null where id = %L', aporte);
  get diagnostics n = row_count;
  perform direito_teste.igual('mas pode virar ex-membro', n, 1);

  -- E volta a apontar para quem é do casal.
  execute format('update public.contributions set user_id = %L where id = %L', ana, aporte);
  get diagnostics n = row_count;
  perform direito_teste.igual('e volta para quem é do casal', n, 1);

  raise notice 'aporte não é reatribuível para fora do casal';
end $$;


-- ===========================================================================
-- 1c. Retenção: cotação velha não fica para sempre
-- ===========================================================================

-- Art. 15 e 16: o dado se elimina quando o tratamento acaba. price_quotes é
-- append-only e guarda o que o casal olhou em loja — sem prazo, isso vira
-- rastro de navegação eterno.
-- As duas cotações entram como postgres, e não como a Ana: `price_quotes` nega
-- insert direto nas policies, porque o único caminho é `add_price_quote`. Mas
-- ela carimba com now(), e o que está sendo medido aqui é justamente o prazo —
-- então a data vai à mão, por fora do RLS.
-- O item VEM DO CENÁRIO deste teste, e não de um `limit 1` na tabela.
--
-- O banco local é compartilhado com a suíte e2e, que também cria goal_items.
-- `limit 1` sem `order by` devolvia um item no insert e outro na asserção, e o
-- teste reprovava com "0, esperava 2" sem nada de errado no código. Armadilha
-- 6, agora pela terceira vez.
reset role;
insert into public.price_quotes (couple_id, goal_item_id, price_cents, source_url, created_at)
select gi.couple_id, gi.id, 419900, 'https://loja.test/nova', now() - interval '1 day'
from public.goal_items as gi
where gi.id = (select valor from cenario where chave = 'item');
insert into public.price_quotes (couple_id, goal_item_id, price_cents, source_url, created_at)
select gi.couple_id, gi.id, 399000, 'https://loja.test/velha', now() - interval '365 days'
from public.goal_items as gi
where gi.id = (select valor from cenario where chave = 'item');

set local role authenticated;

do $$
declare
  item uuid := (select valor from cenario where chave = 'item');
begin
  if item is null then
    raise exception 'SEED QUEBRADO: sem item para pendurar cotação';
  end if;

  -- Conta só as deste teste: o seed já pendurou uma cotação nesse item, e
  -- contar a tabela inteira reprovaria por motivo nenhum (armadilha 6).
  perform direito_teste.igual('as duas cotações entraram',
    (select count(*) from public.price_quotes
      where goal_item_id = item and source_url like 'https://loja.test/%'), 2);

  reset role;
  perform public.expire_and_purge();
  execute 'set local role authenticated';

  perform direito_teste.igual('a cotação de ontem fica',
    (select count(*) from public.price_quotes
      where goal_item_id = item and source_url = 'https://loja.test/nova'), 1);

  perform direito_teste.igual('a de um ano atrás some',
    (select count(*) from public.price_quotes
      where goal_item_id = item and source_url = 'https://loja.test/velha'), 0);

  raise notice 'retenção de cotação: 180 dias';
end $$;

-- Limpa o que este teste plantou: o export logo abaixo conta o histórico de
-- preço do item, e uma cotação a mais reprovaria ele por culpa daqui.
reset role;
delete from public.price_quotes where source_url like 'https://loja.test/%';
set local role authenticated;


-- ===========================================================================
-- 2. export_my_data
-- ===========================================================================

do $$
declare dados jsonb;
begin
  dados := public.export_my_data();

  perform direito_teste.igual('leva as metas do casal',
    jsonb_array_length(dados -> 'metas'), 1);
  perform direito_teste.igual('leva os itens',
    jsonb_array_length(dados -> 'itens'), 1);
  perform direito_teste.igual('leva os aportes dos DOIS',
    jsonb_array_length(dados -> 'aportes'), 2);
  perform direito_teste.igual('leva o histórico de preço',
    jsonb_array_length(dados -> 'precos_observados'), 1);
  perform direito_teste.igual('leva as duas pessoas do plano',
    jsonb_array_length(dados -> 'pessoas_do_plano'), 2);

  -- O e-mail dela sai em claro; o do parceiro, mascarado. auth.users não é
  -- exposta por policy nenhuma, e o export não pode ser a porta dos fundos.
  perform direito_teste.texto('o próprio e-mail sai em claro',
    dados #>> '{minha_conta,email}', 'direito-ana@teste.invalid');
  perform direito_teste.certo('o e-mail do parceiro sai mascarado',
    (select bool_and(
       case when p ->> 'user_id' = 'd1000002-0000-0000-0000-000000000002'
            then p ->> 'email' <> 'direito-beto@teste.invalid'
                 and p ->> 'email' like '%•%'
            else true end)
     from jsonb_array_elements(dados -> 'pessoas_do_plano') as p));

  -- Token de convite é segredo do sistema, não dado dela.
  perform direito_teste.igual('leva o convite',
    jsonb_array_length(dados -> 'convites'), 1);
  perform direito_teste.certo('mas NUNCA o token',
    not (dados::text like '%hash-secretissimo%')
    and not (dados -> 'convites' -> 0 ? 'token_hash'));

  perform direito_teste.certo('e traz os consentimentos',
    dados -> 'meus_consentimentos' ? 'uso_da_faixa_de_renda');

  raise notice 'export completo, sem token e com o e-mail do parceiro mascarado';
end $$;


-- ===========================================================================
-- 3. Sem a palavra, nada acontece
-- ===========================================================================

do $$
declare casal uuid := (select valor from cenario where chave = 'casal');
begin
  perform direito_teste.texto('confirmação vazia',
    public.delete_account(''), 'confirmacao_invalida');
  perform direito_teste.texto('confirmação errada',
    public.delete_account('excluir'), 'confirmacao_invalida');
  perform direito_teste.texto('quase certa',
    public.delete_account('EXCLUI'), 'confirmacao_invalida');

  perform direito_teste.igual('o vínculo continua',
    (select count(*) from public.couple_members
     where user_id = 'd1000001-0000-0000-0000-000000000001' and left_at is null), 1);
  perform direito_teste.igual('e os aportes continuam com dono',
    (select count(*) from public.contributions
     where couple_id = casal and user_id is not null), 2);
end $$;

-- auth.users só é legível fora da sessão do cliente: authenticated não tem
-- grant nela, e é exatamente por isso que só função definer a enxerga.
reset role;
reset request.jwt.claims;

do $$
begin
  perform direito_teste.igual('e NADA foi apagado: a conta continua',
    (select count(*) from auth.users where id = 'd1000001-0000-0000-0000-000000000001'), 1);
  raise notice 'delete_account recusa até ouvir a palavra';
end $$;

set local role authenticated;
set local request.jwt.claims = '{"sub":"d1000001-0000-0000-0000-000000000001","role":"authenticated"}';


-- ===========================================================================
-- 4. Ana exclui a conta. Beto continua com o plano inteiro.
-- ===========================================================================

do $$
begin
  perform direito_teste.texto('com a palavra certa, apaga',
    public.delete_account('EXCLUIR'), 'ok');
end $$;

reset role;
reset request.jwt.claims;

do $$
declare
  ana constant uuid := 'd1000001-0000-0000-0000-000000000001';
  casal uuid := (select valor from cenario where chave = 'casal');
begin
  perform direito_teste.igual('a conta sumiu',
    (select count(*) from auth.users where id = ana), 0);
  perform direito_teste.igual('o perfil sumiu',
    (select count(*) from public.profiles where user_id = ana), 0);
  perform direito_teste.igual('o vínculo sumiu junto (cascade)',
    (select count(*) from public.couple_members where user_id = ana), 0);

  -- O que a regra do CLAUDE.md protege: o dinheiro fica, com o valor intacto.
  perform direito_teste.igual('o plano continua de pé',
    (select count(*) from public.couples where id = casal), 1);
  perform direito_teste.igual('a meta continua',
    (select count(*) from public.goals where couple_id = casal), 1);
  perform direito_teste.igual('os DOIS aportes continuam',
    (select count(*) from public.contributions where couple_id = casal), 2);
  perform direito_teste.igual('somando o mesmo de antes',
    (select sum(amount_cents)::bigint from public.contributions where couple_id = casal), 240000);
  perform direito_teste.igual('e o dela virou de ex-membro',
    (select count(*) from public.contributions
     where couple_id = casal and user_id is null), 1);

  perform direito_teste.igual('Beto continua no plano',
    (select count(*) from public.couple_members
     where couple_id = casal and left_at is null), 1);

  raise notice 'conta apagada, dinheiro intacto, parceiro inteiro';
end $$;


-- ===========================================================================
-- 5. Último membro: o freio de mão continua valendo
-- ===========================================================================

set local role authenticated;
set local request.jwt.claims = '{"sub":"d1000003-0000-0000-0000-000000000003","role":"authenticated"}';

do $$
declare cida constant uuid := 'd1000003-0000-0000-0000-000000000003';
begin
  perform direito_teste.texto('sozinha, sem confirmar apagar o plano',
    public.delete_account('EXCLUIR'), 'precisa_confirmar_apagar');
  perform direito_teste.igual('e o plano dela continua de pé',
    (select count(*) from public.couple_members where user_id = cida and left_at is null), 1);

  perform direito_teste.texto('confirmando, vai tudo',
    public.delete_account('EXCLUIR', true), 'conta_e_plano_apagados');
end $$;

reset role;
reset request.jwt.claims;

do $$
declare cida constant uuid := 'd1000003-0000-0000-0000-000000000003';
begin
  perform direito_teste.igual('a conta sumiu',
    (select count(*) from auth.users where id = cida), 0);
  perform direito_teste.igual('e o plano solo dela também',
    (select count(*) from public.couples as c
     where not exists (select 1 from public.couple_members as m where m.couple_id = c.id)), 0);
end $$;


-- ===========================================================================
-- 6. Sem JWT não existe direito de titular de ninguém
-- ===========================================================================

set local role anon;
set local request.jwt.claims = '';

do $$
begin
  perform direito_teste.recusa('anônimo não exporta',
    'select public.export_my_data()');
  perform direito_teste.recusa('anônimo não consente',
    'select public.set_consent(''analytics'', true)');
  perform direito_teste.recusa('anônimo não exclui conta',
    'select public.delete_account(''EXCLUIR'', true)');
  perform direito_teste.recusa('e a função interna não é alcançável',
    'select public.sair_do_casal_interno(gen_random_uuid(), true, false)');
end $$;

do $$ begin raise notice 'direitos do titular: tudo passou'; end $$;

rollback;
