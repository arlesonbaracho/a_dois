-- Aportes.
--
-- O que este arquivo existe para provar:
--
--   1. couple_id e user_id do aporte saem do JWT — mandar outra coisa no corpo
--      da chamada não muda nada;
--   2. não existe caminho de insert direto: as policies de goals e
--      contributions negam, e a escrita só passa pelas funções;
--   3. meta de outro casal, valor zero e valor negativo são recusados;
--   4. a saída do casal apaga também quanto a pessoa combinava de colocar.
--
-- Roda dentro de uma transação que termina em rollback.
--
--   npm run test:rls

\set ON_ERROR_STOP on

begin;

create schema aporte_teste;

create function aporte_teste.igual(rotulo text, obtido bigint, esperado bigint)
returns void language plpgsql as $$
begin
  if obtido <> esperado then
    raise exception 'FALHOU em "%": %, esperava %', rotulo, obtido, esperado;
  end if;
end $$;

create function aporte_teste.texto(rotulo text, obtido text, esperado text)
returns void language plpgsql as $$
begin
  if obtido is distinct from esperado then
    raise exception 'FALHOU em "%": "%", esperava "%"', rotulo, obtido, esperado;
  end if;
end $$;

-- Espera que o comando exploda. Erro de digitação não conta como recusa: se o
-- teste chamar uma função que não existe, ele reprova em vez de comemorar.
create function aporte_teste.recusa(rotulo text, comando text)
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

grant usage on schema aporte_teste to authenticated, anon;
grant execute on all functions in schema aporte_teste to authenticated, anon;


-- ===========================================================================
-- Seed: casal A com duas pessoas, casal B com uma
-- ===========================================================================

insert into auth.users (id, email, created_at) values
  ('a9000001-0000-0000-0000-000000000001', 'aporte-ana@teste.invalid', now() - interval '90 days'),
  ('a9000002-0000-0000-0000-000000000002', 'aporte-beto@teste.invalid', now() - interval '80 days'),
  ('a9000003-0000-0000-0000-000000000003', 'aporte-cida@teste.invalid', now() - interval '70 days');

create temp table cenario (chave text primary key, valor uuid);
grant all on cenario to authenticated;

do $$
declare
  ana constant uuid := 'a9000001-0000-0000-0000-000000000001';
  beto constant uuid := 'a9000002-0000-0000-0000-000000000002';
  cida constant uuid := 'a9000003-0000-0000-0000-000000000003';
  casal_a uuid;
  casal_b uuid;
  meta_b uuid;
begin
  select couple_id into casal_a from public.couple_members where user_id = ana;
  select couple_id into casal_b from public.couple_members where user_id = cida;

  -- Beto entra no casal da Ana e o casal solo dele some, como confirm_invite faz.
  delete from public.couples
  where id = (select couple_id from public.couple_members where user_id = beto);
  insert into public.couple_members (couple_id, user_id, role, display_name, income_band)
  values (casal_a, beto, 'parceiro', 'Beto', 'de_2_a_5_sm');

  update public.couple_members
  set display_name = 'Ana', income_band = 'de_5_a_10_sm', fixed_share_cents = 80000
  where couple_id = casal_a and user_id = ana;

  insert into public.goals (id, couple_id, title, category, target_amount_cents)
  values (gen_random_uuid(), casal_b, 'Meta do casal B', 'geral', 500000)
  returning id into meta_b;

  insert into cenario values
    ('casal_a', casal_a), ('casal_b', casal_b),
    ('ana', ana), ('beto', beto), ('cida', cida), ('meta_b', meta_b);

  raise notice 'seed ok: Ana e Beto no casal A, Cida sozinha no B';
end $$;


-- ===========================================================================
-- 1. add_goal e add_contribution tiram couple_id e user_id do JWT
-- ===========================================================================

set local role authenticated;
set local request.jwt.claims = '{"sub":"a9000001-0000-0000-0000-000000000001","role":"authenticated"}';

do $$
declare
  casal_a uuid := (select valor from cenario where chave = 'casal_a');
  meta uuid;
  aporte uuid;
begin
  meta := public.add_goal('Entrada do apê', 12000000);
  insert into cenario values ('meta_a', meta);

  perform aporte_teste.igual('a meta nasceu no casal de quem chamou',
    (select count(*) from public.goals where id = meta and couple_id = casal_a), 1);
  perform aporte_teste.texto('categoria mínima enquanto a tela de metas não existe',
    (select category from public.goals where id = meta), 'geral');

  aporte := public.add_contribution(meta, 150000);

  perform aporte_teste.igual('o aporte é do casal de quem chamou',
    (select count(*) from public.contributions
     where id = aporte and couple_id = casal_a), 1);
  -- O ponto do teste: ninguém escolheu esse user_id, ele veio do JWT.
  perform aporte_teste.texto('quem colocou é quem chamou',
    (select user_id::text from public.contributions where id = aporte),
    'a9000001-0000-0000-0000-000000000001');

  raise notice 'Ana criou meta e aportou';
end $$;

-- A data é do cliente, e isso é de propósito: aporte de ontem é caso normal.
do $$
declare meta uuid := (select valor from cenario where chave = 'meta_a');
begin
  perform public.add_contribution(meta, 4200, now() - interval '3 days');
  perform aporte_teste.igual('aporte com data passada entra',
    (select count(*) from public.contributions
     where goal_id = meta and contributed_at < now() - interval '2 days'), 1);
end $$;


-- ===========================================================================
-- 2. O que tem que ser recusado
-- ===========================================================================

do $$
declare
  meta_a uuid := (select valor from cenario where chave = 'meta_a');
  meta_b uuid := (select valor from cenario where chave = 'meta_b');
  casal_a uuid := (select valor from cenario where chave = 'casal_a');
begin
  -- Meta de outro casal. A Ana nem enxerga essa meta, mas manda o uuid mesmo
  -- assim: é exatamente o que um cliente hostil faria.
  perform aporte_teste.recusa('aporte em meta de outro casal',
    format('select public.add_contribution(%L, 1000)', meta_b));

  perform aporte_teste.recusa('aporte de valor zero',
    format('select public.add_contribution(%L, 0)', meta_a));
  perform aporte_teste.recusa('aporte de valor negativo',
    format('select public.add_contribution(%L, -5000)', meta_a));

  perform aporte_teste.recusa('meta sem nome',
    'select public.add_goal('''', 1000)');
  perform aporte_teste.recusa('meta de valor negativo',
    'select public.add_goal(''Alguma coisa'', -1)');

  -- O insert direto morre mesmo no PRÓPRIO casal. Não é sobre invadir o casal
  -- do lado: é que o couple_id não pode vir do corpo da requisição, nem quando
  -- o corpo está certo. Regra 3.
  perform aporte_teste.recusa('insert direto em goals, no próprio casal',
    format('insert into public.goals (couple_id, title, category) values (%L, ''na mão'', ''geral'')',
           casal_a));
  perform aporte_teste.recusa('insert direto em contributions, no próprio casal',
    format('insert into public.contributions (couple_id, goal_id, user_id, amount_cents)
            values (%L, %L, %L, 100)',
           casal_a, meta_a, 'a9000001-0000-0000-0000-000000000001'));

  raise notice 'as recusas de Ana passaram';
end $$;


-- ===========================================================================
-- 3. Beto aporta na mesma meta, e cada aporte fica com o dono certo
-- ===========================================================================

set local request.jwt.claims = '{"sub":"a9000002-0000-0000-0000-000000000002","role":"authenticated"}';

do $$
declare meta uuid := (select valor from cenario where chave = 'meta_a');
begin
  perform public.add_contribution(meta, 90000);

  perform aporte_teste.igual('Beto vê os três aportes do casal',
    (select count(*) from public.contributions where goal_id = meta), 3);
  perform aporte_teste.igual('e um deles é dele',
    (select count(*) from public.contributions
     where goal_id = meta and user_id = 'a9000002-0000-0000-0000-000000000002'), 1);
  perform aporte_teste.igual('o dinheiro do casal soma o que os dois colocaram',
    (select sum(amount_cents)::bigint from public.contributions where goal_id = meta), 244200);
end $$;


-- ===========================================================================
-- 3b. A regra de divisão é UMA, e é do casal
-- ===========================================================================

-- Antes ela era coluna por pessoa: as duas linhas podiam discordar, e uma
-- função em TypeScript desempatava pelo papel 'dono'. Agora mora em `couples`,
-- e é isto que o teste tranca — se alguém a devolver para couple_members, o
-- casal volta a poder ter duas respostas para "como a gente divide".
do $$
declare
  casal uuid := (select valor from cenario where chave = 'casal_a');
begin
  perform aporte_teste.igual('a regra não é mais coluna de couple_members',
    (select count(*) from information_schema.columns
      where table_schema = 'public' and table_name = 'couple_members'
        and column_name = 'split_rule'), 0);

  perform aporte_teste.texto('e o casal nasce dividindo meio a meio',
    (select split_rule::text from public.couples where id = casal), 'igual');

  -- Beto, que é parceiro e não dono, muda a regra: ela é dos dois.
  update public.couples set split_rule = 'proporcional' where id = casal;

  perform aporte_teste.texto('o parceiro muda a regra do casal',
    (select split_rule::text from public.couples where id = casal), 'proporcional');

  -- E não existe segunda resposta em lugar nenhum para a Ana ver.
  perform aporte_teste.igual('a regra é uma só para o casal inteiro',
    (select count(distinct split_rule) from public.couples where id = casal), 1);

  update public.couples set split_rule = 'igual' where id = casal;
end $$;


-- ===========================================================================
-- 4. O casal do lado continua sem enxergar nada
-- ===========================================================================

set local request.jwt.claims = '{"sub":"a9000003-0000-0000-0000-000000000003","role":"authenticated"}';

do $$
declare casal_a uuid := (select valor from cenario where chave = 'casal_a');
begin
  perform aporte_teste.igual('Cida não vê meta do casal A',
    (select count(*) from public.goals where couple_id = casal_a), 0);
  perform aporte_teste.igual('Cida não vê aporte do casal A',
    (select count(*) from public.contributions where couple_id = casal_a), 0);
end $$;


-- ===========================================================================
-- 5. Sem JWT não existe aporte
-- ===========================================================================

set local role anon;
set local request.jwt.claims = '';

do $$
begin
  perform aporte_teste.recusa('anônimo não executa add_goal',
    'select public.add_goal(''Meta anônima'', 100)');
  perform aporte_teste.recusa('anônimo não executa add_contribution',
    'select public.add_contribution(gen_random_uuid(), 100)');
end $$;


-- ===========================================================================
-- 6. Sair do casal apaga também quanto a pessoa combinava de colocar
-- ===========================================================================

set local role authenticated;
set local request.jwt.claims = '{"sub":"a9000001-0000-0000-0000-000000000001","role":"authenticated"}';

do $$
begin
  perform aporte_teste.texto('Ana sai', public.leave_couple(), 'ok');
end $$;

reset role;
reset request.jwt.claims;

do $$
declare casal_a uuid := (select valor from cenario where chave = 'casal_a');
begin
  perform aporte_teste.igual('o valor fixo da Ana some do vínculo',
    (select count(*) from public.couple_members
     where couple_id = casal_a
       and user_id = 'a9000001-0000-0000-0000-000000000001'
       and fixed_share_cents is null), 1);
  -- O dinheiro fica; o dono some. É a regra da pseudonimização.
  perform aporte_teste.igual('os aportes dela viram de ex-membro, com o valor intacto',
    (select sum(amount_cents)::bigint from public.contributions
     where couple_id = casal_a and user_id is null), 154200);
end $$;

do $$ begin raise notice 'aportes: tudo passou'; end $$;

rollback;
