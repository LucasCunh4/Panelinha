# Rastro inferior e halo de compra — 02/11/2026

## Diagnóstico e correções

O checkout anterior estava preservado, limpo e sincronizado com `origin/android/apk-testes` em `be6ec1e`. Nenhum trabalho foi descartado. As cartas, regras, bots, navegação, seletores personalizados, identidade Android e assinatura não foram substituídos.

**Brilho indevido com cartas válidas:** havia duas apresentações independentes. A nova `.pile-aura` respeitava `mustBuy`, mas a regra antiga `#buyBtn:not(:disabled)` ainda aplicava `drop-shadow(0 0 6px #ffe9a7)` e um contorno de 2px a qualquer botão de compra habilitado. Comprar voluntariamente é permitido mesmo com carta válida. Reproduzido em Chromium com uma carta azul legal: `data-mandatory=false` e aura oculta, porém filtro dourado/contorno continuavam ativos no botão. Essa regra foi removida, assim como o antigo pseudo-elemento luminoso sem uso. Há uma única apresentação luminosa de obrigação; foco visível por teclado foi preservado.

**Contato inferior:** o contorno antigo acompanhava apenas o botão/carta superior, enquanto as cinco camadas inferiores avançam de −1 a −5px horizontalmente e de +1,5 a +7,5px verticalmente. Além disso, o filtro no botão difundia luz sobre todo o conteúdo, inclusive o próprio halo, preenchendo o vão. A máscara anterior copiava PNGs/deslocamentos presumidos e não incluía as sombras CSS das cartas. Seu teste de pixels copiava apenas o SVG: não detectava o efeito antigo no botão nem essas sombras.

Agora a camada independente lê os retângulos e filtros das **seis cartas reais**, reproduz sua silhueta conjunta, incluindo sombras, e reserva um envelope externo de 5px. A luz difusa também é recortada por esse envelope. A reserva de 40px para o filtro inclui sombra, distância, borda e desfoque, sem cortar o efeito. A pulsação altera só opacidade, nunca tamanho ou afastamento. Não houve alteração dos PNGs, dimensões/posição da pilha ou área de toque.

**Validação funcional:** `humanMustDraw()` usa `checkCards(0,[id],false)`, a própria validação do comando de jogar. A habilitação das cartas humanas também usa essa função, evitando condições duplicadas. A cada render, o halo é recalculado com fase, turno humano, bloqueio temporal, ação pendente e compra ainda não realizada. Carta legal ou resposta legal à penalidade ocultam todo o efeito. Compra voluntária não o ativa. Pela regra definitiva desta tarefa, a existência do comando Desafiar não torna uma carta inválida em válida: sem carta de resposta, o halo aparece; o desafio e suas consequências continuam disponíveis e inalterados.

**Rastro:** conserva o centro horizontal −4px CSS, raios originais, parte superior e extremos laterais. Apenas a metade inferior recebe `2 / escala × seno(ângulo)²` no plano do cenário: zero nas laterais, progressivo até +2px CSS no fundo, com tangente contínua. Curvas cúbicas aproximam essa metade; dois arcos superiores mantêm a elipse original. Cabeça/caudas compartilham o mesmo percurso, sem recriar elementos ou reiniciar animações. Direção vem do mesmo estado do motor, com a inversão e a fase existentes; duração 7,5s, luminosidade e cauda preservadas. Chama, queimador e descarte não se movem.

## Validação

**19 suítes Chromium aprovadas** (as 18 anteriores + `rastro_halo.cjs`), **5 testes de versionamento aprovados** e **`npm run build` aprovado**. [Logs e capturas](evidencias-rastro-halo/). Os 16 testes de regras internos da suíte de integração também passaram. Nenhum teste existente foi removido.

A medição do DOM real encontrou **zero pixels de contato** e vãos de **4,75 a 5,5px CSS** entre cartas/sombras e halo nos três tamanhos e nas cinco fases (0/275/550/825/1100ms). O percurso foi conferido em 568×320, 844×390, 1280×800 e fallback web 390×844: topo/lados preservados, ponto inferior +2px CSS, deslocamento horizontal −4px, duração 7,5s. Regressões de inversão/sincronização, desafios, bots, Panela, leques, corte 2,2s, animações, menus, artes e modo offline passaram.

A nova suíte verifica casos de cor/número/símbolo, Coringa/+4/+6/Panela, penalidades com e sem resposta, bots, fim de rodada, corte, ação pendente, compra real e mudanças de mão/cor/penalidade. Testa o percurso real em quatro escalas, topo/lados fixos e acréscimo inferior de 2px. Capturas isolam o **DOM real** das seis cartas e do halo, incluindo estilos e sombras; medem separação/sobreposição em cinco fases da pulsação, em 568×320, 844×390 e 1280×800. A instrumentação Android existente foi ampliada, sem remover testes.

## Android

Mantidos `com.lucascunha.panelinha.teste`, `https://localhost`, orientação `sensorLandscape`, imersão, mecanismo de dados locais, certificado da geração 2 e workflow/Secrets existentes. Nenhuma chave criada. A entrega será feita somente após conferir a assinatura e o conteúdo do APK real. Testes no navegador e verificação estática do APK não substituem execução no Android; eventual falha de infraestrutura será registrada separadamente.
