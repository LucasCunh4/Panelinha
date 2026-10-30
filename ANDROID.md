# Panelinha Teste — Android

O Android é um contêiner Capacitor 8.6.0 do jogo existente. `IMPORTACAO_PANELAS/` permanece a versão web independente. `npm run build` confere as 52 imagens e copia `index.html`, `mesa.css`, `mesa.js` e `assets/` para `dist/`, sem reescrever o jogo. `npm run sync:android` sincroniza esse pacote com o aplicativo. Não usa servidor remoto, conta ou multiplayer.

## Identidade permanente de atualização

- Nome: **Panelinha Teste**.
- applicationId/namespace: **`com.lucascunha.panelinha.teste`**.
- Origem local do WebView: **`https://localhost`**.
- Certificado público SHA-256 registrado em `android-identity.json`.
- Android mínimo: **7.0 (API 24)**, com Android System WebView atualizado; target/compile API 36; retrato e paisagem por sensor.

Para atualizar sem desinstalar, todos os APKs precisam conservar o applicationId, o certificado e essa origem. `versionCode` precisa crescer. O verificador rejeita outro certificado, outro pacote ou outra origem. Não rode `adb uninstall`, não limpe os dados e não use outra chave de debug.

O protótipo atual não grava a partida em andamento. Seu fechamento já reinicia a partida na versão web; este trabalho não adiciona salvamento nem altera essa lógica. A atualização conserva o diretório de dados do Android, localStorage e outros dados que o aplicativo efetivamente tiver gravado. Isso não transforma estado apenas em memória em uma partida salva.

## Assinatura exclusiva de testes

A chave **já foi criada** fora do repositório, no diretório privado da máquina de trabalho `/workspace/.panelinha-private/`, com acesso restrito ao dono. Não há senha ou chave privada no Git, no APK ou no código. Não gere outra chave: ela não conseguiria atualizar o primeiro APK instalado.

Arquivos privados necessários, nunca versionar:

| Arquivo privado | Finalidade |
| --- | --- |
| `panelinha-test.p12` | Chave de assinatura PKCS#12 |
| `store.password` | Senha do keystore |
| `key.password` | Senha da chave |
| `alias.txt` | Alias da chave |

Mantenha uma cópia desse diretório em armazenamento privado seguro antes de descartar o ambiente. A cópia apenas nesta máquina não substitui um backup durável. Não envie esses arquivos em commits, Releases, artifacts de Actions ou mensagens públicas. A perda da chave impede continuar a mesma linha de atualização. Este certificado é exclusivo para testes, não uma decisão de assinatura da futura versão de produção.

### Configurar GitHub Actions Secrets sem mostrar os valores

Com o CLI `gh` autorizado a administrar Secrets deste repositório, execute **nesta máquina**:

```sh
bash ferramentas/configurar_secrets.sh /workspace/.panelinha-private
```

O script envia os valores por stdin, sem imprimi-los ou colocá-los em argumentos de comandos. Ele cria quatro **Repository secrets** em `LucasCunh4/Panelinha`:

| Nome em Settings → Secrets and variables → Actions | Conteúdo |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Base64 do arquivo `panelinha-test.p12` existente |
| `ANDROID_KEYSTORE_PASSWORD` | Conteúdo de `store.password` |
| `ANDROID_KEY_PASSWORD` | Conteúdo de `key.password` |
| `ANDROID_KEY_ALIAS` | Conteúdo de `alias.txt` |

A alternativa manual é inserir os mesmos valores em **New repository secret**, sempre a partir de uma cópia privada da chave já criada. Não crie um keystore novo para preencher esses campos. O script é preferível porque dispensa copiar senhas em telas/terminal.

A rede da sessão inicialmente bloqueava `api.github.com` e `uploads.github.com`. Os dois domínios foram adicionados ao rascunho de configurações do ambiente, preservando os presets existentes. É necessário aplicar essa configuração antes de o agente conseguir enviar Secrets ou criar uma Release. Liberar rede não garante permissão: o acesso da conta à API ainda precisa ser confirmado. Nunca coloque tokens no chat; use a autenticação gerenciada ou configuração segura da plataforma.

## Compilar localmente

Requisitos: Node.js 22+, JDK 21, Android SDK com `platforms;android-36`, `build-tools;35.0.0`, `build-tools;36.0.0`, `platform-tools`. O Gradle 8.14.3 vem pelo wrapper, com SHA-256 oficial fixado. Preserve TLS e as verificações de checksum. Configure `JAVA_HOME` e `ANDROID_HOME`.

```sh
npm ci --ignore-scripts --no-audit --no-fund
python3 ferramentas/compilar_android.py --secrets-dir /caminho/privado --code 100 --name 0.1 --test-apk
```

O código 100 é da **primeira versão somente**. Para compilações locais posteriores, escolha um código maior do que todos os APKs já distribuídos; nunca volte a 100. O método normal de atualização é o workflow, que calcula isso automaticamente.

A saída fica em `artifacts/Panelinha-Teste-v0.1-c100.apk` e em um JSON com hash/metadados. A compilação executa `apksigner verify`, verifica a assinatura v2, o certificado fixo, o pacote, a origem e cada um dos 52 PNGs/jogo original dentro do APK. Não distribui APK sem assinatura. O código do app de testes Android é separado e não entra no APK do jogo.

## Próximas versões pelo GitHub

1. Configure os quatro Secrets com **a mesma chave do primeiro APK**.
2. Integre a branch `android/apk-testes` à `main` para disponibilizar o botão manual de Actions.
3. Após alterações no jogo pelo Codex, envie o código à `main`. O workflow **APK Android de testes** começa automaticamente. Também pode usar **Actions → APK Android de testes → Run workflow**.
4. O workflow instala dependências pelo lockfile, prepara a web, sincroniza o Capacitor, compila/assina o APK e verifica seu conteúdo/certificado.
5. Executa testes reais em Android 35 offline e instala uma segunda compilação por cima da primeira para conferir os dados locais. Só publica depois que os testes passam.
6. Baixe o APK em **Releases**, numa versão marcada **Pre-release**. Também fica nos artifacts da execução por 90 dias. No celular, toque no APK e aceite **Atualizar**. Não desinstale antes.

Cada execução gera `v0.1.N`, onde N é o `GITHUB_RUN_NUMBER`; reexecuções usam sufixo `-rT`. `versionCode = 1000 + 100*N + 2*T`, acima do 100 inicial. O código seguinte (+1) é reservado para o teste automático de atualização e não é publicado. O mesmo workflow serializa publicações para impedir duas assinaturas/publicações concorrentes.

**Não renomeie/exclua/recrie `.github/workflows/android-testes.yml` nem reinicie sua sequência.** Isso pode reiniciar `run_number`. Se precisar mudar o mecanismo, aumente a base de `versionCode` acima de todos os códigos anteriores. Não recrie tags/Releases existentes para ocultar uma falha; a reexecução produz outra identificação.

O workflow não usa chave de debug descartável. Se faltar algum Secret, ele falha com orientação e não gera outro certificado. Os arquivos privados temporários são apagados do runner ao finalizar. A chave privada não é anexada aos artifacts ou Releases.

## Testes

Testes web existentes continuam disponíveis por HTTP: `node testes/integracao.cjs`, `node testes/mesa.cjs`. O código web original não foi modificado.

A instrumentação Android (`OfflineGameTest`, 4 testes) verifica no APK real: ausência de rede, decodificação de todos os 52 PNGs, quatro jogadores/três bots, toques Android em carta/corte/compra +20, ação automática de bot e orientações retrato/paisagem. Também grava sentinelas em localStorage/SharedPreferences. A classe `UpdatePersistenceTest` (1 teste) confere essas sentinelas após `adb install -r` de um APK com código maior e a mesma assinatura. O script confirma também que o UID do aplicativo foi preservado.

```sh
bash ferramentas/testar_android.sh primeiro.apk seguinte.apk instrumentacao.apk
```

Esse script destina-se a um emulador/dispositivo exclusivo de testes: desliga Wi-Fi/dados e ativa modo avião. Não roda no celular pessoal sem essa intenção. Os resultados completos ficam em `artifacts/testes-android/`; a presença de `OK (4 tests)`/`OK (1 test)` é validada porque o comando de instrumentação pode retornar status 0 mesmo com falhas. Consulte `testes/ANDROID_RESULTADOS.md` para o que efetivamente foi executado nesta entrega.
