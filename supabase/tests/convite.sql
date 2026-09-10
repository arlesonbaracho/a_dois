-- Convite, reivindicação e confirmação.
--
-- É aqui que uma pessoa passa a ver o histórico financeiro de outra. As duas
-- coisas que este arquivo existe para provar:
--
--   1. reivindicar NÃO concede nada — quem reivindicou continua sem enxergar
--      uma linha sequer do casal até alguém de dentro confirmar;
--   2. o status só anda pelas funções — nenhum update direto move a máquina
--      de estados, e nenhuma transição inválida passa.
--
-- Roda dentro de uma transação que termina em rollback.
--
--   npm run test:rls

\set ON_ERROR_STOP on

begin;

create schema convite_teste;

create function convite_teste.igual(rotulo text, obtido bigint, esperado bigint)
returns void language plpgsql as $$
begin
  if obtido <> esperado then
    raise exception 'FALHOU em "%": %, esperava %', rotulo, obtido, esperado;
  end if;
end $$;

-- Espera que o comando exploda. Erro de digitação não conta como recusa.
create function convite_teste.recusa(rotulo text, comando text)
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

-- claim_invite devolve código em vez de levantar. "indisponivel" precisa
-- cobrir token inexistente, vencido, já reivindicado, de outro canal e do
-- próprio criador: qualquer código diferente entre esses casos seria um
-- oráculo para quem estivesse varrendo tokens.
-- create_invite devolve (resultado, token). Guarda o token quando dá certo.
create function convite_teste.certo(rotulo text, obtido boolean)
returns void language plpgsql as $$
begin
  if obtido is distinct from true then
    raise exception 'FALHOU em "%"', rotulo;
  end if;
end $$;

create function convite_teste.criar(rotulo text, esperado text, p_nome text,
                                    p_channel public.invite_channel,
                                    p_email text default null, p_nickname text default null)
returns void language plpgsql as $$
declare r record;
begin
  select * into r from public.create_invite(p_channel, p_email, p_nickname);
  if r.resultado <> esperado then
    raise exception 'FALHOU em "%": create devolveu "%", esperava "%"', rotulo, r.resultado, esperado;
  end if;
  if p_nome is not null and r.token is not null then
    insert into tokens values (p_nome, r.token);
  end if;
end $$;

create function convite_teste.claim_da(rotulo text, esperado text, p_token text)
returns void language plpgsql as $$
declare obtido text;
begin
  obtido := public.claim_invite(p_token);
  if obtido <> esperado then
    raise exception 'FALHOU em "%": claim devolveu "%", esperava "%"', rotulo, obtido, esperado;
  end if;
end $$;

grant usage on schema convite_teste to authenticated;
grant execute on all functions in schema convite_teste to authenticated;

-- ===========================================================================
-- Seed: cinco pessoas, cada uma no próprio casal (a trigger de cadastro faz)
-- ===========================================================================

-- created_at explícito: a tela de confirmação mostra há quanto tempo a conta
-- existe, e conta nova é o sinal de alerta que ela existe para dar.
insert into auth.users (id, email, created_at) values
  ('e0000001-0000-0000-0000-000000000001', 'convite-ana@teste.invalid',  now() - interval '300 days'),
  ('e0000002-0000-0000-0000-000000000002', 'convite-beto@teste.invalid', now() - interval '100 days'),
  ('e0000003-0000-0000-0000-000000000003', 'convite-caio@teste.invalid', now() - interval '10 days'),
  ('e0000004-0000-0000-0000-000000000004', 'convite-duda@teste.invalid', now() - interval '5 days'),
  ('e0000005-0000-0000-0000-000000000005', 'convite-elis@teste.invalid', now() - interval '2 days');

-- Uma meta no casal da Ana: é o que Beto não pode enxergar antes da
-- confirmação, e precisa enxergar depois.
insert into public.goals (couple_id, title, category, target_amount_cents)
select m.couple_id, 'Entrada do apê', 'moradia', 12000000
from public.couple_members as m
where m.user_id = 'e0000001-0000-0000-0000-000000000001';

do $$
begin
  if (select count(*) from public.couples) < 5 then
    raise exception 'SEED QUEBRADO: cada pessoa deveria ter ganhado um casal';
  end if;
  raise notice 'seed ok: cinco pessoas, cinco casais, uma meta no casal da Ana';
end $$;

-- Guarda os tokens em claro que create_invite devolve. Criada como postgres:
-- authenticated pode não ter TEMP no banco, e não é isso que está em teste.
create temp table tokens (nome text primary key, token text);
grant all on tokens to authenticated;

set local role authenticated;

-- Caio ganha apelido, para o canal 'nickname' ter alvo.
set local request.jwt.claims = '{"sub":"e0000003-0000-0000-0000-000000000003","role":"authenticated"}';
do $$ begin perform public.set_profile('Caio', 'caio_convite', true); end $$;


-- ===========================================================================
-- 1. Criação: três canais, e o teto de três em aberto
-- ===========================================================================

set local request.jwt.claims = '{"sub":"e0000001-0000-0000-0000-000000000001","role":"authenticated"}';

do $$
begin
  perform convite_teste.criar('convite por link', 'ok', 'link', 'link');
  perform convite_teste.criar('convite por e-mail', 'ok', 'email', 'email',
    'convite-beto@teste.invalid');
  perform convite_teste.criar('convite por apelido', 'ok', 'nickname', 'nickname',
    null, 'caio_convite');

  perform convite_teste.igual('três convites em aberto',
    (select count(*) from public.couple_invites where status = 'pending'), 3);

  perform convite_teste.igual('cada token é diferente',
    (select count(distinct token) from tokens), 3);

  perform convite_teste.criar('quarto convite em aberto', 'convites_demais', null, 'link');

  raise notice 'criação: três canais, teto de três em aberto respeitado';
end $$;

-- Os prazos por canal, que é o motivo de existir três canais separados.
do $$
begin
  perform convite_teste.igual('link vale 24h',
    (select count(*) from public.couple_invites
      where channel = 'link' and expires_at between now() + interval '23 hours'
                                              and now() + interval '25 hours'), 1);
  perform convite_teste.igual('e-mail e apelido valem 72h',
    (select count(*) from public.couple_invites
      where channel in ('email','nickname')
        and expires_at between now() + interval '71 hours' and now() + interval '73 hours'), 2);
  raise notice 'prazo por canal: 24h no link, 72h nos amarrados a alguém';
end $$;


-- Auto-convite, com ator próprio para não gastar o orçamento da Ana.
reset role;
insert into auth.users (id, email, created_at) values
  ('e0000008-0000-0000-0000-000000000008', 'convite-hugo@teste.invalid', now());
set local role authenticated;
set local request.jwt.claims = '{"sub":"e0000008-0000-0000-0000-000000000008","role":"authenticated"}';

do $$
begin
  perform convite_teste.criar('convite para o próprio e-mail', 'email_proprio',
    null, 'email', 'convite-hugo@teste.invalid');
  perform convite_teste.criar('convite por apelido que não existe', 'apelido_nao_encontrado',
    null, 'nickname', null, 'ninguem_com_esse_apelido');

  raise notice 'auto-convite e apelido inexistente recusados';
end $$;


-- ===========================================================================
-- 2. Reivindicação recusada, sempre com a mesma frase
-- ===========================================================================

set local request.jwt.claims = '{"sub":"e0000004-0000-0000-0000-000000000004","role":"authenticated"}';

do $$
declare
  t_email text := (select token from tokens where nome = 'email');
  t_nick  text := (select token from tokens where nome = 'nickname');
begin
  perform convite_teste.claim_da('token que não existe', 'indisponivel', 'token-inventado');
  perform convite_teste.claim_da('token vazio', 'indisponivel', '');
  perform convite_teste.claim_da('convite de e-mail reivindicado por outra conta',
    'indisponivel', t_email);
  perform convite_teste.claim_da('convite de apelido reivindicado por outra conta',
    'indisponivel', t_nick);

  raise notice 'canal errado, token inventado e token vazio: mesma frase, sempre';
end $$;

set local request.jwt.claims = '{"sub":"e0000001-0000-0000-0000-000000000001","role":"authenticated"}';

do $$
declare t_link text := (select token from tokens where nome = 'link');
begin
  perform convite_teste.claim_da('quem criou reivindicando o próprio convite',
    'indisponivel', t_link);
  raise notice 'quem convidou não reivindica o próprio convite';
end $$;


-- ===========================================================================
-- 3. Reivindicar não concede nada
-- ===========================================================================

set local request.jwt.claims = '{"sub":"e0000002-0000-0000-0000-000000000002","role":"authenticated"}';

do $$
declare
  t_email text := (select token from tokens where nome = 'email');
  casal_da_ana uuid := (select couple_id from public.couple_members
                        where user_id = 'e0000001-0000-0000-0000-000000000001');
begin
  perform convite_teste.claim_da('Beto reivindica o convite dele', 'ok', t_email);

  perform convite_teste.igual('o convite ficou em claimed',
    (select count(*) from public.couple_invites
      where status = 'claimed' and claimed_by_user_id = 'e0000002-0000-0000-0000-000000000002'), 1);

  -- O coração deste arquivo.
  perform convite_teste.igual('Beto NÃO vê o casal da Ana',
    (select count(*) from public.couples where id = casal_da_ana), 0);
  perform convite_teste.igual('Beto NÃO vê as metas da Ana',
    (select count(*) from public.goals where couple_id = casal_da_ana), 0);
  perform convite_teste.igual('Beto NÃO vê os membros do casal da Ana',
    (select count(*) from public.couple_members where couple_id = casal_da_ana), 0);

  -- Mas vê o próprio pedido, que é o que a tela dele mostra.
  perform convite_teste.igual('Beto vê o próprio pedido',
    (select count(*) from public.couple_invites
      where claimed_by_user_id = 'e0000002-0000-0000-0000-000000000002'), 1);

  raise notice 'reivindicar deixa o pedido de pé e o acesso fechado';
end $$;

-- Corrida: a segunda tentativa na mesma linha volta sem nada.
--
-- O teste é sequencial, e vale dizer em vez de fingir: psql roda numa conexão
-- só, e nem dblink nem pg_background estão instalados. O que torna a
-- concorrência segura é o predicado do update em claim_invite,
-- "where id = ? and status = 'pending'" — sob concorrência real o perdedor
-- bloqueia na trava de linha, reavalia o predicado e o encontra falso. É o
-- mesmo caminho que este bloco percorre.
set local request.jwt.claims = '{"sub":"e0000004-0000-0000-0000-000000000004","role":"authenticated"}';

do $$
declare t_email text := (select token from tokens where nome = 'email');
begin
  perform convite_teste.claim_da('segunda reivindicação do mesmo convite',
    'indisponivel', t_email);
  raise notice 'convite já reivindicado não é reivindicado de novo';
end $$;


-- ===========================================================================
-- 4. A tela de confirmação mostra o mascarado, e só
-- ===========================================================================

set local request.jwt.claims = '{"sub":"e0000001-0000-0000-0000-000000000001","role":"authenticated"}';

do $$
declare linha record;
begin
  select * into linha from public.pending_claim();

  if linha.invite_id is null then
    raise exception 'FALHOU: a Ana não vê o pedido do Beto';
  end if;

  -- convite-beto@teste.invalid → c••••••••o@te••••••.invalid
  if linha.email_mascarado = 'convite-beto@teste.invalid' then
    raise exception 'VAZAMENTO: o e-mail saiu em claro na tela de confirmação';
  end if;
  if position('@' in linha.email_mascarado) < 2 or position('•' in linha.email_mascarado) = 0 then
    raise exception 'FALHOU: máscara inesperada — "%"', linha.email_mascarado;
  end if;
  if linha.conta_criada_ha_dias is distinct from 100 then
    raise exception 'FALHOU: a conta do Beto tem 100 dias, e veio %', linha.conta_criada_ha_dias;
  end if;

  perform convite_teste.igual('um pedido pendente, não mais',
    (select count(*) from public.pending_claim()), 1);

  raise notice 'confirmação mostra e-mail mascarado (%) e idade da conta', linha.email_mascarado;
end $$;


-- ===========================================================================
-- 5. Transições inválidas
-- ===========================================================================

do $$
declare
  id_pendente uuid := (select id from public.couple_invites where status = 'pending' limit 1);
begin
  perform convite_teste.recusa('confirmar convite que ninguém reivindicou',
    format('select public.confirm_invite(%L)', id_pendente));

  perform convite_teste.recusa('recusar convite que ninguém reivindicou',
    format('select public.reject_invite(%L)', id_pendente));

  perform convite_teste.recusa('confirmar convite de outro casal',
    format('select public.confirm_invite(%L)', gen_random_uuid()));

  raise notice 'pending não vira confirmed nem rejected direto';
end $$;


-- ===========================================================================
-- 6. Escrita direta na tabela: não existe
-- ===========================================================================

-- Se um update direto passasse, a máquina de estados inteira seria decoração:
-- bastaria "set status = 'confirmed'" para entrar no casal de outra pessoa.
do $$
declare n bigint;
begin
  update public.couple_invites set status = 'confirmed';
  get diagnostics n = row_count;
  perform convite_teste.igual('update direto de status', n, 0);

  delete from public.couple_invites;
  get diagnostics n = row_count;
  perform convite_teste.igual('delete direto', n, 0);

  perform convite_teste.recusa('insert direto',
    $c$insert into public.couple_invites (couple_id, channel, token_hash, expires_at)
       select couple_id, 'link', 'hash-invasor', now() + interval '1 hour'
       from public.couple_members where user_id = 'e0000001-0000-0000-0000-000000000001'$c$);

  perform convite_teste.igual('nada mudou de estado',
    (select count(*) from public.couple_invites where status = 'confirmed'), 0);

  raise notice 'couple_invites não aceita escrita direta';
end $$;


-- ===========================================================================
-- 6b. E não devolve o e-mail de quem foi convidado, nem o token
-- ===========================================================================

-- O e-mail é de um TERCEIRO: a pessoa convidada nunca consentiu em aparecer
-- para o parceiro de quem a convidou. E o token_hash é segredo do sistema.
-- RLS não resolve isso — ela filtra linha, não coluna. Quem filtra é o grant.
--
-- A auditoria de 2026-09-10 achou as duas colunas legíveis por qualquer membro
-- do casal. Estas asserções são as que teriam pego isso antes.
do $$
begin
  perform convite_teste.recusa('membro do casal não lê invited_email',
    'select invited_email from public.couple_invites limit 1');
  perform convite_teste.recusa('membro do casal não lê token_hash',
    'select token_hash from public.couple_invites limit 1');

  -- E o "select *" cai junto, que é como a tela lia antes.
  perform convite_teste.recusa('nem por select *',
    'select * from public.couple_invites limit 1');

  -- O que sobra continua legível: sem isso a tela não teria como listar nada.
  -- Sem contagem fixa de propósito — o que importa é o select não explodir.
  perform (select count(*) from (select id, channel, status, expires_at
                                 from public.couple_invites) as x);

  raise notice 'invited_email e token_hash fora do alcance do cliente';
end $$;

-- active_invites: o substituto que a tela usa, com o e-mail mascarado.
do $$
declare linha record;
begin
  select * into linha from public.active_invites()
  where channel = 'email' limit 1;

  perform convite_teste.certo('active_invites devolve o convite por e-mail',
    linha.invite_id is not null);
  perform convite_teste.certo('com o e-mail mascarado',
    linha.email_mascarado like '%•%');
  -- O domínio sobrevive à máscara (j••e@gm••l.com), mas o nome antes do @ não
  -- pode sair inteiro.
  perform convite_teste.certo('e nunca o endereço em claro',
    split_part(linha.email_mascarado, '@', 1) like '%•%');

  raise notice 'active_invites mascara o e-mail';
end $$;


-- ===========================================================================
-- 7. Confirmar: o único passo que concede acesso
-- ===========================================================================

do $$
declare
  id_claimed uuid := (select id from public.couple_invites where status = 'claimed' limit 1);
  casal_da_ana uuid := (select couple_id from public.couple_members
                        where user_id = 'e0000001-0000-0000-0000-000000000001');
begin
  perform public.confirm_invite(id_claimed);

  perform convite_teste.igual('o casal da Ana virou duas pessoas',
    (select count(*) from public.couple_members where couple_id = casal_da_ana), 2);

  perform convite_teste.igual('os outros convites foram revogados',
    (select count(*) from public.couple_invites
      where couple_id = casal_da_ana and status = 'revoked'), 2);

  perform convite_teste.igual('nenhum convite sobrou em aberto',
    (select count(*) from public.couple_invites
      where couple_id = casal_da_ana and status in ('pending','claimed')), 0);

  perform convite_teste.recusa('confirmar duas vezes',
    format('select public.confirm_invite(%L)', id_claimed));

  perform convite_teste.recusa('revogar convite já confirmado',
    format('select public.revoke_invite(%L)', id_claimed));

  perform convite_teste.criar('convidar mais alguém para um plano de duas pessoas',
    'plano_cheio', null, 'link');

  raise notice 'confirmar cria o vínculo, revoga o resto e é terminal';
end $$;

-- E o casal vazio do Beto, que só existia porque todo cadastro ganha um.
reset role;
do $$
declare casal_da_ana uuid := (select couple_id from public.couple_members
                              where user_id = 'e0000001-0000-0000-0000-000000000001'
                              order by created_at limit 1);
begin
  if (select count(*) from public.couple_members
      where user_id = 'e0000002-0000-0000-0000-000000000002') <> 1 then
    raise exception 'FALHOU: Beto ficou em dois casais';
  end if;
  if (select couple_id from public.couple_members
      where user_id = 'e0000002-0000-0000-0000-000000000002') <> casal_da_ana then
    raise exception 'FALHOU: Beto não entrou no casal da Ana';
  end if;
  raise notice 'o casal vazio de quem entrou foi descartado';
end $$;
set local role authenticated;

-- Agora sim, e só agora.
set local request.jwt.claims = '{"sub":"e0000002-0000-0000-0000-000000000002","role":"authenticated"}';

do $$
begin
  perform convite_teste.igual('Beto vê a meta que existia antes de ele entrar',
    (select count(*) from public.goals where title = 'Entrada do apê'), 1);
  raise notice 'depois da confirmação, o histórico inteiro fica visível';
end $$;


-- O confirm do bloco 7 revogou os outros dois convites da Ana. Um token
-- revogado é tão indisponível quanto um inventado.
set local request.jwt.claims = '{"sub":"e0000004-0000-0000-0000-000000000004","role":"authenticated"}';

do $$
begin
  perform convite_teste.claim_da('token revogado', 'indisponivel',
    (select token from tokens where nome = 'link'));
  perform convite_teste.claim_da('token revogado, canal apelido', 'indisponivel',
    (select token from tokens where nome = 'nickname'));
  raise notice 'token revogado é recusado igual a token inventado';
end $$;


-- ===========================================================================
-- 8. Link reivindicado por conta aleatória: passa, e não dá acesso a nada
-- ===========================================================================

-- O casal do Caio ganha uma linha em cada tabela: sem isso as asserções de
-- "zero" abaixo seriam zero por não haver nada, e não por RLS.
reset role;
do $$
declare
  casal uuid := (select couple_id from public.couple_members
                 where user_id = 'e0000003-0000-0000-0000-000000000003');
  meta uuid;
  item uuid;
begin
  insert into public.goals (couple_id, title, category, target_amount_cents)
  values (casal, 'Entrada do apê', 'moradia', 12000000) returning id into meta;

  insert into public.goal_items (couple_id, goal_id, name, estimated_price_cents)
  values (casal, meta, 'Geladeira', 420000) returning id into item;

  insert into public.contributions (couple_id, goal_id, user_id, amount_cents)
  values (casal, meta, 'e0000003-0000-0000-0000-000000000003', 150000);

  insert into public.price_quotes (couple_id, goal_item_id, price_cents, source_url)
  values (casal, item, 410000, 'https://loja.test/geladeira');
end $$;
set local role authenticated;

set local request.jwt.claims = '{"sub":"e0000003-0000-0000-0000-000000000003","role":"authenticated"}';

do $$ begin perform convite_teste.criar('Caio convida por link', 'ok', 'recusa', 'link'); end $$;

set local request.jwt.claims = '{"sub":"e0000004-0000-0000-0000-000000000004","role":"authenticated"}';
-- O teste mais importante do arquivo. O canal 'link' é o mais aberto dos três:
-- não amarra a ninguém, e qualquer conta autenticada reivindica. A pergunta é
-- se reivindicar concede alguma coisa. Não concede.
do $$
declare casal_do_caio uuid := (select couple_id from public.couple_members
                               where user_id = 'e0000003-0000-0000-0000-000000000003');
begin
  perform convite_teste.claim_da('conta aleatória reivindica um link', 'ok',
    (select token from tokens where nome = 'recusa'));

  perform convite_teste.igual('e o claim ficou registrado',
    (select count(*) from public.couple_invites
      where status = 'claimed'
        and claimed_by_user_id = 'e0000004-0000-0000-0000-000000000004'), 1);

  perform convite_teste.igual('sem acesso a couples',
    (select count(*) from public.couples where id = casal_do_caio), 0);
  perform convite_teste.igual('sem acesso a couple_members',
    (select count(*) from public.couple_members where couple_id = casal_do_caio), 0);
  perform convite_teste.igual('sem acesso a goals',
    (select count(*) from public.goals where couple_id = casal_do_caio), 0);
  perform convite_teste.igual('sem acesso a goal_items',
    (select count(*) from public.goal_items where couple_id = casal_do_caio), 0);
  perform convite_teste.igual('sem acesso a contributions',
    (select count(*) from public.contributions where couple_id = casal_do_caio), 0);
  perform convite_teste.igual('sem acesso a price_quotes',
    (select count(*) from public.price_quotes where couple_id = casal_do_caio), 0);
  perform convite_teste.igual('e nem à meta pelo título',
    (select count(*) from public.goals where title = 'Entrada do apê'), 0);

  raise notice 'link reivindicado por conta aleatória: claim passa, acesso zero';
end $$;

set local request.jwt.claims = '{"sub":"e0000003-0000-0000-0000-000000000003","role":"authenticated"}';

do $$
declare id_pedido uuid := (select id from public.couple_invites where status = 'claimed' limit 1);
begin
  perform public.reject_invite(id_pedido);

  perform convite_teste.igual('quem reivindicou foi apagado do registro',
    (select count(*) from public.couple_invites
      where id = id_pedido and claimed_by_user_id is null and status = 'rejected'), 1);

  raise notice 'recusar apaga claimed_by na hora, sem esperar o expurgo';
end $$;

-- E para quem foi recusado, o convite simplesmente sumiu: nada de motivo.
set local request.jwt.claims = '{"sub":"e0000004-0000-0000-0000-000000000004","role":"authenticated"}';

do $$
begin
  perform convite_teste.igual('Duda não vê mais o pedido recusado',
    (select count(*) from public.couple_invites), 0);
  raise notice 'quem foi recusado não descobre que foi recusado';
end $$;


-- ===========================================================================
-- 9. Convite vencido, com o expurgo parado
-- ===========================================================================

-- Nenhuma função confia no status 'expired'. Aqui o pg_cron não roda, o
-- convite continua marcado como 'pending', e mesmo assim é recusado.
set local request.jwt.claims = '{"sub":"e0000005-0000-0000-0000-000000000005","role":"authenticated"}';

do $$ begin perform convite_teste.criar('Elis convida por link', 'ok', 'vencido', 'link'); end $$;

reset role;
update public.couple_invites set expires_at = now() - interval '1 minute'
where couple_id = (select couple_id from public.couple_members
                   where user_id = 'e0000005-0000-0000-0000-000000000005')
  and status = 'pending';
set local role authenticated;

set local request.jwt.claims = '{"sub":"e0000004-0000-0000-0000-000000000004","role":"authenticated"}';

do $$
begin
  perform convite_teste.claim_da('convite vencido, com o job parado', 'indisponivel',
    (select token from tokens where nome = 'vencido'));

  raise notice 'convite vencido é recusado sem depender do pg_cron';
end $$;

reset role;
do $$
begin
  if (select count(*) from public.couple_invites
      where status = 'pending' and expires_at < now()) <> 1 then
    raise exception 'TESTE INVÁLIDO: o convite deveria ter ficado pending e vencido';
  end if;
  raise notice 'e ele continuava marcado como pending, como esperado';
end $$;
set local role authenticated;


-- ===========================================================================
-- 10. Plano com movimentação não é abandonado
-- ===========================================================================

reset role;
insert into auth.users (id, email, created_at) values
  ('e0000006-0000-0000-0000-000000000006', 'convite-fabio@teste.invalid', now() - interval '1 day');
insert into public.goals (couple_id, title, category, target_amount_cents)
select m.couple_id, 'Viagem', 'lazer', 500000
from public.couple_members as m
where m.user_id = 'e0000006-0000-0000-0000-000000000006';
set local role authenticated;

set local request.jwt.claims = '{"sub":"e0000005-0000-0000-0000-000000000005","role":"authenticated"}';
do $$ begin perform convite_teste.criar('Elis convida de novo', 'ok', 'com_dados', 'link'); end $$;

set local request.jwt.claims = '{"sub":"e0000006-0000-0000-0000-000000000006","role":"authenticated"}';

do $$
begin
  -- Código específico de propósito: fala do plano de quem reivindica, não do
  -- convite, então não conta nada a quem estivesse varrendo tokens.
  perform convite_teste.claim_da('reivindicar com plano que já tem movimentação',
    'plano_com_movimentacao', (select token from tokens where nome = 'com_dados'));

  perform convite_teste.igual('a meta do Fábio continua onde estava',
    (select count(*) from public.goals where title = 'Viagem'), 1);

  raise notice 'plano com movimentação não é largado para trás';
end $$;


-- ===========================================================================
-- 11. Limites
-- ===========================================================================

-- Reivindicação: 10 por hora, para desencorajar varredura de token.
set local request.jwt.claims = '{"sub":"e0000006-0000-0000-0000-000000000006","role":"authenticated"}';

-- Este bloco é o que provou que o limite não funcionava: enquanto claim_invite
-- levantava exceção, a batida gravada voltava atrás junto com a transação, e
-- dava para varrer token à vontade.
do $$
begin
  -- Uma já foi gasta no bloco 10.
  for i in 1..9 loop
    perform convite_teste.claim_da('varredura', 'indisponivel', 'token-que-nao-existe');
  end loop;

  perform convite_teste.claim_da('décima primeira tentativa da hora', 'limite',
    'token-que-nao-existe');

  raise notice 'tentativa que falha também conta: a varredura para na décima primeira';
end $$;

-- Criação: 5 por hora por casal.
set local request.jwt.claims = '{"sub":"e0000005-0000-0000-0000-000000000005","role":"authenticated"}';

do $$
begin
  -- Duas já foram gastas (blocos 9 e 10). A quinta esbarra no teto de três em
  -- aberto, e é justamente esse o teste: tentativa recusada por outro motivo
  -- TAMBÉM gasta orçamento, senão o teto de três em aberto seria o desvio para
  -- tentar à vontade.
  perform convite_teste.criar('terceira da hora', 'ok', null, 'link');
  perform convite_teste.criar('quarta da hora', 'ok', null, 'link');
  perform convite_teste.criar('quinta da hora', 'convites_demais', null, 'link');
  perform convite_teste.criar('sexta da hora', 'limite', null, 'link');

  raise notice 'criação para na sexta da hora, contando as tentativas recusadas';
end $$;


-- ===========================================================================
-- 12. Convidar por apelido não é um desvio para varrer apelidos
-- ===========================================================================

-- Perguntar "existe alguém com este apelido?" por create_invite consome os
-- dois orçamentos: o de criação de convite (5/h) e o de busca (20/h). Como o
-- de criação é conferido primeiro e é mais apertado, ele é quem barra — a
-- varredura por este caminho para na sexta, não na vigésima primeira.
--
-- Uma pessoa nova, sem nada gasto, para a conta ser exata.
reset role;
insert into auth.users (id, email, created_at) values
  ('e0000007-0000-0000-0000-000000000007', 'convite-gabi@teste.invalid', now());
set local role authenticated;
set local request.jwt.claims = '{"sub":"e0000007-0000-0000-0000-000000000007","role":"authenticated"}';

do $$
begin
  for i in 1..5 loop
    perform convite_teste.criar('varredura por apelido', 'apelido_nao_encontrado',
      null, 'nickname', null, 'ninguem_' || i);
  end loop;

  perform convite_teste.criar('sexta pergunta da hora', 'limite',
    null, 'nickname', null, 'ninguem_final');

  raise notice 'varrer apelido pelo canal de convite para na sexta pergunta';
end $$;


-- ===========================================================================
-- 13. Expurgo: convite morto não fica de lembrança
-- ===========================================================================

-- expire_and_purge é do servidor (execute revogado de authenticated), então
-- roda como postgres. As linhas nascem com a data já para trás: o trigger de
-- updated_at só dispara em update, e sobrescreveria qualquer tentativa de
-- envelhecer a linha depois.
reset role;

do $$
declare
  casal uuid := (select couple_id from public.couple_members
                 where user_id = 'e0000007-0000-0000-0000-000000000007');
  hugo constant uuid := 'e0000008-0000-0000-0000-000000000008';
begin
  insert into public.couple_invites
    (couple_id, channel, token_hash, status, rejected_at, expires_at, created_at, updated_at)
  values
    (casal, 'link', 'hash-velho', 'rejected', now() - interval '8 days',
     now() - interval '8 days', now() - interval '8 days', now() - interval '8 days'),
    (casal, 'link', 'hash-recente', 'rejected', now() - interval '1 day',
     now() - interval '1 day', now() - interval '1 day', now() - interval '1 day');

  insert into public.couple_invites
    (couple_id, channel, token_hash, status, claimed_by_user_id, claimed_at,
     expires_at, created_at, updated_at)
  values
    (casal, 'link', 'hash-parado', 'claimed', hugo, now() - interval '49 hours',
     now() + interval '1 hour', now() - interval '50 hours', now() - interval '49 hours');

  perform public.expire_and_purge();

  perform convite_teste.igual('o terminal de 8 dias foi apagado',
    (select count(*) from public.couple_invites where token_hash = 'hash-velho'), 0);

  perform convite_teste.igual('o terminal de 1 dia continua lá',
    (select count(*) from public.couple_invites where token_hash = 'hash-recente'), 1);

  perform convite_teste.igual('o claim parado há 49h virou expired sem reivindicante',
    (select count(*) from public.couple_invites
      where token_hash = 'hash-parado'
        and status = 'expired'
        and claimed_by_user_id is null), 1);

  perform convite_teste.igual('e o pendente vencido do bloco 9 finalmente virou expired',
    (select count(*) from public.couple_invites
      where status = 'pending' and expires_at <= now()), 0);

  raise notice 'expurgo: terminal de 7 dias apagado, claim de 48h sem reivindicante';
end $$;

rollback;

\echo ''
\echo 'Convite: reivindicar não concede, só confirmar concede — aprovado'
