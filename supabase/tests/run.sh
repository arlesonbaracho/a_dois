#!/usr/bin/env bash
# Roda os testes de SQL do projeto, no melhor banco disponível.
#
# Ordem de preferência:
#   1. DATABASE_URL, se definida (CI, ou apontar para onde você quiser)
#   2. o stack local do Supabase, se estiver no ar — auth, papéis e migrations
#      de verdade, é o alvo que vale
#   3. um Postgres descartável em socket unix, com o auth stubbado em
#      bootstrap.sql — só para máquina sem Docker
#
# O alvo escolhido é impresso. Um teste que roda contra o stub achando que
# rodou contra o Supabase é pior do que teste nenhum.
set -euo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
testes=(
  "$raiz/supabase/tests/rls_isolamento.sql"
  "$raiz/supabase/tests/cadastro_cria_casal.sql"
  "$raiz/supabase/tests/perfil.sql"
  "$raiz/supabase/tests/convite.sql"
  "$raiz/supabase/tests/saida.sql"
)
PG="${PGSQL_HOME:-$HOME/.local/pgsql}"

psql_bin="$(command -v psql || true)"
[ -n "$psql_bin" ] || psql_bin="$PG/bin/psql"
[ -x "$psql_bin" ] || { echo "psql não encontrado (nem no PATH, nem em $PG/bin)" >&2; exit 1; }
export LD_LIBRARY_PATH="$PG/lib:${LD_LIBRARY_PATH:-}"

# Porta do [db] em supabase/config.toml. Mudou lá? Exporte DATABASE_URL.
local_supabase="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

alvo="${DATABASE_URL:-}"
if [ -z "$alvo" ] && "$psql_bin" "$local_supabase" -c 'select 1' >/dev/null 2>&1; then
  alvo="$local_supabase"
fi

if [ -n "$alvo" ]; then
  echo "alvo: ${alvo%%\?*}"
  for t in "${testes[@]}"; do
    "$psql_bin" "$alvo" -v ON_ERROR_STOP=1 -q -f "$t"
  done
  exit 0
fi

if [ ! -x "$PG/bin/initdb" ]; then
  echo "Sem stack do Supabase no ar, sem DATABASE_URL e sem Postgres em $PG." >&2
  echo "Rode 'npx supabase start', ou aponte PGSQL_HOME." >&2
  exit 1
fi

echo "alvo: Postgres descartável com auth stubbado (o stack do Supabase não está no ar)"
tmp="$(mktemp -d)"
trap '"$PG/bin/pg_ctl" -D "$tmp/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$tmp"' EXIT

"$PG/bin/initdb" -D "$tmp/data" -U postgres --no-sync -A trust >/dev/null
"$PG/bin/pg_ctl" -D "$tmp/data" -o "-k $tmp -h ''" -l "$tmp/log" -w start >/dev/null

rodar() { "$PG/bin/psql" -h "$tmp" -U postgres -d postgres -v ON_ERROR_STOP=1 -q "$@"; }

rodar -f "$raiz/supabase/tests/bootstrap.sql"
for m in "$raiz"/supabase/migrations/*.sql; do rodar -f "$m"; done
for t in "${testes[@]}"; do rodar -f "$t"; done
