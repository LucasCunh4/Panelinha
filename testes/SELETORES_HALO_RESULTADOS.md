# Seletores expansíveis, halo externo e órbita — 02/11/2026

## Implementação

- **Listas personalizadas:** `seletores.js`/`seletores.css` apresentam os seis seletores existentes (quatro configurações e dois do laboratório) em popovers violeta, moldura cobre, opção selecionada, hover e feedback de toque. As caixas nativas não participam da interação nem da árvore de acessibilidade; os elementos originais permanecem como modelo, com mesmos IDs, valores e callbacks. A tela de configuração foi preservada.
- Combobox/listbox com nomes acessíveis, opção ativa/selecionada e opções desabilitadas. Toque/clique escolhe e fecha; toque fora, Escape e Tab fecham; setas, Home/End, Enter/Espaço e busca por letras funcionam. O primeiro Voltar fecha apenas a lista, tanto pela ponte Android quanto pelo histórico web; o seguinte segue a hierarquia existente. Popover ancorado e limitado à viewport/áreas seguras, rolagem interna e abertura/fechamento de 130/100ms; movimento reduzido respeitado.
- Metas/opções dinâmicas, textos de nomes e estados desabilitados sincronizados por evento/MutationObserver, sem disparar callbacks adicionais. Valores/callbacks do jogo não foram reimplementados. Somente a apresentação foi substituída.
- **Halo externo:** continua usando a silhueta conjunta dos seis versos, em camada independente atrás das cartas e sem interceptar toque. Envelope de exclusão de 5px, borda entre 5–7px e halo difuso recortado pelo mesmo envelope: nem a luz difusa invade o espaço vazio junto às cartas. Reserva de 26px nas quatro bordas evita corte do filtro. Cantos seguem a máscara arredondada original, sem alterar PNGs ou posição da pilha.
- **Condição do halo:** oculto por padrão; aparece somente com `mustBuy`, calculado no render original com `canPlay`, turno humano, estado de ação, penalidades e desafio disponível. Carta válida, resposta à penalidade, turno de bot, compra já feita ou outra restrição retiram o efeito imediatamente. Não existe mais halo discreto permanente durante compra voluntária.
- **Órbita:** somente seu centro foi deslocado 4px CSS à esquerda, compensando a escala uniforme do cenário em `layout()`. Raios 220×194, altura, brilho, velocidade de 7,5s, cauda e direção/inversão permanecem iguais. Chama, queimador e descarte mantêm seus centros anteriores.
- Motor/callbacks inline de `index.html` comparados com a revisão anterior: **idênticos**. Nenhuma regra, carta, bot, pontuação, seleção de cor ou arte foi alterada. Novos JS/CSS são copiados para o pacote offline e conferidos byte a byte pelo verificador do APK.

## Testes

**18 suítes web aprovadas**: as 17 anteriores e `seletores_halo.cjs`. Cinco testes de versionamento e `npm run build` também aprovados. [Logs e capturas](evidencias-seletores-halo/).

- Quatro seletores de configuração: valores originais, callback único, opção selecionada, metas dinâmicas e desabilitação. 24 combinações de seletor/tela, de 568×320 até 1280×800 e fallback retrato; altura adicional de 240px. Sem popup nativo, opções com alvos de 44px após abertura, lista dentro da viewport.
- Mouse/hover, teclado, toque, toque fora, rolagem real por gesto de toque, fechamento e Voltar web/ponte Android. Laboratório usa o mesmo componente e injeta corretamente a carta escolhida; Voltar fecha a lista antes do laboratório. Escolha offline e movimento reduzido.
- Halo: 15 situações de disponibilidade, incluindo +2/+4/+6, respostas legais, Panela, desafio disponível, turno dos bots, bloqueio temporal, compra já realizada e rodada encerrada. Oculto quando não há obrigação de compra.
- Teste de pixels renderiza cópias do SVG em memória, sem editar imagens do projeto: **zero sobreposição** com a área opaca das cartas; distância externa de **5,25 / 5,25 / 5,25 / 5px** nos quatro lados. Espaço e luminosidade simétricos, máscara formada pelos seis versos.
- Órbita medida em três escalas: deslocamento horizontal −4px CSS, nenhum deslocamento vertical; raios/velocidade preservados, chama/descarte no mesmo local. Testes existentes de sentido antes/depois de Inverter preservados.
- Regressões de regras, Panela sem escolha de cor, desafios, duplas, bots, corte 2,2s, cronômetro, mãos compactas, animações, navegação, perfil local, artes e WebView antigo aprovadas.

Durante a implementação, o teste de Voltar detectou navegação prematura: a prioridade foi corrigida no roteador e o teste passou. O gesto de rolagem sintetizado do CDP não rolava nem um HTML simples neste ambiente; o teste usa eventos reais de toque com movimento/soltura, que rolaram o popover corretamente. Nenhuma verificação foi eliminada para obter aprovação.

## Android e entrega

Permanecem pacote `com.lucascunha.panelinha.teste`, origem `https://localhost`, certificado da geração 2, Secrets e workflow existentes. Orientação horizontal e imersão não foram alteradas. Os 11 testes de instrumentação continuam exigidos, agora incluindo a lista personalizada e Voltar, além do centro deslocado da órbita.

Versão, verificação do APK real, resultado do emulador e link direto serão acrescentados após o workflow. Testes web não substituem execução nativa; o mecanismo de dados locais permanece inalterado e a partida em andamento continua apenas em memória.
