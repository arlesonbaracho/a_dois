-- Perfil público mínimo, e o contador de tentativas que o convite vai usar.
--
-- O perfil existe por causa da tela de confirmação do parceiro: quem convidou
-- precisa reconhecer quem apareceu do outro lado, e para isso precisa de um
-- nome. Nome de pessoa não pode sair de auth.users, então mora aqui.
--
-- O nickname é pseudônimo escolhido, nunca identidade: é opcional, é único, e
-- é conferido contra o prefixo do próprio e-mail para não virar vazamento de
-- e-mail com outro nome.


-- ===========================================================================
-- rate_limit_hits: um mecanismo para os três limites do fluxo de convite
-- ===========================================================================

-- Busca por apelido e tentativa de claim malsucedida não deixam linha em lugar
-- nenhum — não dá para contar linhas existentes como se faz com convites. Uma
-- tabela de batidas resolve os três casos com uma função só.
--
-- Não tem couple_id, e não teria sentido ter: a chave às vezes é uma pessoa,
-- às vezes um casal. Mesma exceção já registrada para couples, cujo id É o
-- couple_id. O escopo aqui é mais estreito que RLS: o cliente não alcança esta
-- tabela por caminho nenhum.
create table public.rate_limit_hits (
  id bigint generated always as identity primary key,
  acao text not null,
  chave text not null,
  created_at timestamptz not null default now()
);

comment on table public.rate_limit_hits is
  'Batidas de rate limit. Dado pessoal de vida curta: expurgado de hora em hora.';

create index rate_limit_hits_janela_idx
  on public.rate_limit_hits (acao, chave, created_at desc);

alter table public.rate_limit_hits enable row level security;

-- Nenhuma policy, de propósito: com RLS ligado e zero policies, authenticated
-- e anon enxergam zero linhas e não escrevem nenhuma. Só as funções security
-- definer abaixo entram aqui. O revoke tira até o grant que o
-- "alter default privileges" do Supabase concede sozinho.
revoke all on public.rate_limit_hits from anon, authenticated;

create function public.checar_limite(
  p_acao text,
  p_chave text,
  p_limite integer,
  p_janela interval
)
returns void
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
    -- 53400 = configuration_limit_exceeded. O chamador distingue "excedeu" de
    -- "deu errado" pelo código, sem depender do texto da mensagem.
    raise exception 'Muitas tentativas. Tenta de novo daqui a pouco.'
      using errcode = '53400';
  end if;

  insert into public.rate_limit_hits (acao, chave) values (p_acao, p_chave);
end;
$$;

comment on function public.checar_limite(text, text, integer, interval) is
  'Conta e registra uma batida. Levanta 53400 quando estoura o limite.';

-- ponytail: contagem sem trava, então uma rajada simultânea pode passar de um.
-- Se virar problema, advisory lock por chave antes do count.

revoke execute on function public.checar_limite(text, text, integer, interval)
  from public, anon, authenticated;


-- ===========================================================================
-- profiles
-- ===========================================================================

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or length(display_name) between 1 and 80),
  -- O formato mora no check, e não só na função que grava: assim vale para
  -- qualquer caminho de escrita que exista amanhã. Minúsculas no próprio
  -- formato tornam a unicidade case-insensitive sem puxar citext.
  nickname text unique check (nickname is null or nickname ~ '^[a-z0-9_]{3,20}$'),
  avatar_url text,
  discoverable_by_nickname boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.nickname is
  'Pseudônimo escolhido, opcional. Nunca pode ser igual ao prefixo do e-mail.';
comment on column public.profiles.avatar_url is
  'Reservado. Ninguém grava ainda: URL livre faria o navegador de quem confirma '
  'buscar endereço escolhido por terceiro. Entra quando o Storage entrar.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Leitura: a própria linha, e a de quem divide casal com você.
--
-- Não existe policy de leitura ampla de propósito. RLS filtra linha, não
-- coluna: liberar profiles para todo autenticado devolveria "select nickname
-- from profiles", isto é, a lista de todo mundo que usa o app — exatamente a
-- enumeração que a busca por apelido evita. Quem procura alguém por apelido
-- usa find_by_nickname, que devolve no máximo uma linha e três colunas.
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.couple_members as m
      where m.user_id = profiles.user_id
        and m.left_at is null
        and public.is_couple_member(m.couple_id)
    )
  );

-- Escrita direta negada nas três, por escrito. A linha nasce da trigger de
-- cadastro e só muda por set_profile, que é onde moram as regras de apelido
-- reservado e de apelido igual ao e-mail. Policy permissiva aqui deixaria
-- gravar apelido "suporte" pela porta lateral.
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (false);

create policy profiles_update on public.profiles
  for update to authenticated
  using (false)
  with check (false);

create policy profiles_delete on public.profiles
  for delete to authenticated
  using (false);


-- ===========================================================================
-- set_profile: o único caminho de escrita
-- ===========================================================================

create function public.set_profile(
  p_display_name text,
  p_nickname text,
  p_discoverable boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_nickname text := nullif(lower(trim(coalesce(p_nickname, ''))), '');
  v_prefixo text;
begin
  if v_user_id is null then
    raise exception 'É preciso estar autenticado';
  end if;

  if v_nickname is not null then
    if v_nickname !~ '^[a-z0-9_]{3,20}$' then
      raise exception 'O apelido vai de 3 a 20 caracteres, com letras minúsculas, números e _';
    end if;

    if v_nickname = any (array[
      'admin', 'administrador', 'moderador', 'suporte', 'ajuda', 'contato',
      'oficial', 'equipe', 'time', 'sistema', 'seguranca', 'financeiro',
      'root', 'api', 'www', 'adois', 'null', 'undefined'
    ]) then
      raise exception 'Esse apelido é reservado. Escolhe outro?';
    end if;

    -- Só esta função enxerga auth.users, então a conferência mora aqui.
    -- Apelido igual ao começo do e-mail transformaria o pseudônimo em pista
    -- do endereço — o contrário do que ele existe para fazer.
    select lower(split_part(coalesce(u.email, ''), '@', 1)) into v_prefixo
    from auth.users as u
    where u.id = v_user_id;

    if v_nickname = v_prefixo then
      raise exception 'Esse apelido entrega seu e-mail. Escolhe outro?';
    end if;
  end if;

  update public.profiles
  set display_name = nullif(trim(coalesce(p_display_name, '')), ''),
      nickname = v_nickname,
      discoverable_by_nickname = coalesce(p_discoverable, true)
  where user_id = v_user_id;

  if not found then
    raise exception 'Perfil não encontrado';
  end if;
exception
  when unique_violation then
    raise exception 'Esse apelido já é de outra pessoa. Escolhe outro?';
end;
$$;

comment on function public.set_profile(text, text, boolean) is
  'Grava o próprio perfil. Único caminho de escrita em profiles.';

revoke execute on function public.set_profile(text, text, boolean) from public, anon;
grant execute on function public.set_profile(text, text, boolean) to authenticated;


-- ===========================================================================
-- find_by_nickname: match exato, e só
-- ===========================================================================

-- Sem like, sem prefixo, sem listagem, sem autocomplete. Busca parcial é
-- ferramenta de enumeração: com ela, alguém varre o app inteiro atrás de quem
-- existe. Igualdade devolve exatamente uma pessoa ou nenhuma.
--
-- Quem desligou discoverable_by_nickname responde como se não existisse — nem
-- "existe mas não quer", que já seria informação.
create function public.find_by_nickname(p_nickname text)
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

  perform public.checar_limite('busca_apelido', v_user_id::text, 20, interval '1 hour');

  return query
  select p.display_name, p.nickname, p.avatar_url
  from public.profiles as p
  where p.nickname = nullif(lower(trim(coalesce(p_nickname, ''))), '')
    and p.discoverable_by_nickname
    and p.user_id <> v_user_id;
end;
$$;

comment on function public.find_by_nickname(text) is
  'Procura uma pessoa pelo apelido exato. Devolve três colunas, nunca o e-mail.';

revoke execute on function public.find_by_nickname(text) from public, anon;
grant execute on function public.find_by_nickname(text) to authenticated;


-- ===========================================================================
-- A trigger de cadastro passa a criar o perfil junto
-- ===========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.create_couple_for(new.id);

  -- Linha vazia: o nome e o apelido são escolha da pessoa, não coleta nossa.
  insert into public.profiles (user_id) values (new.id);

  return new;
end;
$$;
