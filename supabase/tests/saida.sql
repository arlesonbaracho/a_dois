-- Saída do casal.
--
-- O que este arquivo existe para provar:
--
--   1. quem sai perde o acesso NO ATO, mesmo com a linha dela ainda em
--      couple_members — o corte é o left_at, não o delete de sessão;
--   2. os aportes ficam, com o valor intacto, mas sem dono: dinheiro que duas
--      pessoas juntaram não some porque uma foi embora;
--   3. o nome, a faixa de renda e o e-mail dela somem do casal;
--   4. o plano só é apagado no último membro, e só com confirmação explícita.
--
-- Roda dentro de uma transação que termina em rollback.
--
--   npm run test:rls

\set ON_ERROR_STOP on

begin;

create schema saida_teste;

create function saida_teste.igual(rotulo text, obtido bigint, esperado bigint)
returns void language plpgsql as $$
begin
  if obtido <> esperado then
    raise exception 'FALHOU em "%": %, esperava %', rotulo, obtido, esperado;
  end if;
end $$;

create function saida_teste.texto(rotulo text, obtido text, esperado text)
returns void language plpgsql as $$
begin
  if obtido is distinct from esperado then
    raise exception 'FALHOU em "%": "%", esperava "%"', rotulo, obtido, esperado;
  end if;
end $$;

grant usage on schema saida_teste to authenticated;
grant execute on all functions in schema saida_teste to authenticated;


-- ===========================================================================
-- Seed: um casal de duas pessoas, com dinheiro dentro
-- ===========================================================================

insert into auth.users (id, email, created_at) values
  ('f0000001-0000-0000-0000-000000000001', 'saida-nina@teste.invalid', now() - interval '90 days'),
  ('f0000002-0000-0000-0000-000000000002', 'saida-omar@teste.invalid', now() - interval '80 days'),
  ('f0000003-0000-0000-0000-000000000003', 'saida-pilar@teste.invalid', now() - interval '70 days');

create temp table cenario (chave text primary key, valor uuid);
grant all on cenario to authenticated;

-- Nina e Omar dividem o casal da Nina. Pilar fica sozinha no dela.
do $$
declare
  nina constant uuid := 'f0000001-0000-0000-0000-000000000001';
  omar constant uuid := 'f0000002-0000-0000-0000-000000000002';
  casal uuid;
  meta uuid;
begin
  select couple_id into casal from public.couple_members where user_id = nina;
  insert into cenario values ('casal', casal), ('nina', nina), ('omar', omar);

  -- Omar entra e o casal solo dele some, como confirm_invite faria.
  delete from public.couples
  where id = (select couple_id from public.couple_members where user_id = omar);
  insert into public.couple_members (couple_id, user_id, role, display_name, income_band)
  values (casal, omar, 'parceiro', 'Omar', 'de_2_a_5_sm');

  update public.couple_members set display_name = 'Nina', income_band = 'de_5_a_10_sm'
  where couple_id = casal and user_id = nina;

  insert into public.goals (id, couple_id, title, category, target_amount_cents)
  values (gen_random_uuid(), casal, 'Entrada do apê', 'moradia', 12000000)
  returning id into meta;
  insert into cenario values ('meta', meta);

  insert into public.contributions (couple_id, goal_id, user_id, amount_cents) values
    (casal, meta, nina, 150000),
    (casal, meta, omar, 90000);

  -- Um convite criado pela Nina, e um convite que carrega o e-mail dela.
  insert into public.couple_invites (couple_id, created_by, channel, token_hash, expires_at)
  values (casal, nina, 'link', 'hash-da-nina', now() + interval '24 hours');
  insert into public.couple_invites
    (couple_id, created_by, channel, invited_email, token_hash, expires_at)
  values (casal, omar, 'email', 'saida-nina@teste.invalid', 'hash-para-nina',
          now() + interval '72 hours');

  raise notice 'seed ok: Nina e Omar num casal, R$ 2.400,00 aportados, dois convites';
end $$;


-- ===========================================================================
-- 1. Nina sai
-- ===========================================================================

set local role authenticated;
set local request.jwt.claims = '{"sub":"f0000001-0000-0000-0000-000000000001","role":"authenticated"}';

do $$
begin
  perform saida_teste.texto('saída de um casal de duas pessoas',
    public.leave_couple(), 'ok');
  raise notice 'Nina saiu';
end $$;

-- O acesso cai no ato, e a prova é justamente que a linha dela CONTINUA na
-- tabela: o que fechou não foi um delete, foi o left_at.
do $$
declare casal uuid := (select valor from cenario where chave = 'casal');
begin
  perform saida_teste.igual('Nina não vê mais o casal',
    (select count(*) from public.couples where id = casal), 0);
  perform saida_teste.igual('Nina não vê mais as metas',
    (select count(*) from public.goals where couple_id = casal), 0);
  perform saida_teste.igual('Nina não vê mais os aportes',
    (select count(*) from public.contributions where couple_id = casal), 0);
  perform saida_teste.igual('Nina não vê mais os membros',
    (select count(*) from public.couple_members where couple_id = casal), 0);

  raise notice 'acesso fechado no ato, com a linha dela ainda na tabela';
end $$;

reset role;

do $$
declare
  casal uuid := (select valor from cenario where chave = 'casal');
  nina uuid := (select valor from cenario where chave = 'nina');
  linha record;
begin
  select * into linha from public.couple_members where couple_id = casal and user_id = nina;

  if linha.left_at is null then
    raise exception 'FALHOU: left_at não foi carimbado';
  end if;
  if linha.display_name is not null then
    raise exception 'FALHOU: o nome dela continua lá — "%"', linha.display_name;
  end if;
  if linha.income_band is not null then
    raise exception 'FALHOU: a faixa de renda dela continua lá';
  end if;

  raise notice 'linha pseudonimizada: sem nome, sem faixa de renda, com left_at';
end $$;

-- O dinheiro fica. Apagar mentiria sobre quanto o casal juntou.
do $$
declare casal uuid := (select valor from cenario where chave = 'casal');
begin
  perform saida_teste.igual('os dois aportes continuam lá',
    (select count(*) from public.contributions where couple_id = casal), 2);
  perform saida_teste.igual('o valor total não mudou',
    (select sum(amount_cents)::bigint from public.contributions where couple_id = casal), 240000);
  perform saida_teste.igual('o aporte dela ficou sem dono',
    (select count(*) from public.contributions
      where couple_id = casal and user_id is null and amount_cents = 150000), 1);
  perform saida_teste.igual('o aporte do Omar continua com dono',
    (select count(*) from public.contributions
      where couple_id = casal and user_id is not null), 1);

  raise notice 'aportes intactos, o dela agora é de "ex-membro"';
end $$;

-- Convites: o que ela criou foi revogado, o que tinha o e-mail dela sumiu.
do $$
declare casal uuid := (select valor from cenario where chave = 'casal');
begin
  perform saida_teste.igual('o convite criado por ela foi revogado',
    (select count(*) from public.couple_invites
      where couple_id = casal and status = 'revoked' and created_by is null), 1);
  perform saida_teste.igual('nenhum convite em aberto sobrou dela',
    (select count(*) from public.couple_invites
      where couple_id = casal and status in ('pending', 'claimed')), 0);
  perform saida_teste.igual('o convite que carregava o e-mail dela sumiu',
    (select count(*) from public.couple_invites
      where couple_id = casal and invited_email = 'saida-nina@teste.invalid'), 0);

  raise notice 'convites dela revogados, e o e-mail dela apagado do casal';
end $$;

-- Ela volta a ter um plano só dela, vazio.
do $$
declare nina uuid := (select valor from cenario where chave = 'nina');
begin
  perform saida_teste.igual('Nina tem exatamente um casal ativo',
    (select count(*) from public.couple_members where user_id = nina and left_at is null), 1);
  perform saida_teste.igual('e ele está vazio',
    (select count(*) from public.goals g
      join public.couple_members m on m.couple_id = g.couple_id
      where m.user_id = nina and m.left_at is null), 0);

  raise notice 'quem saiu volta com um plano vazio, só dela';
end $$;

-- E o Omar, que ficou, continua vendo tudo.
set local role authenticated;
set local request.jwt.claims = '{"sub":"f0000002-0000-0000-0000-000000000002","role":"authenticated"}';

do $$
begin
  perform saida_teste.igual('Omar continua vendo a meta',
    (select count(*) from public.goals where title = 'Entrada do apê'), 1);
  perform saida_teste.igual('Omar continua vendo os dois aportes',
    (select sum(amount_cents)::bigint from public.contributions), 240000);
  perform saida_teste.igual('e vê a ex-membro na lista, sem nome',
    (select count(*) from public.couple_members
      where left_at is not null and display_name is null), 1);

  raise notice 'quem fica continua com o plano inteiro, e o histórico do dinheiro';
end $$;


-- ===========================================================================
-- 2. Último membro: o plano só some com confirmação
-- ===========================================================================

do $$
declare casal uuid := (select valor from cenario where chave = 'casal');
begin
  perform saida_teste.texto('sair sem confirmar, sendo o último',
    public.leave_couple(false), 'precisa_confirmar_apagar');

  perform saida_teste.igual('nada foi apagado',
    (select count(*) from public.goals where couple_id = casal), 1);
  perform saida_teste.igual('e ele continua dentro',
    (select count(*) from public.couple_members
      where couple_id = casal and user_id = (select valor from cenario where chave = 'omar')
        and left_at is null), 1);

  raise notice 'último membro sem confirmar: nada acontece';
end $$;

do $$
declare casal uuid := (select valor from cenario where chave = 'casal');
begin
  perform saida_teste.texto('sair confirmando, sendo o último',
    public.leave_couple(true), 'plano_apagado');
end $$;

reset role;

do $$
declare casal uuid := (select valor from cenario where chave = 'casal');
begin
  perform saida_teste.igual('o casal sumiu', (select count(*) from public.couples where id = casal), 0);
  perform saida_teste.igual('as metas sumiram', (select count(*) from public.goals where couple_id = casal), 0);
  perform saida_teste.igual('os aportes sumiram', (select count(*) from public.contributions where couple_id = casal), 0);
  perform saida_teste.igual('os vínculos sumiram', (select count(*) from public.couple_members where couple_id = casal), 0);
  perform saida_teste.igual('os convites sumiram', (select count(*) from public.couple_invites where couple_id = casal), 0);

  perform saida_teste.igual('e o Omar também voltou com um plano vazio',
    (select count(*) from public.couple_members
      where user_id = (select valor from cenario where chave = 'omar') and left_at is null), 1);

  raise notice 'último membro confirmando: o plano inteiro é apagado';
end $$;


-- ===========================================================================
-- 3. Sair de um plano que não existe
-- ===========================================================================

set local role authenticated;
set local request.jwt.claims = '{"sub":"f0000003-0000-0000-0000-000000000003","role":"authenticated"}';

do $$
begin
  -- Pilar está sozinha: primeira saída apaga o plano dela e cria outro.
  perform saida_teste.texto('Pilar sai do próprio plano vazio',
    public.leave_couple(true), 'plano_apagado');
  perform saida_teste.texto('e sair de novo continua funcionando',
    public.leave_couple(true), 'plano_apagado');

  raise notice 'sair é idempotente: sempre sobra um plano vazio';
end $$;

reset role;
rollback;

\echo ''
\echo 'Saída: pseudonimização e hard delete do último membro aprovados'
