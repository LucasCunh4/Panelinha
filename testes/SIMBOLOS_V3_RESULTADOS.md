# Símbolos V3 aprovados — substituição definitiva

Base `b18f563`, branch `android/apk-testes`, com o ZIP recém-enviado. Checkout limpo, sem perda/sobrescrita de trabalho.

## Novos arquivos instalados

Em `IMPORTACAO_PANELAS/`:

- `assets/cartas/elementos/bloqueio.png`
- `assets/cartas/elementos/inverter.png`
- `assets/cartas/elementos/mais2.png`
- `assets/cartas/elementos/numero_0.png`
- `assets/cartas/elementos/numero_1.png`
- `assets/cartas/elementos/numero_2.png`
- `assets/cartas/elementos/numero_3.png`
- `assets/cartas/elementos/numero_4.png`
- `assets/cartas/elementos/numero_5.png`
- `assets/cartas/elementos/numero_6.png`
- `assets/cartas/elementos/numero_7.png`
- `assets/cartas/elementos/numero_8.png`
- `assets/cartas/elementos/numero_9.png`

Pacote `panelinha_numeros_simbolos_sombra_aprovados_v3.zip`: CRC íntegro, SHA-256 `e4dcda424e8dad5db407ce6dda4b45fea0a77411d7b50e0d0ed93bc88297c1be`. Exatamente 13 PNGs RGBA 512×512, alfa de 0 a 255, cantos transparentes e limites dos desenhos inteiramente dentro do canvas, incluindo a sombra. Prévia dos 13 inspecionada: números, +2, Bloqueio e Inverter completos, branco brilhante, contorno/sombra preta inferior/direita; nenhum defeito aparente identificado. Arquivos idênticos byte a byte ao pacote; nenhuma edição, recorte, distorção ou imagem substituta.

## Arquivos anteriores excluídos via git rm

- `IMPORTACAO_PANELAS/assets/cartas/elementos/bloqueio_refeito.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/inverter_refeito.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/mais2_refeito.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_0_refeito.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_1_refeito.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_2_refeito.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_3_refeito.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_4_refeito.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_5_refeito.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_6_refeito.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_7_refeito.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_8_refeito.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_9_refeito.png`
- `panelinha_numeros_refeitos_separados.zip`, que continha os 13 símbolos substituídos.

Instalação e testes de renderização ocorreram antes da exclusão. Sem fallback, cópias ou backups das artes antigas. Nomes presentes no registro de remoção do manifesto e relatórios históricos não são referências ativas. Histórico Git preservado. Fundos/especiais/verso/cenário/sons não foram excluídos.

## Componentes atualizados

- `cartas.js`: `symbolArt` atualizado para o canvas 512×512 e limites visíveis próprios de cada V3; caminho usa os nomes aprovados sem sufixo antigo. Continua fundo + três instâncias do mesmo PNG, com controle independente do centro/canto superior/canto inferior, escala isotrópica e PNG integral com `contain`. `symbolLayout` permanece intacto: centro visual em (235,374), acima do centro geométrico, margens e limites existentes dos cantos.
- Manifesto `MANIFESTO_CARTAS_470X800.json`: caminhos/hashes/dimensões novos, pacote e registro das exclusões.
- `ferramentas/build-web.cjs` / `verificar_apk.py`: inventário exato de 13 nomes V3, dimensões 512×512, RGB dos fundos/RGBA dos demais, hashes e 23 PNGs/52 combinações. Identidade/assinatura não foram enfraquecidas.
- Teste `numeros_unitarios.cjs`, expectativa de imagem da instrumentação existente e instrução de assets em `AGENTS.md` atualizados. Testes Android preservados, não executados.

Intactos por comparação com a base: os quatro fundos novos, cinco especiais e verso; CSS de cartas/mesa, posicionamento das mãos, dimensões/escala atual, bordas externas 25 px, total 520×850, raios 70/45, efeitos/animações, motor, bots, servidor e identidade Android. Nenhuma mudança de regras, novo aumento ou redução do tamanho das cartas.

## Verificações executadas

- CRC, dimensões, alfa, margens do desenho/sombra e prévias individuais dos 13 PNGs: aprovados. Comparação byte a byte com o ZIP e com os dez assets preservados: aprovada.
- `node testes/numeros_unitarios.cjs`: aprovado. 52 combinações, mesma imagem nas três instâncias, proporção/contain, limites do PNG dentro da área ilustrada, centro/cantos alinhados, margens e ausência de eventos nas imagens. A asserção histórica de escala confirma o tamanho já existente (1,134 / 1,1016); não aplica outro aumento nesta tarefa. Layouts 568×320, 844×390, 1024×768 e 1280×800 sem rolagem global.
- `testes/cartas_470x800.cjs`, somente escopos `assets`, `layout`, `animations`: aprovado. 52 normais, cinco especiais e verso, oito layouts Individual/Duplas, mão de 40 cartas, seleção, compra normal/punitiva, descarte e montes. Recursos previamente carregados disponíveis offline, sem imagens quebradas/exceções JavaScript. Capturas da composição V3 inspecionadas.
- `npm run build` / `npx cap copy android`: aprovados, somente os 13 novos símbolos também nos pacotes gerados. Sintaxe JS/Python e `git diff --check`: aprovados.

Caminhos novos eliminam a reutilização dos PNGs substituídos pelo cache de imagens em memória. Não há service worker/precache do cliente. Nenhuma limpeza de dados locais.

## Publicação e APK final

Versão web publicada no Worker existente (`3c32d89a-5f4f-431c-a354-c981ff10ca1f`). Os 14 recursos modificados (renderizador + 13 PNGs) foram baixados e conferidos byte a byte com o build; o caminho de amostra do símbolo substituído não serve PNG antigo. Saúde Fase 3 confirmada. Nenhuma configuração, binding, regra do servidor ou sala pública alterada/criada.

[APK direto 0.2.54/c7402](https://github.com/LucasCunh4/Panelinha/releases/download/v0.2.54/Panelinha-Teste-v0.2.54-c7402.apk), 61.862.717 bytes, HTTP 200.

[Workflow 42420578986](https://github.com/LucasCunh4/Panelinha/actions/runs/42420578986): aprovado, execução 54, fonte `05b2d797f4e1c24e49db89156adfdeee8ca8f24c`. Uma compilação de APK, emulador ignorado por opção.

Verificador real `ferramentas/verificar_apk.py` executado também sobre o APK baixado da Release: aprovado. SHA-256 `8ef68eca8256a72e99b4f039a20b55d59c1be8b0d34d143e243cf3a08f1b5098`. Metadados regenerados idênticos ao CI; 23 PNGs (13 V3 512×512), 52 combinações, bytes do código e demais recursos conferidos; símbolos anteriores ausentes. Mesma geometria, pacote `com.lucascunha.panelinha.teste`, origem `https://localhost`, assinatura v2 e certificado da geração 2 de `android-identity.json`. sensorLandscape preservado. Código 7402 > 7302 permite atualização direta da mesma família, sem criação de chave ou alteração de Secrets.

Nenhum emulador/aparelho físico utilizado; instalação/atualização/persistência real e desempenho Android não foram executados e não são declarados aprovados.
