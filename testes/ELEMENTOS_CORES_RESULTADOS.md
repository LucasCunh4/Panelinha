# Ingredientes oficiais na escolha de cor

Base `033bafc` em `android/apk-testes`, contendo o novo ZIP, sem trabalho local pendente/perdido.

## Novos arquivos

Em `IMPORTACAO_PANELAS/`:

- `assets/selecao-cor/alface_panelinha_512.png`
- `assets/selecao-cor/mirtilos_panelinha_512.png`
- `assets/selecao-cor/queijo_panelinha_512.png`
- `assets/selecao-cor/tomate_panelinha_512.png`

Origem `panelinha_elementos_cores_selecao_especiais.zip`, CRC íntegro, SHA-256 `a4206a7f4b99cda0a6896a4201d5b932bd9c072558b89ad415bd635f8d31f9fd`. Os quatro PNGs são RGBA 512×512, alfa 0–255, cantos transparentes, desenho integral e margem no canvas. Prévia inspecionada, sem defeitos aparentes. Instalados sem editar/redimensionar os arquivos; bytes idênticos ao ZIP.

## Integração e interação

`escolher-cor.js` mantém uma única lista/componente para Coringa/+4/+6: tomate → vermelho, mirtilos → azul, queijo → amarelo, alface → verde. Os quatro ingredientes ficam em uma grade junto da prévia da carta completa, preservando as artes. Não são sobrepostos sobre desenhos da carta.

`escolher-cor.css` usa imagens de 56–84 px em landscape/desktop, com ajuste em retrato, `object-fit:contain` e transparência integral. Repouso parado, sem pulsação; hover/foco/toque sobe 8 px e amplia 8% em 180 ms ease-out, com sombra/brilho discretos. Confirmação curta de 180 ms, sem retardar a aplicação da cor pelo motor. Preferência de movimento reduzido respeitada. Botões reais com rótulos acessíveis, foco de teclado, Tab/Enter, Escape e Cancelar/Voltar existentes preservados.

## Exclusões e limpeza

Não existiam PNGs antigos ativos e independentes de ingredientes neste HEAD: o seletor anterior usava zonas transparentes sobre as artes completas. Os PNGs antigos já tinham sido retirados na migração 470×800. Portanto nenhum arquivo de imagem antigo precisava de `git rm` nesta atualização. As frentes aprovadas continuam necessárias e foram preservadas.

Removidos do código:
- Array de regiões/posições antigas e marcação das zonas transparentes.
- `.ingredient-layer`, `.color-zone`, `.color-picker-content` e animações `color-zone-glow`/`color-zone-selected`.
- Cinco regras de botões genéricos/quadrados coloridos do CSS de `index.html`.
- A antiga regra global de tamanho fixo `.colorbtn` em `mesa.css`.

Não há fallback ou cópia antiga de ingredientes. A classe de identificação `colorbtn` permanece nos botões para compatibilidade com os controles/testes existentes; sua aparência é definida pelo componente novo.

## Demais arquivos atualizados

- Novo `documentacao/MANIFESTO_SELECAO_COR.json` com os quatro hashes, dimensões e pacote de origem.
- `ferramentas/build-web.cjs` e `verificar_apk.py` conferem inventário/bytes/hashes/RGBA 512×512 e presença dos quatro recursos no APK offline.
- Novo teste `testes/elementos_cores.cjs`; expectativas de ingredientes em testes existentes e instrumentação Android atualizadas, sem excluir testes.
- Instrução do seletor em `AGENTS.md` atualizada.

As 23 artes de cartas foram comparadas byte a byte com a base e permanecem intactas. `cartas.js`, `cartas.css`, motor, animações, servidor, identidade Android e workflow sem alterações. Em `index.html` e `mesa.css`, comparação confirmou exclusivamente a retirada dos estilos obsoletos citados, sem alterar lógica, geometria ou demais menus.

## Verificações executadas

- `node testes/elementos_cores.cjs`: aprovado. Coringa/+4/+6 em cinco tamanhos (1280×800, 1024×600, 844×390, 568×320, 390×844); quatro imagens corretas/transparentes sem corte/distorção, controles visíveis, repouso estático e ausência das zonas antigas. Hover -8 px / 1,08 / 180 ms e retorno sem deslocar vizinhos. Doze escolhas por mouse/toque, destaque por toque sem seleção no pointerdown, teclado, cancelamento/Escape, movimento reduzido, imagens já carregadas disponíveis offline e recusa de Panela/Liquidificador. Nenhum erro JavaScript/imagem ausente. Capturas inspecionadas; contorno automático de foco do diálogo removido, mantendo o foco dos botões.
- `testes/cartas_470x800.cjs`, somente escopo `colors`: aprovado. Doze escolhas reais no motor, cor/penalidade corretas, acúmulos permitidos de +4/+6, +4 proibido sobre +6, cancelamento, prévia de carta intacta e recursos previamente carregados disponíveis offline. Sem exceções JavaScript ou imagens quebradas.
- CRC/SHA, sintaxe JS/Python, `git diff --check`, `npm run build` e `npx cap copy android`: aprovados. Os quatro PNGs estão também em dist/Capacitor; cartas originais e código preservado conferidos.

## Publicação e APK final

Versão web publicada no Worker existente (`abef9052-1b35-479c-92fe-26053db81a62`); oito arquivos modificados (HTML, estilos, seletor e quatro PNGs) baixados e conferidos byte a byte com o build. Saúde Fase 3 confirmada, sem modificar código/configuração do servidor ou criar salas públicas.

[APK direto 0.2.55/c7502](https://github.com/LucasCunh4/Panelinha/releases/download/v0.2.55/Panelinha-Teste-v0.2.55-c7502.apk), 62.657.623 bytes. Download completo realizado pelo próprio link direto.

[Workflow 42422484264](https://github.com/LucasCunh4/Panelinha/actions/runs/42422484264): aprovado, execução 55, fonte `840e723d0c881d5b481865f60594308276b3e4be`. Uma compilação de APK, com emulador ignorado por opção. A API do GitHub retornou 503 ao iniciar o download pelo CLI; o download pelos URLs diretos da Release terminou normalmente. Não foi uma falha da compilação ou do aplicativo.

`ferramentas/verificar_apk.py` também executado sobre o APK real baixado: aprovado. SHA-256 `5b1377db128e031b153d51b49d5cae13ad5c9a7e088b9330011a8f6fe810b133`. Metadados regenerados idênticos aos do CI. Conferidos quatro ingredientes RGBA 512×512, inventário/bytes/hashes, 23 artes de cartas preservadas, 52 combinações, código web e demais recursos. Mesma geometria, pacote `com.lucascunha.panelinha.teste`, origem `https://localhost`, assinatura v2/certificado da geração 2 de `android-identity.json` e sensorLandscape. Código 7502 > 7402, compatível com atualização direta. Nenhuma chave ou Secret criado/alterado.

Nenhum emulador ou Android físico executado; instalação/atualização/persistência real e desempenho em aparelho permanecem não testados e não são declarados aprovados.
