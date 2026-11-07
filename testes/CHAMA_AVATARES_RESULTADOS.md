# Correção pontual da chama e fundos dos avatares laterais

Base: `0008c74e3d29efba11eb659d1807d5430f427d0b` (0.2.44/c6402), confirmada no GitHub; diretório limpo ao iniciar.

- Histórico consultado: `4a7de7f` acrescentou **-3 px CSS** ao deslocamento nativo anterior de -3 px. Agora `--flame-offset` é `-3 - 1.5/scale`: **+1,5 px CSS para a direita**, exatamente 50% do último ajuste. Deslocamento anterior, tamanho, intensidade, animações, queimador, cartas e órbita preservados.
- Causa do fundo lateral incorreto: regras antigas de maior especificidade mantinham `.seat-identity` com 76×30 px em celular e 82×36 px em tablet, apesar do avatar interno já circular. Correção restrita aos dois contêineres laterais: largura/altura iguais, proporção 1:1, raio 50%, fundo recortado pelo raio e imagem com recorte circular. Centro/tamanho da imagem e pontos dos contadores preservados; contadores ficam fora do recorte da imagem, sem serem cortados. Nomes mantidos pelo posicionador existente.
- Verificação visual direcionada em Chromium/Playwright: referência antes e comparação depois em **844×390 e 1280×800**. Confirmados +1,5 px CSS exatos, geometria idêntica do queimador/descarte/órbita, tamanho/animação da chama, contêineres/imagens circulares, tamanho/posição dos avatares, nomes e contadores legíveis. Sem erros JavaScript. Capturas e medições em `/workspace/work/chama-avatares/`.
- `npm run build` e `git diff --check`: aprovados. Sem executar suítes de regras; motor, servidor autoritativo, artes, sons, identidade Android e workflow não foram alterados. Expectativa anterior do teste de posicionamento atualizada para -1,5 px CSS; não executada a suíte extensa.

APK assinado, versão, link e resultado do emulador serão registrados após o workflow existente. Verificação de navegador não substitui Android físico.
