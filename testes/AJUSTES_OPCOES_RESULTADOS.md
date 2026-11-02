# Ajustes de mesa, interações e opções — 02/11/2026

## Alterações

- **Panela de Pressão:** removida de todos os fluxos de escolha de cor. `COLORLESS` identifica legalidade das cartas incolores; `COLOR_CHOOSERS` contém somente Coringa/+4/+6. A Panela (`dist`) resolve diretamente sua redistribuição e mantém a cor ativa anterior. O seletor recusa explicitamente tipos não autorizados, inclusive `dist`. Bots também deixam de escolher/sortear cor para ela, em jogadas normais, compras e cortes; prioridades de decisão preservadas.
- A função de redistribuição permanece idêntica à versão anterior: redução sorteada de 1–3 quando possível, mínimo 1, diferença máxima 2 entre os demais, conservação dos IDs e autor excluído ao bater. Penalidades, pontuação, desafios e corte não foram modificados.
- **Hover:** a superfície da carta sobe 7px suavemente; botão e vizinhas permanecem nas mesmas posições. Destaque fica visível acima das demais também no leque compacto. Toque, primeiro toque para expandir e seleção por cor preservados.
- **Direção:** elipse horizontal real, centro nativo do queimador (836,451), raios 220×194. Extremos no cenário: x=616/1056 e y=257/645, alinhados à boca ilustrada. SVG mantém escala uniforme com o fundo/chamas. O rastro segue `state.direction`, mantém a fase ao inverter e não ilumina um aro completo permanentemente.
- **Monte:** halo separado das cartas, gerado pela união do alfa dos seis versos oficiais nos mesmos deslocamentos reais da pilha. Expansão de 2px e desfoque de 4px são isotrópicos; reserva de 18px igual nas quatro bordas, com coordenadas fracionárias para evitar deslocamento por arredondamento. O filtro não devolve a imagem original e fica atrás da pilha, sem pintar sobre as cartas ou interceptar toques. Halo normal discreto; obrigação real de compra recebe pulsação/intensidade maiores.
- Compra obrigatória continua sendo calculada pelas ações legais do motor: sem carta válida, inclusive em penalidades; resposta por carta ou desafio disponível não recebe indicação falsa de única ação. Após comprar, mudar turno ou encerrar obrigação, o reforço é removido.
- **Oponente superior:** card compacto aproximado da borda real do leque, com cerca de 12px de separação. Sua largura continua independente do centro das cartas. Sem recriar cartas/mãos inalteradas.
- **Opções:** mesma tela, IDs, valores e callbacks. Dois blocos temáticos, “Receita da partida” e “Temperos do jogo”, com molduras cobre, fundo violeta, seletores legíveis e checkboxes estilizados como toggles. Botão de início fica fora da região rolável; menus baixos rolam somente as opções. Rótulos compactos “Individual”, “Duplas” e “Por pontos” preservam valores e regras. Todos os recursos locais, sem novas imagens/fontes ou requisições externas.

## Validação web

**17 suítes aprovadas**: `integracao`, `atualizacao_regras`, `escolher_cor`, `artes_penalidades`, `horizontal_identidade`, `mesa`, `refinamentos_mesa`, `atualizacao_mesa`, `mesa_fina`, `mesa_atual`, `leque_continuo`, `navegacao`, `preparacao_menu`, `android-compat`, `padrao_400x850`, `correcoes_estabilidade`, `ajustes_opcoes`. Cinco testes de versionamento e `npm run build` também aprovados.

Evidências: [logs e capturas](evidencias-ajustes-opcoes/).

- Panela direta com/sem +2/+6/+20/+40, Individual/Duplas, mãos pequenas e grandes, conservação, compra seguida de jogada, corte humano, três bots e corte por bot. Nenhuma chamada ao seletor. Última carta encerra corretamente. Abertura da rodada sem seletor. Cor anterior preservada.
- Coringa/+4/+6: quatro cores, ingredientes por mouse/toque, desafios e penalidades preservados. Testes antigos que exigiam cor na Panela foram substituídos por verificações de resolução direta; verificações das outras cartas mantidas.
- Hover real com mouse em 7 e 40 cartas, compacto fechado/expandido, sem deslocamento dos vizinhos ou jogada; retorno suave. Toggle também operável por Espaço.
- Elipse medida pela matriz SVG, centro coincidente com chamas, proporção 220/194, sentidos coerentes antes/depois de Inverter. O teste antigo de círculo foi atualizado para a elipse solicitada.
- Nove combinações de tamanho/quantidade verificam halo com margens simétricas de 18px, seis imagens na máscara, card superior próximo e leque centrado. Compra obrigatória e respostas legais verificadas separadamente.
- Dez controles de configuração acessíveis em seis tamanhos (568×320 até 1280×800 e fallback retrato 390×844). Valores configurados chegam intactos à partida. Nomes longos, laboratório, navegação, dados locais de perfil, duplas, três bots, 2,2s de corte, mãos até 100 cartas e WebView antigo sem regressões.
- Todas as artes anteriores conferidas pelos manifestos; nenhum PNG alterado. Ajustes somente em HTML/CSS/JS/SVG, documentação e testes.

## Android

Mantidos `com.lucascunha.panelinha.teste`, origem `https://localhost`, assinatura permanente da geração 2, `sensorLandscape`, imersão e mecanismo de dados locais. Nenhuma chave criada; Secrets e workflow preservados. Os 11 testes de instrumentação continuam exigidos, com expectativas atualizadas para Panela sem cor, elipse e halo completo. O teste de atualização continua no fluxo.

Resultado do workflow, versão, certificado do APK baixado e link direto serão registrados após a compilação. Testes web não substituem execução nativa. A partida em andamento continua somente em memória, conforme o comportamento existente.
