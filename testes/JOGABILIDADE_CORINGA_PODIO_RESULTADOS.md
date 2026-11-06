# Bloqueio, Coringa, compras punitivas e pódio

## Implementado

- Núcleo compartilhado: o jogador pulado por Bloqueio não pode cortar para escapar; cortes posteriores válidos permanecem. A Panela de Pressão é rejeitada durante qualquer penalidade +2/+4/+6, preservando a redistribuição normal e a ausência de seletor.
- Compras por punição/desafio/denúncia/tempo esgotado: cronograma único `PanelinhaRules.drawSequence`, usado pelo motor e apresentação, com limite de sequência e margem de 200 ms. `presentationUntil` suspende ações, automação e início do cronômetro seguinte. O servidor libera por prazo, sem ACK e mesmo se o comprador desconectar; pausa/reconexão conservam o restante. O resultado final aguarda a apresentação.
- O comprador vê cada frente; demais participantes veem somente versos em deslocamento direto. Metadados públicos contêm quantidade/prazo; IDs das cartas compradas são enviados apenas ao comprador.
- Coringa comum usa o PNG oficial completo 400×850 na mão, descarte, seletor e animações, sem uma base antiga 2:3 nem ingredientes de outra arte. No seletor, as quatro regiões de cor são interativas sobre o próprio PNG. +4/+6 mantêm suas bases e overlays aprovados. Nenhum PNG foi alterado.
- Pódio somente em `gameOver`, com plataformas em profundidade, avatares oficiais, nomes e campeão dourado. Individual: 1º central, 2º à esquerda, 3º à direita, 4º complementar. Duplas: duas equipes com seus dois integrantes. Rodadas intermediárias e gráficos anteriores preservados; retorno/revanche mantidos.
- Classificação final oficial calculada uma vez no motor e projetada para cada perspectiva: partida única mantém classificação da rodada; por pontos usa total e vitórias, mostrando empates secundários (ex.: 1º, 2º, 2º, 4º), conforme escolha explícita do usuário. Critério original do campeão e rodada extra por empate preservados. Sem novo disparo de som de vitória; entrada do pódio não reinicia em atualizações.

## Verificações efetivamente executadas

- `node --test --test-reporter=spec multiplayer-server/tests/gameplay-podium.test.mjs`: **7/7**. Bloqueio nos dois sentidos, Panela proibida sob +2/+4/+6/+20 e normal fora deles, conservação, compras de 2/6/20 cartas, privacidade, desconexão, pausa/retomada, denúncia, desafios procedente/improcedente, punição final e classificação oficial Individual/Duplas/empates.
- `node --test --test-reporter=spec --test-name-pattern='Panela|lobby WebSocket' multiplayer-server/tests/visual-update.test.mjs`: **2/2 selecionados**. Redistribuição normal e rejeição sob penalidade; lobby WebSocket local, bots, início e snapshots privados.
- Chromium/Playwright (`testes/jogabilidade_coringa_podio.cjs`, cenários executados por blocos): Coringa completa/proporcional na mão e descarte; hover/toque nas quatro cores de Coringa/+4/+6; bases sem arte duplicada; compra punitiva com duas cartas em sequência, trava até o fim e sem Jogar/Guardar; compra alheia apenas verso; pódio Individual, pontos com empate, Duplas e rodada intermediária; quatro perspectivas do resultado multiplayer com nomes reais. Celular 844×390 e tablet 1280×800; quatro avatares, limites de tela, controles e estabilidade da entrada verificados. Sem erros JavaScript nessas verificações.
- `npm run build`: **aprovado**. Manifestações/hashes dos recursos, 52 PNGs originais, novos módulos e compatibilidade Android preparados. `git diff --check` aprovado.
- Worker existente atualizado, versão `0222f8a1-a2f1-4ccc-a43d-44a94d663396`; `/health` respondeu `{"v":1,"phase":3,"gameplay":true}`. Sem alteração de bindings, conta ou credenciais.

## Android e limites

[Baixar APK 0.2.43 / código 6302 diretamente, sem ZIP](https://github.com/LucasCunh4/Panelinha/actions/runs/42314648666/artifacts/13550402143). É necessário estar conectado ao GitHub. Artefato retido até 04/02/2027.

[Workflow #43](https://github.com/LucasCunh4/Panelinha/actions/runs/42314648666), fonte `4db3f5537f2e8624f4277d4b13cc0acddee6b0b4`: compilação e assinatura aprovadas. O APK real baixado foi novamente verificado com `ferramentas/verificar_apk.py`: metadados idênticos aos do Actions e SHA-256 idêntico ao digest do artefato. Os módulos novos e alterados coincidem byte a byte com o fonte, incluindo `podio.js`/`podio.css`; recursos e sons aprovados conservados.

- Pacote: `com.lucascunha.panelinha.teste`; origem `https://localhost`.
- Certificado gen. 2: `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`.
- Versão: `0.2.43`, código `6302 > 6202` da anterior 0.2.42.
- SHA-256 APK: `0b5756f324daaa93211048aa2a0c6f195ad495e314a8edd6fe153792935ccb37`.
- Mesmo pacote/certificado/origem, release sem debug, `sensorLandscape` e assets locais: identidade compatível com instalação por cima da geração 2. Não houve rotação de chave, alteração de Secrets, limpeza de dados ou mudança no workflow.

**Instrumentação Android não aprovada:** o emulador/ADB ficou `offline` durante `a_imagesAndThreeBotsOffline`. O relatório contém apenas o início do primeiro caso (`INSTRUMENTATION_STATUS_CODE: 1`), sem conclusão: **0/13 testes concluídos**. Não há falha de asserção do aplicativo registrada nesses resultados; a causa raiz da perda do emulador não foi determinada. O teste real de atualização preservando dados não foi executado e permanece pendente. A Release foi corretamente pulada pelo gate existente; o APK assinado foi disponibilizado como artefato direto. Nenhum teste foi desativado ou declarado aprovado indevidamente. Não foram executadas baterias completas de regressão, conforme solicitado. Navegador com emulação de toque não substitui Android físico. Sem garantia de retomada de partida local em memória após encerramento do aplicativo.


Verificação pós-publicação: `/health` aprovado e hashes públicos de `motor.js`, `podio.js` e `online.js` iguais aos arquivos testados.
