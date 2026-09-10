-- Metas e itens: o núcleo, e o Realtime que faz o plano ser compartilhado.
--
-- goals e goal_items existem desde a migration inicial. O que entra aqui é o
-- caminho de escrita completo — e ele segue a mesma regra das outras três
-- tabelas de conteúdo: insert é função security definer, porque insert direto
-- exigiria o couple_id no corpo da requisição (regra 3).
--
-- goal_items é a última das quatro a fechar. Com esta migration, nenhuma tabela
-- de conteúdo do schema aceita insert direto.


-- ===========================================================================
-- add_goal cresce
-- ===========================================================================

-- A versão de duas colunas nasceu de carona no prompt 8, para os aportes terem
-- onde se pendurar, e estava escrita como provisória. Agora a meta tem tela, e
-- categoria, prazo e prioridade deixam de ser enfeite no schema.
drop function public.add_goal(text, bigint);

create function public.add_goal(
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

revoke execute on function
  public.add_goal(text, bigint, text, timestamptz, public.goal_priority)
  from public, anon;
grant execute on function
  public.add_goal(text, bigint, text, timestamptz, public.goal_priority)
  to authenticated;


-- ===========================================================================
-- goal_items fecha o insert direto e ganha a sua função
-- ===========================================================================

drop policy goal_items_insert on public.goal_items;

create policy goal_items_insert on public.goal_items
  for insert to authenticated
  with check (false);

create function public.add_goal_item(
  p_goal_id uuid,
  p_name text,
  p_estimated_price_cents bigint default null,
  p_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_couple_id uuid := public.meu_casal_id();
  v_name text := trim(coalesce(p_name, ''));
  v_url text := nullif(trim(coalesce(p_url, '')), '');
  v_item_id uuid;
begin
  if v_couple_id is null then
    raise exception 'Você ainda não tem um plano por aqui';
  end if;

  if length(v_name) < 1 or length(v_name) > 120 then
    raise exception 'O nome do item precisa ter de 1 a 120 letras';
  end if;

  if coalesce(p_estimated_price_cents, 0) < 0 then
    raise exception 'O preço estimado não pode ser negativo';
  end if;

  -- A URL vira link clicável numa tela nossa. javascript: guardado hoje é
  -- clique amanhã — mesma peneira de add_price_quote.
  if v_url is not null and (v_url !~* '^https?://' or length(v_url) > 2000) then
    raise exception 'O link do item precisa começar com http ou https';
  end if;

  if not exists (
    select 1 from public.goals as g
    where g.id = p_goal_id and g.couple_id = v_couple_id
  ) then
    raise exception 'Essa meta não é do plano de vocês';
  end if;

  insert into public.goal_items (couple_id, goal_id, name, estimated_price_cents, url)
  values (v_couple_id, p_goal_id, v_name, p_estimated_price_cents, v_url)
  returning id into v_item_id;

  return v_item_id;
end;
$$;

comment on function public.add_goal_item(uuid, text, bigint, text) is
  'Cria item numa meta do casal de quem chamou. couple_id sai do JWT.';

revoke execute on function public.add_goal_item(uuid, text, bigint, text) from public, anon;
grant execute on function public.add_goal_item(uuid, text, bigint, text) to authenticated;


-- ===========================================================================
-- delete_goal
-- ===========================================================================

-- A FK de contributions é "on delete restrict" de propósito: apagar meta não
-- vaporiza histórico de dinheiro por acidente. Esta função é o "de propósito"
-- ganhando um caminho — e ele exige confirmação explícita, no mesmo modelo do
-- freio de mão de leave_couple.
--
-- Meta SEM aporte não pede nada. A confirmação existe para o dinheiro, não
-- para o clique.
create function public.delete_goal(
  p_goal_id uuid,
  p_confirmo_apagar boolean default false
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_couple_id uuid := public.meu_casal_id();
  v_aportes integer;
begin
  if v_couple_id is null then
    return 'nao_encontrada';
  end if;

  -- Meta de outro casal e meta inexistente devolvem a mesma coisa. Qualquer
  -- diferença viraria oráculo de "esse uuid existe em algum lugar".
  if not exists (
    select 1 from public.goals as g
    where g.id = p_goal_id and g.couple_id = v_couple_id
  ) then
    return 'nao_encontrada';
  end if;

  select count(*) into v_aportes
  from public.contributions as c
  where c.goal_id = p_goal_id and c.couple_id = v_couple_id;

  if v_aportes > 0 and not coalesce(p_confirmo_apagar, false) then
    return 'precisa_confirmar';
  end if;

  delete from public.contributions
  where goal_id = p_goal_id and couple_id = v_couple_id;

  -- Os itens e o histórico de preço deles caem por cascade.
  delete from public.goals where id = p_goal_id and couple_id = v_couple_id;

  return 'ok';
end;
$$;

comment on function public.delete_goal(uuid, boolean) is
  'Apaga meta. Com aporte dentro, só com confirmação explícita — e leva o histórico junto.';

revoke execute on function public.delete_goal(uuid, boolean) from public, anon;
grant execute on function public.delete_goal(uuid, boolean) to authenticated;


-- ===========================================================================
-- Realtime
-- ===========================================================================

-- O que faz o plano ser compartilhado de verdade: o que um escreve aparece no
-- aparelho do outro sem F5. O RLS continua valendo — o canal sobe com o JWT de
-- quem está olhando, e o Realtime avalia as policies antes de entregar a linha.
alter publication supabase_realtime add table public.goals;
alter publication supabase_realtime add table public.goal_items;
alter publication supabase_realtime add table public.contributions;

-- Sem "replica identity full", e isso foi medido, não deduzido: o Realtime
-- entrega o DELETE com `old` contendo só a chave primária mesmo quando a
-- replica identity é full. Ligar isso custaria a linha velha inteira no WAL
-- para não mudar payload nenhum. Quem lida com a falta do goal_id no DELETE é
-- packages/api/src/realtime.ts, invalidando por prefixo.
