# Composição dos alimentos e toque direto — 08/11/2026

Base preservada: `5917e62`, branch `android/apk-testes`, APK anterior 0.2.56/c7602. Nenhuma perda de arquivos: alterações não commitadas e logs recuperados após interrupção; apenas o servidor HTTP de prévia precisou ser retomado. Não houve limpeza ou reconstrução do projeto.

## Alterações

- `cartas.js`: alimentos aproximados das trilhas coloridas de +4/+6/Coringa, com posicionamento próprio por arte. Coordenadas no conteúdo 470×800, `(x,y,tamanho)`:

| Carta | Vermelho/tomate | Amarelo/queijo | Azul/mirtilos | Verde/alface |
| --- | --- | --- | --- | --- |
| +4 | (55,165,100) | (302,138,110) | (52,374,100) | (314,372,104) |
| +6 | (48,165,100) | (333,133,104) | (40,340,100) | (349,329,92) |
| Coringa | (50,176,96) | (307,145,110) | (42,395,100) | (324,390,104) |

- `escolher-cor.js/.css`: somente a carta ampliada fica visível, centralizada; sem instrução, título visual ou botão externo. Alimentos continuam sendo as quatro áreas de escolha. Nome do diálogo mantido somente para leitores de tela. Cancelamento por fundo, Escape e Voltar preservado, inclusive o ponto de integração `cancelColor` usado pelo fluxo online/Android.
- `mesa.js/.css`: removidos seleção persistente, estado `hand-picked` e confirmação por segundo toque. Um toque/clique/ativação pelo teclado tenta jogar pelo mesmo comando validado pelo motor. Nas três especiais, abre diretamente a escolha de cor necessária. Hover/foco, guarda contra arraste, cartas em voo e transições bloqueantes continuam. Não há anúncio ou jogada automática por hover.
- Teste `mao_dois_toques.cjs` migrado para `mao_um_toque.cjs`; expectativas de outros testes e helper de toque da instrumentação atualizados. Arquivos de testes preservados, sem executar emulador.
- Nenhum PNG, regra, servidor, assinatura, dimensão/borda, cadência de compra ou outro asset foi alterado. Removidos somente código/CSS da seleção por dois toques e marcação/estilos da instrução anterior. Os quatro alimentos aprovados e 23 artes-base continuam em uso.

## Verificações realmente executadas

- `node testes/mao_um_toque.cjs`: aprovado. Primeiro toque joga; carta inválida não joga e mostra feedback; corte válido funciona, expirado/Bloqueio/penalidade não permitem burlar regras; transição bloqueia ação; mão de 40 cartas em celular/tablet e arraste com 160 cartas; hover, clique de mouse em híbrido, setas/Enter. Multiplayer envia um único comando no primeiro toque e o motor autoritativo valida o descarte. Sem erros JavaScript.
- `node testes/alimentos_nas_cartas.cjs`: aprovado. Doze posições com cor de fundo amostrada no PNG original, proporção/transparência e limites em repouso/hover, proteção do símbolo central por contorno. Mão humana e oponentes revelados, cartas ocultas/verso, compra, prévia Jogar/Guardar, voo de descarte e pilha final. Sem perda/duplicação na compra observada.
- `node testes/elementos_cores.cjs`: aprovado. Três cartas em 1280×800, 1024×600, 844×390, 568×320 e 390×844; sem textos visuais/grade ou imagens duplicadas, quatro escolhas por toque/mouse, hover, teclado, fundo/Escape/Voltar nativo no fluxo da partida, movimento reduzido, recursos carregados offline e recusa de Panela/Liquidificador.
- A amostragem detectou posições sobre trechos roxos da +6 durante o ajuste; mirtilos e alface reposicionados no azul/verde, sem editar as imagens. A medição de hover passou a usar a altura CSS fracionária, e o teste de Voltar passou a abrir uma partida real antes do modal. A primeira tentativa após a interrupção falhou por prévia HTTP parada; retomado somente esse processo. As execuções finais passaram, sem remover verificações.
- `npm run build`, sintaxe JS e `git diff --check`: aprovados. Apenas verificações direcionadas; nenhuma bateria completa repetida.

Publicação e APK serão registrados após a compilação final. Emulador, dispositivo Android físico e instalação/atualização/persistência real não executados; não são declarados aprovados.
