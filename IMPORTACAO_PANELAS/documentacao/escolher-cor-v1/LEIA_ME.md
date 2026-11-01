# PANELINHA — Pacote de artes especiais (v1)

## Conteúdo
- `verso_todas_as_cartas.png`: verso roxo oficial para TODAS as cartas.
- `carta_panela_de_pressao.png`: frente da carta Panela de Pressão.
- `carta_escolher_cor_integrada_referencia.png`: referência de estilo da carta coringa.
- `escolher_cor_base.png`: frente fixa da escolha de cor, panela sem tampa e redemoinhos.
- `escolher_cor_tomates.png`, `...queijos.png`, `...mirtilos.png`, `...alfaces.png`: ingredientes isolados, com transparência, para animação.
- `escolher_cor_<ingrediente>_overlay_full.png`: os MESMOS ingredientes transparentes já posicionados em canvas integral de 1024 x 1536 pixels. São a opção preferencial para integrar, pois todas as camadas se alinham perfeitamente à base.
- `carta_escolher_cor_montada_preview.png`: prévia montada em um PNG único, usada também como imagem da carta em tamanho pequeno na mão e no descarte.
- `MANIFESTO_ASSETS.json`: dimensões, posições, hitboxes aproximados.
- `PROMPT_PARA_CODEX_ESCOLHER_COR.md`: tarefas detalhadas.

## Composição
1. Renderize `escolher_cor_base.png` com proporção 2:3 (1024×1536).
2. Sobreponha, na mesma área integral da carta, os quatro `_overlay_full.png` com `position:absolute; inset:0; width:100%;height:100%` e `pointer-events:none` no PNG (a interação fica em regiões semânticas independentes).
3. Superponha as quatro regiões de toque transparentes conforme `MANIFESTO_ASSETS.json`, sem alterar a posição das imagens. Use `role=button` / `button` acessível quando viável.
4. Anime separadamente cada `_overlay_full.png` em escala/posição visual em torno do ingrediente correspondente, configurando `transform-origin` ou aplicando CSS a um wrapper ancorado na região do ingrediente. Se aplicar `scale()` ao overlay full de ponta a ponta sem origem localizada, a imagem inteira pode parecer deslocar-se: ajuste a origem ou use o PNG original numa área ancorada.
5. Faça o controle da escolha de cor apenas pelo motor existente; a arte não deve alterar regras nem tempos.

## Atenção
- A prévia montada NÃO substitui as camadas na janela de seleção; é só a versão visual estática.
- Não inventar novos botões externos ou criar escolha de cor para Liquidificador (Giro), que mantém a cor anterior.
- Só usar este seletor onde o motor atual realmente pede uma escolha de cor. Em partidas encerradas, não bloquear conclusão exigindo escolha desnecessária.
- Use cache local e inclua as imagens na build offline do APK Capacitor.
- Manter certificado Android geração 2 e versionCode crescente.
