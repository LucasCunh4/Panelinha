# Panelinha — Verso e Panela de Pressão (400 × 850)

Este pacote contém apenas **duas novas artes** para substituir as versões anteriores:

- `verso_oficial_400x850.png`: verso de todas as cartas.
- `panela_de_pressao_400x850.png`: frente da carta Panela de Pressão.

Ambas são **PNG RGBA 400 × 850 px**, com a **mesma máscara de transparência, inclusive os cantos arredondados**, da carta numérica oficial usada como referência. Não é necessário adicionar novas bordas ou recortar a imagem no jogo.

**Não altere as demais imagens**, incluindo as cartas numeradas, +2, Bloqueio, Inverter, Escolher Cor, +4 e +6. Esta atualização é apenas visual.

O arquivo `PREVIA_COMPARATIVA.jpg` mostra lado a lado a carta numérica de referência e as duas novas artes. O arquivo `MANIFESTO.json` documenta as dimensões, a transparência e os hashes dos PNGs.

## Como integrar

Use o código atual como ponto de partida. Encontre onde o jogo define a imagem do verso e a imagem da Panela de Pressão; atualize essas referências para os novos PNGs, mantendo os mesmos componentes e CSS de tamanho das cartas numéricas. O verso deve ser atualizado em todas as superfícies: pilha de compra, mãos fechadas dos adversários e quaisquer animações/previews. A frente da Panela de Pressão deve mudar somente de arte, sem alterar redistribuição, limite mínimo, resultados ou penalidades.

Remova referências ativas à versão anterior das duas artes, ou elimine as duplicatas não utilizadas, sem apagar outros arquivos aprovados. Garanta cópia dos novos PNGs para a build Android offline.

Depois, execute os testes existentes, valide em retrato/paisagem **apenas se a versão web oferecer esses layouts**; no APK mantenha a orientação horizontal definida para o projeto. Gere APK assinado com a mesma geração 2 e versionCode crescente. Não gere chave nova.
