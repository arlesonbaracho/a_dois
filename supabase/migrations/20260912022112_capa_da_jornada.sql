-- A capa da jornada: foto de verdade, presa ao nosso bucket.
--
-- A tese do visual é "fotos tortas sobre papel", e até aqui o plano de imagem
-- da polaroide era gradiente em CSS. Esta migration é o que traz a fotografia.
--
-- A regra que organiza o arquivo inteiro: o cliente NUNCA escolhe um endereço.
-- É a mesma decisão já registrada em profiles.avatar_url, que existe e que
-- nenhuma função grava de propósito — URL de terceiro faz o navegador de quem
-- abre a tela buscar um endereço escolhido por outra pessoa, entregando IP e
-- horário de quem só queria ver a própria meta.
--
-- Aqui a coluna nasce incapaz de guardar endereço de fora, por constraint do
-- banco, e não por disciplina de quem escreve o código depois.


-- ===========================================================================
-- O bucket
-- ===========================================================================

-- Privado. Bucket público entregaria a foto do casal a qualquer um com o link,
-- e o escopo é o de sempre: só os dois enxergam o que é dos dois. Quem abre a
-- tela pede uma URL assinada, e o Storage só assina o que a policy de select
-- abaixo deixa ver.
--
-- file_size_limit e allowed_mime_types são os limites de tamanho e de tipo
-- exigidos NO SERVIDOR. Quem os aplica é a API do Storage, não o formulário:
-- uma requisição forjada por fora do app bate no mesmo teto. A checagem no
-- navegador entra também, mas como gentileza, nunca como fronteira.
--
-- Um tipo só, e uma extensão só, porque o app reencoda toda foto para JPEG
-- antes de subir — o que também é o que tira o EXIF, e com ele a coordenada
-- de GPS que o projeto declara não coletar.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('capas', 'capas', false, 2097152, array['image/jpeg'])
on conflict (id) do nothing;


-- ===========================================================================
-- A coluna, amarrada à linha que ela descreve
-- ===========================================================================

alter table public.goals add column cover_path text;

-- O padrão é montado com o couple_id e o id DA PRÓPRIA LINHA. É isso, e só
-- isso, que torna a coluna incapaz de guardar "https://sei-la.example/x.jpg",
-- o caminho do casal vizinho ou o de outra jornada nossa. Não depende de
-- nenhuma função lembrar de conferir: não existe caminho de escrita que passe
-- por fora de uma constraint.
--
-- Constraint, e não função security definer, pela mesma razão escrita em
-- goals_target_amount_cents_teto: editar jornada é update direto pelo
-- PostgREST, então uma checagem que morasse só numa RPC deixaria o update
-- aberto.
alter table public.goals
  add constraint goals_cover_path_do_nosso_bucket
  check (
    cover_path is null
    or cover_path ~ ('^' || couple_id::text || '/' || id::text || '/[0-9a-f-]{36}\.jpg$')
  );

comment on column public.goals.cover_path is
  'Caminho dentro do bucket "capas", nunca URL. A constraint amarra o valor ao '
  'couple_id e ao id da própria linha: endereço de terceiro não entra na tabela.';

comment on constraint goals_cover_path_do_nosso_bucket on public.goals is
  'A capa mora no nosso bucket, na pasta deste casal e desta jornada. Nada mais.';


-- ===========================================================================
-- casal_do_caminho: a mesma pergunta das outras 28 policies
-- ===========================================================================

-- O caminho do objeto é <couple_id>/<goal_id>/<uuid>.jpg, e o primeiro
-- segmento é o que autoriza. Esta função o extrai, ou devolve null quando o
-- caminho não tem a forma esperada.
--
-- null, e não exceção, de propósito: policy que levanta erro transforma
-- "esse objeto não é seu" em mensagem diferente de "não achei", e diferença
-- de resposta é oráculo. Com null, is_couple_member simplesmente responde
-- false, e caminho torto não casa com casal nenhum.
--
-- immutable e search_path vazio pelo mesmo motivo das demais: ninguém
-- sequestra a resolução de nomes.
create function public.casal_do_caminho(caminho text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when caminho ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
    then substring(caminho from 1 for 36)::uuid
  end;
$$;

comment on function public.casal_do_caminho(text) is
  'O couple_id que abre o caminho de um objeto no Storage, ou null se o caminho não tiver essa forma.';


-- ===========================================================================
-- As quatro policies de storage.objects
-- ===========================================================================

-- storage.objects já vem com RLS ligado e ZERO policies, e authenticated já
-- tem grant de select, insert, update e delete nela. Ou seja: é exatamente a
-- mesma situação das tabelas do projeto — RLS é a única fronteira, e sem as
-- policies abaixo ela nega tudo, para todo mundo.
--
-- As quatro são "to authenticated". O papel anon tem grant e nenhuma policy,
-- o que já significa zero linhas e zero escrita.
--
-- Todas fazem a mesma pergunta: o casal que abre este caminho é um dos seus?

create policy capas_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'capas'
    and public.is_couple_member(public.casal_do_caminho(name))
  );

-- O caminho vem no corpo da requisição, sim — e é justamente por isso que o
-- primeiro segmento dele é conferido contra a lista de casais do auth.uid().
-- Mandar o couple_id de outra pessoa não adianta nada.
create policy capas_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'capas'
    and public.is_couple_member(public.casal_do_caminho(name))
  );

-- using E with check escritos à mão, pela razão do cabeçalho do esquema
-- inicial: sem o with check, o using desta policy seria usado no lugar dele, e
-- ninguém deveria precisar lembrar de uma regra implícita para saber por que o
-- objeto não escapa para a pasta de outro casal.
create policy capas_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'capas'
    and public.is_couple_member(public.casal_do_caminho(name))
  )
  with check (
    bucket_id = 'capas'
    and public.is_couple_member(public.casal_do_caminho(name))
  );

-- Trocar a capa apaga a anterior. Os dois do casal podem — a foto é do plano,
-- não de quem subiu.
create policy capas_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'capas'
    and public.is_couple_member(public.casal_do_caminho(name))
  );
