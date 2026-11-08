# Panelinha — artes, interface e animações — 08/11/2026

Base: `fb7cfc0`, HEAD da branch `android/apk-testes`, com o ZIP novo adicionado pelo usuário. Trabalho anterior preservado. Pacote de quatro artes com CRC íntegro; PNGs copiados sem editar os desenhos. Assinatura privada e Secrets não foram alterados nem exibidos.

## Implementado

1. Coringa/+4/+6 redesenhadas e fundo verde-claro 470×800. Os fundos vermelho/azul/amarelo, 13 números V3, verso, Panela e Liquidificador foram preservados. Mesmos tamanhos de cartas, bordas externas de 25 e raios 70/45; nenhuma segunda borda de código.
2. Quatro alimentos oficiais permanentes, com coordenadas próprias para cada nova arte em `PanelinhaCards.foodRegions()`. PNGs opacos no desenho/transparência original, proporção preservada, sem duplicação da arte base. Mão, mesa, descarte, ampliações e voos usam o renderizador único. Hover proporcional em 180 ms somente nos alimentos, além do feedback já existente da carta.
3. Ícone novo criado para esta atualização: panela roxa, tampa/acabamentos dourados e brilho, sem texto. Quinze PNGs para cinco densidades Android, incluindo foreground transparente com área segura e ícones legados; XML adaptativo e splash atualizados. Ícone anterior não permanece como fallback.
4. Nome exibido **Panelinha**. Arquivo final **panelinha.apk**, metadados separados, `archive:false`. Mesmo workflow e sequência crescente. O alocador também lê versionCode do corpo da Release, preservando o crescimento agora que o nome do arquivo é fixo. Opção futura de emulador conservada com cópias distintas de APK base/upgrade.
5. Laboratório e controles de depuração retirados do menu normal. Infraestrutura/testes conservados separadamente em `developmentTools`, opt-in apenas em host local com `?dev`. Histórico, placar, som e saída continuam acessíveis no menu.
6. Escolha de cor com mensagem **Escolha uma cor para continuar.**, quatro alimentos na carta e **Visualizar mesa**. A carta/modal recolhe, com **Voltar à escolha de cor** visível. Ação continua pendente; sem cor automática. Compras, passagem, desafios e outras cartas não podem atravessar a escolha. Sigilo preservado e cartas do parceiro continuam disponíveis em Duplas. Voltar/Escape no modo recolhido retorna primeiro à escolha; desconexão fecha um seletor obsoleto.
7. Engrenagem de Configurações no lugar do acesso Som; menu existente reutilizado, com os controles de volume/silêncio e preferências originais.
8. Avatares alheios aproximadamente 20% maiores (`clamp(43px,11.4vh,62px)`), com limite de 40 px nas menores alturas. Recorte circular e contadores/nomes preservados.
9. Avatar local e **Você · N cartas** centralizados abaixo da mão, com área segura inferior; contador do estado real.
10. Cometa preserva órbita, alinhamento, cauda e período. Inversão desacelera e troca a velocidade assinada em 400 ms, sem reiniciar a fase nem apagar a ponta; movimento reduzido respeitado.
11. Liquidificador usa quatro montes compactos com no máximo seis versos cada. Retirados voos individuais de coleta/abertura, que criavam filas/rastros de cartas. Conjuntos seguem a direção oficial, abrem discretamente no destino e revelam as novas mãos somente na fase correta.
12. Compra normal: 1960 ms por carta (antes 2400), aproximação 760 ms (antes 960), intervalo fixo 2020 ms. A mesma sequência individual e decisão Jogar/Guardar permanecem. Punição intacta: duração 120 ms, intervalo 80 ms, acomodação 40 ms, sem aceleração progressiva.
13. Descarte e turno coordenados: conclusão WAAPI de voo, acomodação e Bloqueio libera a apresentação local, com fallback limitado para falha/cancelamento. `PLAY_TIMING`, `lastPlay` e `playUntil` compartilhados protegem o próximo comando também no servidor. Cortes continuam na janela própria de 2,2 s e não esperam o fim do voo; anúncio após corte mantém os 300 ms. Bots que compram aguardam a apresentação antes de efetivar o descarte, iniciando a janela de corte no momento correto. Não depende de ACK de cliente.
14. Distribuição inicial progressiva em cada rodada: sete passagens alternadas pelos quatro assentos conforme a distribuição real do motor, com contagens ajustadas se um efeito inicial redistribuir. Metadados públicos contêm somente ordem, quantidades e duração. Versos em trânsito; frentes autorizadas aparecem na chegada. `dealUntil` distingue a abertura de compras/efeitos posteriores e protege a primeira ação; pausa/reconexão conserva o tempo. Partida mantém o estado lógico como fonte, sem recriar cartas.
15. Limpeza: quatro PNGs substituídos, dois ZIPs antigos contendo cópias obsoletas e três drawables antigos retirados. Os outros recursos contidos nos ZIPs continuam preservados nos seus arquivos ativos.

## Causas e correções

- O Liquidificador animava toda a mão individualmente na coleta e na abertura, além dos quatro pacotes. Agora só os pacotes viajam; camadas internas têm posição absoluta, com limite de seis e sem mostrar frentes secretas.
- O turno lógico mudava antes da conclusão visual, especialmente sem corte e quando bot comprava/jogava no mesmo evento. Agora a mesma configuração de duração é usada pela apresentação e pelo prazo autoritativo. O cliente aguarda Promises de animação; o servidor protege ações por prazo seguro, sem depender de celular lento/desconectado. O bot posterga somente sua execução visual do descarte; sua escolha de carta e as regras não mudam.
- O seletor recolhido expôs um controle de compra ainda habilitado. Guarda acrescentada ao motor e controles recalculados ao abrir a escolha; cancelamento externo fecha a UI mesmo recolhida.
- Metadados antigos de troca não podem ser reativados por um novo prazo de compra. Distribuição inicial tem prazo próprio, não é confundida com penalidade ou compra ao reconectar.

## Verificações executadas

- `npm run build`: aprovado, uma compilação web local. Integridade dos 23 PNGs, quatro ingredientes, recursos de mesa/menu/som e inventário sem os arquivos retirados.
- `testes/alimentos_nas_cartas.cjs`: aprovado. Doze posições, amostragem da cor real sob o alimento, proteção do símbolo, limites em repouso/hover, mãos abertas/fechadas, compra, prévia, voo, descarte e ausência de duplicação.
- `testes/elementos_cores.cjs`: aprovado. Três cartas e cinco resoluções, quatro cores por mouse/toque, hover/teclado, Visualizar mesa/retorno, Escape/Voltar, movimento reduzido e recursos offline.
- `testes/cartas_470x800.cjs`, escopos `assets`, `layout`, `colors`: aprovado. 52 combinações, cinco especiais e verso, bordas/proporções, oito layouts Individual/Duplas de 568×320 a 1920×1080, mão de 40 cartas, seis cartas no monte/halo e doze escolhas reais com penalidades válidas/inválidas.
- `testes/mesa_artes_animacoes.cjs`: aprovado. Distribuição progressiva/identidade; menu sem laboratório e som funcional; celular/tablet; escolha pendente sem compra; descarte/cancelamento; inversão; Liquidificador Individual/Duplas; bot compra e depois joga sem reativar troca antiga; nova rodada; validação autoritativa e corte durante voo.
- `testes/cartas_multiplayer_470x800.mjs`: aprovado. Perspectivas reais filtradas Individual/Duplas, dono/parceiro e adversários ocultos.
- `testes/cometa_direcao.cjs`: aprovado. Dois sentidos e Inverter real, sem salto; órbita alinhada em 844×390 e 1280×800; volta medida em aproximadamente 3583 ms, projeção multiplayer e movimento reduzido.
- Servidor: **25 testes aprovados** em `presentation`, `menu-rotation-score`, `visual-update`, `mesa-compras-corte`, `gameplay-podium`. Incluem conservação, escolhas, regras, Bloqueio, Panela, cortes/anúncio de 300 ms, desafios, compras punitivas, pausa/reconexão, distribuição, bot deferido, classificação e lobby WebSocket local.
- `testes/versao_android.py`: cinco testes e caso adicional de arquivo fixo aprovados. Sintaxe JS/Python, hashes/pacotes, comparação da fonte com o build e `git diff --check`: aprovados.
- Falhas intermediárias não foram ocultadas: posicionamentos foram corrigidos conforme amostragem/contorno; guarda real de compra pendente corrigida; fixtures passaram a limpar campos novos e aguardar a distribuição; caso inicial aleatório da Panela deixou de ser assumido como sete cartas iguais. Expectativas antigas de punição (+200) foram corrigidas para o parâmetro vigente (+40), e a pausa foi movida para dentro da punição rápida. Nenhum teste foi removido ou desativado.

## Arquivos antigos excluídos

- `IMPORTACAO_PANELAS/assets/cartas/especiais/carta_curinga.png`
- `IMPORTACAO_PANELAS/assets/cartas/especiais/carta_mais4.png`
- `IMPORTACAO_PANELAS/assets/cartas/especiais/carta_mais6.png`
- `IMPORTACAO_PANELAS/assets/cartas/fundos/fundo_verde_novo_470x800.png`
- `android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml`
- `android/app/src/main/res/drawable/ic_launcher_background.xml`
- `android/app/src/main/res/drawable/ic_panelinha.xml`
- `panelinha_especiais_e_verso_aprovados_470x800.zip`
- `panelinha_fundos_normais_novos_470x800.zip`

## Arquivos adicionados ou modificados

- `.github/workflows/android-testes.yml`
- `AGENTS.md`
- `ANDROID.md`
- `IMPORTACAO_PANELAS/AGENTS.md`
- `IMPORTACAO_PANELAS/assets/cartas/especiais/carta_curinga_redesenhada_470x800.png`
- `IMPORTACAO_PANELAS/assets/cartas/especiais/carta_mais4_redesenhada_470x800.png`
- `IMPORTACAO_PANELAS/assets/cartas/especiais/carta_mais6_redesenhada_470x800.png`
- `IMPORTACAO_PANELAS/assets/cartas/fundos/fundo_verde_claro_470x800.png`
- `IMPORTACAO_PANELAS/cartas.js`
- `IMPORTACAO_PANELAS/documentacao/ESPECIFICACAO_COMPLETA.md`
- `IMPORTACAO_PANELAS/documentacao/MANIFESTO_CARTAS_470X800.json`
- `IMPORTACAO_PANELAS/efeitos-mesa.css`
- `IMPORTACAO_PANELAS/efeitos-mesa.js`
- `IMPORTACAO_PANELAS/escolher-cor.css`
- `IMPORTACAO_PANELAS/escolher-cor.js`
- `IMPORTACAO_PANELAS/index.html`
- `IMPORTACAO_PANELAS/mesa.js`
- `IMPORTACAO_PANELAS/motor.js`
- `IMPORTACAO_PANELAS/online.js`
- `IMPORTACAO_PANELAS/partida-ui.css`
- `IMPORTACAO_PANELAS/sons.js`
- `android-identity.json`
- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml`
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png`
- `android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png`
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png`
- `android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png`
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png`
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png`
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png`
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png`
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png`
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png`
- `android/app/src/main/res/values/ic_launcher_background.xml`
- `android/app/src/main/res/values/strings.xml`
- `android/app/src/main/res/values/styles.xml`
- `capacitor.config.json`
- `ferramentas/build-web.cjs`
- `ferramentas/compilar_android.py`
- `ferramentas/notas_release.py`
- `ferramentas/verificar_apk.py`
- `ferramentas/versao_android.py`
- `multiplayer-server/src/game.mjs`
- `multiplayer-server/tests/gameplay-podium.test.mjs`
- `multiplayer-server/tests/menu-rotation-score.test.mjs`
- `multiplayer-server/tests/mesa-compras-corte.test.mjs`
- `multiplayer-server/tests/presentation.test.mjs`
- `multiplayer-server/tests/visual-update.test.mjs`
- `testes/ajustes_visuais_coringa.cjs`
- `testes/alimentos_nas_cartas.cjs`
- `testes/cartas_470x800.cjs`
- `testes/cartas_multiplayer_470x800.mjs`
- `testes/cometa_direcao.cjs`
- `testes/elementos_cores.cjs`
- `testes/jogabilidade_coringa_podio.cjs`
- `testes/mao_um_toque.cjs`
- `testes/mesa_artes_animacoes.cjs`
- `testes/refinos_cartas_punicao.cjs`
- `testes/versao_android.py`

## Publicação e limitações

Compilação/assinatura e download do APK final serão registrados após o GitHub Actions. Emulador não executado, conforme orientação anterior. Não houve teste de instalação/atualização/persistência em dispositivo físico, desempenho de hardware ou sessão com quatro celulares reais. As verificações de toque/responsividade foram em Chromium; WebSocket e projeções autoritativas foram exercitados localmente. Não declarar essas verificações Android pendentes como aprovadas.
