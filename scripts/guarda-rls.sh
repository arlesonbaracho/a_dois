#!/usr/bin/env bash
# Toda tabela criada em supabase/migrations/ tem RLS ligado?
#
# A anon key fica embarcada no cliente, então uma tabela sem RLS não é um
# descuido: é a tabela inteira publicada na internet. É a regra 1 do CLAUDE.md,
# e é a única que ninguém percebe quando esquece — o app continua funcionando.
#
# Roda antes do push e no CI:  npm run guardas
set -euo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
migrations="$raiz/supabase/migrations"

# "create table public.x (" e "create table if not exists public.x", com ou sem
# o schema escrito. Comentário de linha inteira fica de fora.
criadas="$(grep -rhoiE '^[[:space:]]*create table (if not exists )?(public\.)?[a-z_][a-z0-9_]*' \
  "$migrations" 2>/dev/null | grep -oiE '[a-z_][a-z0-9_]*$' | sort -u || true)"

comRls="$(grep -rhoiE 'alter table (public\.)?[a-z_][a-z0-9_]*[[:space:]]+enable row level security' \
  "$migrations" 2>/dev/null | grep -oiE '[a-z_][a-z0-9_]*[[:space:]]+enable' \
  | awk '{print $1}' | sort -u || true)"

faltando="$(comm -23 <(echo "$criadas") <(echo "$comRls"))"

if [ -n "$faltando" ]; then
  echo "REPROVADO: tabela criada sem 'enable row level security':" >&2
  echo "$faltando" | sed 's/^/  - /' >&2
  echo >&2
  echo "A anon key está embarcada no cliente. Sem RLS, esta tabela é pública." >&2
  exit 1
fi

echo "guarda-rls: $(echo "$criadas" | grep -c . ) tabelas, todas com RLS"
