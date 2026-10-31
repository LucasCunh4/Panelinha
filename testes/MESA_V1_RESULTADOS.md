# Mesa V1 — implementação e validação

## Implementado

- Integração no jogo existente de `IMPORTACAO_PANELAS/`, a partir de `android/apk-testes` / `3ab8d3d`.
- Os seis PNGs oficiais são idênticos byte a byte ao ZIP da raiz. Nenhuma imagem foi gerada, editada ou substituída. As 52 cartas mantêm seus arquivos/caminhos/hashes.
- Fundo cobre a viewport; chama da cor ativa usa crossfade de 180 ms e desaparece sem cor. Fundo e chama compartilham o mesmo plano, sem metal desenhado por CSS.
- Descarte no queimador e compra por toque no monte, com contagem e indicação de +N. A ação usa `buyHuman` existente.
- Humano embaixo, participante oposto em cima e bots nas laterais. Parceiro aberto em duplas, adversários ocultos; laboratório ainda pode revelar as mãos explicitamente.
- Turno destacado; direção e penalidade dinâmicas. Corte com o PNG da faca sobre a carta elegível, usando `cutHuman` existente e preservando a pausa de 2800 ms.
- Laboratório, histórico, placar e saída para configurações em menu sobreposto; foco e Escape devolvem o controle à mesa. Bots/tempo continuam enquanto o menu está aberto.
- Contextos de última carta, denúncia, desafio, escolha de cor, guardar/passar e fim da rodada preservados. Mãos grandes rolam horizontalmente; a mesa inteira não rola.

## Geometria e arquivos

- Fundo: 1672×941. Chamas: PNGs RGBA 1024×1024, exibidos com 490×490 no plano nativo; centro (836,451).
- Escala uniforme `max(largura/1672, altura/941)`, com deslocamento centralizado; a mesma transformação se aplica às duas camadas. Nenhum círculo é esticado.
- Faca: PNG RGBA 1254×1254, exibido em alvo contextual sobre a carta; o botão da carta permanece o alvo de toque.
- Layout/transformação em `IMPORTACAO_PANELAS/mesa.css` e `mesa.js`; bindings e marcação em `index.html`. Documentos originais em `documentacao/mesa-v1/`.
- `documentacao/MANIFESTO_MESA_V1.json` acrescenta hashes aos metadados oficiais. Build web e verificador do APK conferem os seis arquivos, além das 52 cartas e do código empacotado.

## Executado e aprovado na web

- `node testes/integracao.cjs`: 16/16 regressões de regras; baralho 114/118, acúmulo e cobrança integral, Distribuidora, Giro, cortes próprios/externos, desafio, denúncia, compra/guarda, pontuação, bots e cronômetro. Também SHA-256/HTTP/decodificação das 52 cartas, laboratório e fallback textual.
- `node testes/mesa.cjs`: 320×568, 360×640, 390×844, 412×915, 568×320, 667×375, 844×390, 915×412, 1280×800 e 1920×1080. Verificadas viewport sem rolagem, fundo cobrindo a tela, registro fundo/chama, descarte central, compra/menu alcançáveis, cartas acessíveis, quatro cores e estado sem cor.
- Toques reais no navegador móvel: compra, pagamento +20, guardar/passar, Inverter, menu/laboratório, faca e controles de fim de rodada. Corte em quatro tamanhos com pausa preservada. Privacidade em individual/duplas e mãos com 30/20 cartas testadas.
- Apresentação aceita estado congelado sem mutar o jogo; ausência de exceções JS e respeito à preferência por movimento reduzido.
- `node testes/android-compat.cjs`: pacote de `dist/`, WebView antigo simulado sem `replaceAll/getAnimations` nativos, bot e Inverter aprovados.
- `python3 testes/versao_android.py`: 5 testes aprovados, incluindo artefatos sem Release e sequência crescente de execuções/tentativas.
- Comparação com a base: 52 funções existentes, incluindo motor, pontuação, bots, compra e corte, preservadas byte a byte. Mudanças do script do jogo limitadas à apresentação/bindings e mensagens visuais.
- Build web, sintaxe JS/shell e `git diff --check` aprovados.

Capturas Chromium (não são capturas de aparelho físico):

- [Retrato 390×844](../evidencias-mesa-v1/390x844-duplas.png)
- [Paisagem 844×390](../evidencias-mesa-v1/844x390-duplas.png)
- [Corte em 320×568](../evidencias-mesa-v1/320x568-corte.png)
- [Corte em 568×320](../evidencias-mesa-v1/568x320-corte.png)

## Android e infraestrutura

A execução anterior (#6) compilou/assinou corretamente, mas o emulador encerrou durante o primeiro teste, com saída 255 e conexão ADB indisponível. Ajustes de RAM/Vulkan não resolveram e não provaram a causa. Isso não é um resultado de asserção do aplicativo.

O roteiro agora coleta logcat desde antes da instalação, status de saída e estado do ADB/processos em falha. As quatro verificações offline e a atualização continuam obrigatórias. O teste de orientação também verifica ausência de rolagem, registro da chama e salva capturas Android para os artefatos quando alcançar essa etapa. Nenhum teste foi desativado.

### Execução #7 — 0.2.7/c2702

- [Workflow](https://github.com/LucasCunh4/Panelinha/actions/runs/41154312603) / [APK em artefato](https://github.com/LucasCunh4/Panelinha/actions/runs/41154312603/artifacts/13024752332).
- Compilação e assinatura aprovadas; APK baixado e novamente validado localmente com `apksigner`/`verificar_apk.py`: certificado ativo, pacote/origem, código 2702, 52 cartas e 6 assets oficiais. SHA-256 do APK: `7f9636071b3b3d8aeee0e050b70d21ea36d19e6a541be68f4dec3f86e9f9082a`.
- O emulador permaneceu ativo; passaram imagens/offline, retrato/paisagem e sentinelas (3/4). O teste de toque falhou em `web.hasWindowFocus()`; a atualização não executou e a Release não publicou.
- O logcat identifica **ANR do `com.google.android.apps.nexuslauncher`**, com janela `Application Not Responding` persistente durante a suíte. Essa é evidência de um bloqueio do launcher do emulador, separado de uma falha nas asserções de compra/corte do jogo.
- A preparação foi ajustada para parar/desativar somente esse launcher, somente em emulador descartável sob `GITHUB_ACTIONS=true`. Não suprime erros/ANRs do aplicativo nem remove testes. A próxima execução registrará o resultado dessa correção.

### Execução #8 — 0.2.8/c2802

- [Workflow](https://github.com/LucasCunh4/Panelinha/actions/runs/41154961380): compilação/assinatura e **4/4 testes offline aprovados**, incluindo toques, corte/compra, bot e orientações. O isolamento do launcher resolveu o bloqueio de foco da execução #7.
- Atualização: instalação por cima e UID/SharedPreferences preservados, mas a sentinela de localStorage não foi recuperada. A Release permaneceu bloqueada. Esse resultado não foi atribuído ao launcher nem tratado como aprovação de persistência.
- O teste gravava a sentinela e terminava o processo dentro de cerca de 1 s. O [Chromium 124 usado pelo WebView](https://github.com/chromium/chromium/blob/124.0.6367.219/components/services/storage/dom_storage/local_storage_impl.cc) usa `kCommitDefaultDelaySecs = base::Seconds(5)` para agrupar gravações. A fixture agora aguarda esse commit e o roteiro exige também leitura após reinício a frio **antes** de trocar o APK. As verificações depois da atualização continuam obrigatórias.
- Capturas em rotação foram ajustadas para aguardar orientação nativa e `postVisualStateCallback` antes de ler o quadro. Isso evita salvar o quadro anterior durante a transição.

### Execuções #9 e #10 — sincronização e persistência

- #9 apontou um toque intermitente em Última carta. O navegador reproduziu e aprovou a sequência +2 → anúncio → corte em retrato/paisagem. O teste nativo agora aguarda `postVisualStateCallback` antes de medir/injetar o toque, sem substituir o toque por chamada JS.
- [#10](https://github.com/LucasCunh4/Panelinha/actions/runs/41156458341) aprovou os toques, orientações e as duas leituras de persistência: **reinício anterior ao upgrade e atualização c3002→c3003**. UID, SharedPreferences e localStorage preservados, sem desinstalar/limpar dados.
- O teste offline de #10 permaneceu vermelho: o log registra `WifiService: setWifiEnabled package=com.google.android.googlesdksetup ... enable=true` após a preparação offline. O assistente de primeiro boot do SDK foi acrescentado ao isolamento do emulador descartável; a asserção de ausência de rede permanece.
- As etapas independentes são executadas e registradas mesmo se outra falhar; qualquer falha conserva status final não zero. A publicação não ignora falhas.
- A próxima execução compara também `UiAutomation` com `screencap` e registra dimensões nativas/DOM, para separar artefatos de rotação do display de problemas reais de layout.

### Resultado final — execução #11 APROVADA

- [Workflow #11](https://github.com/LucasCunh4/Panelinha/actions/runs/41157096344), fonte `4c5e9ac5e3807a410f7d629c0cd466d6af9fb51a`.
- [Release 0.2.11](https://github.com/LucasCunh4/Panelinha/releases/tag/v0.2.11), publicada automaticamente somente após todos os testes passarem.
- **[Baixar APK 0.2.11/c3102](https://github.com/LucasCunh4/Panelinha/releases/download/v0.2.11/Panelinha-Teste-v0.2.11-c3102.apk)**. [Artefato alternativo](https://github.com/LucasCunh4/Panelinha/actions/runs/41157096344/artifacts/13025377682).
- Certificado geração 2 e assinatura v2 aprovados no runner e em verificação independente do APK baixado. SHA-256 do APK: `da87b89083dab0cc43c3bf4dcfa49b1244bb56b1ad5e009dfd1cdea45640a47e`, também igual ao digest do asset da Release.
- Pacote `com.lucascunha.panelinha.teste`, origem `https://localhost`, release, API mínima 24/target 36, `fullSensor`; 52 cartas e 6 imagens oficiais conferidas por hash, assim como HTML/CSS/JS empacotados.
- Android 35: **4/4 testes offline aprovados**, incluindo imagens/3 bots, toques em carta/última carta/corte/compra +20, ação de bot, retrato/paisagem e gravação de sentinelas.
- **1/1 teste após reinício a frio anterior ao upgrade aprovado.**
- **1/1 teste após instalar c3103 por cima de c3102 aprovado**, usando `adb install -r`; UID, localStorage e SharedPreferences preservados. Nenhuma desinstalação/limpeza de dados.
- O assistente do SDK era o componente que religava Wi-Fi. Somente o launcher e esse assistente foram isolados no emulador descartável; o teste ainda exige rede nativa ausente. Não houve supressão de erros do app nem remoção de asserções.
- Capturas físicas via `screencap` e medições do DOM/nativas confirmaram retrato e paisagem corretos. `UiAutomation.takeScreenshot` mostrou um quadro incorreto durante algumas rotações; a comparação independente separou esse artefato de captura do layout real. Ambas as leituras ficam no artefato completo.

Evidências Android reais (emulador; diferentes das capturas Chromium acima):

- [Retrato: display físico](../evidencias-mesa-v1/android/mesa-v1-portrait.png) / [geometria](../evidencias-mesa-v1/android/mesa-v1-portrait.json)
- [Paisagem: display físico](../evidencias-mesa-v1/android/mesa-v1-landscape.png) / [geometria](../evidencias-mesa-v1/android/mesa-v1-landscape.json)
- [4 testes offline](../evidencias-mesa-v1/android/offline.txt)
- [Persistência antes da atualização](../evidencias-mesa-v1/android/baseline-persistence.txt)
- [Persistência após atualização](../evidencias-mesa-v1/android/update.txt)
- [Metadados e hash do APK](../evidencias-mesa-v1/Panelinha-Teste-v0.2.11-c3102.json)

## Limites da validação

Não houve teste em celular físico. O upgrade executado no CI foi c3102→c3103; a compatibilidade para instalar c3102 sobre a versão 0.2.6/c2003 foi conferida pelo mesmo pacote, mesmo certificado (também relido do APK 0.2.6) e código maior, sem alteração da origem. A versão web foi validada por HTTP; a branch principal/site público não foi atualizada nesta etapa. Avatares definitivos e refinamentos artísticos continuam para uma etapa posterior.

## Identidade e atualização

applicationId `com.lucascunha.panelinha.teste`; origem `https://localhost`; certificado da geração 2:

`3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`

A chave e os quatro Secrets não foram alterados. A sequência do mesmo workflow foi preservada. O alocador agora supera também o APK 0.2.6/c2003 já instalado e o candidato c2004, mesmo sem Release, usando base 2000 e o histórico publicado. Entre APKs da geração 2, instalar por cima, sem desinstalar/limpar dados. A partida em andamento continua apenas em memória, como no protótipo anterior.
