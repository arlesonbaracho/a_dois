-- O nome dito no cadastro chega às duas tabelas que o mostram.
--
-- Por que trigger, e não a função set_profile que já existe: set_profile exige
-- sessão, e com confirmação de e-mail ligada não existe sessão logo depois do
-- cadastro. O nome viaja no raw_user_meta_data do próprio signUp, e a trigger
-- é o único ponto que roda na mesma transação da criação do usuário.
--
-- Os dois lugares, e não um, porque os dois são lidos:
--   profiles.display_name       -> o campo "Nome" do cartão de pedido, que é
--                                  por onde alguém decide conceder acesso ao
--                                  histórico financeiro do plano
--   couple_members.display_name -> a saudação da home e a lista "Quem colocou"
--
-- Continua opcional. Quem não quiser dizer não diz, as duas colunas ficam
-- nulas, e a home cai em "oi, vocês" como cai hoje.


-- ===========================================================================
-- create_couple_for: o nome entra junto do vínculo
-- ===========================================================================

-- Parâmetro novo com default nulo, e a versão de um argumento é APAGADA logo
-- abaixo. As duas convivendo seria sobrecarga ambígua: `create_couple_for(id)`
-- passaria a casar com as duas e o Postgres recusaria com 42725 — em tempo de
-- execução, dentro de create_couple, leave_couple e delete_account, não na
-- migration. Com o default, as chamadas de um argumento que já existem
-- continuam funcionando sem tocar em nenhuma delas.
create or replace function public.create_couple_for(
  p_user_id uuid,
  p_display_name text default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_couple_id uuid;
begin
  insert into public.couples default values returning id into v_couple_id;

  insert into public.couple_members (couple_id, user_id, role, display_name)
  values (v_couple_id, p_user_id, 'dono', p_display_name);

  return v_couple_id;
end;
$$;

comment on function public.create_couple_for(uuid, text) is
  'Cria um casal com o usuário informado como dono. Uso interno: quem chega '
  'pelo cliente usa create_couple(), que tira o id do JWT.';

-- O mesmo cuidado do arquivo original: revogar de public não alcança anon e
-- authenticated, porque o Supabase concede execute a eles por default
-- privileges, e essa concessão é direta, não herdada. A assinatura mudou, e
-- uma função nova nasce com os grants de sempre — sem estas linhas, o
-- p_user_id por parâmetro ficaria exposto ao cliente, que é a regra 3 do
-- CLAUDE.md pela porta dos fundos.
revoke execute on function public.create_couple_for(uuid, text) from public, anon, authenticated;

-- E some com a de um argumento, que é o que desfaz a ambiguidade.
drop function public.create_couple_for(uuid);


-- ===========================================================================
-- handle_new_user: lê o nome, e não confia nele
-- ===========================================================================

-- raw_user_meta_data é preenchido por QUEM SE CADASTRA. É entrada de fora, na
-- porta da frente, e por isso passa por trim, corte e nullif antes de tocar a
-- tabela.
--
-- O left(..., 80) é o que impede um ataque de uma linha: display_name tem
-- check (length between 1 and 80), e um nome de 500 caracteres faria a
-- constraint estourar DENTRO desta trigger. Como ela roda na mesma transação
-- do insert em auth.users, a exceção derrubaria o cadastro inteiro — qualquer
-- pessoa poderia quebrar o próprio signup, e um script poderia medir a
-- diferença. Cortar é mais barato que recusar, e não perde ninguém: nome de
-- 80 letras já é nome longo.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nome text := nullif(
    left(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 80),
    ''
  );
begin
  perform public.create_couple_for(new.id, v_nome);

  -- O apelido continua nascendo nulo: ele é único no banco inteiro, e aceitar
  -- do metadata deixaria o cadastro falhar por colisão com apelido de outra
  -- pessoa. Apelido segue sendo escolha consciente, em set_profile.
  insert into public.profiles (user_id, display_name) values (new.id, v_nome);

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Dá um casal e um perfil a quem acaba de se cadastrar, com o nome que a '
  'pessoa disse — cortado em 80, porque o metadata vem de fora.';
