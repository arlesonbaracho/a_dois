-- Convite com confirmação: aceitar cria um pedido, não um acesso.
--
-- Este é o ponto do app em que uma pessoa passa a ver o histórico financeiro
-- de outra, incluindo o que foi registrado antes de ela entrar. Por isso o
-- canal do convite — e-mail, apelido ou link — é só entrega. A autorização é
-- sempre um ato deliberado de quem convidou, na tela que mostra quem apareceu
-- do outro lado.
--
-- A tabela antiga tinha token hasheado e prazo, mas o aceite concedia acesso
-- sozinho. Sem dado em produção e com um consumidor só, refazer sai muito
-- menor que oito alters.
--
-- Sobre confiar em 'expired': nenhuma função aqui confia. Vitalidade é sempre
-- "status = 'pending' and expires_at > now()", avaliada na hora. O valor no
-- enum e o pg_cron lá embaixo são higiene para o expurgo — se o job parar, o
-- convite vencido continua recusado.

drop table public.couple_invites cascade;

create type public.invite_channel as enum ('email', 'nickname', 'link');

create type public.invite_status as enum (
  'pending',    -- criado, esperando alguém reivindicar
  'claimed',    -- alguém reivindicou; ainda NÃO tem acesso a nada
  'confirmed',  -- quem convidou confirmou: aqui, e só aqui, nasce o vínculo
  'rejected',   -- quem convidou não reconheceu quem apareceu
  'revoked',    -- quem convidou desistiu
  'expired'     -- venceu sem desfecho
);


-- ===========================================================================
-- Tabela
-- ===========================================================================

create table public.couple_invites (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,

  channel public.invite_channel not null,
  invited_email text,
  invited_user_id uuid references auth.users (id) on delete cascade,

  token_hash text not null unique,
  status public.invite_status not null default 'pending',
  expires_at timestamptz not null,

  claimed_by_user_id uuid references auth.users (id) on delete set null,
  claimed_at timestamptz,
  confirmed_at timestamptz,
  rejected_at timestamptz,
  revoked_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Canal e destinatário andam juntos. Um convite de e-mail sem e-mail seria
  -- um convite de link disfarçado, sem a vida curta que o link tem.
  constraint couple_invites_canal_coerente check (
    case channel
      when 'email' then invited_email is not null and invited_user_id is null
      when 'nickname' then invited_user_id is not null and invited_email is null
      when 'link' then invited_email is null and invited_user_id is null
    end
  ),

  constraint couple_invites_email_plausivel check (
    invited_email is null or position('@' in invited_email) > 1
  ),

  -- Estado e carimbo andam juntos. Sem isto, 'confirmed' sem confirmed_at
  -- passaria despercebido em qualquer auditoria futura.
  constraint couple_invites_estado_coerente check (
    (status <> 'claimed' or (claimed_at is not null and claimed_by_user_id is not null))
    and (status = 'confirmed') = (confirmed_at is not null)
    and (status = 'rejected') = (rejected_at is not null)
    and (status = 'revoked') = (revoked_at is not null)
  )
);

comment on table public.couple_invites is
  'Convite como máquina de estados. Reivindicar não concede nada; confirmar sim.';
comment on column public.couple_invites.token_hash is
  'SHA-256 do token. Vazamento do banco não vira convite utilizável.';
comment on column public.couple_invites.claimed_by_user_id is
  'Apagado assim que o convite morre: não guardamos dado de quem não virou membro.';

create index couple_invites_ativos_idx on public.couple_invites (couple_id)
  where status in ('pending', 'claimed');
create index couple_invites_couple_id_idx on public.couple_invites (couple_id);
create index couple_invites_created_by_idx on public.couple_invites (created_by);
create index couple_invites_invited_user_id_idx on public.couple_invites (invited_user_id);
create index couple_invites_claimed_by_idx on public.couple_invites (claimed_by_user_id);

create trigger couple_invites_set_updated_at
  before update on public.couple_invites
  for each row execute function public.set_updated_at();


-- ===========================================================================
-- RLS
-- ===========================================================================

alter table public.couple_invites enable row level security;

-- Quem é do casal vê os convites dele. Quem reivindicou vê o próprio pedido,
-- e só enquanto ele estiver de pé: assim que o convite morre, claimed_by
-- é apagado e a linha some da vista de quem reivindicou — que é exatamente o
-- "não está mais disponível" que a spec pede, sem precisar de mensagem.
create policy couple_invites_select on public.couple_invites
  for select to authenticated
  using (
    public.is_couple_member(couple_id)
    or claimed_by_user_id = (select auth.uid())
  );

-- As três escritas negadas por escrito, no mesmo espírito do append-only de
-- price_quotes. Um update direto de status seria a máquina de estados inteira
-- pela porta dos fundos: bastaria "set status = 'confirmed'" para entrar no
-- casal de outra pessoa.
create policy couple_invites_insert on public.couple_invites
  for insert to authenticated
  with check (false);

create policy couple_invites_update on public.couple_invites
  for update to authenticated
  using (false)
  with check (false);

create policy couple_invites_delete on public.couple_invites
  for delete to authenticated
  using (false);


-- ===========================================================================
-- Token
-- ===========================================================================

-- gen_random_bytes do pgcrypto, e não crypto.getRandomValues no cliente: o
-- token em claro passa a existir só como valor de retorno de create_invite,
-- sem atravessar camada nenhuma, e packages/core continua sem Web Crypto —
-- que o React Native não tem, e que quebraria a portabilidade na fase 2.
--
-- translate com o "para" mais curto apaga o '=': base64url sem padding.
create function public.gerar_token()
returns text
language sql
volatile
set search_path = ''
as $$
  select translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/=', '-_');
$$;

create function public.hash_token(p_token text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(extensions.digest(p_token, 'sha256'), 'hex');
$$;

revoke execute on function public.gerar_token() from public, anon, authenticated;
revoke execute on function public.hash_token(text) from public, anon, authenticated;


-- ===========================================================================
-- Máscara de e-mail
-- ===========================================================================

-- Serve para reconhecer, não para coletar. Pedaço curto demais vira só
-- bolinhas: mascarar "ab" como "a•b" não esconderia nada.
create function public.mascarar_pedaco(p_texto text, p_visivel integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when length(p_texto) <= p_visivel + 1 then repeat('•', 3)
    else left(p_texto, p_visivel)
         || repeat('•', length(p_texto) - p_visivel - 1)
         || right(p_texto, 1)
  end;
$$;

create function public.mascarar_email(p_email text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_email is null or p_email !~ '^[^@]+@[^@]+\.[^@]+$' then '•••'
    else public.mascarar_pedaco(split_part(p_email, '@', 1), 1)
      || '@'
      || public.mascarar_pedaco(split_part(split_part(p_email, '@', 2), '.', 1), 2)
      || substring(split_part(p_email, '@', 2) from position('.' in split_part(p_email, '@', 2)))
  end;
$$;

comment on function public.mascarar_email(text) is
  'jose@gmail.com vira j••e@gm••l.com. O e-mail em claro não sai do banco.';


-- ===========================================================================
-- Auxiliares internas
-- ===========================================================================

-- O casal de quem está autenticado. Sai do JWT, nunca do corpo da requisição.
create function public.meu_casal_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.couple_id
  from public.couple_members as m
  where m.user_id = (select auth.uid())
    and m.left_at is null
  order by m.created_at
  limit 1;
$$;

create function public.membros_ativos(p_couple_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.couple_members as m
  where m.couple_id = p_couple_id and m.left_at is null;
$$;

-- O casal tem alguma coisa dentro? Decide se ele pode ser abandonado quando
-- alguém entra no casal de outra pessoa. Na dúvida, o convite é recusado e
-- nada é apagado.
create function public.casal_vazio(p_couple_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (select 1 from public.goals where couple_id = p_couple_id)
     and not exists (select 1 from public.goal_items where couple_id = p_couple_id)
     and not exists (select 1 from public.contributions where couple_id = p_couple_id)
     and not exists (select 1 from public.price_quotes where couple_id = p_couple_id);
$$;

revoke execute on function public.meu_casal_id() from public, anon, authenticated;
revoke execute on function public.membros_ativos(uuid) from public, anon, authenticated;
revoke execute on function public.casal_vazio(uuid) from public, anon, authenticated;


-- ===========================================================================
-- checar_limite volta a ser uma pergunta, não uma exceção
-- ===========================================================================

-- Descoberto pelo teste de convite, e vale registrar porque é sutil: uma
-- função que levanta exceção derruba a transação inteira, e a batida que ela
-- acabou de gravar volta atrás junto. Como toda reivindicação malsucedida
-- levantava exceção, o limite de 10 por hora nunca contava nada — justamente
-- no caso para o qual ele existe, que é alguém varrendo tokens.
--
-- A saída é a função devolver o veredito em vez de levantar. Quem falha por
-- outro motivo (create_invite) continua levantando: lá a batida perdida não
-- importa, porque as tentativas que contam são as que criam convite.
drop function public.checar_limite(text, text, integer, interval);

create function public.checar_limite(
  p_acao text,
  p_chave text,
  p_limite integer,
  p_janela interval
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usadas integer;
begin
  select count(*) into v_usadas
  from public.rate_limit_hits as h
  where h.acao = p_acao
    and h.chave = p_chave
    and h.created_at > now() - p_janela;

  if v_usadas >= p_limite then
    return false;
  end if;

  insert into public.rate_limit_hits (acao, chave) values (p_acao, p_chave);
  return true;
end;
$$;

comment on function public.checar_limite(text, text, integer, interval) is
  'Registra uma batida e devolve se ainda cabe. Não levanta: exceção apagaria '
  'a própria batida ao desfazer a transação.';

-- ponytail: contagem sem trava, então uma rajada simultânea pode passar de um.
-- Se virar problema, advisory lock por chave antes do count.

revoke execute on function public.checar_limite(text, text, integer, interval)
  from public, anon, authenticated;

-- Precisa ser reescrita: com "perform" ela ignorava o retorno, e o limite de
-- busca por apelido teria virado enfeite.
create or replace function public.find_by_nickname(p_nickname text)
returns table (display_name text, nickname text, avatar_url text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'É preciso estar autenticado';
  end if;

  -- Aqui levantar é seguro: as buscas que contam são as que dão certo, e
  -- essas commitam. A batida perdida é só a da tentativa que já foi barrada.
  if not public.checar_limite('busca_apelido', v_user_id::text, 20, interval '1 hour') then
    raise exception 'Muitas buscas. Tenta de novo daqui a pouco.' using errcode = '53400';
  end if;

  return query
  select p.display_name, p.nickname, p.avatar_url
  from public.profiles as p
  where p.nickname = nullif(lower(trim(coalesce(p_nickname, ''))), '')
    and p.discoverable_by_nickname
    and p.user_id <> v_user_id;
end;
$$;


-- ===========================================================================
-- create_invite
-- ===========================================================================

-- Devolve o token em claro UMA vez, junto de um código de resultado.
--
-- Devolve em vez de levantar pelo mesmo motivo de claim_invite, e aqui o
-- motivo tem nome: exceção desfaz a transação e leva junto a batida de rate
-- limit. Com "apelido não encontrado" levantando, procurar gente pelo canal
-- de convite viraria enumeração sem limite nenhum — o desvio exato que
-- find_by_nickname existe para fechar.
--
-- O prazo muda por canal porque a exposição muda: e-mail e apelido amarram o
-- convite a alguém, então 72h; link não amarra a ninguém, e vida curta é o que
-- compensa isso.
create function public.create_invite(
  p_channel public.invite_channel,
  p_email text default null,
  p_nickname text default null
)
returns table (resultado text, token text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_couple_id uuid;
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_nickname text := nullif(lower(trim(coalesce(p_nickname, ''))), '');
  v_invited_user_id uuid;
  v_token text;
  v_ttl interval;
begin
  if v_user_id is null then
    raise exception 'É preciso estar autenticado';
  end if;

  v_couple_id := public.meu_casal_id();
  if v_couple_id is null then
    return query select 'sem_plano'::text, null::text;
    return;
  end if;

  if not public.checar_limite('cria_convite', v_couple_id::text, 5, interval '1 hour') then
    return query select 'limite'::text, null::text;
    return;
  end if;

  if public.membros_ativos(v_couple_id) >= 2 then
    return query select 'plano_cheio'::text, null::text;
    return;
  end if;

  if (
    select count(*) from public.couple_invites as c
    where c.couple_id = v_couple_id
      and c.status in ('pending', 'claimed')
      and c.expires_at > now()
  ) >= 3 then
    return query select 'convites_demais'::text, null::text;
    return;
  end if;

  if p_channel = 'email' then
    if v_email is null or position('@' in v_email) < 2 then
      return query select 'email_invalido'::text, null::text;
      return;
    end if;
    if v_email = (select lower(u.email) from auth.users as u where u.id = v_user_id) then
      return query select 'email_proprio'::text, null::text;
      return;
    end if;
    v_ttl := interval '72 hours';

  elsif p_channel = 'nickname' then
    -- Achar alguém por apelido é a mesma pergunta que find_by_nickname faz, e
    -- gasta o mesmo orçamento: senão, criar convites viraria o caminho torto
    -- para varrer apelidos.
    if not public.checar_limite('busca_apelido', v_user_id::text, 20, interval '1 hour') then
      return query select 'limite'::text, null::text;
      return;
    end if;

    select p.user_id into v_invited_user_id
    from public.profiles as p
    where p.nickname = v_nickname
      and p.discoverable_by_nickname
      and p.user_id <> v_user_id;

    if v_invited_user_id is null then
      return query select 'apelido_nao_encontrado'::text, null::text;
      return;
    end if;
    v_ttl := interval '72 hours';

  else
    v_ttl := interval '24 hours';
  end if;

  v_token := public.gerar_token();

  insert into public.couple_invites (
    couple_id, created_by, channel, invited_email, invited_user_id,
    token_hash, expires_at
  )
  values (
    v_couple_id, v_user_id, p_channel,
    case when p_channel = 'email' then v_email end,
    case when p_channel = 'nickname' then v_invited_user_id end,
    public.hash_token(v_token), now() + v_ttl
  );

  return query select 'ok'::text, v_token;
end;
$$;

revoke execute on function public.create_invite(public.invite_channel, text, text)
  from public, anon;
grant execute on function public.create_invite(public.invite_channel, text, text)
  to authenticated;


-- ===========================================================================
-- claim_invite
-- ===========================================================================

-- Reivindicar NÃO concede acesso: só registra que alguém apareceu.
--
-- Devolve um código em vez de levantar exceção, e isso é decisão de segurança,
-- não de estilo: exceção desfaz a transação, e junto com ela a batida de rate
-- limit que acabou de ser gravada. Como toda tentativa malsucedida levantava,
-- o limite de 10 por hora nunca contava nada — exatamente no caso para o qual
-- ele existe, que é alguém varrendo tokens. Devolvendo, a transação commita e
-- a tentativa fica registrada.
--
-- 'indisponivel' cobre token inexistente, vencido, já reivindicado, de canal
-- que não bate e do próprio criador. Qualquer diferença entre esses casos
-- transformaria a tela num oráculo para quem estivesse varrendo.
create function public.claim_invite(p_token text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_email text;
  v_convite public.couple_invites;
  v_meu_casal uuid;
begin
  if v_user_id is null then
    raise exception 'É preciso estar autenticado';
  end if;

  -- Antes da busca, de propósito: varredura gasta orçamento mesmo quando erra.
  if not public.checar_limite('reivindica_convite', v_user_id::text, 10, interval '1 hour') then
    return 'limite';
  end if;

  select * into v_convite
  from public.couple_invites as c
  where c.token_hash = public.hash_token(coalesce(p_token, ''));

  if v_convite.id is null
     or v_convite.status <> 'pending'
     or v_convite.expires_at <= now()
     or v_convite.created_by = v_user_id then
    return 'indisponivel';
  end if;

  select lower(u.email) into v_email from auth.users as u where u.id = v_user_id;

  if v_convite.channel = 'email' and v_convite.invited_email is distinct from v_email then
    return 'indisponivel';
  end if;

  if v_convite.channel = 'nickname' and v_convite.invited_user_id is distinct from v_user_id then
    return 'indisponivel';
  end if;

  if public.is_couple_member(v_convite.couple_id) then
    return 'indisponivel';
  end if;

  -- Daqui para baixo os códigos falam do plano de quem está reivindicando,
  -- então podem ser específicos: não contam nada sobre o convite.
  v_meu_casal := public.meu_casal_id();

  if v_meu_casal is not null and public.membros_ativos(v_meu_casal) >= 2 then
    return 'ja_tem_parceiro';
  end if;

  if v_meu_casal is not null and not public.casal_vazio(v_meu_casal) then
    return 'plano_com_movimentacao';
  end if;

  -- Dois cliques simultâneos disputam esta linha. O perdedor volta sem linha
  -- afetada — trava de linha do Postgres, que é garantia mais forte do que um
  -- índice único conseguiria dar aqui, já que o convite é uma linha só.
  update public.couple_invites
  set status = 'claimed',
      claimed_by_user_id = v_user_id,
      claimed_at = now()
  where id = v_convite.id
    and status = 'pending'
    and expires_at > now();

  if not found then
    return 'indisponivel';
  end if;

  return 'ok';
end;
$$;

revoke execute on function public.claim_invite(text) from public, anon;
grant execute on function public.claim_invite(text) to authenticated;


-- ===========================================================================
-- pending_claim: o que a tela de confirmação mostra
-- ===========================================================================

-- E-mail já mascarado e idade da conta em dias. auth.users não é exposta por
-- policy nenhuma, e o e-mail em claro não tem caminho até o cliente.
create function public.pending_claim()
returns table (
  invite_id uuid,
  channel public.invite_channel,
  display_name text,
  nickname text,
  avatar_url text,
  email_mascarado text,
  conta_criada_ha_dias integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_couple_id uuid := public.meu_casal_id();
begin
  if v_couple_id is null or not public.is_couple_member(v_couple_id) then
    return;
  end if;

  return query
  select
    c.id,
    c.channel,
    p.display_name,
    p.nickname,
    p.avatar_url,
    public.mascarar_email(u.email),
    extract(day from now() - u.created_at)::integer
  from public.couple_invites as c
  join auth.users as u on u.id = c.claimed_by_user_id
  left join public.profiles as p on p.user_id = c.claimed_by_user_id
  where c.couple_id = v_couple_id
    and c.status = 'claimed'
    and c.claimed_at > now() - interval '48 hours'
  order by c.claimed_at;
end;
$$;

revoke execute on function public.pending_claim() from public, anon;
grant execute on function public.pending_claim() to authenticated;


-- ===========================================================================
-- Transições: confirmar, recusar, revogar
-- ===========================================================================

-- O passo que concede acesso. Vínculo, carimbo, revogação dos outros convites
-- e descarte do casal vazio de quem entrou, tudo na mesma transação.
create function public.confirm_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_convite public.couple_invites;
  v_casal_do_novato uuid;
begin
  if v_user_id is null then
    raise exception 'É preciso estar autenticado';
  end if;

  select * into v_convite
  from public.couple_invites as c
  where c.id = p_invite_id
  for update;

  if v_convite.id is null or not public.is_couple_member(v_convite.couple_id) then
    raise exception 'Esse convite não está disponível.';
  end if;

  if v_convite.status <> 'claimed'
     or v_convite.claimed_at <= now() - interval '48 hours'
     or v_convite.claimed_by_user_id is null then
    raise exception 'Esse pedido não está mais valendo. Peça para tentarem de novo.';
  end if;

  if public.membros_ativos(v_convite.couple_id) >= 2 then
    raise exception 'Este plano já é de duas pessoas';
  end if;

  -- Confere de novo: entre reivindicar e confirmar pode ter aparecido dado no
  -- plano de quem entra, e apagar plano com movimentação está fora de questão.
  select m.couple_id into v_casal_do_novato
  from public.couple_members as m
  where m.user_id = v_convite.claimed_by_user_id and m.left_at is null
  order by m.created_at
  limit 1;

  if v_casal_do_novato is not null then
    if public.membros_ativos(v_casal_do_novato) >= 2 then
      raise exception 'Essa pessoa já divide um plano com outra';
    end if;
    if not public.casal_vazio(v_casal_do_novato) then
      raise exception 'O plano dessa pessoa já tem movimentação. Não dá para juntar os dois por aqui.';
    end if;
  end if;

  insert into public.couple_members (couple_id, user_id, role)
  values (v_convite.couple_id, v_convite.claimed_by_user_id, 'parceiro');

  update public.couple_invites
  set status = 'confirmed', confirmed_at = now()
  where id = v_convite.id and status = 'claimed';

  if not found then
    raise exception 'Esse pedido não está mais valendo. Peça para tentarem de novo.';
  end if;

  -- Confirmado um, os outros perdem a razão de existir.
  update public.couple_invites
  set status = 'revoked', revoked_at = now(), claimed_by_user_id = null
  where couple_id = v_convite.couple_id
    and id <> v_convite.id
    and status in ('pending', 'claimed');

  -- O casal solo e vazio de quem entrou é o hard delete do último membro que
  -- o CLAUDE.md já prevê. Cascade leva o couple_members junto.
  if v_casal_do_novato is not null and v_casal_do_novato <> v_convite.couple_id then
    delete from public.couples where id = v_casal_do_novato;
  end if;
end;
$$;

create function public.reject_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_couple_id uuid;
begin
  select c.couple_id into v_couple_id
  from public.couple_invites as c where c.id = p_invite_id;

  if v_couple_id is null or not public.is_couple_member(v_couple_id) then
    raise exception 'Esse convite não está disponível.';
  end if;

  -- claimed_by_user_id sai na hora, não no expurgo: não guardamos dado de
  -- quem não virou membro nem por sete dias.
  update public.couple_invites
  set status = 'rejected', rejected_at = now(), claimed_by_user_id = null
  where id = p_invite_id and status = 'claimed';

  if not found then
    raise exception 'Esse pedido não está mais valendo.';
  end if;
end;
$$;

create function public.revoke_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_couple_id uuid;
begin
  select c.couple_id into v_couple_id
  from public.couple_invites as c where c.id = p_invite_id;

  if v_couple_id is null or not public.is_couple_member(v_couple_id) then
    raise exception 'Esse convite não está disponível.';
  end if;

  update public.couple_invites
  set status = 'revoked', revoked_at = now(), claimed_by_user_id = null
  where id = p_invite_id and status in ('pending', 'claimed');

  if not found then
    raise exception 'Esse convite já não estava em aberto.';
  end if;
end;
$$;

revoke execute on function public.confirm_invite(uuid) from public, anon;
revoke execute on function public.reject_invite(uuid) from public, anon;
revoke execute on function public.revoke_invite(uuid) from public, anon;
grant execute on function public.confirm_invite(uuid) to authenticated;
grant execute on function public.reject_invite(uuid) to authenticated;
grant execute on function public.revoke_invite(uuid) to authenticated;


-- ===========================================================================
-- Expurgo
-- ===========================================================================

-- Convite morto não é histórico útil, é dado pessoal parado.
create function public.expire_and_purge()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.couple_invites
  set status = 'expired'
  where status = 'pending' and expires_at <= now();

  -- Claim sem desfecho em 48h: expira e o dado de quem reivindicou sai junto.
  update public.couple_invites
  set status = 'expired', claimed_by_user_id = null
  where status = 'claimed' and claimed_at <= now() - interval '48 hours';

  delete from public.couple_invites
  where status in ('rejected', 'revoked', 'expired')
    and updated_at <= now() - interval '7 days';

  -- A janela mais longa dos limites é de uma hora; duas horas dá folga.
  delete from public.rate_limit_hits where created_at <= now() - interval '2 hours';
end;
$$;

revoke execute on function public.expire_and_purge() from public, anon, authenticated;

create extension if not exists pg_cron;

select cron.schedule(
  'convites_expurgo',
  '0 * * * *',
  $cron$select public.expire_and_purge()$cron$
);
