-- A regra de divisão passa a ser do CASAL, não de cada pessoa.
--
-- Como estava: `split_rule` era coluna de `couple_members`, uma por pessoa. As
-- duas linhas podiam discordar, e existia uma função em TypeScript
-- (`regraDoCasal`) cujo trabalho inteiro era desempatar pelo papel 'dono'.
-- Regra de negócio que só existe para consertar o modelo é sintoma do modelo,
-- e estava registrada em Dívidas desde o prompt 6.
--
-- O pedido sempre foi "três modos POR CASAL". Esta migration põe a coluna onde
-- a frase já dizia que ela morava, e a função de desempate some junto.
--
-- Sem policy nova: `couples_update` já deixa qualquer membro alterar o próprio
-- casal, que é o certo — a regra é dos dois, e qualquer um dos dois muda.


alter table public.couples
  add column split_rule public.split_rule not null default 'igual';

comment on column public.couples.split_rule is
  'Como o casal divide. Uma por casal: as duas pessoas veem a mesma conta.';


-- Backfill: a mesma escolha que regraDoCasal fazia em memória, feita uma vez
-- aqui. O dono manda; sem dono ativo, o vínculo mais antigo — que é a ordem em
-- que a consulta do app já vinha.
--
-- Só membros ativos entram: a regra de quem já saiu do casal não decide mais
-- nada, e `left_at` é o corte que o resto do schema também usa.
update public.couples as c
set split_rule = m.split_rule
from (
  select distinct on (couple_id) couple_id, split_rule
  from public.couple_members
  where left_at is null
  order by couple_id, (role = 'dono') desc, created_at
) as m
where m.couple_id = c.id;


-- A coluna velha NÃO sai aqui. Sai em `regra_do_casal_contrai`, depois que o
-- web que a lê tiver saído do ar.
--
-- Esta migration precisa ser inofensiva para a versão do app que já está
-- publicada, e é isso que o expand/contract compra: enquanto as duas colunas
-- existem, o web antigo lê `couple_members.split_rule` e o novo lê
-- `couples.split_rule`, e os dois funcionam contra o mesmo banco. Sem isso, o
-- `db push` e o deploy teriam que acontecer na mesma janela — operação
-- irreversível sob pressão de tempo, que é como se erra.
