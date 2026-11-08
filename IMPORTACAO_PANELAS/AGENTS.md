# AGENTS — Instruções ao agente no projeto PANELAS

- Leia `documentacao/ESPECIFICACAO_COMPLETA.md` e `documentacao/ESTADO_ATUAL_E_PROXIMOS_PASSOS.md` antes de alterar lógica.
- Preserve o código jogável local no `index.html`, os 23 PNGs aprovados na pasta `assets/cartas/` (52 combinações em camadas, cinco especiais e verso) e o modo de teste 1 humano + 3 bots.
- **Não** implementar modo power-ups sem definição do usuário.
- Atualização aprovada: artes 470×800, borda externa 25 px, total 520×850. Use `cartas.js`/`cartas.css` e `MANIFESTO_CARTAS_470X800.json`; nunca restaure PNGs, ZIPs, sprites ou fallback das cartas substituídas.
- Não substituir as regras personalizadas pelas regras oficiais do UNO.
- Validar comportamento com testes, em especial penalidades acumuladas obrigatórias, corte numa jogada separada, bot, Panela de Pressão com redução sorteada de 1–3 (mínimo 1), demais com diferença máxima 2 e autor isento ao bater e soma de pontos.
- Corrigir a exibição de PNGs rodando o app sob servidor HTTP, não presumir acesso a `file://` no Android.
- Manter o código legível; se reorganizar, fazê-lo em passos com teste de regressão e possibilidade de rollback.
- Não expor mãos secretas em eventos públicos do multiplayer; servidor autoritativo no futuro.
- O usuário prefere discutir grupos de decisões importantes, não uma pergunta por microdetalhe.
- Distinguir claramente **feito / testado / ainda a fazer**. Se houver ambiguidade, registrar e sugerir solução, não inventar regra final silenciosamente.

- Tela inicial e navegação ficam em `menu.css` / `navegacao.js`; reutilize `#menu` e preserve o motor. Telas Criar/Entrar são preparação visual, sem backend/códigos fictícios. Voltar deve confirmar saída de partida ativa e respeitar a hierarquia, inclusive no Android.
- A identificação em `perfil.js` fica entre Início e Configurações/Multiplayer. Nome/avatar locais usam `panelinha.player.v1`; escape nomes em HTML, preserve os bots e não apague outras chaves. O APK usa `sensorLandscape` e categoria `game`, com imersão permanente. `wild6` é opcional, ativada por padrão, aplicada somente em novas partidas. O brilho de compra usa disponibilidade real de cartas/desafio, e o crescimento da mão não sinaliza corte fora do turno como turno normal.
- Todas as frentes, versos e animações usam `PanelinhaCards`. Normais: fundo + três instâncias do mesmo PNG unitário (centro e dois cantos), sem texto desenhado; Coringa/+4/+6 usam a arte base completa com quatro ingredientes permanentes de `assets/ingredientes-especiais/`; demais especiais permanecem completas. O seletor usa hitboxes sobre esses mesmos alimentos na carta ampliada, sem grade ou imagens separadas. Dimensões vêm de `PanelinhaCards.geometry`; arte integral dentro da moldura externa, branca nas normais/verso e dourada nas especiais.

- Panela de Pressão (`dist`) nunca abre seletor nem escolhe cor; conserva a cor ativa e resolve redistribuição própria. Somente Coringa/+4/+6 usam `COLOR_CHOOSERS` e o seletor de ingredientes. A classificação de incolores é separada da escolha de cor.

- Atualização autorizada: Bloqueio impede corte do jogador pulado até a próxima ação válida; Panela é proibida durante qualquer penalidade de compra. Compras punitivas usam `drawSequence` e `presentationUntil` compartilhados, com prazo autoritativo limitado, sem ACK de cliente. Pódio só em `gameOver`, a partir de `finalStandings` oficial; por pontos, ordenar total e vitórias, exibindo empates sem desempate adicional.

- Compras: `handCards` filtra somente a apresentação das cartas em voo; nunca remover cartas reais do motor para animar. Ritmos fixos em `DRAW_PACES` (normal/punição), sem aceleração por quantidade. O anúncio cobre também cortes legais com duas cartas; após corte que deixe uma, proteção de 300 ms controlada pelo servidor (`cutAnnounceUntil`, congelada na pausa), sem alterar o restante das denúncias.

- Números/símbolos vigentes: 13 PNGs V3 (`numero_0.png`–`numero_9.png`, `mais2.png`, `bloqueio.png`, `inverter.png`) de 512×512 em `assets/cartas/elementos/`; fundos/especiais/verso continuam 470×800. `PanelinhaCards.symbolLayout` centraliza centro/cantos/escala. Não restaurar os antigos overlays triplos, unitários/refeitos anteriores nem seus ZIPs. Geometria externa/bordas permanece 520×850 / 25 / raios 70 e 45; escala responsiva da mesa 1,134 (1,1016 em landscape baixo), isto é, 8% sobre a versão 0.2.51. `symbolArt` contém os limites visíveis dos novos desenhos; o encaixe não recorta os PNGs e permite centro/canto superior/canto inferior independentes.

- Fundos vigentes: quatro `fundo_*_novo_470x800.png` RGB em `assets/cartas/fundos/`; preservar os originais opacos. Demais cartas/símbolos continuam RGBA. A troca dos fundos não altera `symbolLayout`, geometria, bordas ou escala. Não restaurar os fundos `_retrabalhado_470x800` nem seu ZIP.

- Interação vigente: um toque/clique na carta tenta jogar pelo comando original; sem seleção persistente/segundo toque. Preservar hover/foco, bloqueio durante transições e proteção contra arraste. Seletor mostra a carta, a mensagem Escolha uma cor para continuar e Visualizar mesa; esta opção recolhe a escolha sem cancelar a ação pendente. Voltar retorna à escolha.

- Apresentação compartilhada: `PLAY_TIMING` e `DEAL_TIMING` no motor publicam `playUntil`, `lastPlay` e `lastDeal` sem cartas secretas. Servidor protege o próximo descarte; cortes continuam na janela própria. Cliente espera Promises WAAPI com fallback limitado e limpeza. Liquidificador move somente quatro montes compactos. Laboratório fora do menu, opt-in local `?dev`. Nome Android Panelinha e artefato panelinha.apk; certificado/pacote/origem preservados.
