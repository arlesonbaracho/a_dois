#!/usr/bin/env bash
# packages/ não pode tocar em API de navegador.
#
# packages/core e packages/api vão inteiros para o Expo na fase 2. Um window
# ali dentro não quebra nada hoje — quebra daqui a três meses, no Metro, longe
# de quem escreveu.
#
# O tsc de core já barra parte disso pelo lib sem DOM, mas packages/api tem
# @types/react e não barra. Este guarda pega o que o compilador não pega.
#
# Roda antes do push e no CI:  npm run guardas
set -euo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Só identificador solto: "window." pega, "janela.window" não, e comentário
# também não — senão o guarda proíbe explicar por que a regra existe.
padrao='(^|[^.[:alnum:]_"'"'"'`])(window|document|localStorage|sessionStorage|navigator)[.[]'

achados="$(grep -rnE "$padrao" "$raiz/packages" \
  --include='*.ts' --include='*.tsx' \
  --exclude-dir=node_modules --exclude-dir=dist \
  2>/dev/null | grep -vE ':[[:space:]]*(//|\*|/\*)' || true)"

if [ -n "$achados" ]; then
  echo "REPROVADO: API de navegador dentro de packages/:" >&2
  echo "$achados" | sed 's/^/  /' >&2
  echo >&2
  echo "packages/ roda também no React Native. Receba do ambiente por parâmetro." >&2
  exit 1
fi

echo "guarda-portabilidade: packages/ sem window, document, localStorage ou navigator"
