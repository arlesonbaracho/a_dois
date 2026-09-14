-- Ofertas de parceiro: o conteúdo que a indicação de afiliado mostra.
--
-- POR QUE ESTA TABELA NÃO TEM couple_id
--
-- A regra 1 do CLAUDE.md diz que toda tabela tem couple_id e RLS. Esta tem RLS
-- e não tem couple_id, pelo mesmo motivo que `couples` não tem (o id dela É o
-- couple_id) e que `rate_limit_hits` não tem (a chave às vezes é pessoa, às
-- vezes casal): oferta é conteúdo GLOBAL. A mesma linha é mostrada a todo
-- casal daquela categoria, e ninguém é dono dela. Uma coluna couple_id aqui
-- seria sempre nula, ou a mesma oferta copiada por casal.
--
-- O que a regra 1 protege é "linha de um casal não vaza para outro casal".
-- Aqui não existe linha de casal: NADA nesta tabela fala de ninguém. A
-- compensação é fechar o lado da escrita com todas as letras.
--
-- A TABELA É O CONTRATO
--
-- Ainda não há conta aprovada em programa de afiliado, e isso não trava nada:
-- as primeiras linhas entram à mão, com a service role. Quando a API do
-- marketplace entrar, ela escreve NESTAS colunas e nenhuma linha do lado de
-- leitura muda. Sem adapter, sem provider, sem interface de uma implementação.

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  -- Casa com goals.category, que é texto livre com as seis conhecidas em
  -- packages/core/src/categorias.ts. Mesmo limite da coluna de lá.
  category text not null check (length(category) between 1 and 40),
  title text not null check (length(title) between 1 and 120),
  -- Quem é a loja. Não é enfeite: o rótulo de publicidade tem que NOMEAR o
  -- parceiro comercial, e é daqui que o nome sai.
  merchant text not null check (length(merchant) between 1 and 60),
  price_cents bigint not null check (price_cents > 0),
  -- Preço de terceiro envelhece, e a gente não controla. A tela mostra a data
  -- junto do valor; sem ela o app afirmaria um número que não é dele, contra o
  -- princípio "o dinheiro tem que fechar".
  price_seen_at timestamptz not null default now(),
  -- Só https, e o mesmo teto de tamanho de goal_items.url e price_quotes.
  -- URL guardada hoje é clique amanhã.
  target_url text not null
    check (target_url ~* '^https://' and length(target_url) <= 2000),
  -- A janela de publicação. É ela que a policy de select confere.
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at is null or expires_at > published_at)
);

comment on table public.offers is
  'Indicação de afiliado. Conteúdo global, sem dono: nenhuma linha aqui fala de um casal.';

comment on column public.offers.merchant is
  'O nome da loja. O rótulo de publicidade precisa nomear o parceiro comercial.';

-- Sem coluna de imagem, de propósito. Apontar <img> para o CDN da loja
-- entregaria a ela o IP e o horário de quem só ABRIU a tela, sem clicar em
-- nada — o oposto do que as fontes self-hosted e o Referrer-Policy de
-- /convite protegem. A coluna entra no dia em que houver cópia no nosso
-- bucket; até lá o cartão cai na chapa da categoria, que já existe.

create trigger offers_set_updated_at
  before update on public.offers
  for each row execute function public.set_updated_at();

-- O acesso real é "as ofertas desta categoria, no ar, mais nova primeiro".
create index offers_category_idx on public.offers (category, published_at desc);

-- A busca pelo nome do item que o casal anotou. `portuguese` é dicionário
-- nativo do Postgres: resolve plural e acento sem dependência nova e sem
-- serviço de busca. "Geladeira 375L" acha "geladeira frost free 375 litros".
create index offers_busca_idx on public.offers
  using gin (to_tsvector('portuguese', title));

alter table public.offers enable row level security;

-- Leitura é de quem está logado, mas SÓ do que está no ar: a policy é o filtro
-- de vigência, e não um "deixa passar". Oferta agendada ou vencida não vaza nem
-- por consulta direta ao PostgREST — filtro na consulta do cliente é sugestão,
-- policy é regra.
create policy offers_select on public.offers
  for select to authenticated
  using (
    published_at <= now()
    and (expires_at is null or expires_at > now())
  );

-- As três negações ficam ESCRITAS, como em price_quotes: ausência de policy
-- protege igual, mas não avisa a quem lê que a ausência foi decidida.
create policy offers_insert on public.offers
  for insert to authenticated
  with check (false);

create policy offers_update on public.offers
  for update to authenticated
  using (false)
  with check (false);

create policy offers_delete on public.offers
  for delete to authenticated
  using (false);

-- Cinto e suspensório, como em rate_limit_hits: o revoke tira até o grant que
-- o "alter default privileges" do Supabase concede sozinho. anon não tem o que
-- fazer aqui — não existe tela pública de oferta.
revoke all on public.offers from anon;
revoke insert, update, delete on public.offers from authenticated;
