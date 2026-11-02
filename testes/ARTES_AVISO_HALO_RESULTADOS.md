# Novas +4/+6, anúncio global e halo reforçado — 02/11/2026

## Implementação

Partiu de `acec1fd` da branch `android/apk-testes`, incorporando por fast-forward somente o ZIP enviado pelo usuário. Nenhum trabalho anterior descartado. `LEIA_ME.md`, manifesto, prompt e as duas prévias foram lidos/examinados. Documentos preservados em `IMPORTACAO_PANELAS/documentacao/cartas46-novas/`.

**Novas ilustrações:** os 22 PNGs do pacote substituem os assets +4/+6 anteriores, sem qualquer retoque ou redimensionamento dos arquivos. Frentes completas 400×850 usadas na mão, descarte, histórico e voos. As mesmas caixas CSS responsivas continuam sendo usadas, com `contain`, sem borda extra/recorte/esticamento. Duas prévias antigas e duas bases limpas antigas foram removidas após conferir seus hashes; build/verificador recusam sua presença/referência. Todas as outras artes foram preservadas.

**Interação:** mesmo componente/eventos da Coringa; somente os dados de +4/+6 apontam agora para **base e quatro overlays do pacote novo**, no mesmo canvas 400×850. Não usa a frente completa atrás nem mistura PNGs antigos da Coringa nas duas cartas novas. Os retângulos do manifesto definem áreas de toque/origens de transformação, com alvo mínimo 44px limitado à carta. Tomate/vermelho, queijo/amarelo, mirtilo/azul e alface/verde. Imagem de cada alimento renderizada uma única vez, opacidade 1. Brilho/hover/toque/confirmação compartilhados; crescimento de +4/+6 centrado em 4,5%, sem deslocamento vertical, reduzindo a exposição dos fundos reconstruídos. Pico breve de seleção 7%. Arte e movimento da Coringa preservados. As bases fornecidas foram inspecionadas em movimento; não foi necessário gerar imagens substitutas.

**Aviso de última carta:** `anuncios.js`/`anuncios.css` apresentam aviso roxo/dourado com nome seguro por `textContent`. Emissão ocorre nos pontos reais do motor: anúncio preventivo humano, anúncio tardio humano e decisão existente de anúncio dos bots. Não depende de observar uma mão com uma carta. Não alterou chances/decisões dos bots, janelas de anúncio/denúncia, compra, pontuação ou vitória.

- Anúncio preventivo humano aparece no comando; descarte seguinte consome a mesma declaração e não cria outra notificação. Repetir render ou entregar novamente o mesmo evento não repete o aviso. Um anúncio legítimo posterior tem ID novo.
- Contrato público `panelinha:ultima-carta`, com ID estável por partida/sequência, rodada, jogador, nome e etapa; sem mãos/cartas secretas, sem consumir `Math.random`. `receive` valida partida/rodada e deduplica IDs, preparando integração futura sem implementar rede/backend.
- Um aviso global na mesa local para qualquer um dos quatro assentos, Individual/Duplas. Fila mantém cada mensagem legível por 3 segundos, entrada de 160ms e saída de 180ms. Não pausa turnos/timers e usa `pointer-events:none`; não rouba foco. Respeita movimento reduzido. Fila é limpa na troca/fim da rodada, nova partida e retorno ao menu.

**Halo:** posições, dimensões SVG, seis retângulos reais, deslocamentos, raios 5/7, exclusão de segurança e desfoque 4px preservados. Somente cor/luminância/alfa da luz reforçados: intensidade alfa do halo multiplicada por 2, dourado mais claro e borda quente mais luminosa; pulso de opacidade 0,55–1 no mesmo período 1,1s. A luz continua recortada fora do mesmo envelope. A função `humanMustDraw`/`checkCards` e a condição de exibição não foram modificadas.

**Precisão sobre dimensões:** os novos arquivos são 400×850 e têm máscara idêntica ao verso/Panela padronizados. As 52 numéricas efetivas do repositório continuam sendo 420×850, com máscaras próprias, apesar da descrição do pacote mencionar numéricas 400×850. Foram preservadas conforme o escopo; as caixas CSS são iguais. Não se afirma igualdade pixel a pixel entre essas máscaras numéricas antigas e os PNGs novos.

## Testes

**21 suítes Chromium aprovadas**, **5 testes de versionamento aprovados** e **`npm run build` aprovado**. [Logs, medição antes/depois e capturas](evidencias-artes-aviso-halo/). Inclui todas as 20 suítes anteriores e a nova `artes_aviso_halo.cjs`; testes internos de integração também passaram em 16/16 regras. A regressão dos pixels das cartas/sombras encontrou **zero contato visível** (alfa >8/255, escala 4×), mantendo **4,75–5,5px CSS** livres nos quatro lados, nos cinco momentos da pulsação e em três tamanhos de paisagem.

Verificações específicas já executadas: novas bases/overlays e 28 escolhas por toque com penalidades, quatro escolhas por mouse nas duas cartas, anúncio humano preventivo/tardio, bots 1/2/3 reais em Individual e Duplas, ausência de falso aviso e duplicações, nomes corretos, fila, expiração, interação livre, offline, redução de movimento e layouts baixos/altos.

A medição antes/depois isolou o **halo realmente renderizado pelo DOM**, em captura 4×, no mesmo estado/viewport: geometria idêntica e luminosidade integrada no pico **1,342× a anterior (+34,2%)**. A regressão de pixels das cartas/sombras verifica também a distância livre nos quatro lados durante cinco momentos da pulsação, em três tamanhos de paisagem. Não foram alterados valores de geometria para obter esse aumento.

O teste detectou a entrada do aviso ultrapassando levemente o topo na tela baixa: o movimento inicial foi ajustado para +4px, mantendo o aviso inteiro dentro da viewport durante a própria entrada. Não foram removidas verificações. A instrumentação nativa agora contém **12 testes offline + 1 teste de atualização**, incluindo anúncio real dos quatro participantes nas duas modalidades.

## Android

Mantidos pacote `com.lucascunha.panelinha.teste`, origem `https://localhost`, certificado permanente geração 2, orientação horizontal/imersão, dados locais, Secrets e workflow. Nenhuma chave gerada. Execução [**#33**](https://github.com/LucasCunh4/Panelinha/actions/runs/41490713531), fonte `c188df28ac4ab3ae9ffc450c6369588426deabf7`:

- **Compilação e assinatura aprovadas:** APK **0.2.33 / código 5302**; candidato 5303 reservado ao teste de atualização, não distribuído. Compilados também os 12 testes de instrumentação, sem retirar os anteriores.
- APK baixado e verificado novamente por `ferramentas/verificar_apk.py`: assinatura v2, certificado permanente, pacote, origem local, sensorLandscape/categoria game, 52 cartas e demais artes preservadas, 22 PNGs novos por hash/dimensões/RGBA, ausência dos quatro recursos antigos retirados e cópia exata de JS/CSS/HTML, incluindo `anuncios.js`/`anuncios.css`. [Metadados](ARTES_AVISO_HALO_APK_0.2.33.json).
- Certificado SHA-256 **`3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`**, igual a `android-identity.json` e ao APK anterior real **0.2.32 / 5202**. Mesmo pacote `com.lucascunha.panelinha.teste` e origem `https://localhost`; 5302 supera também o candidato 5203. [Comparação dos APKs reais](evidencias-artes-aviso-halo/comparacao-identidade-apks.json). Identidade compatível com atualização direta, sem desinstalar.
- SHA-256 do APK **`1bf105f311aee2ac332067e77e98b9d2d1a2dc5b97dcf6cce2126fe2fb3974b1`**, igual ao digest do GitHub; **52.001.906 bytes**. Metadados locais e do CI idênticos. Confirmado APK com `AndroidManifest.xml`/assets na raiz, sem ZIP externo ou APK aninhado.

**Testes Android: interrompidos, não aprovados.** O AVD iniciou, instalou o APK e começou `a_imagesAndThreeBotsOffline` às 17:27:06 UTC, com `numtests=12`. O logcat registra `MainActivity` criada/retomada/exibida. Em seguida perdeu-se a conexão: `adb devices` passou a listar `emulator-5554 offline`, os diagnósticos ADB falharam e a tentativa de encerramento encontrou a porta 5554 recusada. O primeiro teste possui apenas status de início (`INSTRUMENTATION_STATUS_CODE: 1`), sem resultado. **0/12 testes offline concluídos; teste adicional de atualização não executado.**

É uma interrupção do ambiente/ADB, sem asserção funcional reprovada registrada. A causa raiz da queda do AVD **não foi determinada** pelos diagnósticos disponíveis. Logcat sem `FATAL EXCEPTION`/`Fatal signal` do aplicativo; kernel do host sem OOM/segfault, com aproximadamente 14GiB disponíveis. Isso não comprova aprovação nativa. [Trechos da execução](evidencias-artes-aviso-halo/github-android-diagnostico.txt) e arquivos de instrumentação/ADB/memória junto das evidências; diagnósticos completos no artefato `resultados-android-33-1`.

Permanecem pendentes: instrumentação nativa completa, confirmação visual/toque nas duas paisagens Android e instalação por cima com preservação efetiva de UID/localStorage/SharedPreferences. Nenhum teste foi desativado para obter sucesso. Workflow terminou com falha, Release corretamente pulada; APK já assinado/verificado, metadados e diagnósticos publicados separadamente.

[**Baixar APK 0.2.33 / 5302 diretamente, sem ZIP**](https://github.com/LucasCunh4/Panelinha/actions/runs/41490713531/artifacts/13164651410). Requer login no GitHub; retenção até 31/01/2027.

A compatibilidade de atualização foi conferida pela identidade/versão dos dois APKs reais. A execução real da atualização continua pendente. O mecanismo de dados locais não foi alterado; a partida em andamento continua apenas em memória. Nas resoluções Chromium inspecionadas, não se observou duplicação de ingredientes; a apresentação usa as bases reconstruídas fornecidas, com crescimento centrado para limitar a exposição de suas transições.
