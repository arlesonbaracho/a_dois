-- A linha de vínculo de cada um passa a ser editável só por ela mesma.
--
-- Como estava: `couple_members_update` conferia apenas "é do seu casal". Ou
-- seja, um parceiro editava a linha do outro — papel, valor combinado e a
-- FAIXA DE RENDA dela. Dado pessoal de uma pessoa, alterável por outra, sem
-- que ela soubesse. Estava em Dívidas como Média, e o conserto sempre foi uma
-- cláusula.
--
-- O `using` continua o casal inteiro de propósito: ler a linha do parceiro é
-- legítimo (é dela que sai o nome na lista "Quem colocou" e a faixa que o
-- rateio proporcional usa). O que muda é o `with check`, que decide qual linha
-- pode RESULTAR de um update.
--
-- Nada legítimo quebra: `salvarMinhaDivisao` já escreve só na própria linha, e
-- `leave_couple` e `confirm_invite` são security definer — passam por fora de
-- RLS, que é como a pseudonimização de quem sai continua funcionando.

drop policy couple_members_update on public.couple_members;

create policy couple_members_update on public.couple_members
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (
    public.is_couple_member(couple_id)
    and user_id = (select auth.uid())
  );

comment on policy couple_members_update on public.couple_members is
  'Edito a minha linha, não a do meu par. O casal no using, eu no with check.';
