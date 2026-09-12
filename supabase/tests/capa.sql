-- A capa da jornada: o bucket, as policies do Storage e a coluna presa.
--
-- O que este arquivo existe para provar:
--
--   1. o casal enxerga, sobe, troca e apaga só o que está na PRÓPRIA pasta;
--   2. o casal vizinho não vê nada nossa, e é recusado ao escrever lá;
--   3. anônimo sem JWT não vê nada;
--   4. caminho fora de formato não casa com casal nenhum — inclusive travessia;
--   5. goals.cover_path recusa URL EXTERNA, caminho de outro casal e caminho
--      de outra jornada. É o ponto da tarefa inteira: o endereço nunca é
--      escolhido pelo cliente;
--   6. o bucket é privado, com teto de tamanho e um tipo só.
--
-- Roda dentro de uma transação que termina em rollback.
--
--   npm run test:rls

\set ON_ERROR_STOP on

begin;

-- storage.objects tem um gatilho (protect_delete) que barra delete direto por
-- SQL, para a API do Storage não ficar com blob órfão. Sem ligar isto, o
-- delete do casal dono também falharia — e o teste "passaria" provando o
-- gatilho em vez da policy, que é o que ele veio medir.
set local storage.allow_delete_query = 'true';

create schema capa_teste;

create function capa_teste.igual(rotulo text, obtido bigint, esperado bigint)
returns void language plpgsql as $$
begin
  if obtido <> esperado then
    raise exception 'FALHOU em "%": %, esperava %', rotulo, obtido, esperado;
  end if;
end $$;

create function capa_teste.certo(rotulo text, obtido boolean, esperado boolean)
returns void language plpgsql as $$
begin
  if obtido is distinct from esperado then
    raise exception 'FALHOU em "%": %, esperava %', rotulo, obtido, esperado;
  end if;
end $$;

-- Espera que o comando exploda. Erro de digitação não conta como recusa.
create function capa_teste.recusa(rotulo text, comando text)
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

grant usage on schema capa_teste to authenticated, anon;
grant execute on all functions in schema capa_teste to authenticated, anon;


-- ===========================================================================
-- Seed: casal A com Alice, casal B com Bento, uma jornada em cada
-- ===========================================================================

insert into auth.users (id, email) values
  ('ca000001-0000-0000-0000-000000000001', 'capa-alice@teste.invalid'),
  ('cb000001-0000-0000-0000-000000000001', 'capa-bento@teste.invalid');

-- O gatilho do cadastro acabou de dar um casal a cada um. Este teste monta o
-- mundo à mão, com uuids fixos, para poder dizer "casal A" e "casal B".
delete from public.couples;

insert into public.couples (id) values
  ('caaaaaaa-0000-0000-0000-00000000000a'),
  ('cbbbbbbb-0000-0000-0000-00000000000b');

insert into public.couple_members (couple_id, user_id, role, display_name) values
  ('caaaaaaa-0000-0000-0000-00000000000a', 'ca000001-0000-0000-0000-000000000001', 'dono', 'Alice'),
  ('cbbbbbbb-0000-0000-0000-00000000000b', 'cb000001-0000-0000-0000-000000000001', 'dono', 'Bento');

insert into public.goals (id, couple_id, title, category, target_amount_cents) values
  ('ca100000-0000-0000-0000-00000000000a', 'caaaaaaa-0000-0000-0000-00000000000a', 'Praia em janeiro', 'viagem', 800000),
  ('ca100001-0000-0000-0000-00000000000a', 'caaaaaaa-0000-0000-0000-00000000000a', 'Sofá novo',        'casa',   300000),
  ('cb100000-0000-0000-0000-00000000000b', 'cbbbbbbb-0000-0000-0000-00000000000b', 'Moto',             'geral',  2500000);

-- Uma capa já no lugar em cada casal, posta por fora de RLS (somos postgres
-- aqui). É o que o casal vizinho vai tentar alcançar mais abaixo.
insert into storage.objects (bucket_id, name, owner) values
  ('capas', 'caaaaaaa-0000-0000-0000-00000000000a/ca100000-0000-0000-0000-00000000000a/cf000000-0000-0000-0000-0000000000f1.jpg',
   'ca000001-0000-0000-0000-000000000001'),
  ('capas', 'cbbbbbbb-0000-0000-0000-00000000000b/cb100000-0000-0000-0000-00000000000b/cf000000-0000-0000-0000-0000000000f2.jpg',
   'cb000001-0000-0000-0000-000000000001');

-- Conta só o que é DESTE teste, e não o bucket inteiro.
--
-- Aqui ainda somos postgres, ou seja, sem RLS filtrando: um banco que já
-- rodou a suíte e2e tem capas de verdade guardadas, e a contagem global
-- reprovaria por motivo nenhum. As asserções depois do `set local role`
-- podem contar à vontade — lá o RLS já reduz ao casal de quem pergunta.
create function capa_teste.minhas() returns bigint language sql as $$
  select count(*) from storage.objects
  where bucket_id = 'capas'
    and (name like 'caaaaaaa-0000-0000-0000-00000000000a/%'
      or name like 'cbbbbbbb-0000-0000-0000-00000000000b/%');
$$;
grant execute on function capa_teste.minhas() to authenticated, anon;

do $$
begin
  perform capa_teste.igual('seed: duas capas no bucket', capa_teste.minhas(), 2);
  raise notice 'seed ok: 2 casais, 3 jornadas, 2 capas';
end $$;


-- ===========================================================================
-- O bucket: privado, com teto e com um tipo só
-- ===========================================================================

-- Os dois limites do escopo moram aqui, no servidor. Se alguém marcar o bucket
-- como público, a foto do casal passa a ser servida a qualquer um com o link —
-- e nenhuma tela mudaria de aparência para avisar.
do $$
declare b record;
begin
  select * into b from storage.buckets where id = 'capas';
  if not found then
    raise exception 'FALHOU: o bucket "capas" não existe';
  end if;

  -- `is not distinct from`, e não `=`: tirar o limite deixa a coluna NULA, e
  -- comparação com nulo devolve nulo, que num `if` conta como falso. A
  -- asserção ingênua passaria justamente no caso que ela veio pegar.
  perform capa_teste.certo('o bucket é privado', b.public is not distinct from false, true);
  perform capa_teste.certo('teto de 2 MiB',
    b.file_size_limit is not distinct from 2097152, true);
  perform capa_teste.certo('só image/jpeg',
    b.allowed_mime_types is not distinct from array['image/jpeg'], true);
end $$;


-- ===========================================================================
-- casal_do_caminho: quem abre o caminho
-- ===========================================================================

do $$
begin
  perform capa_teste.certo('caminho bom devolve o casal',
    public.casal_do_caminho('caaaaaaa-0000-0000-0000-00000000000a/x/y.jpg')
      = 'caaaaaaa-0000-0000-0000-00000000000a', true);

  -- null, e não exceção: policy que levanta erro devolve mensagem diferente
  -- para "não é seu" e para "não existe", e diferença de resposta é oráculo.
  perform capa_teste.certo('URL não abre casal nenhum',
    public.casal_do_caminho('https://sei-la.example/x.jpg') is null, true);
  perform capa_teste.certo('travessia não abre casal nenhum',
    public.casal_do_caminho('../../etc/passwd') is null, true);
  perform capa_teste.certo('caminho vazio não abre casal nenhum',
    public.casal_do_caminho('') is null, true);
  perform capa_teste.certo('quase-uuid não abre casal nenhum',
    public.casal_do_caminho('caaaaaaa-0000-0000-0000-00000000000/x.jpg') is null, true);
end $$;


-- ===========================================================================
-- Cenário 1 — Alice, do casal A
-- ===========================================================================

set local request.jwt.claims = '{"sub":"ca000001-0000-0000-0000-000000000001","role":"authenticated"}';
set local role authenticated;

do $$
declare
  minha constant text := 'caaaaaaa-0000-0000-0000-00000000000a/ca100000-0000-0000-0000-00000000000a/cf000000-0000-0000-0000-0000000000f1.jpg';
  do_bento constant text := 'cbbbbbbb-0000-0000-0000-00000000000b/cb100000-0000-0000-0000-00000000000b/cf000000-0000-0000-0000-0000000000f2.jpg';
begin
  -- Vê a própria, e só a própria. Duas capas no bucket, uma visível.
  perform capa_teste.igual('Alice vê 1 capa no bucket',
    (select count(*) from storage.objects where bucket_id = 'capas'), 1);
  perform capa_teste.igual('e a que ela vê é a dela',
    (select count(*) from storage.objects where name = minha), 1);
  perform capa_teste.igual('a capa do Bento é invisível',
    (select count(*) from storage.objects where name = do_bento), 0);
end $$;

-- Subir na própria pasta funciona.
insert into storage.objects (bucket_id, name) values
  ('capas', 'caaaaaaa-0000-0000-0000-00000000000a/ca100001-0000-0000-0000-00000000000a/cf000000-0000-0000-0000-0000000000f3.jpg');

do $$
begin
  perform capa_teste.igual('Alice subiu a capa da segunda jornada',
    (select count(*) from storage.objects where bucket_id = 'capas'), 2);

  -- E escrever na pasta do vizinho não. O with check da policy de insert é
  -- quem recusa: o caminho vem no corpo da requisição, e o primeiro segmento
  -- dele é conferido contra a lista de casais do auth.uid().
  perform capa_teste.recusa('Alice subindo capa na pasta do casal B', $q$
    insert into storage.objects (bucket_id, name) values
      ('capas', 'cbbbbbbb-0000-0000-0000-00000000000b/cb100000-0000-0000-0000-00000000000b/cf000000-0000-0000-0000-0000000000f9.jpg')
  $q$);

  -- Caminho sem casal na frente também não: o Storage não é pasta franca.
  perform capa_teste.recusa('Alice subindo capa na raiz do bucket', $q$
    insert into storage.objects (bucket_id, name) values ('capas', 'solta.jpg')
  $q$);

  -- Mover a própria capa PARA a pasta do vizinho: é o with check do update
  -- que barra, e é por isso que ele está escrito à mão.
  perform capa_teste.recusa('Alice movendo a própria capa para a pasta do casal B', $q$
    update storage.objects
      set name = 'cbbbbbbb-0000-0000-0000-00000000000b/cb100000-0000-0000-0000-00000000000b/cf000000-0000-0000-0000-0000000000f8.jpg'
      where name = 'caaaaaaa-0000-0000-0000-00000000000a/ca100000-0000-0000-0000-00000000000a/cf000000-0000-0000-0000-0000000000f1.jpg'
  $q$);
end $$;

-- Update e delete apontados para a capa do Bento: não explodem, simplesmente
-- não alcançam linha nenhuma — é RLS filtrando, não erro. A contagem de linhas
-- é conferida à mão, porque "0 linhas afetadas" é o resultado inteiro do teste:
-- sem `get diagnostics`, um delete que APAGOU passaria despercebido, já que a
-- linha some da vista da Alice de qualquer jeito.
do $$
declare
  do_bento constant text := 'cbbbbbbb-0000-0000-0000-00000000000b/cb100000-0000-0000-0000-00000000000b/cf000000-0000-0000-0000-0000000000f2.jpg';
  minha_nova constant text := 'caaaaaaa-0000-0000-0000-00000000000a/ca100001-0000-0000-0000-00000000000a/cf000000-0000-0000-0000-0000000000f3.jpg';
  n integer;
begin
  execute format('update storage.objects set owner = %L where name = %L',
                 'ca000001-0000-0000-0000-000000000001', do_bento);
  get diagnostics n = row_count;
  perform capa_teste.igual('update na capa do Bento alcança 0 linhas', n, 0);

  execute format('delete from storage.objects where name = %L', do_bento);
  get diagnostics n = row_count;
  perform capa_teste.igual('delete na capa do Bento alcança 0 linhas', n, 0);

  -- Apagar a própria, sim.
  execute format('delete from storage.objects where name = %L', minha_nova);
  get diagnostics n = row_count;
  perform capa_teste.igual('apagar a própria capa alcança 1 linha', n, 1);

  perform capa_teste.igual('Alice apagou a própria capa',
    (select count(*) from storage.objects where bucket_id = 'capas'), 1);
end $$;

-- A varredura sem WHERE, que é a forma que de verdade escapa.
--
-- Não é detalhe acadêmico: com um WHERE, o Postgres exige a policy de SELECT
-- para as linhas citadas, e a de select já esconde a capa do vizinho. SEM
-- WHERE nenhum, não há linha "citada" — só a policy de delete decide. Uma
-- policy de delete que conferisse apenas `bucket_id = 'capas'` pareceria
-- correta em todo teste com WHERE e apagaria o álbum do casal vizinho nesta
-- única forma. Foi assim que este teste ficou cego uma vez; não fica de novo.
do $$
declare n integer;
begin
  update storage.objects set owner = 'ca000001-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  perform capa_teste.igual('varredura de update alcança só o que é da Alice', n, 1);

  delete from storage.objects;
  get diagnostics n = row_count;
  perform capa_teste.igual('varredura de delete alcança só o que é da Alice', n, 1);
end $$;


-- ===========================================================================
-- A coluna: o endereço nunca vem do cliente
-- ===========================================================================

-- O coração da tarefa. A constraint compara o caminho contra o couple_id e o
-- id DA PRÓPRIA LINHA, então nada disso entra na tabela — nem por update
-- direto, que é como a tela edita jornada.
do $$
declare
  minha_jornada constant text := 'ca100000-0000-0000-0000-00000000000a';
  meu_casal constant text := 'caaaaaaa-0000-0000-0000-00000000000a';
begin
  -- O caminho legítimo entra.
  update public.goals
    set cover_path = meu_casal || '/' || minha_jornada || '/cf000000-0000-0000-0000-0000000000f1.jpg'
    where id = minha_jornada::uuid;

  perform capa_teste.igual('a capa legítima ficou gravada',
    (select count(*) from public.goals where id = minha_jornada::uuid and cover_path is not null), 1);

  -- URL externa: é ISTO que a tarefa veio impedir. Uma URL de terceiro na
  -- coluna faria o navegador de quem abre a tela buscar um endereço escolhido
  -- por outra pessoa, entregando IP e horário.
  perform capa_teste.recusa('URL externa na coluna', format($q$
    update public.goals set cover_path = 'https://sei-la.example/foto.jpg' where id = %L
  $q$, minha_jornada));

  perform capa_teste.recusa('URL do próprio Supabase, ainda assim URL', format($q$
    update public.goals
      set cover_path = 'https://qualquer.supabase.co/storage/v1/object/public/capas/x.jpg'
      where id = %L
  $q$, minha_jornada));

  perform capa_teste.recusa('protocolo relativo na coluna', format($q$
    update public.goals set cover_path = '//sei-la.example/foto.jpg' where id = %L
  $q$, minha_jornada));

  -- Caminho da pasta de outro casal: mesmo que o objeto exista lá, a linha
  -- não pode apontar para ele.
  perform capa_teste.recusa('caminho do casal B na nossa jornada', format($q$
    update public.goals
      set cover_path = 'cbbbbbbb-0000-0000-0000-00000000000b/cb100000-0000-0000-0000-00000000000b/cf000000-0000-0000-0000-0000000000f2.jpg'
      where id = %L
  $q$, minha_jornada));

  -- Caminho de OUTRA jornada nossa: o segundo segmento também é conferido.
  perform capa_teste.recusa('caminho de outra jornada do mesmo casal', format($q$
    update public.goals
      set cover_path = '%s/ca100001-0000-0000-0000-00000000000a/cf000000-0000-0000-0000-0000000000f1.jpg'
      where id = %L
  $q$, meu_casal, minha_jornada));

  perform capa_teste.recusa('travessia na coluna', format($q$
    update public.goals set cover_path = '../../../etc/passwd' where id = %L
  $q$, minha_jornada));

  perform capa_teste.recusa('extensão que não é jpg', format($q$
    update public.goals
      set cover_path = '%s/%s/cf000000-0000-0000-0000-0000000000f1.svg'
      where id = %L
  $q$, meu_casal, minha_jornada, minha_jornada));

  perform capa_teste.recusa('pasta a mais no caminho', format($q$
    update public.goals
      set cover_path = '%s/%s/sub/cf000000-0000-0000-0000-0000000000f1.jpg'
      where id = %L
  $q$, meu_casal, minha_jornada, minha_jornada));

  -- Limpar a capa é sempre permitido: jornada sem foto é estado legítimo.
  update public.goals set cover_path = null where id = minha_jornada::uuid;
end $$;


-- ===========================================================================
-- Cenário 2 — Bento, do casal B, do outro lado da mesma parede
-- ===========================================================================

reset role;
set local request.jwt.claims = '{"sub":"cb000001-0000-0000-0000-000000000001","role":"authenticated"}';
set local role authenticated;

do $$
declare
  do_casal_a constant text := 'caaaaaaa-0000-0000-0000-00000000000a/ca100000-0000-0000-0000-00000000000a/cf000000-0000-0000-0000-0000000000f1.jpg';
begin
  -- Este número é o que prova que a varredura da Alice não levou a capa dele
  -- junto: ela apagou tudo que a policy deixou, e o que era do casal B ficou.
  perform capa_teste.igual('Bento vê 1 capa, a dele — a varredura da Alice não a levou',
    (select count(*) from storage.objects where bucket_id = 'capas'), 1);
  perform capa_teste.igual('a capa do casal A é invisível para o Bento',
    (select count(*) from storage.objects where name = do_casal_a), 0);

  -- Tentar adivinhar o caminho exato não ajuda: RLS filtra linha, e o
  -- caminho certo de uma linha invisível continua devolvendo nada.
  perform capa_teste.igual('adivinhar o caminho não revela a capa',
    (select count(*) from storage.objects
      where bucket_id = 'capas' and name = do_casal_a), 0);

  perform capa_teste.recusa('Bento subindo na pasta do casal A', format($q$
    insert into storage.objects (bucket_id, name) values ('capas', %L)
  $q$, do_casal_a || '.bis'));
end $$;


-- ===========================================================================
-- Cenário 3 — anônimo, sem JWT nenhum
-- ===========================================================================

reset role;
reset request.jwt.claims;
set local role anon;

do $$
begin
  -- anon tem grant na tabela e nenhuma policy: zero linhas, zero escrita. Se
  -- este número deixar de ser zero, a anon key embarcada no app vira a chave
  -- do álbum de fotos de todo mundo.
  perform capa_teste.igual('anônimo não vê capa nenhuma',
    (select count(*) from storage.objects where bucket_id = 'capas'), 0);

  perform capa_teste.recusa('anônimo subindo capa', $q$
    insert into storage.objects (bucket_id, name) values
      ('capas', 'caaaaaaa-0000-0000-0000-00000000000a/ca100000-0000-0000-0000-00000000000a/cf000000-0000-0000-0000-0000000000ff.jpg')
  $q$);
end $$;

reset role;
reset request.jwt.claims;

\echo 'capa.sql: ok'

rollback;
