-- O e-mail do convite para de sair em claro, e o token_hash para de sair.
--
-- Achado 3 e 5 da auditoria de 2026-09-10. Qualquer membro do casal lia
-- `select invited_email, token_hash from couple_invites` pelo PostgREST. O
-- e-mail é de um TERCEIRO — a pessoa convidada, que nunca consentiu em aparecer
-- para o parceiro de quem a convidou. E o projeto já tinha decidido, em
-- 2026-09-10, que e-mail não sai do banco em claro: é por isso que a tela de
-- confirmação chama mascarar_email. Esta migration fecha a outra porta.
--
-- RLS filtra LINHA, não coluna. Quem filtra coluna no Postgres é o grant — e
-- ele estava aberto na tabela inteira, herdado do "alter default privileges"
-- que o Supabase aplica em public.


-- ===========================================================================
-- A coluna fecha
-- ===========================================================================

revoke select on public.couple_invites from anon, authenticated;

-- Lista explícita do que PODE ser lido, e não um revoke das duas colunas
-- sensíveis: assim coluna nova nasce ilegível até alguém liberar de propósito.
-- Falha fechada — o mesmo raciocínio do allowlist do service worker.
grant select (
  id,
  couple_id,
  channel,
  status,
  created_by,
  invited_user_id,
  claimed_by_user_id,
  expires_at,
  claimed_at,
  confirmed_at,
  rejected_at,
  revoked_at,
  created_at,
  updated_at
) on public.couple_invites to anon, authenticated;

-- anon entra na mesma lista de propósito. O modelo do projeto, escrito na
-- migration inicial, é "anon tem grant nas tabelas e nenhuma policy, o que já
-- significa zero linhas". Tirar o grant dele faria zero linha passar a vir de
-- permissão negada — e o teste de isolamento, que confere isso, deixaria de
-- provar que quem barra é o RLS.

comment on column public.couple_invites.invited_email is
  'E-mail de quem foi convidado. Fora do grant de authenticated: sai só '
  'mascarado, por active_invites(). É dado de terceiro.';


-- ===========================================================================
-- active_invites: o que a tela do parceiro passa a usar
-- ===========================================================================

-- Substitui o "select * from couple_invites" que a tela fazia. Devolve o mesmo
-- que ela mostrava, com o e-mail mascarado no lugar do endereço — reúso direto
-- do que pending_claim já faz.
--
-- Sem parâmetro de casal: ele sai do JWT aqui dentro, que é a regra 3.
create function public.active_invites()
returns table (
  invite_id uuid,
  channel public.invite_channel,
  status public.invite_status,
  email_mascarado text,
  expires_at timestamptz,
  created_at timestamptz
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
    c.status,
    -- Canal link não tem e-mail nenhum, e mascarar_email devolve '•••' para
    -- nulo. A tela decide se mostra ou não.
    case when c.invited_email is null then null
         else public.mascarar_email(c.invited_email) end,
    c.expires_at,
    c.created_at
  from public.couple_invites as c
  where c.couple_id = v_couple_id
    and c.status in ('pending', 'claimed')
  order by c.created_at;
end;
$$;

comment on function public.active_invites() is
  'Os convites em aberto do casal de quem chamou, com o e-mail mascarado.';

revoke execute on function public.active_invites() from public, anon;
grant execute on function public.active_invites() to authenticated;
