# Artes oficiais +4/+6 — 01/11/2026

Base: `android/apk-testes`, commit de upload `96e9703`. Último APK distribuído: 0.2.21/c4102.

## Alterações restritas à apresentação

- Extraídos e lidos integralmente os três documentos do novo ZIP. Os 22 PNGs do pacote estão em `assets/cartas_mais4_mais6/`, idênticos aos originais. Documentos fornecidos em `documentacao/mais4-mais6-v1/`.
- Frentes `carta_mais4_completa.png` e `carta_mais6_completa.png` usadas na mão, no descarte e nos voos normais, sem alterar proporções ou repintar imagens. A +6 conserva os detalhes, faíscas e elementos dourados originais.
- Mesmo `PanelinhaColorPicker`: recebe o tipo da carta pendente e adapta somente base, camadas e geometria dos ingredientes. Eventos, brilho pulsante, hover localizado, feedback, confirmação de 200 ms, prevenção de envio duplo, teclado, Voltar e movimento reduzido continuam compartilhados com Escolher Cor.
- O manifesto fornecido mapeia os overlays completos e sprites, mas não contém coordenadas de toque. As áreas/origens de cada variante foram obtidas do canal alfa dos overlays de canvas 1024×1536, registradas no manifesto adicional e conferidas por teste. Nenhuma imagem foi recortada ou editada.
- `MANIFESTO_MAIS4_MAIS6.json` inclui SHA-256 de todos os 22 PNGs. Build e verificador do APK exigem os novos recursos, além dos manifestos anteriores. Sem dependências externas ou carregamento remoto.
- Nenhuma alteração nas artes anteriores, mesa, chamas, modo offline, Panela de Pressão, Liquidificador ou restante das funcionalidades. Comparação do script do motor com a base: idêntico byte a byte fora de `cardAssetPath`, `cardHTML` e `showColors`, as três funções de apresentação. SHA-256 do restante normalizado: `b6ee7b7220ffcaf400a2c25c803730717b456e6b00a2305a3e7af85aacc59410`.

## Testes

Suíte nova `node testes/artes_penalidades.cjs` **aprovada**:

- 22 PNGs por SHA-256, HTTP e decodificação; preservação dos recursos anteriores pelos quatro manifestos existentes.
- Base e quatro overlays correspondentes ao tipo. Composição em memória alinhada aos previews fornecidos, com tolerância máxima de 1/255 por canal para arredondamento alfa do Canvas.
- 12 layouts das duas variantes, de 320×568 a 1280×800: retrato, paisagem, alvos de toque ≥44×44 CSS px e frentes completas na mão.
- 28 seleções por toque: quatro cores nas duas cartas, início de penalidade e acúmulo sobre +2/+4/+6 conforme permitido. Conservação de IDs, valor acumulado, seleção imediata, destaque e envio único. Frentes oficiais presentes no descarte e no voo.
- +4 continua proibida sobre +6; última carta não exige cor desnecessária; funcionamento offline e movimento reduzido.
- Hover nas oito regiões das duas cartas, luminosidade/expansão da camada correta e confirmação por clique. Sem erros JS ou solicitações externas observadas.

`npm run build`, `npm run sync:android`, `git diff --check` e cinco testes do alocador de versões **aprovados**. Também aprovadas as suítes existentes `integracao.cjs` (16 cenários e 52 PNGs), `atualizacao_regras.cjs` (40 cenários, centenas de sorteios) e `escolher_cor.cjs` (16 escolhas e recursos anteriores). As demais regressões da mesa/navegação estão em execução e seus resultados serão registrados ao terminar.

Adicionado o décimo teste nativo, `j_penaltyCardArtAndColorPickerOffline`: decodificação das novas frentes/bases/camadas, oito escolhas por toque nas cartas +4/+6 durante +2 acumulado e conferência da frente no descarte. Os nove casos anteriores e os testes de atualização/persistência foram mantidos.

Capturas e logs da suíte nova em [evidencias-mais4-mais6](evidencias-mais4-mais6/).

## APK

Mantidos applicationId `com.lucascunha.panelinha.teste`, origem `https://localhost`, assinatura permanente da geração 2 e certificado SHA-256 `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`. Nenhuma chave ou Secret foi criado/alterado.

Mantido o workflow existente, seu alocador crescente e `actions/upload-artifact@v7` com `archive: false`, enviando somente o APK. O arquivo gerado e os resultados reais da instrumentação serão conferidos após a execução, incluindo falhas de infraestrutura sem ocultá-las.
