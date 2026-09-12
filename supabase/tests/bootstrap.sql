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

-- O mínimo de storage para as policies da capa existirem fora do stack.
--
-- Mesma razão do auth acima: sem isto, a migration da capa não aplicaria e o
-- capa.sql sumiria em silêncio nesta máquina — teste que some é pior do que
-- teste nenhum. As colunas são só as que as policies e o teste tocam.
create schema if not exists storage;
grant usage on schema storage to anon, authenticated, service_role;

create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text,
  owner uuid,
  created_at timestamptz default now(),
  unique (bucket_id, name)
);

alter table storage.objects enable row level security;

-- É o que o Supabase faz: o cliente TEM grant, e quem decide linha a linha é o
-- RLS. Se aqui faltasse o grant, o teste passaria por "permission denied" em
-- vez de por policy — que é passar pelo motivo errado.
grant select, insert, update, delete on storage.objects to anon, authenticated, service_role;
grant select on storage.buckets to service_role;
