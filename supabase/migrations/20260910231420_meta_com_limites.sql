-- Meta ganha teto de valor e recusa prazo que já passou.
--
-- Achado 4 da auditoria de 2026-09-10: dava para criar meta de R$ 90 trilhões
-- e com prazo em 2020, sem nada recusar.
--
-- As duas regras entram em lugares DIFERENTES de propósito, e o motivo é o que
-- o relatório tinha errado: editar meta não passa por add_goal. `salvarMeta`
-- faz update direto pelo PostgREST, então uma condição só dentro da função
-- consertaria a criação e deixaria a edição aberta.


-- ===========================================================================
-- Teto de valor: constraint, porque vale para os DOIS caminhos
-- ===========================================================================

-- R$ 100.000.000,00. Acima de qualquer meta de casal, e abaixo de qualquer
-- dedo escorregado — que é o caso real: ninguém quer juntar noventa trilhões,
-- mas é fácil digitar zeros demais, e o número quebra a tela de quem digitou.
--
-- Constraint, e não condição em add_goal: cobre insert e update, é o banco que
-- garante, e não existe caminho de escrita que passe por fora.
alter table public.goals
  add constraint goals_target_amount_cents_teto
  check (target_amount_cents <= 10000000000);

comment on constraint goals_target_amount_cents_teto on public.goals is
  'Teto de R$ 100 milhões. Existe contra erro de digitação, não contra ambição.';


-- ===========================================================================
-- Prazo no passado: só na criação, e isso é decisão, não descuido
-- ===========================================================================

-- Meta com prazo vencido é estado LEGÍTIMO: a data chega e a meta continua
-- lá, esperando. Uma regra que valesse também no update tornaria essa meta
-- impossível de editar — trocar o título de uma meta vencida passaria a
-- falhar, o que é defeito pior do que o que estamos consertando aqui.
--
-- Por isso a condição fica em add_goal, e não em constraint nem em gatilho.
-- E é current_date, não now(): quem cria uma meta para hoje de manhã não pode
-- ser recusado à tarde.
create or replace function public.add_goal(
  p_title text,
  p_target_amount_cents bigint default 0,
  p_category text default 'geral',
  p_deadline_at timestamptz default null,
  p_priority public.goal_priority default 'media'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_couple_id uuid := public.meu_casal_id();
  v_title text := trim(coalesce(p_title, ''));
  v_category text := nullif(trim(coalesce(p_category, '')), '');
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

  if p_deadline_at is not null and p_deadline_at < current_date then
    raise exception 'Esse prazo já passou. Escolhe uma data daqui pra frente?';
  end if;

  insert into public.goals
    (couple_id, title, category, target_amount_cents, deadline_at, priority)
  values (
    v_couple_id,
    v_title,
    coalesce(v_category, 'geral'),
    coalesce(p_target_amount_cents, 0),
    p_deadline_at,
    coalesce(p_priority, 'media')
  )
  returning id into v_goal_id;

  return v_goal_id;
end;
$$;

comment on function public.add_goal(text, bigint, text, timestamptz, public.goal_priority) is
  'Cria meta no casal de quem chamou. O couple_id sai do JWT, nunca do corpo.';
