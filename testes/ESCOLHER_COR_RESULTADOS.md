# Artes especiais oficiais e seletor de ingredientes — 01/11/2026

Base: `android/apk-testes`, upload oficial `33380ca1bfba1bc2e4d4842e2ddc5b1decad09c1`.

## Implementação

- Pacote completo extraído: 13 PNGs idênticos ao ZIP em `assets/especiais/`; três documentos originais em `documentacao/escolher-cor-v1/`. Manifesto adicional de SHA-256 para build, teste HTTP e verificação do APK real.
- Verso oficial em todas as cartas ocultas, seis camadas do monte, compra animada e versos clonados nos descartes animados. Avatares dos participantes continuam independentes.
- Frentes oficiais da Panela de Pressão e Escolher Cor nas mãos e no descarte. Preservados os 52 PNGs anteriores e a representação existente de +4/+6 e Liquidificador.
- Seletor de proporção 2:3: base mais quatro PNGs transparentes alinhados; ingredientes clicáveis no interior da carta, com coordenadas do manifesto e origem de transformação localizada. Não há botões externos de cores.
- Brilho individual pulsante, hover com elevação/luminosidade e feedback imediato ao toque. Confirmação visual de 200 ms; efeitos registrados imediatamente no motor, sem temporizador de regras adicional. Guarda contra envio duplicado e ações antigas, bloqueio de toque na mesa, teclado, Escape e Voltar existentes. Respeita movimento reduzido.
- Layout baixo em paisagem coloca orientação e Cancelar ao lado da carta; alvos medidos com pelo menos 44×44 CSS px. Altura explícita também conserva a proporção nos WebViews sem `aspect-ratio`.
- Mesmas chamadas e condições do motor para solicitar cor: Liquidificador não abre seletor; última carta não exige escolha desnecessária. Sem alteração de regras, bots, pontuação, cronômetro, origem, applicationId ou assinatura.

## Validação local aprovada

`npm run build`, `npm run sync:android`, `git diff --check`, cinco casos de `python3 testes/versao_android.py` e as 12 suítes Chromium abaixo passaram. Logs e capturas reais em [evidencias-escolher-cor](evidencias-escolher-cor/).

| Suíte | Cobertura |
| --- | --- |
| `escolher_cor.cjs` | SHA-256/HTTP/decodificação dos 13 PNGs, versos/monte, frentes, seis tamanhos 320×568 a 1280×800, retrato/paisagem, alvos ≥44 px, 16 escolhas por toque, efeitos de +4/+6 e Panela em +12, conservação e envio único, destaque, cancelamento, Liquidificador e última carta, compra animada, offline, movimento reduzido, hover localizado e teclado |
| `atualizacao_regras.cjs` | 40 cenários, incluindo centenas de sorteios da Panela, limite/redução/mínimo/equilíbrio/conservação, penalidades, última carta, Liquidificador nas quatro cores e corte 2199/2200 ms |
| `integracao.cjs` | 52 frentes por SHA-256/HTTP/decodificação, regras, bots, laboratório e fallback |
| `mesa.cjs`, `refinamentos_mesa.cjs` | Recursos oficiais da mesa, geometria, sigilo, parceiro, cortes e animações humanas/bots |
| `atualizacao_mesa.cjs` | 36 layouts, compras de 20/40/80/100, conservação, últimas três cartas, corte durante voo, Bloqueio e contagem 5–1 |
| `mesa_fina.cjs`, `mesa_atual.cjs` | Posicionamento, intensidade amarela, direção, seis camadas do monte e cartas |
| `leque_continuo.cjs` | 30 layouts e mãos 15/20/30/40/60/100; toque, mouse, seleção, corte e compras com grupos abertos/fechados |
| `navegacao.cjs`, `preparacao_menu.cjs` | Início, configuração reutilizada, três bots, telas futuras, Voltar, nomes longos e órbita circular |
| `android-compat.cjs` | Pacote `dist`, compatibilidade de APIs no host Android e jogabilidade |

Comparação direta do script do motor com a base: **idêntico byte a byte**, omitindo somente as três funções de apresentação alteradas (`cardAssetPath`, `cardHTML`, `showColors`). SHA-256 do restante normalizado: `b6ee7b7220ffcaf400a2c25c803730717b456e6b00a2305a3e7af85aacc59410`.

## Android e distribuição

Mantido o workflow `APK Android de testes`, os quatro Secrets existentes e o upload `actions/upload-artifact@v7` com `archive: false`, somente o APK. O alocador existente produz código superior a 4002, sem reiniciar o histórico.

Adicionado o nono teste nativo de execução offline: decodificação das artes, verso oficial e quatro cores por toques reais no WebView. Preservados os oito testes anteriores e os testes de atualização por instalação `-r`, UID, localStorage e SharedPreferences. Compilar e assinar não equivale a aprovar a instrumentação; os resultados do CI e a verificação do arquivo assinado serão registrados após a execução.

Identidade exigida: `com.lucascunha.panelinha.teste`, origem `https://localhost`, geração 2 e certificado SHA-256 `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`. Nenhuma chave foi criada ou alterada.

O jogo existente guarda a partida em memória; preservar o diretório de dados não implementa retomada de uma partida após fechar o processo.
