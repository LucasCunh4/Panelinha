# Panelinha Teste — Android

Atualização atual: [correções de interface e estabilidade](testes/CORRECOES_ESTABILIDADE_RESULTADOS.md). Preserva geração 2, `sensorLandscape`, imersão, dados locais e o workflow existente. Inclui novas verificações da Panela, mãos persistentes e duas bases interativas reparadas de +4/+6, sem alterar as frentes aprovadas.

> Assinatura ativa: **geração 2**, autorizada em 30/10/2026 após perda da chave
> anterior. Identidade pública e certificado aposentado em `android-identity.json`.
> v0.2.0/código 2000 inicia a nova família; 2001 é reservado ao teste de atualização.
> A instalação antiga exige reinstalação manual única, com perda de dados locais.
> Não há desinstalação automática. Veja `BACKUP_ASSINATURA.md`.

O Android é um contêiner Capacitor 8.6.0 do jogo existente. `IMPORTACAO_PANELAS/` permanece a versão web independente. `npm run build` confere as 52 imagens e copia o jogo para `dist/`. Apenas no pacote gerado, inclui `android-compat.js` antes dos scripts originais: APIs padronizadas ausentes em WebViews antigos, sem reescrever regras ou alterar os arquivos de `IMPORTACAO_PANELAS/`. `npm run sync:android` sincroniza esse pacote com o aplicativo. Não usa servidor remoto, conta ou multiplayer.

## Identidade permanente de atualização

- Nome: **Panelinha Teste**.
- applicationId/namespace: **`com.lucascunha.panelinha.teste`**.
- Origem local do WebView: **`https://localhost`**.
- Certificado público SHA-256 registrado em `android-identity.json`.
- Android mínimo: **7.0 (API 24)**, com Android System WebView atualizado (validação também em WebView 83); target/compile API 36; retrato e paisagem por sensor.

Para atualizar sem desinstalar, todos os APKs precisam conservar o applicationId, o certificado e essa origem. `versionCode` precisa crescer. O verificador rejeita outro certificado, outro pacote ou outra origem. Não rode `adb uninstall`, não limpe os dados e não use outra chave de debug.

O protótipo atual não grava a partida em andamento. Seu fechamento já reinicia a partida na versão web; este trabalho não adiciona salvamento nem altera essa lógica. A atualização conserva o diretório de dados do Android, localStorage e outros dados que o aplicativo efetivamente tiver gravado. Isso não transforma estado apenas em memória em uma partida salva.

## Assinatura exclusiva de testes

A chave **da geração 2 já foi criada** fora do repositório, no diretório privado da máquina de trabalho `/workspace/.panelinha-private/`, com acesso restrito ao dono. Não há senha ou chave privada no Git, no APK ou no código. Não gere outra chave: ela não conseguiria atualizar os APKs da geração 2. O primeiro APK antigo usa um certificado aposentado e não pode ser atualizado por esta chave.

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
python3 ferramentas/compilar_android.py --secrets-dir /caminho/privado --code 2000 --name 0.2.0 --test-apk
```

O comando acima reproduz a primeira versão da geração 2. O código 100 pertence à v0.1 e o 102 à v0.1.1, ambas da assinatura aposentada. O código 2001 fica reservado ao teste de atualização da nova família. Para uma versão local posterior, escolha um código maior do que todos os APKs já distribuídos; nunca volte a um código anterior. A criação de APK por Gradle sem versão explícita também é recusada. O método normal de atualização é o workflow, que calcula isso automaticamente.

A saída segue `artifacts/Panelinha-Teste-vVERSAO-cCODIGO.apk`, acompanhada de um JSON com hash/metadados. A compilação executa `apksigner verify`, verifica a assinatura v2, o certificado fixo, o pacote, a origem e cada um dos 52 PNGs e o jogo original dentro do APK. O HTML só pode diferir pela inclusão única do script de compatibilidade; os scripts e CSS originais permanecem íntegros. Não distribui APK sem assinatura. O código do app de testes Android é separado e não entra no APK do jogo.

## Próximas versões pelo GitHub

1. Configure os quatro Secrets com **a chave ativa da geração 2**.
2. Integre a branch de recuperação `android/assinatura-permanente-v2` (baseada em `android/apk-testes` e com a `main` preservada) à `main` para disponibilizar o workflow com a identidade ativa. Faça isso somente após confirmar backup e secrets da geração 2.
3. Após alterações no jogo pelo Codex, envie o código à `main`. O workflow **APK Android de testes** começa automaticamente. Também pode usar **Actions → APK Android de testes → Run workflow**.
4. O workflow instala dependências pelo lockfile, prepara a web, sincroniza o Capacitor, compila/assina o APK e verifica seu conteúdo/certificado.
5. Executa testes reais em Android 35 offline e instala uma segunda compilação por cima da primeira para conferir os dados locais. Só publica depois que os testes passam.
6. Baixe o APK em **Releases**, numa versão marcada **Pre-release**. Também fica nos artifacts da execução por 90 dias. Entre APKs da geração 2, toque no APK e aceite **Atualizar**. Não desinstale antes. Para migrar da assinatura antiga, consulte `BACKUP_ASSINATURA.md` e só faça a reinstalação manual após validar o APK e guardar o backup.

Cada execução gera `v0.2.N`, onde N é o `GITHUB_RUN_NUMBER`; reexecuções usam sufixo `-rT`. `versionCode` usa como base `2000 + 100*N + 2*T` e consulta todas as Releases para ficar também acima do maior código já publicado e do piso 2004, que inclui o APK 0.2.6/c2003 distribuído como artefato e seu candidato c2004 (+2, reservando +1 ao teste). O patch do nome também supera o histórico. Assim, execuções fora de ordem não publicam downgrade. A falha de consulta da API aborta o cálculo, sem assumir histórico vazio. O código seguinte (+1) é reservado para o teste automático de atualização e não é publicado. Uma tag que já exista faz a publicação falhar, evitando anexar APK a outro código-fonte. O mesmo workflow serializa publicações para impedir duas assinaturas/publicações concorrentes.

**Não renomeie/exclua/recrie `.github/workflows/android-testes.yml` nem reinicie sua sequência.** Isso pode reiniciar `run_number`. A consulta ao histórico oferece uma proteção adicional, mas não apague o histórico de Releases. Se precisar mudar o mecanismo, aumente a base de `versionCode` acima de todos os códigos anteriores. Não recrie tags/Releases existentes para ocultar uma falha; a reexecução produz outra identificação.

O workflow não usa chave de debug descartável. Se faltar algum Secret, ele falha com orientação e não gera outro certificado. Os arquivos privados temporários são apagados do runner ao finalizar. A chave privada não é anexada aos artifacts ou Releases.

## Testes

Testes web existentes continuam disponíveis por HTTP: `node testes/integracao.cjs`, `node testes/mesa.cjs`. As mudanças de regras autorizadas e a apresentação usam a mesma fonte web do APK; veja o relatório da atualização atual.

A instrumentação Android (`OfflineGameTest`, 6 testes) verifica no APK real: ausência de rede, decodificação de todos os 52 PNGs, quatro jogadores/três bots, toques Android em carta/Última Carta/corte/compra +20, ação automática de bot e orientações retrato/paisagem. Também grava sentinelas em localStorage/SharedPreferences. Acrescenta imersão/retorno ao menu, proteção dos recortes, Panela de Pressão, Liquidificador sem cor e cronômetro. A classe `UpdatePersistenceTest` (1 teste) confere essas sentinelas após `adb install -r` de um APK com código maior e a mesma assinatura. O script confirma também que o UID do aplicativo foi preservado.

```sh
bash ferramentas/testar_android.sh primeiro.apk seguinte.apk instrumentacao.apk
```

Esse script destina-se a um emulador/dispositivo exclusivo de testes: desliga Wi-Fi/dados e ativa modo avião. Não roda no celular pessoal sem essa intenção. Os resultados completos ficam em `artifacts/testes-android/`; a presença de `OK (6 tests)`/`OK (1 test)` é validada porque o comando de instrumentação pode retornar status 0 mesmo com falhas. Consulte `testes/ANDROID_RESULTADOS.md` para o que efetivamente foi executado nesta entrega.

## Compatibilidade Android sem alterar o jogo

O WebView 83 da imagem Android 11 não possui `String.prototype.replaceAll`, usado no histórico do protótipo. A falha interrompia o render antes do agendamento do bot. A versão **0.1.1 / código 102** inclui o polyfill padronizado de core-js e a compatibilidade de `Element.getAnimations` no pacote gerado. Não altera regras, bot, arquivos PNG nem a interface. A v0.1 / código 100 permanece no histórico; prefira instalar a 0.1.1 ou posterior, inclusive por cima da v0.1.

`node testes/android-compat.cjs`, apontado ao `dist/` servido por HTTP, simula a ausência dessas APIs e verifica mesa completa, turno automático de bot e Inverter. A instrumentação Android valida o pacote real. Ao substituir artes aprovadas no futuro, atualize também os hashes do manifesto de 52 PNGs para o build verificar os novos arquivos.

## Mesa V1 com recursos oficiais

A mesa usa os seis PNGs do pacote `Panelinha_Mesa_V1_Assets_e_Instrucoes.zip`, sem regenerar imagens ou mudar cartas. As instruções originais estão em `IMPORTACAO_PANELAS/documentacao/mesa-v1/`; `MANIFESTO_MESA_V1.json` acrescenta os SHA-256 para conferir o build e o APK real.

A fonte de regras continua no script existente de `IMPORTACAO_PANELAS/index.html`. A camada de apresentação fica em `mesa.css` e `mesa.js`. Fundo/chamas compartilham um plano nativo 1672×941, escala uniforme tipo cover e centro (836,451); cada chama mede 490×490 nesse plano. A mesa ocupa a viewport, enquanto mãos grandes podem rolar horizontalmente e o menu pode rolar internamente.

O monte recebe a ação de compra original; a carta com faca recebe a ação de corte original. Nenhuma regra, bot, pontuação ou pausa de corte foi alterada. O relatório e as limitações da validação estão em `testes/MESA_V1_RESULTADOS.md`.

A rodada seguinte refina as chamas por CSS, posiciona a compra à esquerda, dispõe as mãos dos oponentes diretamente na mesa, anima a carta da mão ao descarte e amplia a faca. Implementação, testes e evidências em `testes/REFINAMENTOS_MESA_RESULTADOS.md`; as imagens originais continuam intactas.

O cálculo de versão continua no mesmo workflow e consulta Releases, mas usa a base 2000 e o piso histórico 2004: uma compilação apenas em artefato também precisa superar o código 2003 já instalado. Execuções e tentativas seguintes crescem mesmo sem Release.

## Atualização de regras e mesa após 0.2.14

Distribuidora agora redistribui quantidades aleatórias, com limite da mão do autor após o descarte; Giro preserva a cor ativa e não abre modal. A janela de corte expira em 2200 ms, inclusive no handler. O ticker existente alimenta o indicador dos últimos cinco segundos.

Compras e descarte têm camadas visuais independentes do motor; até três jogadas permanecem representadas mesmo após reciclar o monte. Leques mostram todas as cartas; mãos humanas grandes começam centralizadas e preservam rolagem para acessar qualquer carta. Nenhum PNG foi alterado.

Na implementação anterior, o plugin local `TableWindow` usava imersão apenas na mesa. A seção “Mesa atual” abaixo registra a substituição por imersão permanente, inclusive nas configurações. O host reserva recortes e teclado; não muda a origem nem o diretório de dados. A versão web ignora a ponte nativa.

Resultados, decisões de casos limite e limitações em `testes/ATUALIZACAO_REGRAS_MESA_RESULTADOS.md`.

## Refinamentos e download direto após 0.2.16

Distribuidora conserva o baralho, dá no mínimo uma carta a cada participante e mantém o teto do autor após descartar. Não é utilizável como última carta, pois mínimo 1 e teto 0 seriam incompatíveis.

O workflow existente usa `actions/upload-artifact@v7` com `archive: false` **apenas para o arquivo APK**. Metadados e diagnósticos ficam em artefatos separados. O output `artifact-url` é registrado no resumo da execução; o download exige sessão no GitHub e entrega o próprio `.apk`, sem ZIP externo. A publicação em Release continua dependente da aprovação dos testes, e falhas permanecem visíveis.

O APK continua sendo verificado com a assinatura da geração 2 antes de ser disponibilizado; chave, pacote, origem e sequência de versionCode não mudaram. Resultados desta rodada em `testes/MESA_FINA_MINIMO_RESULTADOS.md`.


## Mesa atual: tamanho comum, sentido e imersão permanente

A disposição é 0 embaixo, 1 à direita, 2 em cima, 3 à esquerda. O valor interno +1 percorre esses assentos em sentido **anti-horário**; -1 é horário. Texto, seta, brilho da moldura e mensagens do Liquidificador seguem essa correspondência, sem inverter a ordem do motor. Os identificadores `dist`/`rotate` e as regras permanecem; os nomes visíveis são Panela de Pressão e Liquidificador.

Cartas humanas, adversários, parceiro, descarte e monte usam o mesmo tamanho-base responsivo. Leques laterais ficam em pé em retrato para deixar o centro livre, e girados nas laterais em paisagem. A centralização inclui nome/avatar. A pilha de compra tem seis camadas decorativas e um único contador real. O cronômetro final 5–1 fica à direita no mesmo eixo do monte e lê o prazo existente.

`MainActivity` mantém status/navigation bars ocultas no menu e na partida, na retomada/foco e após orientação. Usa `BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE`, com retorno automático se o sistema mostrar barras transitórias. Gestos do Android continuam possíveis; não há promessa de impedir barras temporárias exigidas pelo sistema. Recortes e teclado são reservados. Testes nativos continuam obrigatórios para aprovação da Release.

Verificações e resultados desta atualização: `testes/MESA_ATUAL_RESULTADOS.md`.


## Atualização posterior à 0.2.18: Panela e leque contínuo

A Panela de Pressão agora reduz a mão do autor em 1–3 cartas quando possível, sem baixar de 1; entre os demais, conserva todas as cartas com diferença máxima de duas. O último descarte pode vencer: o autor fica fora da redistribuição, que continua entre os restantes inclusive com penalidade acumulada, antes da finalização existente. Liquidificador e demais regras não mudaram.

Mãos humanas grandes continuam em um único leque de botões, ordenado por cor. Toque abre uma cor; o próximo toque pode jogar. Mouse usa intenção de 180 ms, clique fixa a abertura e toque/clique fora fecha. Uma cor com dezenas de cartas pode rolar somente dentro da mão. A faca preserva toque direto e janela de 2200 ms. As posições reais da mão alimentam os voos de compra/descarte.

O card superior fica ao lado do leque. Somente cartas dos bots/parceiro ficam um pouco menores (90% e 94% da base); humano, descarte e monte mantêm o tamanho. Textos redundantes centrais ficam fora da apresentação visual, com informação acessível nas opções/leitor de tela. O fluxo da moldura ganha cauda de 155/1000 do percurso e acompanha o mesmo `direction` do motor.

A instrumentação acrescenta `g_continuousFanTouch`: são **7 testes** de `OfflineGameTest`, além do teste de atualização/persistência. Mantém imersão permanente, assinatura, pacote, origem offline e publicação por APK direto. Resultados em `testes/PANELA_LEQUE_RESULTADOS.md`.


## Tela inicial e navegação após 0.2.19

`menu.css` e `navegacao.js` acrescentam a tela inicial Panelinha, caminhos de Um jogador e preparação de Multiplayer. A configuração é o `#menu` existente; todos os campos/valores e as regras continuam no mesmo `index.html`. Não há backend, autenticação, sala ou código real. Lilita One e licença OFL ficam em `assets/fonts/`, incluídas e verificadas offline pelo manifesto `MANIFESTO_MENU_V1.json`. A cozinha usa vetores derivados das formas de panelas existentes, sem copiar a mesa completa ou trocar as artes das cartas.

O histórico usa fragmentos da mesma origem e não altera localStorage/SharedPreferences. Voltar fecha escolha de cor/opções antes de pedir saída da mesa; cancelar conserva o estado. Uma partida encerrada não é recriada pelo Avançar do navegador. O Android usa `OnBackPressedDispatcher` para a mesma hierarquia; em início, pede confirmação para ir ao segundo plano. O teclado recebe prioridade para recolher antes da navegação. Imersão permanente e áreas seguras continuam no host existente.

A transição de até 240 ms usa apenas apresentação/opacidade, sem retardar o motor, o deadline ou desativar controles. O card superior passa a ter largura/altura naturais e quebra de nomes longos. O indicador luminoso percorre um círculo centrado em (836,451), raio 206 no plano nativo do fogão, atrás das cartas. A direção continua derivada do motor (+1 anti-horário, -1 horário).

Há **8 testes** de `OfflineGameTest`, incluindo navegação inicial, Back do sistema e swipe pela borda em navegação gestual no dispositivo exclusivo de teste; o teste de atualização/persistência continua exigido. O APK real também verifica os dois novos scripts/estilos e os recursos da fonte, além das 52 cartas, seis PNGs da mesa e identidade de assinatura. Resultados atuais em `testes/INICIO_MENU_RESULTADOS.md`.

## Artes especiais após 0.2.21 e +4/+6 em 0.2.22

As artes oficiais do verso, Panela de Pressão e Escolher Cor ficam em `assets/especiais/`, com 13 PNGs verificados pelo `MANIFESTO_ESPECIAIS_V1.json`. As novas frentes completas, bases, overlays e sprites de +4/+6 ficam em `assets/cartas_mais4_mais6/`, com 22 PNGs conferidos pelo `MANIFESTO_MAIS4_MAIS6.json`. Build e verificador do APK exigem esses recursos e preservam os manifestos anteriores.

`escolher-cor.js`/`.css` compartilham uma única interação: a carta pendente seleciona a base, os quatro overlays alinhados e suas áreas/origens de animação. Cor/efeitos continuam registrados imediatamente pelo motor; a confirmação visual de 200 ms não cria temporizador de regras. Liquidificador continua sem escolha de cor. Nenhuma arte anterior ou regra foi modificada nesta integração de +4/+6.

São agora **10 testes** em `OfflineGameTest`: os nove anteriores e o caso de +4/+6 com toques e penalidade acumulada. O teste de atualização/persistência continua obrigatório. A compilação/assinatura do APK **0.2.22/c4202** passou, e o arquivo foi verificado independentemente com o certificado da geração 2. No workflow #22, o emulador ficou offline durante o primeiro teste, sem concluir os dez casos; a instrumentação e retenção real de dados permanecem pendentes. Resultados, evidências e download direto em `testes/ARTES_MAIS4_MAIS6_RESULTADOS.md`.

## Landscape, perfil local e +6 opcional — 0.2.25

O APK agora declara **`sensorLandscape`**, com os dois sentidos horizontais, e categoria `game` para respeitar orientação em telas grandes Android 16. A imersão permanente e os insets existentes continuam. O verificador exige essa orientação/categoria; referências a fullSensor e capturas em retrato acima são históricas. A versão web conserva fallback em retrato.

O menu principal passa por uma identificação compartilhada antes das configurações ou da seleção Multiplayer. `perfil.js` usa somente `panelinha.player.v1` e SVGs temporários locais; a partida captura o nome/avatar e os bots permanecem independentes. `wild6` é opcional, ativada por padrão, lida ao criar uma nova partida e aplicada a todas as suas rodadas. O laboratório não injeta +6 quando desligada. O baralho padrão com Panela/Liquidificador tem 118 cartas ligada e 116 desligada. As demais regras foram preservadas.

A mesa remove os textos de espera, apresenta SUA VEZ!, amplia a mão humana em 6% durante o turno disponível e destaca o monte apenas quando comprar for a única ação de turno válida. Configurações/menus podem rolar para conservar a acessibilidade; a mesa não rola. Em landscape baixo, nomes longos no card humano ficam em até duas linhas, com valor integral no perfil/resultados/título/acessibilidade.

São **11 testes nativos**, com capturas landscape e reverse-landscape e verificação adicional do perfil na atualização. As 14 suítes web e cinco testes de versão passaram. O APK **0.2.25/c4502** foi assinado no workflow existente e verificado independentemente com o certificado da geração 2, pacote e origem preservados. No workflow #25, o emulador ficou offline durante o primeiro teste: zero dos 11 casos concluídos, e atualização real com retenção de dados pendente. Resultados e APK direto em `testes/HORIZONTAL_IDENTIDADE_RESULTADOS.md`.

## Verso e Panela padronizados — 0.2.26

O verso e a Panela usam exclusivamente os novos PNGs RGBA de 400×850 em `assets/padronizadas/`. As duas versões anteriores foram retiradas da produção; `MANIFESTO_ESPECIAIS_V1.json` conserva as outras 11 imagens. `MANIFESTO_PADRAO_400X850.json` registra as duas novas. Build e verificador rejeitam imagens antigas e conferem os novos hashes, dimensões e formato. Seletores e outras artes não foram alterados.

Os componentes continuam com a geometria das numéricas e encaixe proporcional `contain`, sem borda/recorte CSS adicional nas novas imagens. As 52 numéricas integradas têm 420×850 e foram preservadas; a referência numérica 400×850 do ZIP não pertence a esse conjunto. As máscaras das duas novas artes são idênticas entre si, sem alegar igualdade pixel a pixel com todas as numéricas atuais.

Quinze suítes web e cinco testes de versão passaram. O APK **0.2.26/c4602** foi assinado e verificado independentemente com a geração 2, incluindo ausência das imagens antigas e atualização compatível sobre c4502. No workflow #26, o emulador ficou offline durante o primeiro teste: zero dos 11 casos nativos concluídos e retenção real de dados pendente. Download direto, evidências e limitações em `testes/PADRAO_400X850_RESULTADOS.md`.
