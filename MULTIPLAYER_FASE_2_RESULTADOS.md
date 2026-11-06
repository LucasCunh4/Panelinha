# Panelinha — Fase 2: partidas autoritativas

Data: 06/11/2026. Branch `android/apk-testes`. Base: `a560c24`, lobby da Fase 1 publicado e confirmado pelo proprietário. Esta etapa segue a Fase 2 de `MULTIPLAYER_ESPECIFICACAO.md`; a especificação aprovada não foi modificada.

## Implementado

- **Núcleo compartilhado** em `IMPORTACAO_PANELAS/motor.js`, extraído de 40 funções do jogo local. Navegador offline e servidor usam o mesmo código de baralho, validação, efeitos, compras, desafios, corte, bots, classificação e pontuação. Callbacks separam apresentação/timers do motor. Não existe uma cópia alternativa das regras online.
- **Servidor autoritativo** em `multiplayer-server/src/game.mjs`: recebe intenções, valida dono da carta/turno/estado, aplica a regra e persiste o estado completo em SQLite. O cliente não fornece mão, resultado, pontuação ou tempo considerado válido. A ordem de processamento e o horário de recebimento no servidor decidem conflitos.
- **Visão por participante**: própria mão aberta, parceiro oposto aberto em Duplas, adversários apenas com contagem. Eventos de compra também filtram a carta por destinatário/parceiro. Não são transmitidos baralho, ordem futura, token privado ou indicador interno de irregularidade para desafiar.
- **Mesa V1 reutilizada** por `online.js`/`online.css`. Cada jogador vê a si mesmo embaixo; posições e direção são derivadas dos assentos do servidor. Os IDs das cartas ocultas no DOM são placeholders locais, sem revelar identidades de cartas adversárias. Avatares, artes, chamas, leque compacto, faca, compras/descartes e efeitos sonoros existentes são reutilizados.
- **Início manual**: quatro lugares preenchidos e humanos Pronto; só o anfitrião inicia. Servidor sorteia assentos, mantendo parceiros opostos. Primeira posição da primeira rodada sorteada; contagem 3–2–1 bloqueia jogadas. Rodadas posteriores começam pelo finalizador anterior. Direção inicial horária (`-1` no mapa físico existente), respeitando o efeito da carta inicial, inclusive Inverter/Bloqueio.
- **Ações online**: jogar, comprar, guardar/passar, escolher cor na própria carta, cortar, desafiar, anunciar e denunciar última carta. A janela de corte é de 2200 ms. A interface de cor é local; não pausa o relógio do servidor. Panela e Liquidificador nunca abrem esse seletor.
- **Turnos e bots**: prazos e ações automáticas são agendados por alarmes do Durable Object. Tempo esgotado compra 1 e passa, ou cobra a penalidade integral. Bots reutilizam a escolha conservadora existente, incluindo respostas a penalidades, cortes e anúncio/denúncia. Não há heartbeat de jogo mantendo o objeto ativo.
- **Resultados/rodadas**: pontuação e desempates existentes, confirmação de Pronto após resultado, próxima rodada iniciada pelo anfitrião. Ao fim da partida, todos confirmam retorno ao lobby do mesmo código, com pontos reiniciados na próxima partida e regras novamente editáveis. Não se permite alterar regras/perfil/equipes no intervalo de uma partida.
- **Continuidade básica**: desconexão/saída durante jogo preserva assento e mão para o titular e permite bot substituto; visitante novo é bloqueado. Retorno com a identidade original restaura controle sem recuperar cargo de anfitrião. Sem humanos conectados, encerra-se a sala. Bloqueios de expulsão continuam válidos até fechar a sala.
- **Compatibilidade da atualização**: abas antigas da Fase 1 permanecem no lobby com aviso para atualizar; não conseguem iniciar partida até todos os clientes indicarem suporte à Fase 2. O token, código e perfil não são recriados por esse aviso. A negociação é aditiva (`clientPhase`), mantendo protocolo HTTP/WebSocket v1.

## Regras preservadas

Baralho 112 sem opcionais, até 118 com opcionais; +6 ativado por padrão; penalidades crescentes +2/+4/+6; desafios; Panela com redução de 1–3, mínimo 1, equilíbrio dos demais e conservação, inclusive como última carta; Liquidificador na direção atual sem escolha de cor; última carta e denúncia ordenadas; corte próprio sem efeito especial duplicado; pontuação 3/2/1/0 no Individual e 1/0 em Duplas. Casos iniciais sem autor mantêm o comportamento validado: penalidade inicial sem desafio a um autor inexistente, efeitos iniciais aplicados aos participantes.

Os desempates residuais usam a ordenação estável já existente; não foi inventado sorteio final. Empate em pontos e vitórias continua permitindo rodada extra como no jogo local. Identificação do vencedor por ID/índice foi acrescentada ao estado para nomes repetidos não confundirem os efeitos de vitória.

## Testes locais executados

| Verificação | Resultado |
| --- | --- |
| Regressão web completa, incluindo 23 suítes anteriores, lobby e partida online | **25/25 suítes aprovadas**. |
| Backend final | **71/71 testes aprovados**, zero ignorados: 14 de lobby, 27 de jogo/privacidade/continuidade e 30 de paridade. |
| Referência anterior à extração | **30 cenários** capturados do motor `a560c24`, com estado, intenção, RNG/relógio controlados e resultado esperado; comparação inclui cartas/IDs, sequência, efeitos e pontuação. |
| Partida completa em quatro contextos, dois processos Chromium | **Individual e Duplas aprovados**: início, contagem, mãos filtradas, compras/descartes animados, seletor, anúncio, resultado e revanche. |
| Panela com 20/40/80 cartas e penalidades 0/2/12/40 | **Aprovado**, conservação e limites. Outros casos extremos permanecem na regressão offline. |
| Compras grandes | **60 eventos individuais** preservados, carta visível só ao destinatário/parceiro, sem perder cartas. |
| Corte | **2199 ms permitido / 2200 ms recusado**, guarda de turno e idempotência de comando. |
| Retorno e atualização | Visitante bloqueado; original conserva mão/assento; perfil não muda pela autenticação durante partida; antigo anfitrião não recupera cargo; cliente antigo exige atualizar. |
| Bots | Partidas completas simuladas em Individual/Duplas, conservando cartas a cada avanço. |
| Build, sync Capacitor, dry-run | **Aprovados**. |
| Versão/identidade Android | **5/5 verificações aprovadas**. |

O cenário de fallback de PNG inicialmente consultava visibilidade antes de a animação terminar; agora aguarda a apresentação visível e mantém a mesma exigência. Um teste de quatro navegadores também usava uma visão atrasada de um cliente antes de receber a jogada anterior: o driver agora escolhe a versão mais recente e aguarda a sincronização, mantendo a verificação do brilho obrigatório. Não foram alteradas regras ou condição de compra para satisfazer esses testes. Falhas intermediárias e resultados finais ficam nas evidências.

## Arquivos principais e operação

- `motor.js`: regras compartilhadas, sem DOM/rede/timers próprios.
- `multiplayer-server/src/game.mjs`: partida canônica, intenções, visão privada e alarmes.
- `room.mjs`: integra partida à sala existente; código, identidade, autoridade e persistência preservados.
- `online.js`/`online.css`: adapta a visão privada à mesa e envia intenções; cronômetro apenas ilustrativo do prazo recebido.
- `index.html`, `mesa.js`, `navegacao.js`, `multiplayer.js`, `multiplayer-connection.js`: integração incremental, com laboratório exclusivamente local.
- Build e verificador APK incluem os três novos arquivos web. O teste nativo de navegação foi atualizado para o campo de código acompanhar a configuração do servidor, preservando as outras verificações.

Comandos no ambiente do Codex:

```bash
npm --prefix multiplayer-server test
npm run sync:android
npm --prefix multiplayer-server run check
# Fonte HTTP em 8000 e Wrangler local em 8788:
PANELINHA_TEST_SERVER=http://127.0.0.1:8788 node testes/multiplayer_partida.cjs
PANELINHA_TEST_SERVER=http://127.0.0.1:8788 PANELAS_TEST_MODE=solo node testes/multiplayer_partida.cjs
```

## Publicação e Android

A Fase 2 está publicada em **https://panelinha-lobby.lucas260802.workers.dev/**, Worker versão `f7776fbf-39ea-4d49-acfe-31de61715ccb`, código-fonte `00c0e169273527cec6494e17f43c654ec0407d33`. Os mesmos bindings/classes SQLite da Fase 1 foram preservados. `GET /health` responde fase 2 e `gameplay: true`; cinco arquivos publicados foram comparados byte a byte com o checkout.

Partidas públicas HTTPS/WSS, em dois processos Chromium/quatro contextos independentes, **aprovadas**:

- **Duplas**: 29 descartes, 7 compras; parceiro aberto e adversários ocultos.
- **Individual**: 59 descartes, 16 compras; somente a própria mão aberta.
- Nos dois modos: contagem 3–2–1, identidade própria embaixo, seletor interativo, anúncio, animação de descarte, placar, confirmação e retorno ao mesmo código para revanche. Payloads sem baralho, mãos adversárias ou marcador privado de desafio; nenhum erro JavaScript.

O lobby também passou em HTTPS/WSS sem injeção de configuração, com dois humanos/dois bots, **70 segundos sem comandos**, comando posterior sincronizado, retorno da mesma identidade e encerramento/código 404. O início depende do comando do anfitrião e é desabilitado ao desmarcar Pronto. O teste público foi atualizado para verificar os dois estados desse botão na Fase 2.

São testes de navegadores no servidor real, não testes em quatro celulares. Evidências em [testes/evidencias-multiplayer-fase2](testes/evidencias-multiplayer-fase2/).

**APK 0.2.36 / código 5602**, compilado e assinado pelo workflow existente [#36](https://github.com/LucasCunh4/Panelinha/actions/runs/42213703802):

[**Baixar Panelinha-Teste-v0.2.36-c5602.apk diretamente, sem ZIP**](https://github.com/LucasCunh4/Panelinha/actions/runs/42213703802/artifacts/13500452776).

O download do artefato exige sessão no GitHub e tem retenção até 04/02/2027. O arquivo foi baixado integralmente e conferido: **96.051.221 bytes**, SHA-256 `cba6e5a52a31791363d10ebd67580e230c8802d880fdf526fe1920d08976d54c`. É o APK bruto, com `AndroidManifest.xml` na raiz, sem ZIP de transporte. Metadados e resultados Android são artefatos separados. A Release automática foi pulada por falha da instrumentação, sem ocultar o resultado vermelho do workflow.

**Verificação independente do APK aprovada** por `ferramentas/verificar_apk.py`: certificado geração 2, assinatura v2, applicationId, versão, origem local, `sensorLandscape`, categoria game, código web exato (incluindo o motor/online), compatibilidade WebView e recursos offline. Confere 52 cartas, seis PNGs da mesa, 69 recursos visuais/sonoros e os manifestos das cartas/fontes/interações anteriores. O JSON gerado localmente coincide com os metadados do Actions.

**Instrumentação Android interrompida**: o AVD iniciou `a_imagesAndThreeBotsOffline`, ficou `offline` e a porta de controle 5554 recusou conexão. Não há conclusão do primeiro caso: **0/13 testes offline concluídos**, teste de atualização/retenção de dados **não executado**. Os diagnósticos capturados não mostram uma asserção funcional reprovada nem estabelecem a causa raiz da queda do emulador. Trata-se de execução indisponível no AVD, não de aprovação do aplicativo. Nenhuma verificação foi removida/desativada para produzir verde. Logs/estado do dispositivo estão nas evidências e no artefato `resultados-android-36-1`.

A comparação com o APK 0.2.35/c5502 confirma pacote, origem e certificado idênticos, com código maior. Assim, o novo APK é compatível com atualização direta sobre a geração 2, **sem desinstalar nem limpar dados**. A retenção real de dados após instalação continua pendente da instrumentação/aparelho físico; a aplicação não troca chaves nem apaga armazenamento local.

Identidade preservada: `com.lucascunha.panelinha.teste`, origem `https://localhost`, certificado geração 2 `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`. Os Secrets e o workflow de assinatura não foram modificados. Perfil/som/identidade multiplayer mantêm suas chaves de armazenamento. O modo Um jogador não depende do servidor; não há migração nem limpeza de dados locais.

## Ainda para a Fase 3

Pausa/retomada com congelamento de todos os deadlines, substituição por inatividade (dois turnos expirados ou dois minutos sem limite), retomada por primeiro toque intencional após inatividade, testes de perdas/oscilações de rede móvel, hibernação instrumentada, disputas temporais sob latência e testes reais em quatro aparelhos/Android. A continuidade básica desta fase não equivale a essa bateria de robustez. Não foram adicionados controles falsos de pausa ou bot voluntário.

Não há chat, espectadores, reações, backend de contas, alteração de artes ou regras extras. O APK anterior não se atualiza sozinho: instale o novo arquivo por cima e escolha Atualizar. A compilação usa o mesmo workflow, código crescente e assinatura permanente já verificada.
