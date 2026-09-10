-- Metas e itens.
--
-- O que este arquivo existe para provar:
--
--   1. couple_id de meta e de item sai do JWT — o corpo da chamada não escolhe;
--   2. não existe insert direto em goal_items, nem no próprio casal;
--   3. apagar meta com dinheiro dentro exige confirmação explícita, e sem ela
--      NADA some;
--   4. meta de outro casal responde igual a meta que não existe.
--
-- Roda dentro de uma transação que termina em rollback.
--
--   npm run test:rls

\set ON_ERROR_STOP on

begin;

create schema meta_teste;

create function meta_teste.igual(rotulo text, obtido bigint, esperado bigint)
returns void language plpgsql as $$
begin
  if obtido <> esperado then
    raise exception 'FALHOU em "%": %, esperava %', rotulo, obtido, esperado;
  end if;
end $$;

create function meta_teste.texto(rotulo text, obtido text, esperado text)
returns void language plpgsql as $$
begin
  if obtido is distinct from esperado then
    raise exception 'FALHOU em "%": "%", esperava "%"', rotulo, obtido, esperado;
  end if;
end $$;

-- Espera que o comando exploda. Erro de digitação não conta como recusa.
create function meta_teste.recusa(rotulo text, comando text)
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

grant usage on schema meta_teste to authenticated, anon;
grant execute on all functions in schema meta_teste to authenticated, anon;


-- ===========================================================================
-- As três tabelas estão publicando para o Realtime
-- ===========================================================================

-- Sem isto, todo o resto do prompt 7 funciona e o app simplesmente não é ao
-- vivo — falha silenciosa, que é a pior de descobrir na mão.
do $$
begin
  perform meta_teste.igual('goals, goal_items e contributions publicando',
    (select count(*) from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename in ('goals', 'goal_items', 'contributions')), 3);

  -- E a publication tem que publicar delete, senão item apagado por um nunca
  -- some da tela do outro.
  perform meta_teste.igual('a publication publica delete',
    (select count(*) from pg_publication
     where pubname = 'supabase_realtime' and pubdelete), 1);
end $$;


-- ===========================================================================
-- Seed: casal A com Ana, casal B com Cida
-- ===========================================================================

insert into auth.users (id, email, created_at) values
  ('c1000001-0000-0000-0000-000000000001', 'meta-ana@teste.invalid', now() - interval '90 days'),
  ('c1000002-0000-0000-0000-000000000002', 'meta-cida@teste.invalid', now() - interval '70 days');

create temp table cenario (chave text primary key, valor uuid);
grant all on cenario to authenticated;

do $$
declare
  ana constant uuid := 'c1000001-0000-0000-0000-000000000001';
  cida constant uuid := 'c1000002-0000-0000-0000-000000000002';
  casal_b uuid;
  meta_b uuid;
begin
  select couple_id into casal_b from public.couple_members where user_id = cida;

  insert into public.goals (couple_id, title, category, target_amount_cents)
  values (casal_b, 'Meta do casal B', 'geral', 500000)
  returning id into meta_b;

  insert into cenario values
    ('ana', ana), ('cida', cida),
    ('casal_a', (select couple_id from public.couple_members where user_id = ana)),
    ('casal_b', casal_b), ('meta_b', meta_b);

  raise notice 'seed ok: Ana no casal A, Cida no B com uma meta';
end $$;


-- ===========================================================================
-- 1. add_goal com tudo, e add_goal_item
-- ===========================================================================

set local role authenticated;
set local request.jwt.claims = '{"sub":"c1000001-0000-0000-0000-000000000001","role":"authenticated"}';

do $$
declare
  casal_a uuid := (select valor from cenario where chave = 'casal_a');
  meta uuid;
  item uuid;
begin
  meta := public.add_goal('Cozinha nova', 1500000, 'casa',
                          now() + interval '400 days', 'alta');
  insert into cenario values ('meta_a', meta);

  perform meta_teste.igual('a meta nasceu no casal de quem chamou',
    (select count(*) from public.goals where id = meta and couple_id = casal_a), 1);
  perform meta_teste.texto('categoria gravada',
    (select category from public.goals where id = meta), 'casa');
  perform meta_teste.texto('prioridade gravada',
    (select priority::text from public.goals where id = meta), 'alta');
  perform meta_teste.igual('prazo gravado',
    (select count(*) from public.goals where id = meta and deadline_at is not null), 1);

  item := public.add_goal_item(meta, 'Geladeira', 419900, 'https://amazon.com.br/dp/1');
  insert into cenario values ('item_a', item);

  perform meta_teste.igual('o item nasceu no mesmo casal',
    (select count(*) from public.goal_items
     where id = item and couple_id = casal_a and goal_id = meta), 1);
  perform meta_teste.texto('item começa como desejado',
    (select status::text from public.goal_items where id = item), 'desejado');

  -- Item sem preço e sem link é caso normal: "ainda não sei quanto custa".
  perform public.add_goal_item(meta, 'Cooktop');
  perform meta_teste.igual('item sem preço nem link entra',
    (select count(*) from public.goal_items where goal_id = meta), 2);

  raise notice 'meta e itens criados';
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
  perform meta_teste.recusa('item em meta de outro casal',
    format('select public.add_goal_item(%L, ''Invasor'')', meta_b));

  perform meta_teste.recusa('item sem nome',
    format('select public.add_goal_item(%L, ''   '')', meta_a));
  perform meta_teste.recusa('item de preço negativo',
    format('select public.add_goal_item(%L, ''Cooktop'', -1)', meta_a));

  -- A URL vira link clicável na tela. Guardar javascript: é plantar o clique.
  perform meta_teste.recusa('link javascript:',
    format('select public.add_goal_item(%L, ''Cooktop'', null, ''javascript:alert(1)'')', meta_a));
  perform meta_teste.recusa('link file:',
    format('select public.add_goal_item(%L, ''Cooktop'', null, ''file:///etc/passwd'')', meta_a));

  perform meta_teste.recusa('meta sem nome', 'select public.add_goal(''  '')');

  -- Insert direto morre mesmo no PRÓPRIO casal: o couple_id não pode vir do
  -- corpo da requisição, nem quando o corpo está certo. Regra 3.
  perform meta_teste.recusa('insert direto em goal_items, no próprio casal',
    format('insert into public.goal_items (couple_id, goal_id, name) values (%L, %L, ''na mão'')',
           casal_a, meta_a));

  raise notice 'as recusas passaram';
end $$;


-- ===========================================================================
-- 3. Update por PostgREST continua valendo, dentro do casal
-- ===========================================================================

do $$
declare
  item uuid := (select valor from cenario where chave = 'item_a');
  meta_b uuid := (select valor from cenario where chave = 'meta_b');
  n integer;
begin
  update public.goal_items set status = 'comprado' where id = item;
  perform meta_teste.texto('marcar como comprado é update direto',
    (select status::text from public.goal_items where id = item), 'comprado');

  update public.goals set title = 'Cozinha nova (2027)'
  where id = (select valor from cenario where chave = 'meta_a');
  perform meta_teste.texto('editar meta é update direto',
    (select title from public.goals where id = (select valor from cenario where chave = 'meta_a')),
    'Cozinha nova (2027)');

  -- O casal do lado continua fora de alcance.
  update public.goals set title = 'invadido' where id = meta_b;
  get diagnostics n = row_count;
  perform meta_teste.igual('update na meta do casal B não pega linha', n, 0);
end $$;


-- ===========================================================================
-- 4. delete_goal
-- ===========================================================================

do $$
declare
  meta_a uuid := (select valor from cenario where chave = 'meta_a');
  meta_b uuid := (select valor from cenario where chave = 'meta_b');
  descartavel uuid;
begin
  -- Meta de outro casal responde igual a meta que não existe.
  perform meta_teste.texto('meta do casal B',
    public.delete_goal(meta_b), 'nao_encontrada');
  perform meta_teste.texto('uuid que não existe',
    public.delete_goal(gen_random_uuid()), 'nao_encontrada');

  -- Sem dinheiro dentro, apaga direto: a confirmação é para o histórico, não
  -- para o clique.
  descartavel := public.add_goal('Meta de mentira', 100);
  perform public.add_goal_item(descartavel, 'Item de mentira');
  perform meta_teste.texto('meta sem aporte apaga direto',
    public.delete_goal(descartavel), 'ok');
  perform meta_teste.igual('e leva os itens junto',
    (select count(*) from public.goal_items where goal_id = descartavel), 0);

  -- Com dinheiro dentro, o freio de mão.
  perform public.add_contribution(meta_a, 250000);
  perform meta_teste.texto('meta com aporte, sem confirmar',
    public.delete_goal(meta_a), 'precisa_confirmar');

  perform meta_teste.igual('e NADA sumiu',
    (select count(*) from public.goals where id = meta_a), 1);
  perform meta_teste.igual('nem os itens',
    (select count(*) from public.goal_items where goal_id = meta_a), 2);
  perform meta_teste.igual('nem o dinheiro',
    (select count(*) from public.contributions where goal_id = meta_a), 1);

  raise notice 'delete_goal recusa até ouvir sim';
end $$;

-- E com o sim, some tudo o que era daquela meta.
do $$
declare
  meta_a uuid := (select valor from cenario where chave = 'meta_a');
  item uuid := (select valor from cenario where chave = 'item_a');
begin
  perform public.add_price_quote(item, 399000, 'https://amazon.com.br/dp/1');
  perform meta_teste.igual('havia cotação pendurada no item',
    (select count(*) from public.price_quotes where goal_item_id = item), 1);

  perform meta_teste.texto('confirmando, apaga', public.delete_goal(meta_a, true), 'ok');

  perform meta_teste.igual('meta',
    (select count(*) from public.goals where id = meta_a), 0);
  perform meta_teste.igual('itens',
    (select count(*) from public.goal_items where goal_id = meta_a), 0);
  perform meta_teste.igual('aportes',
    (select count(*) from public.contributions where goal_id = meta_a), 0);
  perform meta_teste.igual('cotações do item',
    (select count(*) from public.price_quotes where goal_item_id = item), 0);
end $$;


-- ===========================================================================
-- 5. Sem JWT não existe meta
-- ===========================================================================

set local role anon;
set local request.jwt.claims = '';

do $$
begin
  perform meta_teste.recusa('anônimo não cria meta',
    'select public.add_goal(''Meta anônima'')');
  perform meta_teste.recusa('anônimo não cria item',
    'select public.add_goal_item(gen_random_uuid(), ''Item anônimo'')');
  perform meta_teste.recusa('anônimo não apaga meta',
    'select public.delete_goal(gen_random_uuid(), true)');
end $$;

-- Fora de qualquer sessão: a meta do casal B atravessou tudo isso intacta.
-- Dentro da sessão da Ana o RLS já devolvia zero, então lá a asserção não
-- distinguiria "não vejo" de "não existe" — e é justamente essa a diferença.
reset role;
reset request.jwt.claims;

do $$
begin
  perform meta_teste.igual('a meta do casal B continua lá',
    (select count(*) from public.goals
     where id = (select valor from cenario where chave = 'meta_b')), 1);
end $$;

do $$ begin raise notice 'metas: tudo passou'; end $$;

rollback;
