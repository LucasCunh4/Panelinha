# CODEX — PANELINHA: NOVAS ARTES +4/+6, ÚLTIMA CARTA E BRILHO MAIS FORTE

Trabalhe na branch `android/apk-testes` sobre a implementação mais recente. Adicionei `Panelinha_Cartas_4_6_Interativas_Novas.zip` ao repositório. Extraia, leia `LEIA_ME.md` e `MANIFESTO_ASSETS.json` e use a prévia. Não usar a versão antiga esticada.

## 1. Cartas +4 e +6 com a proporção correta
- Substituir as artes antigas pelas novas `carta_mais4_completa.png` e `carta_mais6_completa.png` (400x850 PNG RGBA, mesma máscara alfa da carta numérica oficial). Elas foram obtidas a partir de ILUSTRAÇÕES NOVAS, sem alterar a proporção; não esticar verticalmente nem introduzir bordas adicionais.
- Nas mãos dos jogadores, na compra, descarte e animações comuns usar as imagens completas.
- Para selecionar cor na +4 e +6, usar a base correspondente `*_base_sem_ingredientes.png` MAIS exatamente uma camada para cada ingrediente, das quatro `*_overlay_full.png` ou `*_sprite.png`. **Não usar a arte completa por baixo da base ou dos sprites**, pois os ingredientes ficariam duplicados. Nunca misturar antigas camadas com estas novas.
- Os arquivos overlay_full têm 400x850, mesma posição relativa da base, portanto renderizar em camadas com dimensões, objeto e transformações idênticas; para recortes sprite, seguir `bbox_xywh` do MANIFESTO. Envolver o seletor no mesmo contêiner de proporção 400/850.
- Cores: tomates=vermelho, queijos=amarelo, mirtilos=azul, alfaces=verde. Preservar seleção no toque Android e hover no mouse.
- Reutilizar a interação de cor da Coringa que já está aprovada: ingredientes integrados, crescimento e brilho suave, sem efeito de adesivo semitransparente. Preferir overlays completos para posicionamento robusto. Validar visivelmente as bases reconstruídas durante a animação; se houver falha na reconstrução do fundo, corrigir o fundo local no código/asset, não resolver com dupla camada.
- Manter os valores de +4 e +6 e toda a lógica de cartas, acúmulo de penalidades, restrições e desafios, inclusive a opção de habilitar/desabilitar a +6.

## 2. Aviso de ÚLTIMA CARTA para todos
Quando QUALQUER jogador (humano ou bot) ANUNCIAR 'Última carta', apresentar uma notificação visível para TODOS os participantes, com seu nome, por exemplo: `Última carta! — Ana`. Preservar a ação/gatilho atual de anúncio (não inventar obrigação ou penalidade nova, não disparar ao comprar, não confundir ter uma carta com anunciar se o jogo distingue essas situações). O aviso deve ser chamativo, temático roxo/dourado, com animação rápida e duração suficiente para ler, sem bloquear o descarte, compra ou seleção de cor. Em modo Duplas, todos veem, inclusive o parceiro. Em multiplayer futuro, transmitir o evento quando a rede existir; nesta versão local basta o anúncio global para os quatro assentos. Evitar repetição por re-renderização: disparar uma vez por evento real, com identificador estável. Preservar a lógica de vitória e o andamento dos turnos.

## 3. Brilho do monte de compra: mais forte, mesma posição
A POSIÇÃO, ESPAÇAMENTO e GEOMETRIA DO HALO JÁ ESTÃO CORRETOS. Não mudar sua distância das cartas, não deslocar nem aumentar tamanho da pilha. Apenas aumentar de forma visível a luminosidade, contraste e intensidade/alcance luminoso externo, mantendo o vão livre entre halo e cartas e sua simetria nos quatro lados. Garantir que durante o pulso máximo nenhuma área luminosa encoste nas cartas.
A condição NÃO DEVE SER MODIFICADA: o halo aparece SOMENTE durante o turno humano quando NÃO EXISTE carta legalmente jogável no estado atual, incluindo a incapacidade de responder a penalidade acumulada. Se houver qualquer jogada legal, o halo fica totalmente invisível; em turno de bot, invisível. Usar a mesma validação real do motor, sem valores de estado obsoletos.

## 4. Testes obrigatórios
- Todas as artes PNG 400x850 e mesma máscara alfa das cartas numéricas.
- Sem esticamento nem corte; carta +4/+6 da mão, descarte, compra e seletor com tamanho consistente.
- Quatro ingredientes corretamente alinhados, sem duplicação/efeito de adesivo; hover e toque selecionam cada uma das quatro cores, com animações atuais.
- Aviso de última carta a partir do evento real do humano e de cada bot, visível para todos, sem duplicação.
- Halo mais brilhante sem mudar geometria, sem encostar nas cartas, aparecendo só quando humano não tiver jogada legal.
- Regressões de +4/+6, desafios, compra, bots, duplas, corte, Panela de Pressão (que NUNCA seleciona cor), Liquidificador, controles e APK offline.

## 5. APK e entrega
Manter `com.lucascunha.panelinha.teste`, certificado permanente da assinatura geração 2, os quatro GitHub Secrets atuais, versionCode crescente e instalação como atualização sobre o último APK. Não criar nem pedir chave privada. Executar testes reais, distinguir falha de infraestrutura de falha funcional, gerar APK assinado e fornecer link direto do APK, se possível sem ZIP. Informar o commit, o resultado dos testes e o que foi efetivamente implementado.
