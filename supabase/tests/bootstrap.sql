-- Só para rodar o teste FORA do stack do Supabase.
--
-- Recria o mínimo que a imagem do Supabase já traz de fábrica: os papéis anon
-- e authenticated, o schema auth com auth.uid(), e — o mais importante — os
-- grants de tabela. Sem os grants, o teste passaria pelo motivo errado:
-- "permission denied" em vez de RLS filtrando linha. O teste confere isso.
--
-- Contra um banco Supabase de verdade este arquivo NÃO roda; lá tudo isso já
-- existe. Ver supabase/tests/run.sh.

create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role;

-- Espelho pobre de auth.users: o teste só precisa do id, que é o alvo das FKs.
create table auth.users (
  id uuid primary key,
  email text
);

-- Mesma definição do Supabase: o "sub" do JWT, que o PostgREST deixa no GUC
-- request.jwt.claims a cada requisição.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid;
$$;

grant usage on schema public to anon, authenticated, service_role;

-- É isto que o Supabase faz por padrão: o cliente TEM grant nas tabelas, e
-- quem decide linha a linha é o RLS. Precisa valer para as tabelas que as
-- migrations criam depois deste arquivo.
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
