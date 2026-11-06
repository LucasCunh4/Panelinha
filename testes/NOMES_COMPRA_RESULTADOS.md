# Nomes na mesa e compras — 06/11/2026

Base recuperada: `67409cf`, HEAD remoto de `android/apk-testes`, diretório limpo.

- Três rótulos de nome independentes dos leques/avatares, sem nome do jogador local. Fonte de 20px (aproximadamente o dobro da anterior), com adaptação até 16px para nomes longos/espaço limitado. Posicionamento considera cartas, avatares, monte, descarte, menu, cronômetro e aviso de conexão; acompanha o fim das transições dos leques. Sem deslocar cartas nem recriar mãos. Seleção de avatar permanece sem rótulos.
- Reutiliza os nomes reais e a projeção local de assentos já existente no multiplayer. Trocar temporariamente um humano por bot não muda seu nome. Rótulos usam `textContent`; não alteram o motor, dados ou mensagens do servidor.
- Compra própria isolada com 2400ms (antes 1450ms): chegada à prévia em 960ms e pausa de 960ms. Easing por trecho conserva a aceleração/desaceleração sem comprimir artificialmente esses tempos. Carta jogável continua esperando Jogar/Guardar quando autorizado.
- Compras sucessivas começam com intervalo de 1100ms, diminuindo gradualmente e mantendo a prévia de cada carta separada. Sequências muito grandes ainda aceleram, com orçamento de 14s para os escalonamentos. Compras alheias usam somente verso, diretamente para a mão em 850ms, sem prévia/frente — inclusive no modo Duplas. Quantidades, turno, penalidades e compra infinita continuam decididos pelo motor.

Verificações executadas:

- `testes/nomes_compra.cjs`: compras aprovadas — isolada/Guardar em 2400ms, tempos reais de chegada/pausa, compra infinita com escalonamentos 0/1100/2156ms e decisão final, penalidade +6 sem ação de descarte, conservação da quantidade na mão e compra alheia com verso.
- Mesmo teste, filtro `--names-only` após corrigir o acompanhamento da transição: aprovado. Três nomes de bots, fonte ampliada, próprio nome oculto e seleção de avatar sem textos. Quatro perspectivas de snapshots privados produzidos por `gameView`, incluindo substituição temporária por bot e nomes longos, em 844×390 e 1280×800, sem sobreposições com cartas/avatares/monte/descarte/menu. Foram testadas as projeções no cliente; não se trata de uma nova bateria de partidas/conexões online.
- Uma compilação web: aprovada. Manifestos/52 PNGs e artes/sons mantidos. Nenhum código do motor ou servidor alterado.
- Expectativas das suítes visuais anteriores ajustadas para os novos nomes/tempos; não foram executadas novamente. Nenhum teste removido ou desativado. Capturas/logs fora do Git em `/workspace/work/nomes-compra`.

applicationId, origem, assinatura geração 2, armazenamento, Secrets e workflow permanecem intactos. Resultado Android será registrado após a execução única.
