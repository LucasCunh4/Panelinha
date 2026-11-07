# Correção pontual da chama e fundos dos avatares laterais

Base: `0008c74e3d29efba11eb659d1807d5430f427d0b` (0.2.44/c6402), confirmada no GitHub; diretório limpo ao iniciar.

- Histórico consultado: `4a7de7f` acrescentou **-3 px CSS** ao deslocamento nativo anterior de -3 px. Agora `--flame-offset` é `-3 - 1.5/scale`: **+1,5 px CSS para a direita**, exatamente 50% do último ajuste. Deslocamento anterior, tamanho, intensidade, animações, queimador, cartas e órbita preservados.
- Causa do fundo lateral incorreto: regras antigas de maior especificidade mantinham `.seat-identity` com 76×30 px em celular e 82×36 px em tablet, apesar do avatar interno já circular. Correção restrita aos dois contêineres laterais: largura/altura iguais, proporção 1:1, raio 50%, fundo recortado pelo raio e imagem com recorte circular. Centro/tamanho da imagem e pontos dos contadores preservados; contadores ficam fora do recorte da imagem, sem serem cortados. Nomes mantidos pelo posicionador existente.
- Verificação visual direcionada em Chromium/Playwright: referência antes e comparação depois em **844×390 e 1280×800**. Confirmados +1,5 px CSS exatos, geometria idêntica do queimador/descarte/órbita, tamanho/animação da chama, contêineres/imagens circulares, tamanho/posição dos avatares, nomes e contadores legíveis. Sem erros JavaScript. Capturas e medições em `/workspace/work/chama-avatares/`.
- `npm run build` e `git diff --check`: aprovados. Sem executar suítes de regras; motor, servidor autoritativo, artes, sons, identidade Android e workflow não foram alterados. Expectativa anterior do teste de posicionamento atualizada para -1,5 px CSS; não executada a suíte extensa.

[Baixar APK 0.2.45 / código 6502 diretamente, sem ZIP](https://github.com/LucasCunh4/Panelinha/actions/runs/42325330864/artifacts/13554987447). Requer sessão no GitHub; retenção até 05/02/2027.

[Workflow #45](https://github.com/LucasCunh4/Panelinha/actions/runs/42325330864): compilação/assinatura aprovadas. APK real baixado e verificado com `ferramentas/verificar_apk.py`; metadados iguais aos do Actions, digest idêntico ao artefato e arquivos web exatamente iguais ao fonte. Pacote `com.lucascunha.panelinha.teste`, origem `https://localhost`, release, `sensorLandscape`, assets e sons conferidos.

- Certificado geração 2: `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`.
- `versionCode` **6502 > 6402** da anterior 0.2.44; identidade compatível com atualização sem desinstalação. Dados locais e Secrets não alterados.
- SHA-256 APK: `636a811dcbf2417877eb8e8175570d9786704a73245b52c9e1dd5791ffdb4f33`.

Instrumentação Android **não aprovada**: ADB/emulador ficou `offline` durante `a_imagesAndThreeBotsOffline`. Só há início do primeiro teste, sem conclusão: **0/13 casos Android concluídos**. Nenhuma falha de asserção do aplicativo registrada; causa raiz da perda do emulador não determinada. Instalação por cima com retenção de dados **não executada**, permanece pendente. Release pulada pelo gate existente; APK disponível como artefato direto. Nenhum teste desativado. Verificação de navegador não substitui Android físico.

Publicação web aprovada na segunda tentativa, após erro interno transitório 10500 da Cloudflare; versão `563fba95-03b9-466c-988b-1f336683b2af`. Health fase 3 ativo; hashes públicos de `mesa.js`, `efeitos-mesa.css` e `partida-ui.css` iguais aos arquivos testados. Lógica do servidor, bindings e credenciais preservados.
