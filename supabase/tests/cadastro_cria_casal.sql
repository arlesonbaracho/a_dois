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

-- ===========================================================================
-- Uma pessoa nova
-- ===========================================================================

do $$
declare
  ines constant uuid := 'c0000001-0000-0000-0000-000000000001';
  casal uuid;
begin
  insert into auth.users (id, email) values (ines, 'ines@exemplo.test');

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
  insert into auth.users (id, email) values (ivo, 'ivo@exemplo.test');

  perform cadastro_teste.igual(
    'cada pessoa nova ganha o próprio casal',
    (select count(distinct couple_id) from public.couple_members
      where user_id in (ines, ivo)), 2);

  raise notice 'dois cadastros, dois casais separados';
end $$;

-- ===========================================================================
-- create_couple_for não é alcançável pelo cliente
-- ===========================================================================

-- Ela recebe o user_id por parâmetro. Se o cliente pudesse chamá-la, criaria
-- casal com dono arbitrário — que é a regra 3 do CLAUDE.md ao contrário.
do $$
declare papel text;
begin
  foreach papel in array array['anon', 'authenticated'] loop
    if has_function_privilege(papel, 'public.create_couple_for(uuid)', 'execute') then
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
