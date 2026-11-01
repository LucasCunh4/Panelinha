# PANELINHA — Integrar artes finais do verso, Panela de Pressão e seleção de cor

Trabalhe sobre o HEAD MAIS RECENTE de `android/apk-testes` em LucasCunh4/Panelinha. Não use `main` como base (ela contém apenas pacotes ZIP).

Leia `LEIA_ME.md` e `MANIFESTO_ASSETS.json` deste pacote e `AGENTS.md`, `ANDROID.md`, `android-identity.json` do projeto. Extraia o pacote completo e adicione as imagens ao sistema real de assets do jogo, não apenas à pasta de documentos. Não sobrescreva alterações recentes.

**Verso:** substitua o verso atual de TODAS as cartas pelo PNG `verso_todas_as_cartas.png` em toda a mesa: monte, bots, animações, laboratório e demais lugares onde o verso é usado. Não toque nas 52 artes das cartas numéricas/especiais coloridas já aprovadas.

**Panela de Pressão:** use `carta_panela_de_pressao.png` como frente desta carta. Preserve a regra atualmente implementada da Panela de Pressão e suas interações; não introduza nova regra por causa da arte.

**Escolher Cor:** usar a arte composta `carta_escolher_cor_montada_preview.png` como imagem estática desta carta quando está na mão e na pilha. Quando o motor solicitar seleção de cor para uma jogada elegível, mostre uma carta grande no centro da tela, com a base `escolher_cor_base.png` e quatro camadas PNG separadas. Use preferencialmente os quatro `_overlay_full.png` e suas posições 1024×1536. `carta_escolher_cor_integrada_referencia.png` serve como referência visual. Tomates -> vermelho; queijos -> amarelo; mirtilos -> azul; alfaces -> verde. Os ingredientes devem continuar visualmente conectados à panela e aos redemoinhos.

Interação obrigatória no seletor ampliado:
- Quatro conjuntos de ingredientes são as próprias regiões clicáveis; não botões externos.
- Antes da escolha, brilho suave pulsante em torno de CADA ingrediente, comunicando interatividade.
- Ao passar o mouse (desktop), expandir suavemente só o ingrediente correspondente, com brilho mais forte e leve elevação; ao sair, voltar.
- Ao tocar (Android), aplicar feedback imediato, com animação de escolha mais intensa por instante curto e confirmação da cor. Não exigir segundo toque em botão oculto.
- Ao confirmar, atualizar a cor na lógica existente, encerrar o seletor, retomar animações/turnos e atualizar a chama.
- Não deixar toques atravessarem modal atingindo mão/compra/descarte. Evitar duplo envio; usar eventos pointer/touch coerentes; permitir clique com mouse e teclado; área de toque >=44px CSS quando possível.
- Travar apenas a ação que precisa da escolha; não congelar ou descontar indevidamente turno, corte, bots e penalidades.
- Reusar seleção para outras cartas que exigem cor apenas quando o motor existente o determinar (+4, +6, coringa etc.), sem substituir suas artes individuais. Não exigir seleção para Liquidificador.

Confira layout em retrato e paisagem, hover desktop, toque Android, seleção das 4 cores, fechamento correto, exibição sem rede e ausência de PNG ausente. Atualize manifests/checksums/hashes de assets usados pelo build para refletir as novas imagens.

**Android:** preserve `com.lucascunha.panelinha.teste`, certificado da geração 2 em `android-identity.json`, `https://localhost`, versionCode superior ao maior já publicado; GitHub Actions Secrets existentes; nenhum novo keystore. Execute testes web/integracao e verificações do APK; reporte falhas de emulador separadamente de falhas de build. Gere APK atualizável por cima do último, preferencialmente link direto `.apk` conforme a automação atual.

Entrega: resumo de alterações, evidências de telas, lista de testes com aprovados/pendentes, link APK e certificado validado. Não implementar multiplayer nem mudar outras regras nesta tarefa.
