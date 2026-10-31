# Refinamentos da mesa — rodada seguinte à 0.2.11

Base: `android/apk-testes`, commit `91e24df`. A implementação continua no jogo existente, sem uma segunda lógica de regras.

## Alterações

- Chamas: máscara radial suaviza/encurta as pontas; opacidade ativa de 0,66, saturação e brilho menores. Oscilação de escala/rotação e luminosidade contínuas, discretas e com períodos diferentes. Cor ativa e transição de cor preservadas; PNGs originais intactos. Movimento reduzido mantém a chama estática.
- Compra: monte vertical na borda esquerda, fora do queimador, com toque direto, contagem e indicação de penalidade preservados.
- Oponentes: cartas apoiadas diretamente na mesa, sem painel de fundo. Mão superior na borda de cima; laterais giradas em ±90°. Somente nome/avatar/contagem usam um rótulo pequeno, com destaque de turno. Até sete versos representam a mão oculta; o rótulo conserva a contagem real. Parceiro aberto em duplas; adversários ocultos em individual. Revelação explícita do laboratório preservada.
- Jogada: captura da geometria da carta antes de substituir o DOM da mão, seguida de cópia visual com voo de 560 ms até o descarte e assentamento de 150 ms. Funciona para humano e três bots, incluindo corte. Carta oculta começa pelo verso e revela apenas a carta jogada durante o percurso. O novo topo do descarte fica oculto até o pouso. A camada não intercepta toques nem posterga o motor. Movimento reduzido mostra o resultado imediatamente; rotação cancela somente o efeito e mantém o estado.
- Corte: balão oficial de faca ampliado de 44 para 58 px, com espaço na mão para não recortar o alvo. Carta inteira e balão continuam acionando o corte original.

## Código e estrutura

Chamas e tamanho da faca foram ajustados por CSS. Nenhum PNG, arte de carta ou manifesto de imagem mudou. Os 52 arquivos de cartas e seis recursos da mesa conservam seus SHA-256.

O monte passou a ser filho direto da mesa no HTML para ficar independente do bloco central. Os oponentes ganharam um agrupamento pequeno para identidade, separado das mãos. A animação acrescenta uma camada visual e um gancho de leitura antes do render existente. Não há novo estado de partida nem espera acrescentada às jogadas.

Comparação com a base: a única função modificada no script principal é `render`, com a chamada de apresentação antes da reconstrução das mãos. As outras 52 funções, inclusive regras, pontuação, compra, corte e bots, são idênticas byte a byte. A pausa de corte permanece em 2800 ms. Pacote Android, origem `https://localhost`, certificado de geração 2, Secrets e workflow permanecem os mesmos.

## Web: executado e aprovado

- `node testes/integracao.cjs`: 16/16 regressões, incluindo penalidades acumuladas, Distribuidora, Giro, corte, pontuação, bots, laboratório e 52 imagens.
- `node testes/mesa.cjs`: 320×568, 360×640, 390×844, 412×915, 568×320, 667×375, 844×390, 915×412, 1280×800 e 1920×1080. Sem rolagem da mesa; registro fundo/chama, compra, menu, cores, corte, privacidade e mãos grandes aprovados.
- `node testes/refinamentos_mesa.cjs`: monte à esquerda/vertical, mãos físicas e orientação, máscara/intensidade/animação da chama, origem real do toque humano, voo dos três bots, versos e privacidade, pouso no descarte, rotação durante o voo e movimento reduzido. Motor avança sem esperar o efeito; pausa de corte preservada. Nenhuma exceção JS.
- `npm run build`: pacote web e hashes aprovados.
- `node testes/android-compat.cjs`: bundle de distribuição com APIs antigas simuladas, imagens e bot aprovados.
- `python3 testes/versao_android.py`: 5/5 verificações de sequência de versão.
- Sintaxe JS/shell e `git diff --check` aprovados.

Capturas Chromium (cenários de teste determinísticos):

- [Retrato 390×844](../evidencias-refinamentos/390x844-duplas.png)
- [Paisagem 568×320](../evidencias-refinamentos/568x320-duplas.png)
- [Corte em 320×568](../evidencias-refinamentos/320x568-corte.png)
- [Carta humana a caminho do descarte](../evidencias-refinamentos/voo-humano-meio.png)
- [Carta de bot a caminho do descarte](../evidencias-refinamentos/voo-bot-1-meio.png)

## Android

A compilação assinada e as evidências Android desta rodada serão registradas aqui após a execução do workflow. A instrumentação conserva os quatro testes offline e as duas verificações de persistência (reinício e atualização), acrescentando verificação da origem da animação, toque no próprio balão e posição vertical/esquerda do monte.

Somente no emulador descartável do CI, a escala global de animadores é restaurada para 1 para testar o movimento normal do WebView; transições de janelas continuam desativadas. As correções anteriores de infraestrutura, diagnósticos e agregação de falhas continuam presentes. Nenhum teste foi removido.

## Limitações

Não há teste em celular físico nesta rodada. As capturas estáticas não demonstram a fluidez; o percurso e a duração são verificados por testes automatizados, com capturas intermediárias. Preferência por movimento reduzido intencionalmente evita o voo. A partida em curso continua em memória, como no protótipo anterior; a atualização preserva a identidade e os dados persistidos, sem prometer retomada da partida.
