# Alimentos permanentes em +4, +6 e Coringa

Base `5d74c06`, branch `android/apk-testes`, checkout limpo e igual ao HEAD remoto. Reutilizado o ZIP oficial `panelinha_elementos_cores_selecao_especiais.zip`, CRC íntegro e SHA-256 `a4206a7f4b99cda0a6896a4201d5b932bd9c072558b89ad415bd635f8d31f9fd`. Nenhuma arte redesenhada, recortada ou composta em PNG estático.

## Arquivos integrados

Quatro PNGs oficiais RGBA 512×512, movidos sem alteração de bytes para `IMPORTACAO_PANELAS/assets/ingredientes-especiais/`:

- `alface_panelinha_512.png`
- `mirtilos_panelinha_512.png`
- `queijo_panelinha_512.png`
- `tomate_panelinha_512.png`

Tomate = vermelho, queijo = amarelo, mirtilos = azul, alface = verde. Todas as 23 artes-base permanecem idênticas à base, incluindo os fundos normais, números V3, especiais e verso.

## Renderização e posicionamento

`cartas.js` agora monta cada frente de `wild4`, `wild6` e `wild` com a arte base completa e os quatro alimentos em camadas absolutas internas à carta. `PanelinhaCards.foodRegions(type)` centraliza arquivos, cores e coordenadas. Nenhuma camada interativa é criada dentro das cartas da mão: os eventos continuam no botão original da carta. `layers()` enumera cinco imagens nas três especiais; são 27 arquivos únicos (23 artes + quatro alimentos), com cache compartilhado.

Coordenadas no conteúdo 470×800, formato `(x, y, tamanho quadrado)`:

| Carta | Tomate / vermelho | Queijo / amarelo | Mirtilos / azul | Alface / verde |
| --- | --- | --- | --- | --- |
| +4 | (35, 140, 100) | (338, 145, 106) | (30, 352, 106) | (340, 355, 102) |
| +6 | (30, 122, 96) | (338, 110, 102) | (16, 326, 96) | (366, 326, 88) |
| Coringa | (17, 150, 90) | (330, 115, 108) | (16, 358, 90) | (368, 365, 86) |

Posições convertidas em percentuais por eixo; `object-fit:contain` preserva o PNG quadrado. As camadas herdam escala, rotação e movimento da carta na mão humana, mãos abertas, compra, prévia, voo de jogar, descarte e visualização ampliada. Nenhum alimento aparece no verso ou em cartas sem permissão de revelar a frente. Panela, Liquidificador e cartas normais não recebem alimentos.

`cartas.css` aplica hover somente às imagens dos alimentos da carta interativa: subida proporcional de 10% da altura do próprio PNG e escala 1,06, em 180 ms ease-out. Na carta ampliada isso corresponde aproximadamente a 5–6 px; na mão reduz proporcionalmente, evitando cortes/exagero. O efeito original da mão continua. Toque na mão mantém os alimentos estáticos após a transição de retorno do mouse; primeiro toque seleciona, segundo joga. Foco acessível e movimento reduzido preservados.

## Escolha de cor e limpeza

A grade separada da atualização anterior foi removida. `escolher-cor.js` usa o mesmo renderizador e cria somente hitboxes transparentes sobre os alimentos da própria carta ampliada, derivadas das mesmas coordenadas, com área mínima 44×44 e ajuste para permanecer na área útil. Não cria cópias dos PNGs. Callback, cancelamento, teclado, Escape e aplicação imediata da cor continuam; apenas Coringa/+4/+6 usam esse fluxo.

Retirados o mapeamento/preload duplicado e a marcação/CSS da grade externa, `.color-picker-choices`, `.ingredient-image`, `.ingredient-name`, tamanhos fixos e animação exclusiva dos ícones separados. A pasta anterior `assets/selecao-cor/` foi esvaziada e removida após `git mv` dos quatro PNGs. Seus quatro caminhos antigos já não existem. `documentacao/MANIFESTO_SELECAO_COR.json` foi movido para `MANIFESTO_INGREDIENTES_ESPECIAIS.json`, com novos caminhos e registro de remoções. PNGs continuam em uso, portanto nenhum deles foi apagado ou mantido como cópia/backup. O ZIP oficial continua sendo o pacote de origem válido.

Build e verificador de APK atualizados para conferir a pasta compartilhada e rejeitar a antiga no pacote. Metadata passa a registrar `specialIngredientAssetsVerified`. Instruções e expectativas de testes/instrumentação foram atualizadas; testes antigos conservados, sem desativação. Sem mudanças no motor, bots, pontuação, servidor, identidade Android, medidas das cartas/mãos, montes ou cadência de animações.

## Verificações executadas

- CRC/bytes do ZIP, RGBA/transparência/dimensões e 23 PNGs de artes-base: aprovados; imagens intactas.
- `node testes/alimentos_nas_cartas.cjs`: aprovado. Doze posicionamentos com amostragem da cor no jato original; limite do PNG e proteção da área do símbolo em repouso/hover. As três cartas na mão humana e em três oponentes revelados; hover dos alimentos, troca mouse/toque, dois toques, carta ampliada, compra/voo, decisão Jogar/Guardar, retorno à mão, voo de descarte e pilha final. Versos sem alimentos, cartas ocultas preservadas, contagem após compra/limpeza corretas, sem exceções JavaScript.
- Durante a validação, o tomate inicial da Coringa coincidiu com um reflexo quase branco: reposicionado no vermelho saturado, mantendo a área do símbolo livre. A fixture nova foi ajustada para aguardar o retorno CSS de 180 ms e observar separadamente voo de compra, prévia e voo de guardar, sem alterar a cadência do aplicativo. Nenhum teste foi removido para forçar sucesso.
- `node testes/elementos_cores.cjs`: aprovado. Coringa/+4/+6 em cinco resoluções (1280×800, 1024×600, 844×390, 568×320, 390×844), quatro áreas sobre a carta, doze escolhas por mouse/toque, hover/foco, cancelar/Escape, teclado, movimento reduzido e recursos já carregados offline. Sem grade ou PNG duplicado.
- `testes/cartas_470x800.cjs`, somente escopo `colors`: aprovado. Escolhas reais no motor para as quatro cores, +4/+6 e acúmulos permitidos/proibidos, cancelamento e offline, sem imagens quebradas/erros JS.
- `node testes/cartas_multiplayer_470x800.mjs`: aprovado. Projeções reais do servidor em Individual/Duplas, frentes do dono/parceiro com alimentos e mãos fechadas sem alimentos, sem revelar conteúdo ou criar sala pública.
- Comparação isolada do HTML das 52 normais, Panela, Liquidificador e verso com o renderizador anterior: idêntico. `geometry` e `symbolLayout` inalterados. Scripts de mesa/efeitos/motor e CSS da mesa comparados intactos.
- `npm run build`, `npx cap copy android`, sintaxe JS/Python e `git diff --check`: aprovados. Pasta nova incluída em dist/Capacitor, antiga ausente.

## Publicação e APK final

- Código salvo na branch `android/apk-testes`, commit `cc33a2f9464515a9a927e9dd28da0c9a2d0c7ae3`.
- [GitHub Actions 42425171178](https://github.com/LucasCunh4/Panelinha/actions/runs/42425171178): compilação, assinatura, verificações e publicação aprovadas. Etapas de emulador não executadas pela opção existente; nenhum teste removido ou marcado falsamente como aprovado.
- [APK direto 0.2.56/c7602, sem ZIP](https://github.com/LucasCunh4/Panelinha/releases/download/v0.2.56/Panelinha-Teste-v0.2.56-c7602.apk), 62.657.987 bytes. Código anterior: 7502.
- APK baixado e validado localmente por `ferramentas/verificar_apk.py`: assinatura v2, certificado da geração 2, pacote `com.lucascunha.panelinha.teste`, origem `https://localhost`, `sensorLandscape`, 23 artes-base, quatro ingredientes e demais recursos/código esperados. Metadados regenerados idênticos aos produzidos pelo CI. Configuração e identidade permitem atualização direta da versão anterior sem desinstalar; instalação/persistência em dispositivo não foram executadas.
- Certificado SHA-256: `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`.
- SHA-256 do APK: `c4e58ee0d8ef0f8d62a3cfabc4336e36ab2fd2736a288249d3f60cf3936af902`.
- Web publicada em `https://panelinha-lobby.lucas260802.workers.dev`, versão Worker `45158150-88eb-4fbe-b747-b244eab15b4c`. Os quatro scripts/estilos alterados e quatro PNGs publicados conferidos byte a byte com o build; `/health` retornou `v:1`, `phase:3`, `gameplay:true`. Servidor, credenciais e regras preservados.

Emulador e Android físico não executados; instalação/atualização/persistência real e desempenho em hardware não são declarados aprovados. Verificações visuais feitas no navegador, incluindo viewport de celular/tablet e toque simulado. Sem pendências funcionais observadas nos escopos executados.
