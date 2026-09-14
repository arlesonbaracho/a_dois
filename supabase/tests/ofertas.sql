-- Ofertas de parceiro: quem lê, o que lê, e quem não escreve.
--
-- A tabela não tem couple_id — é conteúdo global. Então o que este arquivo
-- prova não é isolamento entre casais: é que a VIGÊNCIA está na policy, e não
-- na consulta do cliente, e que ninguém logado escreve aqui por caminho
-- nenhum.

begin;

create schema oferta_teste;

create function oferta_teste.igual(rotulo text, obtido bigint, esperado bigint)
returns void language plpgsql as $$
begin
  -- `is distinct from` e não `<>`: com NULL o `<>` devolve nulo, o if trata
  -- como falso, e a asserção passa justamente no caso que ela veio pegar.
  if obtido is distinct from esperado then
    raise exception 'FALHOU em "%": %, esperava %', rotulo, obtido, esperado;
  end if;
end $$;

create function oferta_teste.recusa(rotulo text, comando text)
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

grant usage on schema oferta_teste to authenticated, anon;
grant execute on all functions in schema oferta_teste to authenticated, anon;

-- ===========================================================================
-- O cenário: três ofertas, uma de cada estado da janela
-- ===========================================================================

insert into public.offers (id, category, title, merchant, price_cents, target_url, published_at, expires_at)
values
  ('11111111-1111-1111-1111-111111111111', 'casa', 'Geladeira frost free 375 litros',
   'Loja Exemplo', 289900, 'https://loja.example/geladeira', now() - interval '1 day', null),
  ('22222222-2222-2222-2222-222222222222', 'casa', 'Fogão cinco bocas',
   'Loja Exemplo', 134000, 'https://loja.example/fogao', now() - interval '10 days', now() - interval '1 day'),
  ('33333333-3333-3333-3333-333333333333', 'viagem', 'Mala de bordo',
   'Loja Exemplo', 39900, 'https://loja.example/mala', now() + interval '1 day', null);

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';

do $$
begin
  -- Conta só o que é do cenário (armadilha 6): depois de uma rodada de e2e há
  -- dado de verdade na tabela.
  perform oferta_teste.igual('só a oferta no ar é visível',
    (select count(*) from public.offers
      where id in ('11111111-1111-1111-1111-111111111111',
                   '22222222-2222-2222-2222-222222222222',
                   '33333333-3333-3333-3333-333333333333')), 1);

  perform oferta_teste.igual('e é a de casa que está no ar',
    (select count(*) from public.offers
      where id = '11111111-1111-1111-1111-111111111111'), 1);

  perform oferta_teste.igual('a vencida não sai daqui',
    (select count(*) from public.offers
      where id = '22222222-2222-2222-2222-222222222222'), 0);

  perform oferta_teste.igual('a agendada também não',
    (select count(*) from public.offers
      where id = '33333333-3333-3333-3333-333333333333'), 0);

  raise notice 'vigência é da policy, não da consulta do cliente';
end $$;

-- ===========================================================================
-- A escrita é nossa, e é negada por escrito
-- ===========================================================================

do $$
begin
  perform oferta_teste.recusa('insert por quem está logado',
    $sql$insert into public.offers (category, title, merchant, price_cents, target_url)
         values ('casa', 'Invasora', 'X', 100, 'https://x.example/')$sql$);

  perform oferta_teste.recusa('update por quem está logado',
    $sql$update public.offers set title = 'Trocada'
         where id = '11111111-1111-1111-1111-111111111111'$sql$);

  perform oferta_teste.recusa('delete por quem está logado',
    $sql$delete from public.offers
         where id = '11111111-1111-1111-1111-111111111111'$sql$);

  raise notice 'ninguém logado escreve em offers';
end $$;

-- ===========================================================================
-- anon não alcança a tabela
-- ===========================================================================

set local role anon;
set local request.jwt.claims = '';

do $$
begin
  perform oferta_teste.recusa('anon lendo offers',
    $sql$select count(*) from public.offers$sql$);
  raise notice 'anon não alcança offers';
end $$;

reset role;
reset request.jwt.claims;

-- ===========================================================================
-- A busca por nome de item, que é o que a tela usa
-- ===========================================================================

do $$
begin
  -- OU, e não E: é `termosDeBusca` de packages/core que monta isto. Com E,
  -- "Geladeira 375L" exigiria os dois tokens e não acharia a geladeira.
  perform oferta_teste.igual('"geladeira | 375l" acha a geladeira',
    (select count(*) from public.offers
      where to_tsvector('portuguese', title) @@ to_tsquery('portuguese', 'geladeira | 375l')
        and id = '11111111-1111-1111-1111-111111111111'), 1);

  -- O dicionário português é o motivo de isto funcionar sem serviço de busca:
  -- "boca" acha "bocas". O stemmer não unifica plural irregular ("fogão" vira
  -- `fogã` e "fogões" vira `fogõ`), e é por isso que a busca é OU: basta um
  -- termo do nome casar.
  perform oferta_teste.igual('o singular acha o plural',
    (select count(*) from public.offers
      where to_tsvector('portuguese', title) @@ to_tsquery('portuguese', 'boca')
        and id = '22222222-2222-2222-2222-222222222222'), 1);

  perform oferta_teste.igual('e o que não tem nada a ver não entra',
    (select count(*) from public.offers
      where to_tsvector('portuguese', title) @@ to_tsquery('portuguese', 'bicicleta')
        and id in ('11111111-1111-1111-1111-111111111111',
                   '22222222-2222-2222-2222-222222222222')), 0);

  raise notice 'busca por nome de item: dicionário nativo dá conta';
end $$;

do $$ begin raise notice 'ofertas: tudo passou'; end $$;

rollback;
