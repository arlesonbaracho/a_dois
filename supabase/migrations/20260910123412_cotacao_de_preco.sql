-- Cotação de preço: o caminho de escrita de price_quotes.
--
-- A tabela já existe desde a migration inicial, já é append-only (update e
-- delete negam com using(false)) e já tem RLS. O que faltava era o caminho de
-- entrada — e ele não pode ser insert direto, pelo mesmo motivo de goals e
-- contributions: o cliente teria que mandar o couple_id no corpo da
-- requisição, e a regra 3 diz que ele vem do JWT.
--
-- Quem chama esta função é a Edge Function extract-product-link, com a anon key
-- e o Authorization de quem pediu. Ou seja: ela roda como a pessoa, e não como
-- service role. A função só encurta o que a pessoa já poderia fazer, ela não
-- amplia nada.


-- ===========================================================================
-- Insert direto passa a negar
-- ===========================================================================

drop policy price_quotes_insert on public.price_quotes;

-- A negação fica escrita, e não é ausência de policy: as três operações de
-- escrita desta tabela agora dizem "não" com todas as letras, e a única porta
-- é add_price_quote.
create policy price_quotes_insert on public.price_quotes
  for insert to authenticated
  with check (false);


-- ===========================================================================
-- add_price_quote
-- ===========================================================================

-- Sempre insere. Nunca atualiza — é o histórico de preço daquele item, e um
-- histórico que se reescreve não é histórico. A policy de update já negava;
-- esta função nem tem por onde tentar.
create function public.add_price_quote(
  p_goal_item_id uuid,
  p_price_cents bigint,
  p_source_url text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_couple_id uuid := public.meu_casal_id();
  v_url text := trim(coalesce(p_source_url, ''));
  v_quote_id uuid;
begin
  if (select auth.uid()) is null or v_couple_id is null then
    raise exception 'Você ainda não tem um plano por aqui';
  end if;

  if coalesce(p_price_cents, -1) < 0 then
    raise exception 'O preço não pode ser negativo';
  end if;

  -- A URL vai ser guardada e mostrada depois. Só http e https entram: guardar
  -- javascript: ou data: seria plantar hoje o link que alguém clica amanhã.
  if v_url !~* '^https?://' or length(v_url) > 2000 then
    raise exception 'Endereço de origem inválido';
  end if;

  -- O item tem que ser do casal de quem chamou. A FK composta também recusaria,
  -- mas com erro de constraint em vez de recusa nossa, e depender de qual erro
  -- o banco levanta é depender de sorte.
  if not exists (
    select 1 from public.goal_items as i
    where i.id = p_goal_item_id and i.couple_id = v_couple_id
  ) then
    raise exception 'Esse item não é do plano de vocês';
  end if;

  insert into public.price_quotes (couple_id, goal_item_id, price_cents, source_url)
  values (v_couple_id, p_goal_item_id, p_price_cents, v_url)
  returning id into v_quote_id;

  return v_quote_id;
end;
$$;

comment on function public.add_price_quote(uuid, bigint, text) is
  'Grava um preço observado. Sempre insere, nunca atualiza. couple_id sai do JWT.';

revoke execute on function public.add_price_quote(uuid, bigint, text) from public, anon;
grant execute on function public.add_price_quote(uuid, bigint, text) to authenticated;
