# Liquidificador oficial — 400×850

## Alteração

Base `877d9d6` da branch `android/apk-testes`, incluindo `Panelinha_Liquidificador_CORRIGIDO.zip`. Checkout preservado. Documentos do pacote lidos integralmente e prévia/PNG inspecionados; originais em `IMPORTACAO_PANELAS/documentacao/liquidificador-oficial/`.

Somente `liquidificador_oficial_400x850.png` foi copiado para `assets/padronizadas/`, byte a byte. A prévia JPG não foi incluída nos assets do jogo. SHA-256 **`1c6c4e0c71206b4b750673797dfd43c0d7247df5aa7fb08bca80f76d5e0f39a9`**, igual ao manifesto fornecido; RGBA 400×850, alfa **`934a687637936ca627554de0610cefbf764b59b9f325514b6667e2957077a71d`**, exatamente igual à Panela de Pressão, incluindo cantos transparentes.

`cardAssetPath` agora associa o tipo lógico existente **`rotate`** ao PNG. A carta reutiliza `standard-card`, como a Panela: `contain`, raio CSS zero e nenhuma borda/padding extra. As caixas responsivas de cada posição permanecem iguais às das demais cartas; o PNG não é deformado nem recortado. Não houve alteração de CSS ou das animações.

A apresentação anterior era o fallback textual do renderizador, sem PNG dedicado. Agora todas as representações normais usam o arquivo oficial pelo mesmo renderizador: mão humana, parceiro/adversário revelado, descarte/histórico e frente do voo. Compras continuam saindo com o verso oficial; ao chegar à mão, o Liquidificador usa a frente nova. O fallback textual continua disponível para erro de imagem ou opção de laboratório de desligar artes, preservando acessibilidade/jogabilidade.

Novo `MANIFESTO_LIQUIDIFICADOR.json` registra origem/hash/dimensões e apenas um recurso. Build e verificador do APK conferem seu conteúdo. Os manifestos e bytes de Panela, Coringa, +4/+6, numéricas, verso e demais artes não foram alterados.

**Motor preservado:** comparação do HTML com a base confirma igualdade byte a byte após remover apenas a nova associação de imagem e a inclusão de `rotate` na classe visual padronizada. Rotação, cor ativa, restrição contra penalidades, bots, pontuação, opção e regras de finalização permanecem as mesmas. Não houve nova carta lógica nem distribuição aleatória.

## Testes

**22 suítes Chromium aprovadas** (as 21 anteriores + `liquidificador.cjs`), **5 testes de versionamento aprovados** e **`npm run build` aprovado**. [Logs e capturas](evidencias-liquidificador/). Integração interna: 16/16 regras; suíte de atualização: 40 cenários. A suíte específica foi repetida aguardando o pouso do voo para capturar a frente já visível no descarte. Nenhuma verificação existente removida.

A nova suíte `liquidificador.cjs` já validou:

- PNG/hash/HTTP/decodificação, RGBA 400×850 e alfa idêntico à Panela em todos os pixels/cantos.
- Configurações reais pelo seletor personalizado, toque e retorno confirmado: Individual/Duplas × ativado/desativado. Duas cartas quando ativado, zero quando desligado; totais 118/116 com as demais opcionais ligadas.
- 12 cenários em 568×320, 844×390 e 1280×800, ambos os modos e sentidos. Caixa igual à numérica/Panela, sem borda, imagem na mão/parceiro/descarte/voo. Transferência exata de cada mão inteira ao próximo assento, conservando IDs/ordem/quantidades e sem consumir RNG. Direção/cor ativa preservadas, nenhuma redistribuição ou seleção de cor.
- Carta indisponível contra penalidade acumulada, compra real e frente nova ao chegar à mão, jogada offline em Duplas e ausência de erros JavaScript.

A instrumentação Android existente foi ampliada para verificar o PNG 400×850 na mão e no descarte durante a jogada real de Liquidificador, conservando os 12 testes offline + 1 de atualização.

## Android

ApplicationId `com.lucascunha.panelinha.teste`, origem `https://localhost`, geração 2, Secrets, landscape, imersão, dados locais e workflow preservados. Nenhuma chave criada. Execução [**#34**](https://github.com/LucasCunh4/Panelinha/actions/runs/41494958701), fonte `0134d0855f1b454639dba678ada4d358b9e67d4b`:

- **Compilação e assinatura aprovadas:** APK **0.2.34 / código 5402**. Candidato 5403 reservado à instrumentação de atualização, não distribuído.
- APK preservado no ambiente após a interrupção e verificado em **05/11/2026** por `ferramentas/verificar_apk.py`: assinatura v2, certificado ativo, pacote, origem, sensorLandscape/categoria game, 52 PNGs e demais artes anteriores, PNG do Liquidificador por SHA-256/dimensões/RGBA e cópia exata do código web. [Metadados verificados](LIQUIDIFICADOR_APK_0.2.34.json).
- Certificado SHA-256 **`3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`**, igual a `android-identity.json` e ao APK anterior real **0.2.33 / 5302**. Mesmo pacote `com.lucascunha.panelinha.teste` e origem `https://localhost`; 5402 também supera o candidato 5303. [Comparação dos APKs reais](evidencias-liquidificador/comparacao-identidade-apks.json). Identidade compatível com atualização direta, sem desinstalar.
- SHA-256 do APK **`97433fea0d5dddcfa831a858416c4b5c0391e35e493fb9a4660516ae30d9d8c0`**, igual ao digest do GitHub; **52.551.204 bytes**. Metadados locais e do CI idênticos. Confirmado APK com `AndroidManifest.xml`/assets na raiz, sem ZIP externo ou APK aninhado.

**Android nativo: interrompido, não aprovado.** Em 02/11, o AVD iniciou, instalou o aplicativo e começou `a_imagesAndThreeBotsOffline` às 17:55:05 UTC, com `numtests=12`. O logcat registra `MainActivity` criada/retomada/exibida. O dispositivo perdeu a conexão: `adb devices` passou a listar `emulator-5554 offline`; os diagnósticos ADB falharam e a tentativa de encerramento encontrou a porta 5554 recusada. O primeiro teste possui apenas status de início (`INSTRUMENTATION_STATUS_CODE: 1`), sem resultado. **0/12 testes offline concluídos; teste adicional de atualização não executado.**

É uma interrupção do ambiente/ADB, sem asserção funcional reprovada registrada. A causa raiz da queda do AVD **não foi determinada** pelos arquivos disponíveis. Logcat sem `FATAL EXCEPTION`/`Fatal signal` do aplicativo, kernel do host sem OOM/segfault e aproximadamente 14GiB disponíveis. Isso não comprova aprovação funcional no Android. [Trechos da execução](evidencias-liquidificador/github-android-diagnostico.txt) e arquivos de instrumentação/ADB/memória junto das evidências; diagnósticos completos no artefato `resultados-android-34-1`.

Permanecem pendentes instrumentação nativa completa, confirmação visual/toque nas duas paisagens Android e instalação por cima com preservação efetiva de UID/localStorage/SharedPreferences. Nenhum teste desativado. O workflow terminou com falha nos testes; Release corretamente pulada, APK já assinado/verificado disponibilizado como artefato direto com metadados/diagnósticos separados.

[**Baixar APK 0.2.34 / 5402 diretamente, sem ZIP**](https://github.com/LucasCunh4/Panelinha/actions/runs/41494958701/artifacts/13166476449). Requer login no GitHub; retenção até 31/01/2027.

A compatibilidade de atualização foi conferida pela identidade/versão dos dois APKs reais. A execução da atualização continua pendente. O mecanismo de dados locais não foi alterado; a partida em andamento continua apenas em memória.

## Retomada em 05/11/2026

Nenhuma perda identificada: checkout original acessível, sem alterações não commitadas, implementação preservada no commit `0134d08`, imagem/hash corretos, logs das 22 suítes e APK completo recuperados. Os testes web/versionamento/build são os já executados na etapa anterior; nesta retomada foram recuperados os resultados e executada a verificação final do APK, sem repetir ou alegar novos testes nativos.

A branch remota avançou até `33152bc` somente com documentos e quatro ZIPs de integração visual/sonora. Foram incorporados por fast-forward, preservando o histórico. Comparação `0134d08..33152bc` confirmou nenhum arquivo do jogo, Android, ferramentas, identidade ou workflow alterado. Menu/sons, avatares, letras, tampa/brilhos e especificação multiplayer são materiais adicionados ao repositório; **não são funcionalidades novas implementadas no jogo nesta retomada**. Última implementação funcional continua sendo a arte oficial do Liquidificador. Não houve nova geração de assinatura ou APK nesta retomada.
