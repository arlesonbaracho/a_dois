#!/usr/bin/env bash
# Roda o teste de isolamento entre casais.
#
# Com DATABASE_URL definido (stack local do Supabase, ou CI), roda direto
# contra ele: lá os papéis, o schema auth e as migrations já existem.
#
# Sem DATABASE_URL, sobe um Postgres descartável em socket unix, aplica o
# bootstrap e as migrations, roda o teste e derruba tudo. É o que permite
# rodar este teste em máquina sem Docker.
set -euo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
teste="$raiz/supabase/tests/rls_isolamento.sql"

if [ -n "${DATABASE_URL:-}" ]; then
  exec psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$teste"
fi

PG="${PGSQL_HOME:-$HOME/.local/pgsql}"
if [ ! -x "$PG/bin/initdb" ]; then
  echo "Sem Postgres em $PG e sem DATABASE_URL." >&2
  echo "Suba o stack do Supabase e exporte DATABASE_URL, ou aponte PGSQL_HOME." >&2
  exit 1
fi
export LD_LIBRARY_PATH="$PG/lib:${LD_LIBRARY_PATH:-}"

tmp="$(mktemp -d)"
trap '"$PG/bin/pg_ctl" -D "$tmp/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$tmp"' EXIT

"$PG/bin/initdb" -D "$tmp/data" -U postgres --no-sync -A trust >/dev/null
"$PG/bin/pg_ctl" -D "$tmp/data" -o "-k $tmp -h ''" -l "$tmp/log" -w start >/dev/null

rodar() { "$PG/bin/psql" -h "$tmp" -U postgres -d postgres -v ON_ERROR_STOP=1 -q "$@"; }

rodar -f "$raiz/supabase/tests/bootstrap.sql"
for m in "$raiz"/supabase/migrations/*.sql; do rodar -f "$m"; done
rodar -f "$teste"
