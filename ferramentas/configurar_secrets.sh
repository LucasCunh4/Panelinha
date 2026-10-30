#!/usr/bin/env bash
# Envia valores por stdin para não expor a chave/senhas na linha de comando ou no log.
set -euo pipefail
set +x
private_dir="${1:?Uso: bash ferramentas/configurar_secrets.sh /pasta/privada}"
repo="LucasCunh4/Panelinha"
for item in panelinha-test.p12 store.password key.password alias.txt; do
  test -s "$private_dir/$item" || { echo "Arquivo necessário ausente: $item" >&2; exit 1; }
done
script_dir="$(cd -- "$(dirname -- "$0")" && pwd)"
python3 "$script_dir/verificar_assinatura.py" "$private_dir"
# Consultar primeiro: se rede/permissão falhar, não iniciar uma atualização parcial.
gh api "repos/$repo/actions/secrets?per_page=100" --jq '.total_count' >/dev/null
base64 < "$private_dir/panelinha-test.p12" | gh secret set ANDROID_KEYSTORE_BASE64 --repo "$repo"
gh secret set ANDROID_KEYSTORE_PASSWORD --repo "$repo" < "$private_dir/store.password"
gh secret set ANDROID_KEY_PASSWORD --repo "$repo" < "$private_dir/key.password"
gh secret set ANDROID_KEY_ALIAS --repo "$repo" < "$private_dir/alias.txt"
gh api "repos/$repo/actions/secrets?per_page=100" --jq '[.secrets[].name]' | python3 -c '
import json,sys
expected={"ANDROID_KEYSTORE_BASE64","ANDROID_KEYSTORE_PASSWORD","ANDROID_KEY_PASSWORD","ANDROID_KEY_ALIAS"}
assert expected.issubset(json.load(sys.stdin)), "Secrets ausentes após configuração"
'
echo 'Quatro Secrets de Actions configurados. Não apague o backup privado da chave.'
