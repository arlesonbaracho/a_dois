-- Quem se cadastra ganha um casal, e ganha exatamente um.
--
-- A trigger on_auth_user_created é o único caminho de criação de casal no
-- fluxo normal. Se ela sumir, o app deixa todo mundo sem casal e todas as
-- policies passam a devolver zero linha — falha silenciosa, do tipo que parece
-- "tela vazia" em vez de "bug". Se ela criar dois, o casal duplicado divide o
-- plano do casal ao meio.
--
-- Roda dentro de uma transação que termina em rollback.
--
--   npm run test:rls

\set ON_ERROR_STOP on

begin;

create schema cadastro_teste;

create function cadastro_teste.igual(rotulo text, obtido bigint, esperado bigint)
returns void language plpgsql as $$
begin
  if obtido <> esperado then
    raise exception 'FALHOU em "%": %, esperava %', rotulo, obtido, esperado;
  end if;
end $$;

create function cadastro_teste.texto(rotulo text, obtido text, esperado text)
returns void language plpgsql as $$
begin
  if obtido is distinct from esperado then
    raise exception 'FALHOU em "%": "%", esperava "%"', rotulo, obtido, esperado;
  end if;
end $$;

-- ===========================================================================
-- Uma pessoa nova
-- ===========================================================================

do $$
declare
  ines constant uuid := 'c0000001-0000-0000-0000-000000000001';
  casal uuid;
begin
  insert into auth.users (id, email) values (ines, 'cadastro-ines@teste.invalid');

  select m.couple_id into casal
  from public.couple_members as m
  where m.user_id = ines;

  if casal is null then
    raise exception 'FALHOU: quem se cadastrou não virou membro de casal nenhum';
  end if;

  perform cadastro_teste.igual(
    'o casal existe mesmo em couples',
    (select count(*) from public.couples where id = casal), 1);

  perform cadastro_teste.igual(
    'o casal nasce com uma pessoa só',
    (select count(*) from public.couple_members where couple_id = casal), 1);

  perform cadastro_teste.igual(
    'quem se cadastra entra como dono e ativo',
    (select count(*) from public.couple_members
      where user_id = ines and role = 'dono' and left_at is null), 1);

  perform cadastro_teste.igual(
    'e em um casal só',
    (select count(*) from public.couple_members where user_id = ines), 1);

  raise notice 'cadastro cria um casal, com quem se cadastrou como dono';
end $$;

-- ===========================================================================
-- Uma segunda pessoa não cai no casal da primeira
-- ===========================================================================

do $$
declare
  ines constant uuid := 'c0000001-0000-0000-0000-000000000001';
  ivo  constant uuid := 'c0000002-0000-0000-0000-000000000002';
begin
  insert into auth.users (id, email) values (ivo, 'cadastro-ivo@teste.invalid');

  perform cadastro_teste.igual(
    'cada pessoa nova ganha o próprio casal',
    (select count(distinct couple_id) from public.couple_members
      where user_id in (ines, ivo)), 2);

  raise notice 'dois cadastros, dois casais separados';
end $$;

-- ===========================================================================
-- create_couple_for não é alcançável pelo cliente
-- ===========================================================================
-- O nome dito no cadastro
-- ===========================================================================

-- raw_user_meta_data é preenchido por quem se cadastra: é entrada de fora.
-- Estes três casos são o contrato inteiro dela.
do $$
declare
  com_nome constant uuid := 'c0000003-0000-0000-0000-000000000003';
  sem_nome constant uuid := 'c0000004-0000-0000-0000-000000000004';
  gigante constant uuid := 'c0000005-0000-0000-0000-000000000005';
begin
  insert into auth.users (id, email, raw_user_meta_data) values
    (com_nome, 'cadastro-lia@teste.invalid', '{"display_name":"  Lia  "}'::jsonb);

  -- Os DOIS lugares, porque os dois são lidos: profiles alimenta o campo
  -- "Nome" do cartão de pedido, que é por onde alguém concede acesso ao
  -- histórico financeiro; couple_members alimenta a saudação da home.
  perform cadastro_teste.texto('o nome chega em couple_members, sem os espaços',
    (select display_name from public.couple_members where user_id = com_nome), 'Lia');
  perform cadastro_teste.texto('e chega em profiles também',
    (select display_name from public.profiles where user_id = com_nome), 'Lia');

  -- Cadastro sem nome continua sendo cadastro: o campo é opcional.
  insert into auth.users (id, email) values (sem_nome, 'cadastro-sem@teste.invalid');
  perform cadastro_teste.texto('sem nome, a coluna fica nula',
    (select display_name from public.couple_members where user_id = sem_nome), null);
  perform cadastro_teste.igual('e o casal nasce igual',
    (select count(*) from public.couple_members where user_id = sem_nome), 1);

  -- O teste que importa: display_name tem check de 80, e a trigger roda na
  -- MESMA transação do insert em auth.users. Sem o left(), a constraint
  -- estouraria aqui dentro e derrubaria o cadastro inteiro — qualquer pessoa
  -- quebraria o próprio signup com um nome comprido.
  insert into auth.users (id, email, raw_user_meta_data) values
    (gigante, 'cadastro-gigante@teste.invalid',
     jsonb_build_object('display_name', repeat('a', 500)));

  perform cadastro_teste.igual('nome comprido não derruba o cadastro',
    (select count(*) from public.couple_members where user_id = gigante), 1);
  perform cadastro_teste.igual('ele entra cortado em 80',
    (select length(display_name) from public.couple_members where user_id = gigante), 80);

  raise notice 'nome do cadastro: chega nas duas tabelas, e o comprido entra cortado';
end $$;


-- ===========================================================================

-- Ela recebe o user_id por parâmetro. Se o cliente pudesse chamá-la, criaria
-- casal com dono arbitrário — que é a regra 3 do CLAUDE.md ao contrário.
do $$
declare papel text;
begin
  foreach papel in array array['anon', 'authenticated'] loop
    if has_function_privilege(papel, 'public.create_couple_for(uuid, text)', 'execute') then
      raise exception
        'FALHOU: % pode executar create_couple_for, que aceita user_id do chamador', papel;
    end if;
  end loop;

  -- E o caminho legítimo continua aberto: create_couple() tira o id do JWT.
  if not has_function_privilege('authenticated', 'public.create_couple()', 'execute') then
    raise exception 'FALHOU: authenticated perdeu o execute em create_couple()';
  end if;

  raise notice 'create_couple_for fechada ao cliente, create_couple aberta';
end $$;

rollback;

\echo 'Cadastro: casal criado na mesma transação, aprovado'
