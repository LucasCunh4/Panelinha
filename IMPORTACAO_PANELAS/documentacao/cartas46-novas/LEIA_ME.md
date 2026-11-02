# Panelinha — Novas cartas +4 e +6 interativas

Este pacote substitui exclusivamente os assets de +4 e +6. As artes vieram das duas imagens geradas e aprovadas em 02/11/2026, não da versão anterior que ficou esticada. A imagem de origem é 860 × 1828 px; foi redimensionada proporcionalmente para 400 × 850 px (diferença de proporção menor que 0,03%) e foi aplicada a MESMA máscara alfa das cartas numéricas do jogo.

## Arquivos
- `cartas_mais4_mais6/carta_mais4_completa.png` e `carta_mais6_completa.png`: arte final da carta estática, 400 × 850 PNG.
- `carta_mais4_base_sem_ingredientes.png` e equivalente +6: fundo visual para montagem interativa, com reconstrução com gradientes cromáticos das regiões dos alimentos.
- `carta_mais4_{tomates,queijos,mirtilos,alfaces}_overlay_full.png` (e +6): camadas 400 × 850 transparentes com imagem colocada na coordenada nativa.
- `carta_mais4_{tomates,queijos,mirtilos,alfaces}_sprite.png` (e +6): recortes transparentes menores com posição especificada no manifesto.
- `carta_mais4_montagem_interativa_teste.png` e equivalente +6: composição das camadas sobre fundo para QA.

## CUIDADO: sobreposições e diferenças de composição
A base foi reconstruída digitalmente nas quatro regiões, a partir da arte completa original. **Inspecione em movimento**, especialmente nos momentos em que os ingredientes aumentarem: pode haver transições de fundo imperfeitas. Se ocorrer, o Codex deverá ajustar a base ou aproveitar o componente de seleção da Coringa para garantir qualidade final. Não sobrepor a arte completa aos sprites, pois daria duplicação e aspecto de adesivo.

## Como instalar
1. Faça upload do ZIP na branch `android/apk-testes` do GitHub.
2. Peça ao Codex que extraia os arquivos na pasta de assets existente do +4 e +6, preservando nomes e corrigindo referências/caminhos.
3. Use arte `completa` nas mãos/descarte; `base_sem_ingredientes` + quatro overlays na interface interativa.
4. Os arquivos `*_sprite.png` são alternativas aos overlays de tela inteira; se usar sprite recortado, posicione pelo bbox do MANIFESTO_ASSETS.json, respeitando escala responsiva.
5. Não atualizar artes numéricas, verso, Panela de Pressão, Coringa nem outras cartas.
6. Mantenha o mesmo comportamento de seleção e realce já usado pela Coringa.

## Outros pedidos incluídos no prompt
- Avisar os quatro jogadores quando alguém ANUNCIAR 'Última carta', sem alterar o gatilho/regras.
- Tornar o brilho de compra existente mais intenso, sem mudar geometria nem condição correta.
