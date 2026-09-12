#!/usr/bin/env bash
# Aplica em produção só as migrations que são seguras com o web atual no ar.
#
# Existe porque `supabase db push` aplica TUDO que está pendente, e uma das
# pendentes não pode entrar agora: `regra_do_casal_contrai` apaga
# `couple_members.split_rule`, que a versão publicada do app ainda lê.
#
# O jeito manual é tirar o arquivo da pasta, empurrar, e devolver. O risco é
# o push falhar no meio e o arquivo ficar fora do repositório — daí o `trap`,
# que devolve mesmo se der erro, mesmo se você apertar Ctrl+C.
#
#   bash scripts/subir-producao.sh
#
# Depois do deploy do web, a contração sobe com um `supabase db push` normal.
set -euo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$raiz"

# O que NÃO pode entrar agora. Vazio = pode empurrar tudo, e aí este script
# não tem mais razão de existir.
ADIADAS=("20260912150948_regra_do_casal_contrai.sql")

# A CLI é devDependency do workspace, não binário global — o resto do projeto
# a chama pelos scripts do npm, que põem node_modules/.bin no PATH.
if command -v supabase >/dev/null 2>&1; then
  sb() { supabase "$@"; }
else
  sb() { npx --no-install supabase "$@"; }
fi

sb --version >/dev/null 2>&1 || { echo "CLI do supabase não encontrada. Rode 'npm install'." >&2; exit 1; }

if ! sb projects list >/dev/null 2>&1; then
  echo "Não autenticado. Rode 'npx supabase login' primeiro." >&2; exit 1
fi

# Link não dá para fazer daqui: pede a senha do banco, e senha se digita à mão.
if [ ! -f supabase/.temp/project-ref ]; then
  echo "Projeto não linkado. Rode primeiro:" >&2
  echo "  npx supabase link --project-ref qysekkewsrwtebpiowim" >&2
  exit 1
fi
echo "projeto: $(cat supabase/.temp/project-ref)"

guardado="$(mktemp -d)"
devolver() {
  for f in "${ADIADAS[@]}"; do
    [ -f "$guardado/$f" ] && mv "$guardado/$f" "supabase/migrations/$f"
  done
  rmdir "$guardado" 2>/dev/null || true
}
trap devolver EXIT

for f in "${ADIADAS[@]}"; do
  if [ -f "supabase/migrations/$f" ]; then
    mv "supabase/migrations/$f" "$guardado/$f"
    echo "adiada: $f"
  fi
done

echo
echo "--- o que entraria (dry-run) ---"
saida="$(sb db push --dry-run 2>&1)" || { echo "$saida"; exit 1; }
echo "$saida"

# A conferência que um humano não faz: se alguma adiada escapou para a lista,
# parar antes de aplicar. É o erro que este script inteiro existe para evitar.
for f in "${ADIADAS[@]}"; do
  if grep -q "${f%.sql}" <<<"$saida"; then
    echo >&2
    echo "PARANDO: '$f' apareceu no dry-run e não devia." >&2
    exit 1
  fi
done

echo
read -r -p "Aplicar em produção? (digite: sim) " resposta
[ "$resposta" = "sim" ] || { echo "Cancelado. Nada foi aplicado."; exit 0; }

sb db push

echo
echo "Aplicado. O botão 'Pôr uma foto' deve voltar a funcionar agora, sem deploy."
echo "Confira em https://a-dois-web.vercel.app antes de seguir para o 'git push origin main'."
echo "O rollback de cada passo está em relatorios/subir-pendentes-2026-09-12.md."
