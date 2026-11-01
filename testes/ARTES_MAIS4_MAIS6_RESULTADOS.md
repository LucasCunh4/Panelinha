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

`npm run build`, `npm run sync:android`, `git diff --check` e cinco testes do alocador de versões **aprovados**. Também aprovadas as suítes existentes `integracao.cjs` (16 cenários e 52 PNGs), `atualizacao_regras.cjs` (40 cenários, centenas de sorteios) e `escolher_cor.cjs` (16 escolhas e recursos anteriores). Todas as demais regressões também passaram: `mesa.cjs`, `refinamentos_mesa.cjs`, `atualizacao_mesa.cjs`, `mesa_fina.cjs`, `mesa_atual.cjs`, `leque_continuo.cjs`, `navegacao.cjs`, `preparacao_menu.cjs` e `android-compat.cjs`. Total: **13 suítes Chromium aprovadas**, além dos cinco testes de versionamento. Logs completos em `evidencias-mais4-mais6/`.

Adicionado o décimo teste nativo, `j_penaltyCardArtAndColorPickerOffline`: decodificação das novas frentes/bases/camadas, oito escolhas por toque nas cartas +4/+6 durante +2 acumulado e conferência da frente no descarte. Os nove casos anteriores e os testes de atualização/persistência foram mantidos.

Capturas e logs da suíte nova em [evidencias-mais4-mais6](evidencias-mais4-mais6/).

## APK

Mantidos applicationId `com.lucascunha.panelinha.teste`, origem `https://localhost`, assinatura permanente da geração 2 e certificado SHA-256 `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`. Nenhuma chave ou Secret foi criado/alterado.

Mantido o workflow existente, seu alocador crescente e `actions/upload-artifact@v7` com `archive: false`, enviando somente o APK.

### Resultado real e download

- [GitHub Actions #22](https://github.com/LucasCunh4/Panelinha/actions/runs/41258767793), código-fonte `8fc6f06c9fdcbb1bd9838f2d1549d07128fe42b6`: compilação dos APKs release, instrumentação e candidato de atualização **aprovada**. Assinatura fixa conferida no CI, sem alteração dos Secrets.
- Entrega **0.2.22 / código 4202**; candidato interno 4203. Verificação independente do APK baixado com `apksigner`, `aapt` e `ferramentas/verificar_apk.py`: assinatura v2 da geração 2, pacote/origem corretos, release, orientação e todos os arquivos esperados. Conferidos 52 PNGs anteriores, seis da mesa, dois recursos do menu, 13 artes especiais anteriores e os **22 PNGs novos**.
- SHA-256: `b70dc84513af4857b124973163dcdde393e70f8e5a46e71b59da7263da16e90d`, igual ao digest do artefato GitHub. O arquivo é o próprio APK, com `AndroidManifest.xml` e `classes.dex` na raiz; não contém outro APK interno e **não precisa de extração**.
- [Baixar diretamente Panelinha-Teste-v0.2.22-c4202.apk](https://github.com/LucasCunh4/Panelinha/actions/runs/41258767793/artifacts/13064820656). Exige login no GitHub; retenção até 30/01/2027. [Metadados verificados](ARTES_MAIS4_MAIS6_APK_0.2.22.json).
- **Workflow geral falhou na etapa do emulador.** A instrumentação anunciou dez testes e iniciou `a_imagesAndThreeBotsOffline`, mas **zero testes concluíram**. O dispositivo passou a `offline` no ADB e a porta TCP 5554 do emulador recusou conexão. Não houve resultado de asserção nem registro de crash/ANR do aplicativo nos logs coletados. Não encontrado registro de OOM/segfault do host. A causa raiz da interrupção do ambiente permanece sem comprovação; isso não equivale a aprovar o app no Android.
- Permanecem pendentes os dez testes nativos, incluindo o novo seletor por toque no WebView, e a instalação real por cima com conferência de UID/localStorage/SharedPreferences. Não foram removidos ou desativados testes. A Release permanece bloqueada pela falha; o APK assinado foi disponibilizado pelo upload de artefato já existente.
- [Diagnósticos completos do Android](https://github.com/LucasCunh4/Panelinha/actions/runs/41258767793/artifacts/13064197540), examinados separadamente das validações de assinatura/recursos e testes web. Extratos originais em `evidencias-mais4-mais6/android-*`.

### Atualização sobre a versão instalada

Comparação dos dois APKs reais **0.2.21/c4102 → 0.2.22/c4202** confirmou mesmo applicationId, mesmo certificado da geração 2, mesma configuração de origem e código estritamente maior. O APK é compatível com atualização direta, sem desinstalação. O armazenamento não foi modificado; o teste real de retenção de dados no emulador ficou pendente pela interrupção descrita. A partida em andamento continua existindo somente em memória, como no jogo anterior.
