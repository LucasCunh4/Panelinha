# Verso e Panela de Pressão 400×850 — 01/11/2026

Base: `android/apk-testes`, upload `e1e9edd`, após APK 0.2.25/c4502.

## Alterações

- Extraídos e lidos integralmente `LEIA_ME.md`, `MANIFESTO.json` e `PROMPT_PARA_CODEX.md`. Documentos/preview originais em `documentacao/padrao-400x850/`.
- `assets/padronizadas/verso_oficial_400x850.png` em todas as mãos ocultas, seis camadas do monte, compras animadas e versos clonados no voo das cartas. `panela_de_pressao_400x850.png` como frente da Panela na mão, parceiro revelado, descarte e animação normal.
- PNGs copiados sem alteração de bytes, dimensões ou alfa. Hashes conferidos com o manifesto fornecido. Ambos RGBA 400×850, com máscaras alfa idênticas e cantos transparentes.
- Panela reutiliza o componente de tamanho das numéricas; removida sua classificação anterior como arte 2:3. Encaixe `contain`, sem borda CSS ou arredondamento/recorte extra nas novas artes. O contador do monte voltou à região inferior da carta, ajustado à nova arte alta.
- Mantidas as escalas de contexto já aprovadas (oponentes/parceiro e aumento da mão no próprio turno). Nenhuma mudança nos tamanhos-base da mesa, na geometria dos componentes ou no JavaScript das animações.
- Duas artes antigas removidas do pacote de produção e do manifesto ativo, com substituição registrada. Não há referência ativa aos antigos nomes no HTML/CSS/JS do jogo. Novos nomes/caminhos evitam reaproveitar o cache das imagens antigas. Build rejeita arquivos ou referências antigas reaparecendo.
- `MANIFESTO_PADRAO_400X850.json` registra os dois PNGs, dimensões, SHA-256 do arquivo e do alfa. Build e verificador do APK exigem as duas imagens; o verificador também valida cabeçalho/dimensões/RGBA e ausência das duas versões retiradas. O manifesto especial anterior passa a ter 11 PNGs remanescentes, todos intactos.

**Diferença de origem documentada:** as 52 numéricas atualmente integradas têm canvas **420×850**; a referência numérica citada pelo novo pacote é **400×850** e não faz parte desses 52 arquivos. Portanto, foi comprovada a igualdade das máscaras **entre as duas novas artes**, não uma igualdade pixel a pixel com todas as numéricas atuais. A caixa do componente é a mesma, com proporções nativas e encaixe proporcional; não foram recortadas, esticadas ou substituídas as outras cartas para ocultar essa diferença.

## Preservação e testes

**15 suítes Chromium aprovadas**, cinco testes de versionamento, `npm run build`, `npm run sync:android` e `git diff --check`. Logs/capturas em [evidencias-padrao-400x850](evidencias-padrao-400x850/).

- Nova `padrao_400x850.cjs`: hash/HTTP/decodificação, 400×850 RGBA, alfas iguais, transparência nos cantos, demais artes intactas, imagens antigas ausentes, 12 layouts Individual/Duplas em landscape e fallback web retrato, caixa da Panela igual à numérica, `contain`, borda/radius CSS zero, todos os versos e seis camadas do monte, Panela no descarte/voo, compra animada e parceiro aberto offline.
- Regressões existentes: `integracao`, `atualizacao_regras`, `escolher_cor`, `artes_penalidades`, `horizontal_identidade`, `mesa`, `refinamentos_mesa`, `atualizacao_mesa`, `mesa_fina`, `mesa_atual`, `leque_continuo`, `navegacao`, `preparacao_menu`, `android-compat` — todas aprovadas.
- Comparação do motor completo com a base: idêntico byte a byte, omitindo somente `cardAssetPath` e `cardHTML`, alteradas exclusivamente para as imagens/classes. SHA-256 do restante normalizado: `3860722df6da44a233393ea29c5211296bd73a6e9bd5d3393dc2d02a2642dbc5`.
- `mesa.js`, seletores interativos, perfis, regras, bots, corte, pontuação e opções não foram alterados. Todas as demais imagens aprovadas mantêm seus hashes anteriores.
- Instrumentação existente adaptada aos novos caminhos/dimensões, sem remover casos: continuam 11 testes Android, além da atualização/persistência.

## Android

Mantidos `com.lucascunha.panelinha.teste`, origem `https://localhost`, `sensorLandscape`, categoria `game`, imersão permanente e assinatura da geração 2. Nenhum Secret ou chave alterado/criado. Mesmo workflow, alocador crescente e upload `actions/upload-artifact@v7` com `archive: false`, somente APK. Compilação/assinatura e resultados reais do emulador serão registrados após o workflow, sem tratar falhas de infraestrutura como aprovação de testes.
