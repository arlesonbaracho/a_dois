-- Saída do casal, com pseudonimização.
--
-- A outra metade do direito do titular: até aqui só existia entrada. Quem sai
-- deixa de ser uma pessoa no plano e vira "ex-membro" — o dinheiro que ela
-- aportou continua na conta do casal, porque é história financeira de duas
-- pessoas e apagar mentiria sobre o saldo, mas o nome, a faixa de renda e o
-- vínculo com os aportes somem.
--
-- O que corta o acesso é o left_at, e não o delete de sessão lá embaixo:
-- is_couple_member já exige "left_at is null", então no instante em que ele é
-- gravado toda policy do schema para de devolver linha para essa pessoa. Isso
-- já estava construído desde a migration inicial; aqui só passou a ter quem
-- escrevesse.
--
-- Apagar auth.sessions é a milha extra, e tem limite honesto: o access token é
-- um JWT e continua válido até jwt_expiry. Ele deixa de provar PERTENCIMENTO na
-- hora (passo 1); deixa de provar IDENTIDADE quando o GoTrue recusa a sessão
-- apagada. Revogar JWT exigiria lista de bloqueio, que não paga o próprio custo
-- aqui.

create function public.leave_couple(p_confirmo_apagar boolean default false)
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
      income_band = null
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

  -- 5. Sessões. Ver a ressalva do cabeçalho sobre o JWT.
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

revoke execute on function public.leave_couple(boolean) from public, anon;
grant execute on function public.leave_couple(boolean) to authenticated;
