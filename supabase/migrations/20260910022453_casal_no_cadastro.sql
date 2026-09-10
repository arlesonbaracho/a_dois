-- O casal nasce junto com a pessoa.
--
-- Com enable_confirmations ligado, o cadastro não devolve sessão: o usuário só
-- fica autenticado depois de clicar no link do e-mail. Ou seja, não existe
-- instante em que o app possa chamar create_couple() "logo após cadastrar".
-- Uma trigger no insert de auth.users resolve isso e ainda entrega o que a
-- alternativa não entregaria: couples e couple_members na mesma transação do
-- próprio cadastro, sem orquestração no cliente e sem corrida entre duas
-- requisições criando dois casais.
--
-- create_couple() não serve como está: lá dentro auth.uid() é null, porque a
-- inserção em auth.users acontece no contexto do GoTrue, não do PostgREST. Os
-- dois inserts saem dela para uma função que recebe o id, e create_couple()
-- vira um invólucro. Assinatura, grant e comportamento externo continuam iguais.


-- ===========================================================================
-- create_couple_for: os dois inserts, agora reaproveitáveis
-- ===========================================================================

-- Security INVOKER de propósito, apesar de create_couple() ser definer.
--
-- Ela só é chamada de dentro de funções definer, e lá o usuário corrente já é
-- a dona das tabelas — que passa reto pelo RLS, já que nenhuma tabela usa
-- force row level security. Não precisa de definer, então não ganha definer:
-- é uma superfície de escalação a menos.
--
-- E se alguém conceder execute nela por engano, o estrago é zero: chamada
-- direta por authenticated roda com RLS ligado, e a policy couples_insert nega
-- (no instante do insert ninguém é membro do casal que está nascendo).
create function public.create_couple_for(p_user_id uuid)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_couple_id uuid;
begin
  insert into public.couples default values returning id into v_couple_id;

  insert into public.couple_members (couple_id, user_id, role)
  values (v_couple_id, p_user_id, 'dono');

  return v_couple_id;
end;
$$;

comment on function public.create_couple_for(uuid) is
  'Cria um casal com o usuário informado como dono. Uso interno: quem chega '
  'pelo cliente usa create_couple(), que tira o id do JWT.';

-- Ninguém do lado do cliente chama isto. O user_id vem por parâmetro, e
-- parâmetro vindo do cliente é exatamente o que a regra 3 do CLAUDE.md proíbe.
--
-- anon e authenticated aparecem por escrito porque revogar de public não os
-- alcança: o Supabase concede execute a eles por default privileges, e essa
-- concessão é direta, não herdada. Comprovado em cadastro_cria_casal.sql, que
-- reprovou esta migration quando a linha dizia só "from public".
revoke execute on function public.create_couple_for(uuid) from public, anon, authenticated;


-- ===========================================================================
-- create_couple: mesmo contrato, agora delegando
-- ===========================================================================

create or replace function public.create_couple()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'É preciso estar autenticado para criar um casal';
  end if;

  return public.create_couple_for(v_user_id);
end;
$$;


-- ===========================================================================
-- A trigger
-- ===========================================================================

-- Definer porque o GoTrue insere em auth.users como supabase_auth_admin, que
-- não tem nada a ver com as tabelas de public.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.create_couple_for(new.id);
  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Dá um casal a quem acaba de se cadastrar, na mesma transação do cadastro.';

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
