# PANELINHA — SUBSTITUIÇÃO DA ARTE +4/+6 PELO PADRÃO 400×850

Adicionei à branch `android/apk-testes` o ZIP `Panelinha_Mais4_Mais6_Padronizadas_400x850.zip`. Extraia-o e leia `LEIA_ME.md` e `MANIFESTO_ASSETS.json`.

Objetivo: corrigir definitivamente a proporção das cartas +4 e +6 para **400 × 850 pixels**, idêntica às numéricas. Substitua os PNGs antigos das cartas +4 e +6 por estas versões, incluindo frente completa, base, previews, overlays transparentes e sprites. Mantenha os nomes dos arquivos e atualize referências/caches/manifestos de assets.

- Na mão, no descarte e em animações de cartas normais, mostre a frente completa correspondente.
- Na escolha de cor, mostre a base sem ingredientes junto com apenas uma camada por ingrediente: tomate/vermelho; queijo/amarelo; mirtilo/azul; alface/verde. **Não deixe a imagem completa por trás dos overlays**, evitando os ingredientes duplicados/translúcidos.
- Use posições do manifesto para os sprites. Cada `overlay_full` é um PNG de 400×850 alinhado diretamente sobre a base; sprites independentes possuem recortes menores e coordenadas fornecidas.
- **Não regredir os aprimoramentos recentes dos ingredientes das cartas +4/+6.** Se a versão mais recente do jogo já estiver usando os ingredientes melhores herdados do seletor Coringa, mantenha esses desenhos e a lógica de destaque atual; ajuste suas imagens/posições para o novo canvas 400×850. O material de ingredientes do ZIP serve como substituição compatível ou referência geométrica, não como autorização para voltar aos overlays translúcidos antigos. Valide visualmente que nada ficou parecido com adesivo duplicado.
- Mantenha hover com aumento e brilho elegante e seleção por toque. Preserve a reutilização do seletor da carta Coringa existente. **Não altere a lógica de regras** das cartas +4 e +6 (acúmulo, desafio, cor e pontuação).
- As duas cartas completas e bases possuem a mesma máscara de cantos arredondados transparentes das cartas numéricas e borda externa branca. Evite `object-fit: cover`, bordas CSS extras ou escalas próprias que as deixem com tamanho diferente das outras cartas.
- Preserve todo o restante: cartas numéricas, verso, Panela de Pressão sem escolha de cor, Liquidificador, bots, configurações, corte, mesa horizontal, funcionamento offline e multiplayer ainda não implementado.
- Teste o tamanho visual idêntico na mão, monte/descarte e seleção ampliada, inclusive todas as quatro cores nas duas cartas; verifique ausência de duplicação e desalinhamento de ingredientes e a renderização na build Android offline.
- Gere APK de teste com mesmo `applicationId`, mesmo certificado da geração 2 e `versionCode` maior que o mais recente distribuído, assinando com os Secrets existentes. Não gere nova chave. Entregue resultados dos testes e link direto ao APK (preferência sem ZIP).
