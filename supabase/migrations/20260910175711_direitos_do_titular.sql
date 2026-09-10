-- Direitos do titular: acesso, portabilidade, eliminação e consentimento.
--
-- LGPD, Art. 18. Até aqui o app coletava dado pessoal e não tinha nenhuma das
-- três portas de saída: levar embora, apagar, e dizer para que serve.
--
-- A exclusão de conta é quase a saída do casal. Em vez de duplicar noventa
-- linhas com uma diferença no fim, o corpo de leave_couple vira uma função
-- interna e as duas entram por ela.


-- ===========================================================================
-- Consentimentos
-- ===========================================================================

-- Três colunas em profiles, e não uma tabela de eventos. O timestamp é o
-- registro E a flag: nulo é "nunca consentiu", data é "consentiu nesta hora".
-- Uma tabela de histórico guardaria dado pessoal que ninguém vai ler antes de
-- existir auditoria — e guardar por precaução é o oposto de minimizar.
alter table public.profiles
  add column consent_analytics_at timestamptz,
  add column consent_marketing_at timestamptz,
  add column consent_income_band_at timestamptz;

comment on column public.profiles.consent_analytics_at is
  'Quando consentiu com métrica de uso. Nulo é não. Nada usa isso ainda.';
comment on column public.profiles.consent_marketing_at is
  'Quando consentiu com novidades por e-mail. Nulo é não. Nada usa isso ainda.';
comment on column public.profiles.consent_income_band_at is
  'Quando consentiu com o uso da faixa de renda no cálculo da divisão. '
  'Nulo é não, e aí o modo proporcional fica indisponível.';

-- Cada tipo é independente do outro de propósito: consentimento agrupado não é
-- consentimento, é um botão de "aceito tudo" com outro nome.
create function public.set_consent(p_tipo text, p_aceito boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_quando timestamptz := case when coalesce(p_aceito, false) then now() end;
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
end;
$$;

comment on function public.set_consent(text, boolean) is
  'Liga ou desliga UM consentimento. Os outros dois não são tocados.';

revoke execute on function public.set_consent(text, boolean) from public, anon;
grant execute on function public.set_consent(text, boolean) to authenticated;

-- Escolher a faixa de renda no formulário É o ato afirmativo de consentir com
-- o uso dela. Sem isto o padrão opt-in desligaria o modo proporcional para quem
-- já usava, e a pessoa teria que consentir de novo com algo que acabou de
-- digitar. O toggle do perfil continua sendo onde ela revoga.
-- security definer por necessidade: profiles nega update nas policies desde a
-- migration dos perfis, e o gatilho roda como quem chamou. Sem o definer ele
-- atualizaria zero linhas em silêncio — que foi exatamente o que o teste pegou.
create function public.consent_income_band_on_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- TG_OP no lugar de olhar OLD direto: no INSERT o OLD não existe, e tocar
  -- nele levantaria. Cobrir o insert é para um caminho de escrita futuro não
  -- gravar faixa sem registrar o consentimento junto.
  if new.income_band is not null
     and (tg_op = 'INSERT' or new.income_band is distinct from old.income_band) then
    update public.profiles
    set consent_income_band_at = coalesce(consent_income_band_at, now())
    where user_id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger couple_members_consent_income_band
  after insert or update of income_band on public.couple_members
  for each row execute function public.consent_income_band_on_write();


-- ===========================================================================
-- export_my_data: acesso e portabilidade
-- ===========================================================================

-- Tudo do casal, porque o plano financeiro é das duas pessoas e metade dele não
-- se porta para lugar nenhum. Do parceiro sai a linha inteira do vínculo e o
-- perfil — que ela já enxerga hoje pela policy couple_members_select, então o
-- export não dá acesso novo.
--
-- O e-mail dele é a exceção, e sai MASCARADO. auth.users não é exposta por
-- policy nenhuma, e a tela de confirmação de convite já mostra j••e@gm••l.com
-- justamente para o e-mail em claro não sair do banco. Deixar ele cru aqui
-- desfaria essa decisão por outra porta, e seria um titular levando embora o
-- endereço de outro.
--
-- token_hash dos convites fica de fora: é segredo do sistema, não dado dela.
create function public.export_my_data()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_couple_id uuid := public.meu_casal_id();
begin
  if v_user_id is null then
    raise exception 'É preciso estar autenticado';
  end if;

  return jsonb_build_object(
    'exportado_em', now(),
    'sobre', 'Tudo que o A DOIS guarda sobre você e sobre o plano de vocês.',

    'minha_conta', (
      select jsonb_build_object(
        'user_id', u.id,
        'email', u.email,
        'conta_criada_em', u.created_at
      )
      from auth.users as u where u.id = v_user_id
    ),

    'meu_perfil', (
      select to_jsonb(p) from public.profiles as p where p.user_id = v_user_id
    ),

    'meus_consentimentos', (
      select jsonb_build_object(
        'analytics', p.consent_analytics_at,
        'marketing', p.consent_marketing_at,
        'uso_da_faixa_de_renda', p.consent_income_band_at
      )
      from public.profiles as p where p.user_id = v_user_id
    ),

    'plano', (
      select to_jsonb(c) from public.couples as c where c.id = v_couple_id
    ),

    'pessoas_do_plano', coalesce((
      select jsonb_agg(
        to_jsonb(m) || jsonb_build_object(
          'apelido', (select p.nickname from public.profiles as p where p.user_id = m.user_id),
          'nome_exibido', (select p.display_name from public.profiles as p where p.user_id = m.user_id),
          'email', case
            when m.user_id = v_user_id
              then (select u.email from auth.users as u where u.id = m.user_id)
            else public.mascarar_email(
              (select u.email from auth.users as u where u.id = m.user_id))
          end
        )
        order by m.created_at
      )
      from public.couple_members as m where m.couple_id = v_couple_id
    ), '[]'::jsonb),

    'metas', coalesce((
      select jsonb_agg(to_jsonb(g) order by g.created_at)
      from public.goals as g where g.couple_id = v_couple_id
    ), '[]'::jsonb),

    'itens', coalesce((
      select jsonb_agg(to_jsonb(i) order by i.created_at)
      from public.goal_items as i where i.couple_id = v_couple_id
    ), '[]'::jsonb),

    'aportes', coalesce((
      select jsonb_agg(to_jsonb(a) order by a.contributed_at)
      from public.contributions as a where a.couple_id = v_couple_id
    ), '[]'::jsonb),

    'precos_observados', coalesce((
      select jsonb_agg(to_jsonb(q) order by q.created_at)
      from public.price_quotes as q where q.couple_id = v_couple_id
    ), '[]'::jsonb),

    'convites', coalesce((
      select jsonb_agg(
        (to_jsonb(v) - 'token_hash') order by v.created_at
      )
      from public.couple_invites as v where v.couple_id = v_couple_id
    ), '[]'::jsonb)
  );
end;
$$;

comment on function public.export_my_data() is
  'Tudo do casal em JSON. E-mail do parceiro mascarado; token de convite nunca sai.';

revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;


-- ===========================================================================
-- Exclusão de conta
-- ===========================================================================

-- O corpo de leave_couple vira função interna, com um parâmetro a mais.
-- Sair do casal recria um plano vazio para quem saiu; excluir a conta não —
-- não há mais para quem recriar.
create function public.sair_do_casal_interno(
  p_user_id uuid,
  p_confirmo_apagar boolean,
  p_recriar_plano boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_couple_id uuid;
  v_email text;
  v_restantes integer;
begin
  if p_user_id is null then
    raise exception 'É preciso estar autenticado';
  end if;

  select m.couple_id into v_couple_id
  from public.couple_members as m
  where m.user_id = p_user_id and m.left_at is null
  order by m.created_at
  limit 1;

  if v_couple_id is null then
    return 'sem_plano';
  end if;

  -- Freio de mão. Apagar o plano é irreversível e leva metas, itens, aportes e
  -- histórico de preço junto; uma tela com bug não faz isso por acidente.
  if public.membros_ativos(v_couple_id) = 1 and not coalesce(p_confirmo_apagar, false) then
    return 'precisa_confirmar_apagar';
  end if;

  select lower(u.email) into v_email from auth.users as u where u.id = p_user_id;

  -- 1. A saída em si. Daqui em diante o RLS já não devolve nada para ela.
  update public.couple_members
  set left_at = now(),
      display_name = null,
      income_band = null,
      fixed_share_cents = null
  where couple_id = v_couple_id
    and user_id = p_user_id
    and left_at is null;

  if not found then
    return 'sem_plano';
  end if;

  -- 2. Os aportes ficam, com o valor intacto; quem aportou vira "ex-membro".
  update public.contributions
  set user_id = null
  where couple_id = v_couple_id and user_id = p_user_id;

  -- 3. Convite ativo criado por quem saiu não sobrevive à saída: quem
  --    autorizaria a confirmação não está mais aqui.
  update public.couple_invites
  set status = 'revoked',
      revoked_at = now(),
      claimed_by_user_id = null,
      created_by = null
  where couple_id = v_couple_id
    and created_by = p_user_id
    and status in ('pending', 'claimed');

  -- 4. O e-mail dela é a única cópia de dado pessoal que o casal guardava fora
  --    de couple_members.
  delete from public.couple_invites
  where couple_id = v_couple_id
    and (
      lower(invited_email) = v_email
      or invited_user_id = p_user_id
      or claimed_by_user_id = p_user_id
    );

  -- 5. Sessões. O access token é JWT e vale até jwt_expiry; ele deixa de provar
  --    PERTENCIMENTO no passo 1, e IDENTIDADE quando o GoTrue recusa a sessão.
  delete from auth.sessions where user_id = p_user_id;

  -- 6. Último a sair apaga a luz. As contributions saem à mão porque a FK
  --    goal_id é "on delete restrict" de propósito, e bloquearia o cascade.
  select public.membros_ativos(v_couple_id) into v_restantes;

  if v_restantes = 0 then
    delete from public.contributions where couple_id = v_couple_id;
    delete from public.couples where id = v_couple_id;
  end if;

  -- 7. Só para quem sai do casal: ela volta a ter um plano só dela, mantendo o
  --    invariante de que todo mundo tem um plano. Quem exclui a conta não passa
  --    por aqui — não sobra ninguém para quem recriar.
  if coalesce(p_recriar_plano, false) then
    perform public.create_couple_for(p_user_id);
  end if;

  return case when v_restantes = 0 then 'plano_apagado' else 'ok' end;
end;
$$;

revoke execute on function public.sair_do_casal_interno(uuid, boolean, boolean)
  from public, anon, authenticated;

-- leave_couple vira invólucro. O comportamento dela não muda em nada, e quem
-- prova isso é o supabase/tests/saida.sql, que já existia.
create or replace function public.leave_couple(p_confirmo_apagar boolean default false)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  return public.sair_do_casal_interno(
    (select auth.uid()), coalesce(p_confirmo_apagar, false), true);
end;
$$;

comment on function public.leave_couple(boolean) is
  'Sai do casal, pseudonimizando quem saiu. Apaga o plano só no último membro, '
  'e só com confirmação explícita.';

-- A palavra é conferida AQUI, e não na tela. Proteção que mora no cliente é
-- proteção que quem chama a API direto não tem.
create function public.delete_account(
  p_confirmacao text,
  p_confirmo_apagar boolean default false
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_resultado text;
begin
  if v_user_id is null then
    raise exception 'É preciso estar autenticado';
  end if;

  if coalesce(p_confirmacao, '') <> 'EXCLUIR' then
    return 'confirmacao_invalida';
  end if;

  v_resultado := public.sair_do_casal_interno(v_user_id, p_confirmo_apagar, false);

  -- Só 'precisa_confirmar_apagar' interrompe: é o freio de mão do último
  -- membro, e nesse caso nada foi escrito.
  if v_resultado = 'precisa_confirmar_apagar' then
    return v_resultado;
  end if;

  delete from public.profiles where user_id = v_user_id;

  -- A conta. O cascade em couple_members leva junto a linha do vínculo — e
  -- isso é de propósito: depois da pseudonimização o que sobra nela é o
  -- user_id, que é identificador de pessoa. Os aportes já viraram "ex-membro"
  -- no passo 2, com o valor intacto, que é o que a regra protege.
  delete from auth.users where id = v_user_id;

  return case when v_resultado = 'plano_apagado' then 'conta_e_plano_apagados' else 'ok' end;
end;
$$;

comment on function public.delete_account(text, boolean) is
  'Apaga a conta. Exige a palavra EXCLUIR, conferida aqui e não na tela.';

revoke execute on function public.delete_account(text, boolean) from public, anon;
grant execute on function public.delete_account(text, boolean) to authenticated;
