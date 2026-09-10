-- Esquema inicial do A DOIS.
--
-- A anon key fica embarcada no cliente, então RLS é a única fronteira entre o
-- plano financeiro de um casal e a internet. Toda tabela aqui tem couple_id,
-- RLS habilitado e as quatro policies, sempre comparando contra a lista de
-- casais do auth.uid().
--
-- Nenhuma tabela usa "force row level security" de propósito: as funções
-- security definer abaixo rodam como dona das tabelas e precisam desse desvio.
-- Elas são o único caminho que ignora RLS, e cada uma está comentada.
--
-- As policies são todas "to authenticated". O papel anon tem grant nas tabelas
-- mas nenhuma policy, o que já significa zero linhas e zero escrita.


-- ===========================================================================
-- Tipos
-- ===========================================================================

create type public.couple_role as enum ('dono', 'parceiro');

create type public.split_rule as enum ('igual', 'proporcional');

-- Faixa, nunca o valor exato: minimização de dado (LGPD, Art. 6º, III).
create type public.income_band as enum (
  'ate_2_sm',
  'de_2_a_5_sm',
  'de_5_a_10_sm',
  'acima_10_sm'
);

-- Estes dois espelham os enums de packages/core/src/schemas.ts.
create type public.goal_priority as enum ('baixa', 'media', 'alta');

create type public.goal_item_status as enum ('desejado', 'pesquisando', 'comprado');


-- ===========================================================================
-- Gatilho de updated_at
-- ===========================================================================

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Mantém updated_at sem depender de o cliente lembrar de mandar.';


-- ===========================================================================
-- Tabelas
-- ===========================================================================

-- O espaço compartilhado. Não tem coluna couple_id porque o id dela É o
-- couple_id de todo o resto do schema.
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Vínculo pessoa <-> casal. display_name, income_band e o vínculo com
-- auth.users são o que a saída do casal pseudonimiza (left_at preenchido,
-- nome e faixa de renda apagados).
create table public.couple_members (
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.couple_role not null default 'parceiro',
  split_rule public.split_rule not null default 'igual',
  income_band public.income_band,
  is_adult boolean not null default true,
  display_name text check (display_name is null or length(display_name) between 1 and 80),
  left_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

comment on column public.couple_members.is_adult is
  'Guardamos o booleano, nunca a data de nascimento.';
comment on column public.couple_members.income_band is
  'Faixa e opcional. O valor exato da renda não é coletado.';

-- Convite pendente. O token em claro nunca toca o banco: só o hash.
create table public.couple_invites (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  token_hash text not null unique,
  invited_email text not null check (position('@' in invited_email) > 1),
  invited_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz not null default now() + interval '72 hours',
  used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.couple_invites.token_hash is
  'Hash do token de convite. Vazamento do banco não vira convite utilizável.';

-- Um convite pendente por e-mail por casal. Os usados ficam no histórico.
create unique index couple_invites_pendente_por_email_idx
  on public.couple_invites (couple_id, lower(invited_email))
  where used_at is null;

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null check (length(title) between 1 and 120),
  category text not null check (length(category) between 1 and 40),
  target_amount_cents bigint not null default 0 check (target_amount_cents >= 0),
  deadline_at timestamptz,
  priority public.goal_priority not null default 'media',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Alvo da chave estrangeira composta dos filhos.
  unique (id, couple_id)
);

-- A FK composta (goal_id, couple_id) é o que impede um item de apontar para a
-- meta de outro casal. Constraint do banco, não checagem em código.
create table public.goal_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null,
  goal_id uuid not null,
  name text not null check (length(name) between 1 and 120),
  estimated_price_cents bigint check (estimated_price_cents >= 0),
  status public.goal_item_status not null default 'desejado',
  url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (goal_id, couple_id)
    references public.goals (id, couple_id) on delete cascade,
  unique (id, couple_id)
);

-- on delete restrict de propósito: meta com aporte não some por engano e leva
-- o histórico de dinheiro junto. Para apagar, os aportes saem antes.
create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  goal_id uuid not null,
  user_id uuid references auth.users (id) on delete set null,
  amount_cents bigint not null check (amount_cents > 0),
  contributed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (goal_id, couple_id)
    references public.goals (id, couple_id) on delete restrict
);

comment on column public.contributions.user_id is
  'Nulo quando quem aportou saiu do casal: o aporte vira "ex-membro".';

-- Histórico de preço. Append-only: as policies de update e delete negam.
-- Sem updated_at, porque linha nenhuma aqui muda.
create table public.price_quotes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null,
  goal_item_id uuid not null,
  price_cents bigint not null check (price_cents >= 0),
  source_url text not null,
  created_at timestamptz not null default now(),
  foreign key (goal_item_id, couple_id)
    references public.goal_items (id, couple_id) on delete cascade
);


-- ===========================================================================
-- Índices: toda foreign key e todo couple_id
-- ===========================================================================

-- couple_members não precisa de índice em couple_id: a PK (couple_id, user_id)
-- já começa por ele. user_id é por onde is_couple_member procura.
create index couple_members_user_id_idx on public.couple_members (user_id);

create index couple_invites_couple_id_idx on public.couple_invites (couple_id);
create index couple_invites_invited_by_idx on public.couple_invites (invited_by);

create index goals_couple_id_idx on public.goals (couple_id);

create index goal_items_couple_id_idx on public.goal_items (couple_id);
create index goal_items_goal_id_idx on public.goal_items (goal_id);

create index contributions_couple_id_idx on public.contributions (couple_id);
create index contributions_goal_id_idx on public.contributions (goal_id);
create index contributions_user_id_idx on public.contributions (user_id);

create index price_quotes_couple_id_idx on public.price_quotes (couple_id);
-- O acesso real é "histórico deste item, mais recente primeiro".
create index price_quotes_item_recente_idx
  on public.price_quotes (goal_item_id, created_at desc);


-- ===========================================================================
-- Triggers de updated_at
-- ===========================================================================

create trigger couples_set_updated_at
  before update on public.couples
  for each row execute function public.set_updated_at();

create trigger couple_members_set_updated_at
  before update on public.couple_members
  for each row execute function public.set_updated_at();

create trigger couple_invites_set_updated_at
  before update on public.couple_invites
  for each row execute function public.set_updated_at();

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

create trigger goal_items_set_updated_at
  before update on public.goal_items
  for each row execute function public.set_updated_at();

create trigger contributions_set_updated_at
  before update on public.contributions
  for each row execute function public.set_updated_at();


-- ===========================================================================
-- is_couple_member: a única pergunta que toda policy faz
-- ===========================================================================

-- security definer, e não invoker, por necessidade técnica: a policy de
-- couple_members chama esta função, que lê couple_members, que reavalia a
-- policy. Em invoker isso é recursão e o Postgres aborta com 42P17. Como
-- definer, a função roda como dona da tabela e RLS não reaplica lá dentro.
--
-- Endurecimento que vem junto do definer:
--   set search_path = ''  -> ninguém sequestra a resolução de nomes
--   tudo schema-qualificado
--   execute revogado de public, concedido só a authenticated
--
-- O (select auth.uid()) entre parênteses é avaliado uma vez por consulta em
-- vez de uma vez por linha.
create function public.is_couple_member(couple_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.couple_members as m
    where m.couple_id = is_couple_member.couple_id
      and m.user_id = (select auth.uid())
      and m.left_at is null
  );
$$;

comment on function public.is_couple_member(uuid) is
  'Responde se o usuário autenticado é membro ativo do casal informado.';

revoke execute on function public.is_couple_member(uuid) from public;
grant execute on function public.is_couple_member(uuid) to authenticated;


-- ===========================================================================
-- create_couple: o caminho de entrada
-- ===========================================================================

-- Sem esta função ninguém cria um casal: no instante do insert em couples o
-- usuário ainda não é membro de nada, então a policy de insert nega — e ela
-- está certa em negar. A criação do casal e do primeiro membro acontece aqui,
-- na mesma transação, com o couple_id saindo do banco e o user_id do JWT.
-- Nada vem do corpo da requisição.
create function public.create_couple()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_couple_id uuid;
begin
  if v_user_id is null then
    raise exception 'É preciso estar autenticado para criar um casal';
  end if;

  insert into public.couples default values returning id into v_couple_id;

  insert into public.couple_members (couple_id, user_id, role)
  values (v_couple_id, v_user_id, 'dono');

  return v_couple_id;
end;
$$;

comment on function public.create_couple() is
  'Cria um casal e coloca quem chamou como dono. Único caminho de criação.';

revoke execute on function public.create_couple() from public;
grant execute on function public.create_couple() to authenticated;


-- ===========================================================================
-- RLS
-- ===========================================================================

alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.couple_invites enable row level security;
alter table public.goals enable row level security;
alter table public.goal_items enable row level security;
alter table public.contributions enable row level security;
alter table public.price_quotes enable row level security;


-- --------------------------------------------------------------------------
-- couples — o id da linha é o próprio couple_id
-- --------------------------------------------------------------------------

-- Cada pessoa enxerga só os casais de que participa. Sem isto, a anon key
-- listaria todos os casais da base.
create policy couples_select on public.couples
  for select to authenticated
  using (public.is_couple_member(id));

-- Insert direto é sempre negado: no momento do insert o usuário ainda não é
-- membro, então a checagem dá falso. Criar casal é via create_couple().
create policy couples_insert on public.couples
  for insert to authenticated
  with check (public.is_couple_member(id));

-- Só membro altera o próprio casal. As duas pontas são checadas para que a
-- linha não possa ser reapontada para um casal alheio durante o update.
create policy couples_update on public.couples
  for update to authenticated
  using (public.is_couple_member(id))
  with check (public.is_couple_member(id));

-- Apagar o casal é privilégio de quem está dentro dele.
create policy couples_delete on public.couples
  for delete to authenticated
  using (public.is_couple_member(id));


-- --------------------------------------------------------------------------
-- couple_members
-- --------------------------------------------------------------------------

-- Membro enxerga a si e ao parceiro — é o que permite mostrar nome, papel e
-- regra de divisão do outro. Ninguém de fora enxerga o vínculo.
create policy couple_members_select on public.couple_members
  for select to authenticated
  using (public.is_couple_member(couple_id));

-- Entrada de novo membro só dentro de um casal do próprio usuário. O fluxo de
-- aceitar convite não passa por aqui: roda em Edge Function com service role,
-- porque o convidado ainda não é membro quando aceita.
create policy couple_members_insert on public.couple_members
  for insert to authenticated
  with check (public.is_couple_member(couple_id));

-- Editar papel, regra de divisão ou faixa de renda, e marcar left_at na saída.
-- As duas pontas impedem mover o vínculo para outro casal.
create policy couple_members_update on public.couple_members
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

-- Remover vínculo só de dentro do casal. A saída normal pseudonimiza em vez
-- de apagar; o delete existe para o hard delete do último membro.
create policy couple_members_delete on public.couple_members
  for delete to authenticated
  using (public.is_couple_member(couple_id));


-- --------------------------------------------------------------------------
-- couple_invites
-- --------------------------------------------------------------------------

-- Só quem já é do casal vê os convites pendentes. O convidado não enxerga
-- nada por aqui: ele chega com o token, que é conferido no servidor.
create policy couple_invites_select on public.couple_invites
  for select to authenticated
  using (public.is_couple_member(couple_id));

-- Convidar alguém para um casal que não é o seu fica barrado na origem.
create policy couple_invites_insert on public.couple_invites
  for insert to authenticated
  with check (public.is_couple_member(couple_id));

-- Marcar used_at ou reemitir prazo, sempre dentro do próprio casal.
create policy couple_invites_update on public.couple_invites
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

-- Cancelar convite é coisa de quem está dentro do casal.
create policy couple_invites_delete on public.couple_invites
  for delete to authenticated
  using (public.is_couple_member(couple_id));


-- --------------------------------------------------------------------------
-- goals
-- --------------------------------------------------------------------------

-- As metas do casal, e só elas.
create policy goals_select on public.goals
  for select to authenticated
  using (public.is_couple_member(couple_id));

-- O couple_id da meta nova é conferido contra a lista do auth.uid(). Mandar
-- um couple_id qualquer no corpo da requisição não adianta nada.
create policy goals_insert on public.goals
  for insert to authenticated
  with check (public.is_couple_member(couple_id));

-- Editar meta do próprio casal. O with check impede que um update mova a meta
-- (e todos os itens e aportes pendurados nela) para outro casal.
create policy goals_update on public.goals
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

-- Apagar meta do próprio casal. Meta com aporte é barrada pela FK restrict.
create policy goals_delete on public.goals
  for delete to authenticated
  using (public.is_couple_member(couple_id));


-- --------------------------------------------------------------------------
-- goal_items
-- --------------------------------------------------------------------------

-- Itens das metas do casal. A FK composta já garante que item e meta são do
-- mesmo casal; esta policy garante que o casal é o seu.
create policy goal_items_select on public.goal_items
  for select to authenticated
  using (public.is_couple_member(couple_id));

-- Item novo só em casal seu.
create policy goal_items_insert on public.goal_items
  for insert to authenticated
  with check (public.is_couple_member(couple_id));

-- Mudar nome, preço estimado, status ou URL escolhida, dentro do casal.
create policy goal_items_update on public.goal_items
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

-- Apagar item do próprio casal. Leva junto o histórico de preço dele.
create policy goal_items_delete on public.goal_items
  for delete to authenticated
  using (public.is_couple_member(couple_id));


-- --------------------------------------------------------------------------
-- contributions
-- --------------------------------------------------------------------------

-- Quanto cada um aportou é visível para os dois: o plano é compartilhado.
create policy contributions_select on public.contributions
  for select to authenticated
  using (public.is_couple_member(couple_id));

-- Registrar aporte só no próprio casal.
create policy contributions_insert on public.contributions
  for insert to authenticated
  with check (public.is_couple_member(couple_id));

-- Corrigir valor ou data do aporte, dentro do casal. As duas pontas impedem
-- que um aporte seja empurrado para o casal do lado.
create policy contributions_update on public.contributions
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

-- Apagar aporte do próprio casal.
create policy contributions_delete on public.contributions
  for delete to authenticated
  using (public.is_couple_member(couple_id));


-- --------------------------------------------------------------------------
-- price_quotes — append-only
-- --------------------------------------------------------------------------

-- Histórico de preço dos itens do casal.
create policy price_quotes_select on public.price_quotes
  for select to authenticated
  using (public.is_couple_member(couple_id));

-- Novo preço observado, sempre em item do próprio casal.
create policy price_quotes_insert on public.price_quotes
  for insert to authenticated
  with check (public.is_couple_member(couple_id));

-- Negação explícita: histórico de preço não se reescreve. A policy existe
-- para que a proibição esteja escrita, em vez de ser ausência de policy.
create policy price_quotes_update on public.price_quotes
  for update to authenticated
  using (false)
  with check (false);

-- Negação explícita: histórico de preço não se apaga. Expurgo por retenção,
-- quando existir, roda em rotina do servidor, fora do alcance do cliente.
create policy price_quotes_delete on public.price_quotes
  for delete to authenticated
  using (false);
