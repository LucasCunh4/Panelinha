# PANELINHA — +4 e +6 padronizadas em 400 × 850 pixels

**Escopo exclusivo:** substituir SOMENTE as imagens das cartas +4 e +6 e suas camadas interativas. As cartas numéricas, verso, Panela de Pressão, Coringa, Liquidificador e demais artes não mudam.

Todas as imagens `*_completa.png`, `*_base_sem_ingredientes.png`, `*_montada_camadas_preview.png` e `*_overlay_full.png` agora têm **400 × 850 px**. O contorno externo de cada frente/base usa exatamente a mesma máscara alfa da carta numérica original, com fundo transparente nos cantos e borda externa branca. O desenho original foi adaptado ao formato mais estreito (proporção 8:17) sem recortar os ingredientes ou os números.

Os `*_sprite.png` são recortes transparentes individuais, propositalmente menores que 400×850, porque precisam ser animados isoladamente. `MANIFESTO_ASSETS.json` traz a posição e o tamanho de cada sprite em pixels E porcentagem sobre a carta 400×850. Eles possuem a mesma geometria dos respectivos overlays completos; escolha UM dos métodos para renderização interativa, sem duplicar as imagens.

**Exibição normal:** use `carta_mais4_completa.png` ou `carta_mais6_completa.png` na mão e no descarte.

**Seleção de cor:** use a `base_sem_ingredientes.png` com ingredientes em overlays alinhados (mesmo canvas) OU sprites nas posições do manifesto. Não deixe a carta completa visível atrás, pois duplicaria os ingredientes. Preserve o sistema de hover/toque, brilho e escolha de cor do jogo.

**Importante:** a transformação é proporcional ao CANVAS de carta e não altera regras ou efeitos. Um ajuste de arte 1024×1536 para o formato físico mais estreito 400×850 exige recomposição da escala horizontal em relação à vertical; isto evita cortes e mantém as peças e elementos clicáveis alinhados. Não aplique outro `object-fit: cover` ou padding extra no jogo. Ao exibir, use as mesmas dimensões CSS e `aspect-ratio: 8 / 17` que as numéricas.

Teste a renderização em landscape Android, versão web e no modal interativo. Mantenha o pacote, a assinatura Android geração 2, o `applicationId` e o `versionCode` crescente.

**Atenção à versão mais recente do código:** se os ingredientes interativos da +4/+6 já foram aprimorados a partir da carta Coringa, adapte **esses** elementos ao novo canvas em vez de regressar à aparência anterior. Os PNGs deste pacote correspondem à composição visual de referência e fornecem geometria padronizada.
