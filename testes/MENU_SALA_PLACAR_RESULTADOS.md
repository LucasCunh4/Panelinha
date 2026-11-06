# Menu, animações, sala e pontos — 06/11/2026

Base: `cc51375`, HEAD remoto de `android/apk-testes`, diretório limpo e sem perda de trabalho.

Implementado:

- Título centralizado em 25% da altura, arco descendente suave com os nove PNGs intactos e tampa pequena suspensa, deslocada para a esquerda. Fundo cover preservado.
- Compras próprias mais suaves e lentas (1150ms para uma carta), com prévia e decisão somente quando autorizada pelo motor. Compras dos demais usam voo direto do monte à mão, sempre com verso, incluindo parceiro/bots; sem prévia ampliada. Compras múltiplas aceleram progressivamente.
- Na mesa, somente avatares circulares junto às mãos; nomes continuam nos resultados, anúncios, lobby e rótulos acessíveis. Leques mantêm seu eixo próprio.
- Seis opcionais ativos e Partida única por padrão no offline e em novas salas. Salas existentes preservam suas regras. Ajuda por ícone `i` nas seis opções, também no formulário clonado do lobby; fecha por fora, Escape ou Voltar, sem alternar o toggle.
- Liquidificador mantém a rotação real, registra apenas rotas/contagens públicas e usa a mesma pausa autoritativa de apresentação da Panela. Após o descarte: recolhimento, montes compactos movendo-se simultaneamente no sentido dos turnos e abertura dos novos leques. Interações bloqueadas durante 2s; corte de 2,2s começa depois. Versos no trajeto; frentes finais apenas das mãos autorizadas. Pausa/reconexão reutilizam o prazo existente.
- Panela mostra brevemente `+N` perto de cada avatar após a redistribuição, usando as quantidades finais autoritativas, sem alterar sua regra.
- Resultados por pontos mostram ganhos da rodada, total e quatro barras proporcionais à meta. Em Duplas, cada jogador mostra o progresso compartilhado de sua dupla (sem inventar pontuação individual). A animação usa os totais reais anteriores/finais e não reinicia com atualizações de Pronto. A pontuação existente foi preservada.

Verificações efetivamente executadas:

1. `menu-rotation-score.test.mjs`: três testes aprovados — padrões, Liquidificador em ambos os sentidos/conservação/privacidade/bloqueio, deltas reais em Individual e Duplas.
2. `menu_sala_placar.cjs`: aprovado — menu/halo/arco em 844×390 e 1280×800; ajuda e retorno; nomes ocultos na mesa; sequência visual completa do Liquidificador; quantidades da Panela; compra própria/alheia e decisão; gráfico 12→15/50 (+3 reais), quatro barras e persistência da animação após render.
3. `sala_ajuda_smoke.cjs`: aprovado — geometria de toggles/ajuda em celular/tablet; sala real em Worker local, padrões, seis ajudas no formulário do lobby, Voltar e salvamento de alterações com confirmação assíncrona.
4. Uma compilação web: aprovada; manifestos e artes aprovadas preservados. Build/verificador incluem `partida-ui.js/css`. Teste Android de três bots passou a consultar os IDs do estado, pois nomes não são mais texto visível na mesa; nenhum teste desativado.

Capturas/logs fora do Git: `/workspace/work/menu-sala-placar`. Sem baterias extensas ou emulador local. Resultado do workflow Android e verificação final de assinatura serão acrescentados após a geração. Pacote, origem, certificado de geração 2, armazenamento local e Secrets não foram alterados.
