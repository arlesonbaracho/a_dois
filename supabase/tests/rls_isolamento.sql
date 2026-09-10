-- Isolamento entre casais.
--
-- Este é o teste que separa o dado financeiro de um casal da internet aberta.
-- A anon key fica embarcada no cliente, então qualquer pessoa consegue falar
-- com o PostgREST. O que ela não pode é enxergar, mudar ou apagar linha de
-- casal alheio.
--
-- Roda inteiro dentro de uma transação que termina em rollback: não deixa
-- resíduo e pode rodar duas vezes seguidas.
--
--   npm run test:rls
--
-- Um teste de RLS falha calado com facilidade: se o seed não entrou, se o
-- papel não tem grant, se auth.uid() volta nulo, tudo devolve zero linha e o
-- teste "passa" sem ter testado nada. Por isso cada cenário prova primeiro
-- que o caminho feliz funciona, e só então exige que o proibido não funcione.

\set ON_ERROR_STOP on

begin;

-- ===========================================================================
-- Ferramentas de asserção
-- ===========================================================================

create schema rls_teste;

create function rls_teste.igual(rotulo text, obtido bigint, esperado bigint)
returns void language plpgsql as $$
begin
  if obtido <> esperado then
    raise exception 'FALHOU em "%": % linha(s), esperava %', rotulo, obtido, esperado;
  end if;
end $$;

-- Guarda contra teste vazio: sem grant, zero linha viria de permissão negada e
-- não de RLS, e o teste passaria sem ter testado nada.
create function rls_teste.exige_grant(papel text)
returns void language plpgsql as $$
declare t text;
begin
  foreach t in array array[
    'public.couples', 'public.couple_members', 'public.couple_invites',
    'public.goals', 'public.goal_items', 'public.contributions',
    'public.price_quotes'
  ] loop
    if not has_table_privilege(papel, t, 'select') then
      raise exception
        'TESTE INVÁLIDO: % não tem grant de select em %. Zero linha viria de permissão, não de RLS.',
        papel, t;
    end if;
  end loop;
end $$;

grant usage on schema rls_teste to anon, authenticated;
grant execute on all functions in schema rls_teste to anon, authenticated;

-- ===========================================================================
-- Seed: dois casais, dois usuários cada, todas as tabelas populadas
-- ===========================================================================

insert into auth.users (id, email) values
  ('a0000001-0000-0000-0000-000000000001', 'rls-ana@teste.invalid'),
  ('a0000002-0000-0000-0000-000000000002', 'rls-artur@teste.invalid'),
  ('b0000001-0000-0000-0000-000000000001', 'rls-bia@teste.invalid'),
  ('b0000002-0000-0000-0000-000000000002', 'rls-bruno@teste.invalid');

-- A trigger on_auth_user_created acabou de dar um casal a cada um dos quatro.
-- Este teste monta o mundo à mão, com uuids fixos, para poder falar "o casal A"
-- e "o casal B"; os automáticos saem daqui. Que a trigger funciona é assunto de
-- cadastro_cria_casal.sql.
delete from public.couples;

insert into public.couples (id) values
  ('aaaaaaaa-0000-0000-0000-00000000000a'),
  ('bbbbbbbb-0000-0000-0000-00000000000b');

insert into public.couple_members (couple_id, user_id, role, display_name) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'a0000001-0000-0000-0000-000000000001', 'dono',     'Ana'),
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'a0000002-0000-0000-0000-000000000002', 'parceiro', 'Artur'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'b0000001-0000-0000-0000-000000000001', 'dono',     'Bia'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'b0000002-0000-0000-0000-000000000002', 'parceiro', 'Bruno');

insert into public.couple_invites
  (couple_id, created_by, channel, invited_email, token_hash, expires_at) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'a0000001-0000-0000-0000-000000000001',
   'email', 'rls-convidado-a@teste.invalid', 'hash-do-casal-a', now() + interval '72 hours'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'b0000001-0000-0000-0000-000000000001',
   'email', 'rls-convidado-b@teste.invalid', 'hash-do-casal-b', now() + interval '72 hours');

insert into public.goals (id, couple_id, title, category, target_amount_cents) values
  ('a1000000-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-00000000000a', 'Entrada do apê', 'moradia', 12000000),
  ('b1000000-0000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-00000000000b', 'Casamento',      'festa',    4500000);

insert into public.goal_items (id, couple_id, goal_id, name, estimated_price_cents) values
  ('a2000000-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-00000000000a', 'a1000000-0000-0000-0000-00000000000a', 'Geladeira', 420000),
  ('b2000000-0000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-00000000000b', 'b1000000-0000-0000-0000-00000000000b', 'Buffet',   1800000);

insert into public.contributions (couple_id, goal_id, user_id, amount_cents) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'a1000000-0000-0000-0000-00000000000a', 'a0000001-0000-0000-0000-000000000001', 150000),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'b1000000-0000-0000-0000-00000000000b', 'b0000001-0000-0000-0000-000000000001',  90000);

insert into public.price_quotes (couple_id, goal_item_id, price_cents, source_url) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'a2000000-0000-0000-0000-00000000000a',  410000, 'https://loja.test/geladeira'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'b2000000-0000-0000-0000-00000000000b', 1750000, 'https://loja.test/buffet');

-- O seed entrou mesmo? Sem isto, "zero linha visível" não prova nada.
do $$
declare t text; n bigint;
begin
  foreach t in array array[
    'public.couples', 'public.couple_invites', 'public.goals',
    'public.goal_items', 'public.contributions', 'public.price_quotes'
  ] loop
    execute format('select count(*) from %s', t) into n;
    if n <> 2 then
      raise exception 'SEED QUEBRADO: % tem % linha(s), esperava 2', t, n;
    end if;
  end loop;
  if (select count(*) from public.couple_members) <> 4 then
    raise exception 'SEED QUEBRADO: couple_members não tem 4 linhas';
  end if;
  raise notice 'seed ok: 2 casais, 4 pessoas, 7 tabelas populadas';
end $$;

-- ===========================================================================
-- Cenário 1 — Ana, do casal A, tentando alcançar o casal B
-- ===========================================================================

set local request.jwt.claims = '{"sub":"a0000001-0000-0000-0000-000000000001","role":"authenticated"}';
set local role authenticated;

do $$
declare
  casal_a constant uuid := 'aaaaaaaa-0000-0000-0000-00000000000a';
  casal_b constant uuid := 'bbbbbbbb-0000-0000-0000-00000000000b';
  ana     constant uuid := 'a0000001-0000-0000-0000-000000000001';
  meta_b  constant uuid := 'b1000000-0000-0000-0000-00000000000b';
  item_b  constant uuid := 'b2000000-0000-0000-0000-00000000000b';
  n bigint;
begin
  perform rls_teste.exige_grant('authenticated');

  if auth.uid() <> ana then
    raise exception 'TESTE INVÁLIDO: auth.uid() devolveu %, o JWT não chegou', auth.uid();
  end if;
  if not public.is_couple_member(casal_a) then
    raise exception 'TESTE INVÁLIDO: Ana não é vista como membro do próprio casal';
  end if;
  if public.is_couple_member(casal_b) then
    raise exception 'VAZAMENTO: Ana é vista como membro do casal B';
  end if;

  -- Caminho feliz primeiro. Se Ana não enxergasse o próprio casal, tudo o que
  -- vem depois provaria só que nada funciona.
  perform rls_teste.igual('A vê o próprio casal',   (select count(*) from public.couples        where id = casal_a), 1);
  perform rls_teste.igual('A vê os dois membros',   (select count(*) from public.couple_members where couple_id = casal_a), 2);
  perform rls_teste.igual('A vê o próprio convite', (select count(*) from public.couple_invites where couple_id = casal_a), 1);
  perform rls_teste.igual('A vê a própria meta',    (select count(*) from public.goals          where couple_id = casal_a), 1);
  perform rls_teste.igual('A vê o próprio item',    (select count(*) from public.goal_items     where couple_id = casal_a), 1);
  perform rls_teste.igual('A vê o próprio aporte',  (select count(*) from public.contributions  where couple_id = casal_a), 1);
  perform rls_teste.igual('A vê o próprio preço',   (select count(*) from public.price_quotes   where couple_id = casal_a), 1);
  raise notice 'A enxerga o próprio casal';

  -- SELECT no casal B, tabela por tabela.
  perform rls_teste.igual('select couples de B',        (select count(*) from public.couples        where id = casal_b), 0);
  perform rls_teste.igual('select couple_members de B', (select count(*) from public.couple_members where couple_id = casal_b), 0);
  perform rls_teste.igual('select couple_invites de B', (select count(*) from public.couple_invites where couple_id = casal_b), 0);
  perform rls_teste.igual('select goals de B',          (select count(*) from public.goals          where couple_id = casal_b), 0);
  perform rls_teste.igual('select goal_items de B',     (select count(*) from public.goal_items     where couple_id = casal_b), 0);
  perform rls_teste.igual('select contributions de B',  (select count(*) from public.contributions  where couple_id = casal_b), 0);
  perform rls_teste.igual('select price_quotes de B',   (select count(*) from public.price_quotes   where couple_id = casal_b), 0);

  -- Sem filtro nenhum: varrer a tabela inteira só pode trazer o casal A.
  perform rls_teste.igual('varredura de couples',        (select count(*) from public.couples), 1);
  perform rls_teste.igual('varredura de couple_members', (select count(*) from public.couple_members), 2);
  perform rls_teste.igual('varredura de couple_invites', (select count(*) from public.couple_invites), 1);
  perform rls_teste.igual('varredura de goals',          (select count(*) from public.goals), 1);
  perform rls_teste.igual('varredura de goal_items',     (select count(*) from public.goal_items), 1);
  perform rls_teste.igual('varredura de contributions',  (select count(*) from public.contributions), 1);
  perform rls_teste.igual('varredura de price_quotes',   (select count(*) from public.price_quotes), 1);
  raise notice 'A não enxerga nada do casal B';

  -- UPDATE no casal B: zero linha afetada.
  update public.couples        set updated_at = now()        where id = casal_b;
  get diagnostics n = row_count; perform rls_teste.igual('update couples de B', n, 0);

  update public.couple_members set display_name = 'invadido'  where couple_id = casal_b;
  get diagnostics n = row_count; perform rls_teste.igual('update couple_members de B', n, 0);

  update public.couple_invites set expires_at = now()         where couple_id = casal_b;
  get diagnostics n = row_count; perform rls_teste.igual('update couple_invites de B', n, 0);

  update public.goals          set title = 'invadido'         where couple_id = casal_b;
  get diagnostics n = row_count; perform rls_teste.igual('update goals de B', n, 0);

  update public.goal_items     set name = 'invadido'          where couple_id = casal_b;
  get diagnostics n = row_count; perform rls_teste.igual('update goal_items de B', n, 0);

  update public.contributions  set amount_cents = 1           where couple_id = casal_b;
  get diagnostics n = row_count; perform rls_teste.igual('update contributions de B', n, 0);

  update public.price_quotes   set price_cents = 1            where couple_id = casal_b;
  get diagnostics n = row_count; perform rls_teste.igual('update price_quotes de B', n, 0);

  -- DELETE no casal B: zero linha afetada.
  delete from public.price_quotes   where couple_id = casal_b;
  get diagnostics n = row_count; perform rls_teste.igual('delete price_quotes de B', n, 0);

  delete from public.contributions  where couple_id = casal_b;
  get diagnostics n = row_count; perform rls_teste.igual('delete contributions de B', n, 0);

  delete from public.goal_items     where couple_id = casal_b;
  get diagnostics n = row_count; perform rls_teste.igual('delete goal_items de B', n, 0);

  delete from public.goals          where couple_id = casal_b;
  get diagnostics n = row_count; perform rls_teste.igual('delete goals de B', n, 0);

  delete from public.couple_invites where couple_id = casal_b;
  get diagnostics n = row_count; perform rls_teste.igual('delete couple_invites de B', n, 0);

  delete from public.couple_members where couple_id = casal_b;
  get diagnostics n = row_count; perform rls_teste.igual('delete couple_members de B', n, 0);

  delete from public.couples        where id = casal_b;
  get diagnostics n = row_count; perform rls_teste.igual('delete couples de B', n, 0);
  raise notice 'A não muda nem apaga nada do casal B';

  -- INSERT com couple_id alheio: é o IDOR da regra 3, mandar couple_id do
  -- outro casal no corpo da requisição. Aqui o banco recusa com erro.
  begin
    insert into public.couples (id) values (gen_random_uuid());
    raise exception 'VAZAMENTO: insert direto em couples passou (deve ser só via create_couple)';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.couple_members (couple_id, user_id) values (casal_b, ana);
    raise exception 'VAZAMENTO: Ana se inseriu como membro do casal B';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.couple_invites (couple_id, channel, invited_email, token_hash, expires_at)
    values (casal_b, 'email', 'invasor@teste.invalid', 'hash-invasor', now() + interval '1 hour');
    raise exception 'VAZAMENTO: insert em couple_invites do casal B passou';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.goals (couple_id, title, category) values (casal_b, 'invadido', 'teste');
    raise exception 'VAZAMENTO: insert em goals do casal B passou';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.goal_items (couple_id, goal_id, name) values (casal_b, meta_b, 'invadido');
    raise exception 'VAZAMENTO: insert em goal_items do casal B passou';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.contributions (couple_id, goal_id, amount_cents) values (casal_b, meta_b, 1);
    raise exception 'VAZAMENTO: insert em contributions do casal B passou';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.price_quotes (couple_id, goal_item_id, price_cents, source_url)
    values (casal_b, item_b, 1, 'https://x.test');
    raise exception 'VAZAMENTO: insert em price_quotes do casal B passou';
  exception when insufficient_privilege then null;
  end;
  -- Mover a PRÓPRIA linha para o casal B. É o que o "with check" do update
  -- existe para barrar: só com "using", esta linha passaria.
  --
  -- couple_invites não entra mais aqui por with check: desde o convite com
  -- confirmação, ela não aceita update de ninguém, e a máquina de estados só
  -- anda por função. A prova então é que nada muda, e não que levanta 42501.
  update public.couple_invites set couple_id = casal_b where couple_id = casal_a;
  get diagnostics n = row_count;
  perform rls_teste.igual('empurrar o próprio convite para o casal B', n, 0);

  begin
    update public.couple_members set couple_id = casal_b where user_id = ana;
    raise exception 'VAZAMENTO: A empurrou o próprio vínculo para o casal B (falta with check no update)';
  exception when insufficient_privilege then null;
  end;
  raise notice 'A não escreve nada no casal B';

  -- price_quotes é append-only, inclusive no próprio casal.
  update public.price_quotes set price_cents = 1 where couple_id = casal_a;
  get diagnostics n = row_count; perform rls_teste.igual('update do próprio preço', n, 0);

  delete from public.price_quotes where couple_id = casal_a;
  get diagnostics n = row_count; perform rls_teste.igual('delete do próprio preço', n, 0);

  perform rls_teste.igual('o preço original continua lá',
    (select count(*) from public.price_quotes where couple_id = casal_a and price_cents = 410000), 1);

  -- Insert direto morre até no próprio casal: o couple_id não pode vir do
  -- corpo da requisição, nem quando o corpo está certo. Regra 3.
  begin
    insert into public.price_quotes (couple_id, goal_item_id, price_cents, source_url)
    values (casal_a, 'a2000000-0000-0000-0000-00000000000a', 399000, 'https://loja.test/x');
    raise exception 'VAZAMENTO: insert direto em price_quotes do próprio casal passou';
  exception when insufficient_privilege then null;
  end;

  -- Append-only não é somente-leitura: preço novo entra, pela função.
  perform public.add_price_quote(
    'a2000000-0000-0000-0000-00000000000a', 399000, 'https://loja.test/geladeira');
  perform rls_teste.igual('preço novo entrou',
    (select count(*) from public.price_quotes where couple_id = casal_a), 2);
  raise notice 'price_quotes recusa update e delete até no próprio casal';
end $$;

-- ===========================================================================
-- Cenário 2 — Artur, o parceiro, enxerga o casal A
-- ===========================================================================
-- Sem isto, uma policy quebrada que esconde tudo de todo mundo passaria como
-- se fosse isolamento.

reset role;
set local request.jwt.claims = '{"sub":"a0000002-0000-0000-0000-000000000002","role":"authenticated"}';
set local role authenticated;

do $$
declare
  casal_a constant uuid := 'aaaaaaaa-0000-0000-0000-00000000000a';
  casal_b constant uuid := 'bbbbbbbb-0000-0000-0000-00000000000b';
  ana     constant uuid := 'a0000001-0000-0000-0000-000000000001';
begin
  perform rls_teste.igual('parceiro vê a meta do casal', (select count(*) from public.goals          where couple_id = casal_a), 1);
  perform rls_teste.igual('parceiro vê a linha da Ana',  (select count(*) from public.couple_members where user_id = ana), 1);
  perform rls_teste.igual('parceiro não vê o casal B',   (select count(*) from public.goals          where couple_id = casal_b), 0);
  raise notice 'o parceiro enxerga o próprio casal e não o outro';
end $$;

-- ===========================================================================
-- Cenário 3 — anônimo, sem JWT: tudo vazio
-- ===========================================================================

reset role;
set local request.jwt.claims = '';
set local role anon;

do $$
declare
  casal_a constant uuid := 'aaaaaaaa-0000-0000-0000-00000000000a';
  meta_a  constant uuid := 'a1000000-0000-0000-0000-00000000000a';
  n bigint;
begin
  perform rls_teste.exige_grant('anon');

  perform rls_teste.igual('anon em couples',        (select count(*) from public.couples), 0);
  perform rls_teste.igual('anon em couple_members', (select count(*) from public.couple_members), 0);
  perform rls_teste.igual('anon em couple_invites', (select count(*) from public.couple_invites), 0);
  perform rls_teste.igual('anon em goals',          (select count(*) from public.goals), 0);
  perform rls_teste.igual('anon em goal_items',     (select count(*) from public.goal_items), 0);
  perform rls_teste.igual('anon em contributions',  (select count(*) from public.contributions), 0);
  perform rls_teste.igual('anon em price_quotes',   (select count(*) from public.price_quotes), 0);

  update public.goals set title = 'invadido';
  get diagnostics n = row_count; perform rls_teste.igual('anon update goals', n, 0);

  update public.contributions set amount_cents = 1;
  get diagnostics n = row_count; perform rls_teste.igual('anon update contributions', n, 0);

  delete from public.price_quotes;
  get diagnostics n = row_count; perform rls_teste.igual('anon delete price_quotes', n, 0);

  delete from public.contributions;
  get diagnostics n = row_count; perform rls_teste.igual('anon delete contributions', n, 0);

  delete from public.couples;
  get diagnostics n = row_count; perform rls_teste.igual('anon delete couples', n, 0);

  begin
    insert into public.couples (id) values (gen_random_uuid());
    raise exception 'VAZAMENTO: anon inseriu em couples';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.goals (couple_id, title, category) values (casal_a, 'invadido', 'teste');
    raise exception 'VAZAMENTO: anon inseriu em goals';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.contributions (couple_id, goal_id, amount_cents) values (casal_a, meta_a, 1);
    raise exception 'VAZAMENTO: anon inseriu em contributions';
  exception when insufficient_privilege then null;
  end;
  raise notice 'anônimo não enxerga nem escreve nada';
end $$;

-- ===========================================================================
-- Nada do que foi feito aqui fica no banco
-- ===========================================================================

reset role;
rollback;

\echo ''
\echo 'RLS: isolamento entre casais aprovado'
