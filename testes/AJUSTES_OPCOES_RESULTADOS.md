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

Workflow [#28](https://github.com/LucasCunh4/Panelinha/actions/runs/41387326728), fonte `1068d74dfc2f263a71df14ca3c37eb6043054385`:

- Compilação web/release/instrumentação, assinatura e verificadores: **aprovados**. APK principal **0.2.28 / código 4802**; candidato de atualização 4803, não distribuído.
- APK principal baixado e novamente verificado localmente por `ferramentas/verificar_apk.py`: assinatura v2, pacote, origem, landscape/categoria game, código exato e todas as artes por SHA-256. [Metadados](AJUSTES_OPCOES_APK_0.2.28.json).
- Certificado SHA-256 **`3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`**, igual ao registro da geração 2 e ao APK anterior real **0.2.27 / código 4702**. Mesmo pacote `com.lucascunha.panelinha.teste` e origem `https://localhost`. Código 4802 maior que 4702/4703: identidade compatível com atualização direta, sem desinstalar.
- SHA-256 do APK: **`853a1b890d7926e18e5e889b85cb9e2b398ae434afcc72a2524508873bd413e4`**, igual ao digest do artefato GitHub. 65.166.302 bytes. Verificado arquivo APK direto (`AndroidManifest.xml` e assets na raiz), sem ZIP externo/APK aninhado.
- **Etapa Android falhou: 0/11 testes concluídos.** A instrumentação iniciou `a_imagesAndThreeBotsOffline`; AVD/ADB ficou indisponível (`device offline`), com conexão recusada na porta 5554. Logs coletados não contêm FATAL EXCEPTION/Fatal signal do app, OOM ou segfault do host. Havia cerca de 14 GiB disponíveis após a queda. A causa final da indisponibilidade do emulador não foi identificada; não houve resultado de assertiva funcional do aplicativo.
- **Pendentes:** execução nativa completa, capturas nativas nas duas orientações horizontais e teste real de atualização/preservação de UID, localStorage e SharedPreferences. Nenhuma verificação removida/desativada. Release pulada pelo fluxo após a falha; APK direto e diagnósticos publicados como artefatos separados.

[**Baixar APK 0.2.28 / 4802 diretamente, sem ZIP**](https://github.com/LucasCunh4/Panelinha/actions/runs/41387326728/artifacts/13115682554). Requer login no GitHub; retenção até 31/01/2027.

Testes web e verificação criptográfica não substituem execução nativa. A identidade de atualização foi conferida nos dois APKs reais; a preservação dos dados não pôde ser exercitada nesta execução. O mecanismo de dados locais permanece inalterado. A partida em andamento continua somente em memória, conforme o comportamento existente.
