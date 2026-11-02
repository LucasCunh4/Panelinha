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

ApplicationId `com.lucascunha.panelinha.teste`, origem `https://localhost`, geração 2, Secrets, landscape, imersão, dados locais e workflow preservados. Nenhuma chave criada. Próximo código deve superar 5302 e o candidato reservado 5303. O APK real será verificado antes da entrega; resultados nativos/falhas serão registrados separadamente dos testes web.
