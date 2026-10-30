# Assinatura permanente de testes — geração 2

A geração 2 foi autorizada em 30/10/2026 porque a chave anterior ficou inacessível.
O certificado ativo está em `android-identity.json`; o certificado antigo permanece
registrado como aposentado. O applicationId continua `com.lucascunha.panelinha.teste`.
Nunca gere outra chave para restaurar uma máquina: recupere o backup desta chave.

O usuário confirmou a recuperação fora do Codex: decifragem no OpenKeychain do
Android e visualização dos cinco arquivos do ZIP, sem extrair nem compartilhar
o conteúdo. A configuração dos GitHub Secrets ainda depende da liberação de
acesso descrita em `AUTOMACAO_ANDROID.md`.

## Somente pelo celular Android (recomendado para este projeto)

1. Instale o OpenKeychain a partir de uma loja confiável. Crie uma chave pessoal
   com senha longa exclusiva. Não confunda esta chave de criptografia com a chave
   de assinatura do APK, que já existe no ambiente.
2. Guarde a senha no gerenciador de senhas. Use a opção de backup/exportação
   **secreta** do OpenKeychain para guardar sua própria chave de decifragem em
   armazenamento privado seguro, fora deste chat. Sem ela, perder o celular pode
   tornar o backup do APK inacessível.
3. Exporte/compartilhe somente a **chave pública**, normalmente um `.asc` que
   começa com `BEGIN PGP PUBLIC KEY BLOCK`. Essa parte pode ser enviada ao Codex.
   Nunca envie uma exportação `PRIVATE KEY BLOCK` nem sua senha.
4. O Codex poderá cifrar os quatro arquivos de assinatura para essa chave pública
   usando `backup_assinatura.py --public-key`. Só será entregue o `.gpg` cifrado,
   por transferência privada, nunca os quatro arquivos brutos.
5. Baixe o `.gpg` no celular e mantenha outra cópia privada fora do celular.
   Abra-o com o OpenKeychain e confirme a decifragem. O resultado é um `.zip`
   sensível: mantenha-o em armazenamento protegido, não compartilhe pelo chat e
   não extraia para uma pasta pública/sincronizada. Após conferir a restauração,
   remova a cópia de trabalho sem cifragem e mantenha o backup cifrado.
6. Confirme download e decifragem antes de descartar/republicar a máquina.
   Só então o backup externo estará verificado. A existência de um arquivo
   privado no Codex não confirma proteção fora dele.

Alternativa com Termux de fonte confiável: `pkg install gnupg`, depois
`gpg --full-generate-key` (RSA 3072, assinatura/cifragem). Exporte a chave pública
com `gpg --armor --export SEU_IDENTIFICADOR > chave-publica.asc` e compartilhe apenas
essa exportação. Senhas são digitadas só no prompt privado do celular. Guarde
também uma exportação privada cifrada da chave GPG fora do celular, sem enviá-la.

## Guardar fora do Codex

O diretório `/workspace/.panelinha-private` é privado, mas ainda pertence à máquina
Codex. Isso **não é backup externo**. Não publique nem anexe seus quatro arquivos a
commits, Releases, artifacts ou mensagens. GitHub Secrets também não são um backup
exportável: seus valores não podem ser recuperados depois de enviados.

Em um terminal privado da máquina que contém a chave, execute:

```sh
python3 ferramentas/backup_assinatura.py /workspace/.panelinha-private /workspace/panelinha-assinatura-backup.zip.gpg
```

Escolha uma senha longa exclusiva na entrada oculta do terminal, nunca no chat;
guarde-a em seu gerenciador de senhas. O script cifra com GPG/AES-256, testa a
decifragem internamente e não grava o arquivo ZIP sem cifragem.

Uma alternativa que dispensa digitar a senha do backup no Codex é fornecer apenas
sua **chave pública GPG** e usar `--public-key /caminho/chave-publica.asc`.
A chave privada GPG deve permanecer no seu computador. Nesse modo o teste de
restauração deve acontecer no computador do destinatário.

Transfira apenas o `.gpg` por download privado/autenticado da plataforma. Não use
link público. Se sua interface não permite download privado, use uma transferência
privada autorizada: não envie o arquivo bruto nem a senha no chat. Guarde duas
cópias cifradas em locais independentes, por exemplo computador e backup offline.
Não descarte o ambiente antes de confirmar download e restauração fora do Codex.

## Testar a restauração no seu computador ou num ambiente futuro

Com GPG, JDK/keytool e uma cópia do código que contém a identidade ativa:

```sh
umask 077
mkdir -p "$HOME/panelinha-restauracao-privada"
gpg --output "$HOME/panelinha-restauracao-privada/backup.zip" --decrypt /caminho/panelinha-assinatura-backup.zip.gpg
unzip "$HOME/panelinha-restauracao-privada/backup.zip" -d "$HOME/panelinha-restauracao-privada"
rm "$HOME/panelinha-restauracao-privada/backup.zip"
python3 ferramentas/verificar_assinatura.py "$HOME/panelinha-restauracao-privada"
```

Confira o SHA-256 público contra `android-identity.json`. A verificação precisa
terminar com `OK`. Proteja a pasta restaurada e mantenha-a fora de sincronizações
públicas. Não apague a única cópia válida. O PKCS#12 não depende da máquina original:
de posse desses arquivos e das credenciais, pode ser usado offline em outro
computador; compilação ainda precisa das ferramentas/dependências Android.

## Configurar os quatro GitHub Repository Secrets

Depois de restaurar a mesma chave, com API liberada e permissão de Secrets:

```sh
bash ferramentas/configurar_secrets.sh "$HOME/panelinha-restauracao-privada"
```

O script confere o certificado ativo e envia valores por stdin, sem imprimi-los.
Ele consulta apenas os nomes para confirmar presença. Falha de rede/permissão não
significa que os secrets foram configurados. Não execute o workflow até os quatro
secrets corresponderem à geração 2; o verificador recusa o certificado antigo.

## Instalação no Android

Primeiro valide o novo APK e confirme o backup externo. A assinatura v2 não
atualiza a instalação v0.1/v0.1.1, pois a chave antiga foi perdida e não há prova
de rotação assinada por ela. A reinstalação única é **manual**, somente quando você
decidir: desinstalar a versão antiga apaga seus dados locais, depois instalar o
APK v0.2.0. Não há migração automática desses dados entre certificados.
Entre APKs da geração 2, use atualização por cima, com versionCode crescente.
