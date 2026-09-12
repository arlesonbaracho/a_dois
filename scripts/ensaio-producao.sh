#!/usr/bin/env bash
# Ensaia o `supabase db push` de produção, num Postgres descartável.
#
# Por que existe: o relatório de deploy registra que `db push` já morreu na 4ª
# migration e deixou o banco pela metade — e `db push` não é transacional
# ENTRE arquivos. Aqui as migrations pendentes rodam contra um banco no estado
# EXATO de produção, com dados dentro, antes de alguém tocar no hospedado.
#
# O que ele prova, nesta ordem:
#   1. as pendentes aplicam, uma a uma, sem levantar;
#   2. o backfill da regra escolhe o dono, e ignora quem saiu do casal;
#   3. `couple_members.split_rule` CONTINUA existindo depois delas — é o que
#      garante que o web publicado hoje não muda de comportamento;
#   4. a contração, aplicada depois, é a única que apaga alguma coisa.
#
#   bash scripts/ensaio-producao.sh
set -euo pipefail

# Quantas migrations o projeto hospedado já tem. Está no EVOLUCAO.md, na
# tabela "Migrations: repositório × produção". Mudou lá? Mude aqui.
EM_PRODUCAO="${EM_PRODUCAO:-11}"

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PG="${PGSQL_HOME:-$HOME/.local/pgsql}"
export LD_LIBRARY_PATH="$PG/lib:${LD_LIBRARY_PATH:-}"

[ -x "$PG/bin/initdb" ] || { echo "Sem Postgres em $PG. Aponte PGSQL_HOME." >&2; exit 1; }

todas=("$raiz"/supabase/migrations/*.sql)
aplicadas=("${todas[@]:0:$EM_PRODUCAO}")
pendentes=("${todas[@]:$EM_PRODUCAO}")

echo "produção tem ${#aplicadas[@]}; pendentes: ${#pendentes[@]}"
[ ${#pendentes[@]} -gt 0 ] || { echo "Nada pendente. Nada a ensaiar."; exit 0; }

tmp="$(mktemp -d)"
trap '"$PG/bin/pg_ctl" -D "$tmp/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$tmp"' EXIT

"$PG/bin/initdb" -D "$tmp/data" -U postgres --no-sync -A trust >/dev/null
"$PG/bin/pg_ctl" -D "$tmp/data" -o "-k $tmp -h ''" -l "$tmp/log" -w start >/dev/null
rodar() { "$PG/bin/psql" -h "$tmp" -U postgres -d postgres -v ON_ERROR_STOP=1 -q "$@"; }

# ---------------------------------------------------------------------------
# O estado de produção
# ---------------------------------------------------------------------------
# O bootstrap dos testes stuba auth e storage; o Postgres pelado não tem nem o
# schema `extensions` nem a publication do Realtime, que duas migrations
# esperam. São dois stubs, não um atalho: o que este ensaio mede é o efeito
# das PENDENTES, e elas não tocam em nenhum dos dois.
rodar -f "$raiz/supabase/tests/bootstrap.sql" >/dev/null
rodar >/dev/null <<'SQL'
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create publication supabase_realtime;

-- pg_cron não existe num Postgres pelado, e produção tem (foi habilitado no
-- painel antes do primeiro push). O stub só precisa aceitar a chamada: o que
-- este ensaio mede é o efeito das PENDENTES, e nenhuma delas agenda nada.
create schema if not exists cron;
create or replace function cron.schedule(text, text, text) returns bigint
  language sql as $f$ select 1::bigint $f$;
SQL

# `create extension if not exists pg_cron` levanta mesmo com o schema stubado.
# Neutralizar a linha é honesto aqui: a extensão existe no alvo de verdade, e
# o que está sendo ensaiado é outra coisa.
preparar() {
  sed 's/^create extension if not exists pg_cron;/-- (stub do ensaio) create extension pg_cron;/' "$1"
}

echo "--- subindo o estado de produção (${#aplicadas[@]} migrations)"
for m in "${aplicadas[@]}"; do
  preparar "$m" > "$tmp/m.sql"
  rodar -f "$tmp/m.sql" >/dev/null 2>"$tmp/erro" || {
    echo "  PAROU em $(basename "$m"):"; sed 's/^/       /' "$tmp/erro" | head -4; exit 1; }
done

# ---------------------------------------------------------------------------
# Dados, com os casos difíceis dentro
# ---------------------------------------------------------------------------
# O prefixo f9 é exclusivo deste ensaio: os testes de supabase/tests/ usam
# a0, a9, b0, c0, c1, ca, cb, d1 e e0, e colidir com um deles faria o ensaio
# reprovar por id repetido em vez de por migration ruim.
#
# Um casal decidindo 'proporcional' pelo DONO enquanto o parceiro tem 'igual'
# na linha dele — é o desempate que o backfill precisa acertar. Outro casal
# onde quem tinha 'fixo' JÁ SAIU: a regra de quem saiu não pode ganhar.
rodar >/dev/null <<'SQL'
insert into auth.users (id, email) values
  ('f9000001-0000-0000-0000-000000000001', 'ensaio-dono@teste.invalid'),
  ('f9000002-0000-0000-0000-000000000002', 'ensaio-parceiro@teste.invalid'),
  ('f9000003-0000-0000-0000-000000000003', 'ensaio-saiu@teste.invalid'),
  ('f9000004-0000-0000-0000-000000000004', 'ensaio-ficou@teste.invalid');

delete from public.couples;
insert into public.couples (id) values
  ('f9aaaaaa-0000-0000-0000-00000000000a'),
  ('f9bbbbbb-0000-0000-0000-00000000000b');

insert into public.couple_members (couple_id, user_id, role, split_rule, income_band, left_at) values
  ('f9aaaaaa-0000-0000-0000-00000000000a', 'f9000001-0000-0000-0000-000000000001', 'dono',     'proporcional', 'de_5_a_10_sm', null),
  ('f9aaaaaa-0000-0000-0000-00000000000a', 'f9000002-0000-0000-0000-000000000002', 'parceiro', 'igual',        'de_2_a_5_sm',  null),
  -- quem saiu tinha 'fixo': não pode decidir nada
  ('f9bbbbbb-0000-0000-0000-00000000000b', 'f9000003-0000-0000-0000-000000000003', 'dono',     'fixo',         null,           now()),
  ('f9bbbbbb-0000-0000-0000-00000000000b', 'f9000004-0000-0000-0000-000000000004', 'parceiro', 'igual',        null,           null);

insert into public.goals (id, couple_id, title, category, target_amount_cents) values
  ('f9100000-0000-0000-0000-00000000000a', 'f9aaaaaa-0000-0000-0000-00000000000a', 'Entrada do apê', 'casa', 12000000);
insert into public.contributions (couple_id, goal_id, user_id, amount_cents) values
  ('f9aaaaaa-0000-0000-0000-00000000000a', 'f9100000-0000-0000-0000-00000000000a', 'f9000001-0000-0000-0000-000000000001', 150000);
SQL
echo "--- dados semeados: 2 casais, 4 pessoas, 1 meta, 1 aporte"

# ---------------------------------------------------------------------------
# As pendentes, uma a uma
# ---------------------------------------------------------------------------
echo "--- aplicando as pendentes"
for m in "${pendentes[@]}"; do
  nome="$(basename "$m" .sql)"
  case "$nome" in
    *_contrai) echo "  (pulando $nome — é a contração, vai depois)"; continue ;;
  esac
  if rodar -f "$m" >/dev/null 2>"$tmp/erro"; then
    echo "  ok   $nome"
  else
    echo "  FALHOU $nome:"; sed 's/^/       /' "$tmp/erro"; exit 1
  fi
done

# ---------------------------------------------------------------------------
# O que tem que ser verdade agora
# ---------------------------------------------------------------------------
rodar <<'SQL'
do $$
declare n int; v text;
begin
  -- 1. O web PUBLICADO lê esta coluna. Ela não pode ter sumido.
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='couple_members' and column_name='split_rule';
  if n <> 1 then
    raise exception 'FALHOU: couple_members.split_rule sumiu — o web no ar quebra';
  end if;

  -- 2. O dono desempata.
  select split_rule::text into v from public.couples where id='f9aaaaaa-0000-0000-0000-00000000000a';
  if v <> 'proporcional' then
    raise exception 'FALHOU: backfill ignorou o dono, ficou "%"', v;
  end if;

  -- 3. Quem saiu do casal não vota: sobra o 'igual' de quem ficou.
  select split_rule::text into v from public.couples where id='f9bbbbbb-0000-0000-0000-00000000000b';
  if v <> 'igual' then
    raise exception 'FALHOU: a regra de quem saiu venceu, ficou "%"', v;
  end if;

  -- 4. A capa: coluna, bucket e as quatro policies.
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='goals' and column_name='cover_path';
  if n <> 1 then raise exception 'FALHOU: goals.cover_path não entrou'; end if;

  select count(*) into n from storage.buckets where id='capas' and public = false;
  if n <> 1 then raise exception 'FALHOU: bucket capas ausente ou público'; end if;

  select count(*) into n from pg_policy where polrelid='storage.objects'::regclass;
  if n <> 4 then raise exception 'FALHOU: storage.objects tem % policies, esperava 4', n; end if;

  -- 5. A sobrecarga ambígua não voltou.
  select count(*) into n from pg_proc where proname='create_couple_for';
  if n <> 1 then raise exception 'FALHOU: create_couple_for tem % versões', n; end if;

  -- 6. O dinheiro não foi tocado.
  select count(*) into n from public.contributions where amount_cents = 150000;
  if n <> 1 then raise exception 'FALHOU: o aporte sumiu no caminho'; end if;

  raise notice 'estado intermediário ok: as duas colunas convivem, backfill certo, capa no lugar';
end $$;
SQL

# ---------------------------------------------------------------------------
# A contração, que é a única que apaga
# ---------------------------------------------------------------------------
echo "--- aplicando a contração"
for m in "${pendentes[@]}"; do
  case "$(basename "$m" .sql)" in
    *_contrai)
      rodar -f "$m" >/dev/null 2>"$tmp/erro" || { echo "  FALHOU:"; sed 's/^/       /' "$tmp/erro"; exit 1; }
      echo "  ok   $(basename "$m" .sql)" ;;
  esac
done

rodar <<'SQL'
do $$
declare n int;
begin
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='couple_members' and column_name='split_rule';
  if n <> 0 then raise exception 'FALHOU: a contração não apagou a coluna'; end if;
  select count(*) into n from public.contributions where amount_cents = 150000;
  if n <> 1 then raise exception 'FALHOU: a contração levou dinheiro junto'; end if;
  raise notice 'contração ok: coluna morta apagada, dinheiro intacto';
end $$;
SQL

# A suíte roda aqui, e não antes, de propósito: ela descreve o DESTINO — o
# `aportes.sql` afirma que `couple_members.split_rule` não existe mais. Na
# parada intermediária ela reprovaria com razão, porque lá a coluna ainda
# está lá por desenho. Quem guarda o estado intermediário são as asserções
# de cima.
echo "--- a suíte inteira, contra o schema final"
for t in "$raiz"/supabase/tests/*.sql; do
  case "$(basename "$t")" in bootstrap.sql|run.sh) continue ;; esac
  rodar -f "$t" >/dev/null 2>"$tmp/erro" || {
    echo "  FALHOU $(basename "$t"):"; grep -E "ERROR|FALHOU" "$tmp/erro" | head -3 | sed 's/^/       /'; exit 1; }
done
echo "  ok   os 9 testes de isolamento"

echo
echo "ENSAIO APROVADO — as pendentes aplicam limpas sobre o estado de produção."
