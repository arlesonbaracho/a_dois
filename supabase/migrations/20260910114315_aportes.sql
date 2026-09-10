-- Aportes: quem colocou quanto, quando, em qual meta.
--
-- Nenhuma tabela nova — goals, contributions e as policies delas existem desde
-- a migration inicial. O que faltava era caminho de escrita, e ele não pode ser
-- insert direto: o cliente teria que mandar o couple_id no corpo da requisição,
-- e a regra 3 diz que couple_id vem do JWT. Então as duas policies de insert
-- passam a negar, e a escrita vira função security definer, como já acontece
-- com couples e couple_invites.
--
-- De brinde, isso fecha a dívida do user_id: até aqui um membro conseguia
-- registrar aporte atribuído a alguém de fora do casal, porque a policy só
-- olhava o couple_id. Agora o user_id sai de auth.uid() e ninguém escolhe.


-- ===========================================================================
-- Regra de divisão: o terceiro modo
-- ===========================================================================

-- 'fixo' é "cada um coloca um valor combinado". O valor mora em
-- couple_members.fixed_share_cents e serve de peso na divisão.
--
-- add value, e não recriação do tipo, porque o Postgres 17 aceita isso dentro
-- da transação da migration desde que o valor novo não seja USADO aqui. Não é:
-- nenhuma linha, default ou check abaixo menciona 'fixo'.
alter type public.split_rule add value 'fixo';

alter table public.couple_members
  add column fixed_share_cents bigint
  check (fixed_share_cents is null or fixed_share_cents >= 0);

comment on column public.couple_members.fixed_share_cents is
  'Quanto esta pessoa combinou de colocar, em centavos. Só o modo fixo lê. '
  'Nulo é "ainda não disse" — e o modo fixo fica indisponível até dizer.';


-- ===========================================================================
-- leave_couple aprende a apagar mais uma coisa
-- ===========================================================================

-- Quanto uma pessoa se comprometeu a colocar por mês é informação financeira
-- dela. A pseudonimização tem que levar junto, na mesma linha de display_name e
-- income_band. O resto da função é idêntico ao de 20260910112108.
create or replace function public.leave_couple(p_confirmo_apagar boolean default false)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_couple_id uuid;
  v_email text;
  v_restantes integer;
begin
  if v_user_id is null then
    raise exception 'É preciso estar autenticado';
  end if;

  v_couple_id := public.meu_casal_id();
  if v_couple_id is null then
    return 'sem_plano';
  end if;

  -- Freio de mão. Apagar o plano é irreversível e leva metas, itens, aportes e
  -- histórico de preço junto; uma tela com bug não faz isso por acidente.
  if public.membros_ativos(v_couple_id) = 1 and not coalesce(p_confirmo_apagar, false) then
    return 'precisa_confirmar_apagar';
  end if;

  select lower(u.email) into v_email from auth.users as u where u.id = v_user_id;

  -- 1. A saída em si. Daqui em diante o RLS já não devolve nada para ela.
  update public.couple_members
  set left_at = now(),
      display_name = null,
      income_band = null,
      fixed_share_cents = null
  where couple_id = v_couple_id
    and user_id = v_user_id
    and left_at is null;

  if not found then
    return 'sem_plano';
  end if;

  -- 2. Os aportes ficam, com o valor intacto; quem aportou vira "ex-membro".
  update public.contributions
  set user_id = null
  where couple_id = v_couple_id and user_id = v_user_id;

  -- 3. Convite ativo criado por quem saiu não sobrevive à saída: quem
  --    autorizaria a confirmação não está mais aqui.
  update public.couple_invites
  set status = 'revoked',
      revoked_at = now(),
      claimed_by_user_id = null,
      created_by = null
  where couple_id = v_couple_id
    and created_by = v_user_id
    and status in ('pending', 'claimed');

  -- 4. O e-mail dela é a única cópia de dado pessoal que o casal guardava fora
  --    de couple_members. Apagar a linha em vez de anular a coluna porque o
  --    check de coerência exige invited_email não-nulo quando o canal é
  --    'email' — e porque convite morto é dado parado, não histórico útil.
  delete from public.couple_invites
  where couple_id = v_couple_id
    and (
      lower(invited_email) = v_email
      or invited_user_id = v_user_id
      or claimed_by_user_id = v_user_id
    );

  -- 5. Sessões. Ver a ressalva do cabeçalho da migration da saída sobre o JWT.
  delete from auth.sessions where user_id = v_user_id;

  -- 6. Último a sair apaga a luz. As contributions saem à mão porque a FK
  --    goal_id é "on delete restrict" de propósito, e bloquearia o cascade.
  select public.membros_ativos(v_couple_id) into v_restantes;

  if v_restantes = 0 then
    delete from public.contributions where couple_id = v_couple_id;
    delete from public.couples where id = v_couple_id;
  end if;

  -- 7. E ela volta a ter um plano só dela. Mantém o invariante que a trigger
  --    de cadastro criou — todo mundo tem um plano — e é dele que claim_invite
  --    depende para deixar alguém entrar em outro casal.
  perform public.create_couple_for(v_user_id);

  return case when v_restantes = 0 then 'plano_apagado' else 'ok' end;
end;
$$;

comment on function public.leave_couple(boolean) is
  'Sai do casal, pseudonimizando quem saiu. Apaga o plano só no último membro, '
  'e só com confirmação explícita.';


-- ===========================================================================
-- Insert direto passa a negar
-- ===========================================================================

-- Não é endurecimento decorativo: a policy antiga aceitava o couple_id vindo do
-- corpo da requisição e apenas conferia se ele era um dos seus. Funciona contra
-- IDOR, mas deixa o cliente escolher qual dos seus casais recebe a linha, e
-- deixa contributions.user_id ser qualquer uuid. As funções abaixo tiram as
-- duas escolhas da mão do cliente.
--
-- Update e delete continuam abertos ao casal de propósito: corrigir e apagar
-- meta ou aporte é coisa que os dois fazem, e não passa por couple_id novo.

drop policy goals_insert on public.goals;
create policy goals_insert on public.goals
  for insert to authenticated
  with check (false);

drop policy contributions_insert on public.contributions;
create policy contributions_insert on public.contributions
  for insert to authenticated
  with check (false);


-- ===========================================================================
-- add_goal
-- ===========================================================================

-- A meta mínima que os aportes precisam ter em que se pendurar: título e valor
-- alvo. Categoria, prioridade e prazo entram com a tela de metas de verdade.
create function public.add_goal(
  p_title text,
  p_target_amount_cents bigint default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_couple_id uuid := public.meu_casal_id();
  v_title text := trim(coalesce(p_title, ''));
  v_goal_id uuid;
begin
  if v_couple_id is null then
    raise exception 'Você ainda não tem um plano por aqui';
  end if;

  if length(v_title) < 1 or length(v_title) > 120 then
    raise exception 'O nome da meta precisa ter de 1 a 120 letras';
  end if;

  if coalesce(p_target_amount_cents, 0) < 0 then
    raise exception 'O valor da meta não pode ser negativo';
  end if;

  insert into public.goals (couple_id, title, category, target_amount_cents)
  values (v_couple_id, v_title, 'geral', coalesce(p_target_amount_cents, 0))
  returning id into v_goal_id;

  return v_goal_id;
end;
$$;

comment on function public.add_goal(text, bigint) is
  'Cria meta no casal de quem chamou. O couple_id sai do JWT, nunca do corpo.';

revoke execute on function public.add_goal(text, bigint) from public, anon;
grant execute on function public.add_goal(text, bigint) to authenticated;


-- ===========================================================================
-- add_contribution
-- ===========================================================================

-- Único caminho de registro de aporte. As duas colunas que importam para
-- segurança saem do JWT: couple_id de meu_casal_id(), user_id de auth.uid().
-- O cliente escolhe a meta, o valor e a data, e mais nada.
create function public.add_contribution(
  p_goal_id uuid,
  p_amount_cents bigint,
  p_contributed_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_couple_id uuid := public.meu_casal_id();
  v_contribution_id uuid;
begin
  if v_user_id is null or v_couple_id is null then
    raise exception 'Você ainda não tem um plano por aqui';
  end if;

  if coalesce(p_amount_cents, 0) <= 0 then
    raise exception 'O valor precisa ser maior que zero';
  end if;

  -- A meta tem que ser do casal de quem chamou. Sem esta checagem, a função
  -- definer devolveria pela janela o IDOR que a policy fecha pela porta: a FK
  -- composta recusaria a linha, mas com erro de constraint em vez de recusa
  -- nossa, e depender de qual erro o banco levanta é depender de sorte.
  if not exists (
    select 1 from public.goals as g
    where g.id = p_goal_id and g.couple_id = v_couple_id
  ) then
    raise exception 'Essa meta não é do plano de vocês';
  end if;

  insert into public.contributions (couple_id, goal_id, user_id, amount_cents, contributed_at)
  values (v_couple_id, p_goal_id, v_user_id, p_amount_cents, coalesce(p_contributed_at, now()))
  returning id into v_contribution_id;

  return v_contribution_id;
end;
$$;

comment on function public.add_contribution(uuid, bigint, timestamptz) is
  'Registra aporte. couple_id e user_id saem do JWT; o cliente não escolhe nem um nem outro.';

revoke execute on function public.add_contribution(uuid, bigint, timestamptz) from public, anon;
grant execute on function public.add_contribution(uuid, bigint, timestamptz) to authenticated;
