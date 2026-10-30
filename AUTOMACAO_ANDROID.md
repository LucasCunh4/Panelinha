# Finalizar os Secrets e a compilação automatizada

A assinatura da geração 2 já existe e foi usada no APK 0.2.0/c2000. Não gerar,
rotacionar ou substituir a chave. O backup cifrado foi recuperado e os cinco
arquivos foram visualizados pelo usuário fora do Codex, no OpenKeychain Android.

## Impedimento observado no Codex

`api.github.com` ainda não está permitido na política de rede em execução.
A conexão HTTPS falha no proxy com `Tunnel connection failed: 403 Forbidden`,
antes de chegar à API. Outro login não concede acesso a um domínio bloqueado.

O CLI `gh` está disponível, mas usa `GH_TOKEN` gerenciado da plataforma e recusa
iniciar `gh auth login --web` em paralelo. Não remover, copiar ou substituir
essa credencial para contornar a configuração. Não solicitar tokens no chat.

O rascunho já permite `api.github.com` e `uploads.github.com`, preservando os
presets. É necessário revisar/salvar e publicar essa configuração nas opções
do ambiente para aplicá-la. O agente não publicou o ambiente. A liberação da rede
não comprova permissão de administrar Secrets: testar a operação após aplicar.

## Caminho preferido: configurar diretamente nesta máquina

Depois de liberar a API, no checkout da geração 2:

```sh
python3 ferramentas/verificar_assinatura.py /workspace/.panelinha-private
bash ferramentas/configurar_secrets.sh /workspace/.panelinha-private
```

O script confere o certificado ativo, consulta a API antes de iniciar e envia
os quatro valores por stdin, sem imprimi-los. Confirma apenas os nomes:
`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_PASSWORD`,
`ANDROID_KEY_ALIAS`. Se faltar autorização, parar e corrigir o acesso; não usar
outra chave. A presença dos nomes não comprova os valores: o APK precisa ser
assinado e seu certificado comparado depois.

## Alternativa: autenticação oficial no próprio celular

Em Termux de fonte confiável, onde não há a credencial gerenciada do Codex:

```sh
pkg install gh git python openjdk-21
gh auth login --hostname github.com --git-protocol https --web
```

Abra `https://github.com/login/device` no navegador do celular e digite o código
mostrado no seu próprio Termux. Confira que está autorizando o GitHub CLI para
sua conta. Não enviar código, senha ou token pelo chat. A autorização precisa
permitir administrar Repository Secrets de `LucasCunh4/Panelinha`.

Importe/restaure os quatro arquivos do backup somente na área privada do Termux,
por exemplo `$HOME/.panelinha-private`, com pasta 0700 e arquivos 0600. Não extrair
para Downloads, armazenamento compartilhado ou pastas sincronizadas. Se não houver
transferência privada entre os aplicativos, use o caminho preferido acima.

```sh
gh repo clone LucasCunh4/Panelinha
cd Panelinha
git switch android/assinatura-permanente-v2
python3 ferramentas/verificar_assinatura.py "$HOME/.panelinha-private"
bash ferramentas/configurar_secrets.sh "$HOME/.panelinha-private"
```

Esse script utiliza os arquivos sem exigir copiar valores para mensagens ou
campos públicos. Não exportar um token do celular para a sessão Codex.

## Execução e confirmação do certificado

Somente depois dos quatro Secrets cadastrados, colocar a configuração da geração
2 na branch que executará o workflow. A branch de recuperação contém essa
configuração; `android/apk-testes` ainda deve ser conferida antes da execução.
Não executar a configuração antiga com a chave nova: seu verificador recusará.

O workflow existente é disparado por push em `android/apk-testes` ou `main` quando
há mudanças nos caminhos Android, incluindo `android-identity.json`. A atualização
por fast-forward da branch Android para a recuperação, preservando todo o histórico,
pode disparar a execução sem alterar a main. Conferir o diff remoto primeiro.
O botão/API `workflow_dispatch` exige que o workflow exista na branch padrão.

Monitorar o job até sucesso e baixar seu APK/JSON. Executar `verificar_apk.py`
no APK baixado e exigir que `certificateSha256` seja igual ao de
`android-identity.json`, geração 2. Os quatro Secrets não estão confirmados até
essa compilação hospedada passar. Os testes locais já aprovaram c2000 → c2001,
sem desinstalar, preservando UID, localStorage e SharedPreferences.
