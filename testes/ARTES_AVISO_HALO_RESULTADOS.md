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

Mantidos pacote `com.lucascunha.panelinha.teste`, origem `https://localhost`, certificado permanente geração 2, orientação horizontal/imersão, dados locais, Secrets e workflow. Nenhuma chave gerada. Próximo código deve superar o APK 0.2.32 / 5202 e o candidato reservado 5203. A assinatura e o conteúdo serão conferidos no APK real. Testes no navegador não substituem execução Android; falhas/pendências serão explicitadas.
