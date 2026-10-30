#!/usr/bin/env bash
# Envia valores por stdin para não expor a chave/senhas na linha de comando ou no log.
set -euo pipefail
set +x
private_dir="${1:?Uso: bash ferramentas/configurar_secrets.sh /pasta/privada}"
repo="LucasCunh4/Panelinha"
for item in panelinha-test.p12 store.password key.password alias.txt; do
  test -s "$private_dir/$item" || { echo "Arquivo necessário ausente: $item" >&2; exit 1; }
done
base64 < "$private_dir/panelinha-test.p12" | gh secret set ANDROID_KEYSTORE_BASE64 --repo "$repo"
gh secret set ANDROID_KEYSTORE_PASSWORD --repo "$repo" < "$private_dir/store.password"
gh secret set ANDROID_KEY_PASSWORD --repo "$repo" < "$private_dir/key.password"
gh secret set ANDROID_KEY_ALIAS --repo "$repo" < "$private_dir/alias.txt"
echo 'Quatro Secrets de Actions configurados. Não apague o backup privado da chave.'
