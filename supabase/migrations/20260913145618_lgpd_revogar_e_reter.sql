-- Três coisas que a LGPD exige e que o banco não fazia.
--
-- 1. Revogar o consentimento da faixa de renda só apagava o CARIMBO. O dado
--    continuava guardado. Art. 18, IX: revogação é sobre o dado, não sobre o
--    registro de que um dia houve consentimento.
-- 2. `price_quotes` crescia para sempre, sem retenção. Art. 15 e 16: o dado se
--    elimina quando o tratamento acaba.
-- 3. `contributions_update` conferia só o casal, então dava para reatribuir um
--    aporte para um `user_id` de fora dele.


-- ===========================================================================
-- 1. Revogar apaga a faixa, não só a data
-- ===========================================================================

-- A ordem entre os dois updates não importa, e vale saber por quê: o gatilho
-- `couple_members_consent_income_band` só reconsente quando a faixa NOVA não é
-- nula. Apagando-a, ele vê `new.income_band is null`, não faz nada, e o
-- carimbo que acabamos de limpar fica limpo.
create or replace function public.set_consent(p_tipo text, p_aceito boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_aceito boolean := coalesce(p_aceito, false);
  v_quando timestamptz := case when v_aceito then now() end;
begin
  if v_user_id is null then
    raise exception 'É preciso estar autenticado';
  end if;

  if p_tipo not in ('analytics', 'marketing', 'income_band') then
    raise exception 'Consentimento desconhecido';
  end if;

  update public.profiles
  set consent_analytics_at =
        case when p_tipo = 'analytics' then v_quando else consent_analytics_at end,
      consent_marketing_at =
        case when p_tipo = 'marketing' then v_quando else consent_marketing_at end,
      consent_income_band_at =
        case when p_tipo = 'income_band' then v_quando else consent_income_band_at end
  where user_id = v_user_id;

  if not found then
    raise exception 'Perfil não encontrado';
  end if;

  -- Revogar o uso da faixa APAGA a faixa.
  --
  -- Antes daqui, desligar o toggle só tirava a data e o app parava de usar o
  -- dado — que continuava no banco, indefinidamente, sem base legal nenhuma
  -- sustentando a guarda. Guardar "por precaução" é exatamente o que o Art.
  -- 6º, III proíbe.
  --
  -- Vale para TODAS as linhas de vínculo da pessoa, e não só a do casal atual:
  -- quem já saiu de um casal e entrou em outro tem mais de uma, e a revogação
  -- é sobre o dado dela, não sobre um plano.
  if p_tipo = 'income_band' and not v_aceito then
    update public.couple_members
    set income_band = null
    where user_id = v_user_id
      and income_band is not null;
  end if;
end;
$$;

comment on function public.set_consent(text, boolean) is
  'Liga ou desliga UM consentimento. Os outros dois não são tocados. Revogar '
  'o da faixa de renda APAGA a faixa — revogação é sobre o dado.';


-- ===========================================================================
-- 2. Retenção de price_quotes
-- ===========================================================================

-- 180 dias, e o número tem motivo dos dois lados: curto demais mata o
-- histórico de preço, que é a razão de a tabela existir e ser append-only;
-- longo demais é guardar o que o casal olhou numa loja anos atrás, sem
-- ninguém precisar.
--
-- Entra no expurgo que já existe, e não num job novo: é o mesmo trabalho
-- (apagar o que passou do prazo) e um agendamento a menos para alguém
-- descobrir que parou.
create or replace function public.expire_and_purge()
returns void
language plpgsql
security definer
set search_path = ''
as $$
--
-- O corpo abaixo é o original, palavra por palavra, mais UMA instrução no fim.
-- Escrevi ele de memória na primeira tentativa e perdi duas coisas: o claim
-- expira por `claimed_at + 48h` e não por `expires_at`, e o
-- `claimed_by_user_id = null` é o que tira o dado de quem reivindicou. Ou
-- seja, quase apaguei uma limpeza de dado pessoal dentro de uma migration de
-- privacidade. Quem pegou foi o convite.sql.
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

  -- Cotação velha não serve mais a ninguém, e é rastro de navegação do casal.
  delete from public.price_quotes where created_at <= now() - interval '180 days';
end;
$$;

comment on function public.expire_and_purge() is
  'Expurgo periódico: convites vencidos, batidas de limite e cotação com mais '
  'de 180 dias. É o único lugar que apaga por prazo.';

revoke execute on function public.expire_and_purge() from public, anon, authenticated;


-- ===========================================================================
-- 3. O aporte não sai do casal
-- ===========================================================================

-- `contributions_insert` já nega, e `add_contribution` tira o `user_id` do
-- JWT. Mas o UPDATE continuava aberto ao casal inteiro sem olhar para quem o
-- aporte aponta: dava para inserir pela função e depois reatribuir o
-- `user_id` para alguém de fora — um uuid que não é de ninguém dali.
--
-- `null` continua valendo, e é obrigatório que continue: é o "ex-membro" que
-- a pseudonimização da saída deixa no lugar do nome.
--
-- A checagem não exige `left_at is null` de propósito. Quem saiu do casal tem
-- os aportes convertidos em "ex-membro" por `leave_couple`, então na prática
-- não sobra linha apontando para ela; e exigir vínculo ATIVO transformaria
-- qualquer correção de aporte antigo numa recusa sem explicação.
drop policy contributions_update on public.contributions;

create policy contributions_update on public.contributions
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (
    public.is_couple_member(couple_id)
    and (
      user_id is null
      or exists (
        select 1
        from public.couple_members as m
        where m.couple_id = contributions.couple_id
          and m.user_id = contributions.user_id
      )
    )
  );

comment on policy contributions_update on public.contributions is
  'Editar aporte do próprio casal, e só podendo atribuí-lo a quem é do casal.';
