# Correções da mesa, Panela de Pressão e estabilidade — 01/11/2026

## Implementação

- Opção `+6` usa o mesmo checkbox das outras cartas especiais, sem texto de estado adicional. Seu padrão e efeito continuam iguais.
- Card superior menor, com quebra de nomes longos; o leque tem centro próprio em 50% da mesa, independente da largura do nome/avatar.
- `SUA VEZ!` acima do leque humano, acompanhando sua expansão e o crescimento de 6%. Margens responsivas evitam recortes nas telas horizontais baixas.
- Hover eleva apenas a superfície da carta, sem mover os botões/vizinhos ou jogar. Funciona em leques normais e grupos compactos/expandidos; toque preservado.
- Panela mantém tipo `dist`, frente padronizada e efeito próprio. A transação de escolha guarda ID/tipo; o motor recusa identidade alterada e resolve a redistribuição em função específica, antes dos demais efeitos.
- Direção em SVG quadrado, círculos reais e escala uniforme no mesmo plano do fogão: centro nativo (836,451), raio 206. Cauda luminosa e inversão derivadas de `state.direction`, com fase preservada.
- +4/+6 usam exatamente os quatro overlays originais da Coringa, uma camada por alimento, sobre duas bases interativas reparadas. Não usam os overlays antigos com recortes visíveis. As 22 imagens originais do pacote e as frentes completas aprovadas continuam com os mesmos hashes; verso/Panela padronizados também intactos. Somente as duas bases da apresentação interativa foram adaptadas para remover os vestígios de alimentos/borrões.
- Monte conserva seis camadas e toque direto, sem contador visível. Quantidade real disponível no laboratório. Brilho obrigatório aplicado à silhueta do conjunto inteiro, sem cobrir a arte; disponibilidade calculada pelo motor, incluindo respostas/desafios.
- Assentos, avatares e cartas dos bots persistem entre renders. Cartas identificadas por ID; inserção/remoção/substituição somente quando necessário. Geometria do leque não é reaplicada quando permanece igual. Alterações reais ajustam o leque suavemente.

## Diagnóstico confirmado

**Panela:** na fonte recuperada (`745e6f9`), `cardAssetPath` já associava a frente padronizada ao tipo `dist`, e `applyPlay` já tinha redistribuição específica. A reprodução anterior às alterações mostrou redistribuição correta com e sem +20, mas o seletor rotulava a Panela como `wild`, com título genérico. Isso foi corrigido; a confirmação ficou vinculada ao ID/tipo e a resolução especial explícita no motor. Não foi possível reproduzir, nessa revisão, a ausência de redistribuição relatada pelo usuário. A evidência original está em [repro-panela-antes.json](evidencias-correcoes-estabilidade/repro-panela-antes.json). Nenhuma fórmula de redistribuição, pontuação, bot ou regra de corte foi alterada.

**Tremulação:** o render principal substituía `seat.innerHTML` em todos os assentos em cada ação, e a apresentação recriava novamente as cartas ocultas com `back.innerHTML`. Os elementos e suas transições reiniciavam mesmo sem mudança na mão. A atualização por ID elimina essa dupla reconstrução. A regressão usa referências DOM e MutationObserver: zero mutações nas mãos inalteradas durante mudanças de turno/renders repetidos.

**Ingredientes:** as bases antigas de +4/+6 continham áreas borradas e vestígios dos desenhos; seus overlays tinham recortes visíveis. As duas novas bases limpas ficam em `assets/interacao_v2/`, registradas por hash em `MANIFESTO_INTERACAO_V2.json`. Os ingredientes são os PNGs aprovados de `assets/especiais/`, sem edição.

## Testes web aprovados

16 suítes Chromium por HTTP: `integracao`, `atualizacao_regras`, `escolher_cor`, `artes_penalidades`, `horizontal_identidade`, `mesa`, `refinamentos_mesa`, `atualizacao_mesa`, `mesa_fina`, `mesa_atual`, `leque_continuo`, `navegacao`, `preparacao_menu`, `android-compat`, `padrao_400x850` e `correcoes_estabilidade`. Logs e imagens em [evidencias-correcoes-estabilidade](evidencias-correcoes-estabilidade/).

- Nova regressão: 35 jogadas de Panela através do seletor, conjuntos pequenos e de 20/40/80/120+ cartas, reduções 1/2/3, mínimo 1, diferença máxima 2 entre os demais, penalidades até +40, conservação de todos os IDs, última carta e recusa de tipo alterado durante seleção. Coringa comum não redistribui.
- DOM persistente, compra/remoção pontual, revelar/ocultar, seis camadas persistentes sem contador e brilho aplicado ao monte inteiro.
- 35 cenários horizontais (568×320 a 1280×800), 7/15/20/30/40/60/100 cartas; mão centrada e acessível, card superior contido, aviso acima do leque inclusive expandido. Web em retrato também coberta pelas suítes existentes.
- Hover real, ingredientes por toque/mouse, 28 escolhas nas penalidades, seleção offline, redução de movimento, desafios, bots, duplas, corte exato de 2,2s, cronômetro e animações preservados.
- Matrizes SVG confirmam raios horizontal/vertical iguais e centro compartilhado com as chamas. Inverter troca o sentido sem salto de fase.
- `npm run build`, hashes de todas as artes anteriores, duas bases novas e cinco testes de versionamento aprovados.

## Android

Aplicativo mantém `sensorLandscape`, imersão, pacote `com.lucascunha.panelinha.teste`, origem `https://localhost` e identidade da geração 2. Código nativo de produção, certificado e configuração dos Secrets não foram alterados. Os 11 testes de instrumentação existentes foram preservados e atualizados para conferir as bases reparadas, tipo da Panela, círculo, estabilidade e pilha completa. O teste de toque externo usa a mesa, pois o aviso SUA VEZ não intercepta eventos.

Compilação, certificado do APK real e resultados do emulador serão acrescentados após o workflow. Os resultados web não substituem execução no Android. O aplicativo conserva dados locais gravados; a partida em andamento continua existindo apenas em memória.
