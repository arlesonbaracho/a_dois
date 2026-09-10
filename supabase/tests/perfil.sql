-- Perfil, apelido e o limite de buscas.
--
-- O apelido é a única coisa do app que uma pessoa mostra para desconhecidos.
-- Se ele puder ser "suporte", vira engenharia social; se puder ser igual ao
-- começo do e-mail, vira vazamento de e-mail com outro nome; e se a tabela
-- puder ser lida inteira, a busca exata não serve de nada, porque a lista de
-- todo mundo sai por outra porta.
--
-- Roda dentro de uma transação que termina em rollback.
--
--   npm run test:rls

\set ON_ERROR_STOP on

begin;

create schema perfil_teste;

create function perfil_teste.igual(rotulo text, obtido bigint, esperado bigint)
returns void language plpgsql as $$
begin
  if obtido <> esperado then
    raise exception 'FALHOU em "%": %, esperava %', rotulo, obtido, esperado;
  end if;
end $$;

-- Roda um comando esperando que ele exploda. Se passar, o teste falha.
create function perfil_teste.recusa(rotulo text, comando text)
returns void language plpgsql as $$
begin
  execute comando;
  raise exception 'FALHOU: "%" deveria ter sido recusado, e passou', rotulo;
exception
  when others then
    if sqlerrm like 'FALHOU:%' then raise; end if;
    -- Comando que nem existe ou nem compila não conta como recusa: seria o
    -- teste passando por erro de digitação.
    if sqlstate in ('42883', '42601', '42P01') then
      raise exception 'TESTE INVÁLIDO em "%": % (%)', rotulo, sqlerrm, sqlstate;
    end if;
end $$;

grant usage on schema perfil_teste to authenticated;
grant execute on all functions in schema perfil_teste to authenticated;

-- ===========================================================================
-- Seed: duas pessoas, cada uma no próprio casal (a trigger cuida disso)
-- ===========================================================================

insert into auth.users (id, email) values
  ('d0000001-0000-0000-0000-000000000001', 'perfil-lia@teste.invalid'),
  ('d0000002-0000-0000-0000-000000000002', 'perfil-caio@teste.invalid');

do $$
begin
  if (select count(*) from public.profiles
        where user_id in ('d0000001-0000-0000-0000-000000000001',
                          'd0000002-0000-0000-0000-000000000002')) <> 2 then
    raise exception 'SEED QUEBRADO: a trigger de cadastro não criou os perfis';
  end if;
  raise notice 'cadastro cria o perfil junto com o casal';
end $$;

-- ===========================================================================
-- set_profile: o que ele recusa
-- ===========================================================================

set local request.jwt.claims = '{"sub":"d0000001-0000-0000-0000-000000000001","role":"authenticated"}';
set local role authenticated;

do $$
begin
  perform perfil_teste.recusa('apelido curto demais',
    $c$select public.set_profile('Lia', 'li', true)$c$);

  perform perfil_teste.recusa('apelido com mais de 20',
    $c$select public.set_profile('Lia', 'liaaaaaaaaaaaaaaaaaaaaaa', true)$c$);

  perform perfil_teste.recusa('apelido com caractere fora do conjunto',
    $c$select public.set_profile('Lia', 'lia-souza', true)$c$);

  perform perfil_teste.recusa('apelido reservado',
    $c$select public.set_profile('Lia', 'suporte', true)$c$);

  -- O e-mail da Lia é perfil-lia@teste.invalid.
  perform perfil_teste.recusa('apelido igual ao prefixo do e-mail',
    $c$select public.set_profile('Lia', 'perfil-lia', true)$c$);

  raise notice 'apelido curto, longo, torto, reservado e igual ao e-mail: recusados';
end $$;

-- ===========================================================================
-- set_profile: o caminho feliz, e a unicidade
-- ===========================================================================

do $$
begin
  perform public.set_profile('Lia', 'LIA_2026', true);

  perform perfil_teste.igual('o apelido foi normalizado para minúsculas',
    (select count(*) from public.profiles
      where user_id = 'd0000001-0000-0000-0000-000000000001' and nickname = 'lia_2026'), 1);

  raise notice 'apelido gravado e normalizado';
end $$;

set local request.jwt.claims = '{"sub":"d0000002-0000-0000-0000-000000000002","role":"authenticated"}';

do $$
begin
  perform perfil_teste.recusa('apelido de outra pessoa, na mesma caixa',
    $c$select public.set_profile('Caio', 'lia_2026', true)$c$);

  perform perfil_teste.recusa('apelido de outra pessoa, em caixa diferente',
    $c$select public.set_profile('Caio', 'Lia_2026', true)$c$);

  perform public.set_profile('Caio', 'caio_sp', true);
  raise notice 'apelido é único sem depender de caixa';
end $$;

-- ===========================================================================
-- Escrita direta em profiles: não existe
-- ===========================================================================

-- Se o cliente pudesse escrever direto, as regras de apelido acima seriam
-- decoração: bastaria um update para virar "suporte".
do $$
declare n bigint;
begin
  update public.profiles set nickname = 'suporte'
  where user_id = 'd0000002-0000-0000-0000-000000000002';
  get diagnostics n = row_count;
  perform perfil_teste.igual('update direto no próprio perfil', n, 0);

  delete from public.profiles where user_id = 'd0000002-0000-0000-0000-000000000002';
  get diagnostics n = row_count;
  perform perfil_teste.igual('delete do próprio perfil', n, 0);

  perform perfil_teste.recusa('insert direto em profiles',
    $c$insert into public.profiles (user_id) values ('d0000003-0000-0000-0000-000000000003')$c$);

  raise notice 'profiles não aceita escrita direta, nem do próprio dono';
end $$;

-- ===========================================================================
-- profiles não é um diretório de usuários
-- ===========================================================================

do $$
begin
  -- Caio enxerga o próprio perfil...
  perform perfil_teste.igual('Caio vê o próprio perfil',
    (select count(*) from public.profiles
      where user_id = 'd0000002-0000-0000-0000-000000000002'), 1);

  -- ...e ninguém mais, porque não divide casal com ninguém.
  perform perfil_teste.igual('varredura de profiles',
    (select count(*) from public.profiles), 1);

  raise notice 'select em profiles devolve só quem divide casal';
end $$;

-- ===========================================================================
-- find_by_nickname
-- ===========================================================================

do $$
declare n bigint;
begin
  select count(*) into n from public.find_by_nickname('lia_2026');
  perform perfil_teste.igual('busca exata encontra', n, 1);

  select count(*) into n from public.find_by_nickname('LIA_2026');
  perform perfil_teste.igual('busca ignora a caixa', n, 1);

  -- O ponto da busca exata: prefixo não encontra nada.
  select count(*) into n from public.find_by_nickname('lia');
  perform perfil_teste.igual('prefixo não encontra', n, 0);

  select count(*) into n from public.find_by_nickname('lia_2026 ');
  perform perfil_teste.igual('espaço em volta é aparado', n, 1);

  select count(*) into n from public.find_by_nickname('caio_sp');
  perform perfil_teste.igual('ninguém se encontra na própria busca', n, 0);

  raise notice 'busca por apelido é exata, e só';
end $$;

-- Quem se esconde some, sem virar "existe mas não quer aparecer".
set local request.jwt.claims = '{"sub":"d0000001-0000-0000-0000-000000000001","role":"authenticated"}';

do $$
declare n bigint;
begin
  perform public.set_profile('Lia', 'lia_2026', false);

  set local request.jwt.claims = '{"sub":"d0000002-0000-0000-0000-000000000002","role":"authenticated"}';
  select count(*) into n from public.find_by_nickname('lia_2026');
  perform perfil_teste.igual('quem desligou a descoberta some', n, 0);

  raise notice 'discoverable_by_nickname desligado responde como inexistente';
end $$;

-- ===========================================================================
-- Rate limit da busca: 20 por hora
-- ===========================================================================

-- Uma terceira pessoa, sem busca nenhuma gasta, para a conta ser exata. O
-- próprio teste não consegue ler rate_limit_hits para descontar — e não poder
-- ler é o que o bloco seguinte exige.
reset role;
insert into auth.users (id, email) values
  ('d0000003-0000-0000-0000-000000000003', 'perfil-noa@teste.invalid');
set local request.jwt.claims = '{"sub":"d0000003-0000-0000-0000-000000000003","role":"authenticated"}';
set local role authenticated;

do $$
declare estourou boolean := false;
begin
  for i in 1..20 loop
    perform public.find_by_nickname('ninguem_com_esse_apelido');
  end loop;

  begin
    perform public.find_by_nickname('ninguem_com_esse_apelido');
  exception when sqlstate '53400' then
    estourou := true;
  end;

  if not estourou then
    raise exception 'FALHOU: a busca de apelido passou do limite de 20 por hora';
  end if;

  raise notice 'busca por apelido para na vigésima primeira da hora';
end $$;

-- ===========================================================================
-- rate_limit_hits é invisível para o cliente
-- ===========================================================================

do $$
begin
  perform perfil_teste.recusa('select em rate_limit_hits',
    $c$select count(*) from public.rate_limit_hits$c$);

  perform perfil_teste.recusa('insert em rate_limit_hits',
    $c$insert into public.rate_limit_hits (acao, chave) values ('x','y')$c$);

  raise notice 'rate_limit_hits fora do alcance do cliente';
end $$;

reset role;
rollback;

\echo ''
\echo 'Perfil: apelido pseudônimo e busca exata aprovados'
