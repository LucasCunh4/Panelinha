# Panelinha — Fase 3: pausa, continuidade e robustez

Base funcional: `0084082`, branch `android/apk-testes`. O commit remoto `8cbe6db`, com dois arquivos visuais enviados posteriormente, foi incorporado por fast-forward sem sobrescrever as alterações locais. Esse pacote está preservado para outra entrega; suas artes/instruções não foram aplicadas nesta Fase 3. Segue a Fase 3 de `MULTIPLAYER_ESPECIFICACAO.md`. Implementação e publicação concluídas. O APK assinado foi verificado; execução Android e aparelhos físicos permanecem limitações explícitas abaixo.

## Implementação

- **Pausa do anfitrião** no menu da mesa, sem limite de duração. O servidor persiste o tempo restante de turno, corte, inatividade e ações automáticas; anúncio/desafio mantêm seu estado e não podem ser executados durante a pausa. Não existe alarme recorrente durante uma pausa estável.
- **Retomada 3–2–1** para todos. Só depois da barreira do servidor os prazos congelados voltam a correr. Pausar a contagem de abertura reapresenta 3–2–1 e preserva o turno completo, sem acrescentar uma segunda contagem residual.
- **Inatividade com cronômetro**: cada turno expirado compra uma carta e passa, ou cobra a penalidade integral. Nunca joga automaticamente a carta comprada. Após dois turnos próprios consecutivos expirados, bot assume temporariamente. Uma ação válida no próprio turno interrompe essa sequência; comandos inválidos não a renovam.
- **Sem cronômetro**: 120 segundos sem ação válida no próprio turno acionam o bot. Abertura/corte e pausa não consomem esse intervalo. Uma ação válida do titular renova o prazo; ação alheia e atualização de tela não renovam.
- **Retomada do humano inativo**: primeiro toque na mesa/cartas apenas solicita controle; o gesto completo é consumido, mesmo se a resposta chegar antes do clique. O próximo toque joga normalmente. Há também botão acessível. Nome, avatar, posição, cartas, pontuação e identidade permanecem; adversários veem o indicador de bot.
- **Reconexão**: até quatro tentativas automáticas, depois botão Reconectar. Falha de rede não apaga identidade/código nem reenvia compras/jogadas ambíguas. Voltar ao primeiro plano/recuperar rede solicita um snapshot, sem heartbeat. A mesa fica sem comandos enquanto desconectada.
- **Relógio ilustrativo**: estima o horário do servidor por RTT de autenticação/ACK e relógio monotônico. Receber um broadcast atrasado não cria outro prazo. Validade de jogada, corte e fim de turno continuam exclusivamente no servidor.
- **Persistência/concorrência**: classes e namespaces existentes mantidos. SQLite conserva prazos, substituição, mãos e deduplicação; attachments restauram as controladoras após hibernação. A fila autoritativa aceita somente a primeira intenção válida da mesma versão. Cliente nunca fornece timestamp considerado confiável nem mão/pontuação.
- **Compatibilidade**: protocolo v1 mantido com `clientPhase: 3`. Clientes anteriores podem permanecer no lobby, mas precisam atualizar para iniciar/retornar a partidas. Identidade/perfil/código são preservados. Não foi criada opção de bot voluntário, conta, chat ou transferência de anfitrião.

O anfitrião continua sendo transferido definitivamente por sorteio entre humanos conectados quando sai; o sucessor pode retomar uma pausa. Se todos os humanos desconectam, a sala é encerrada, inclusive durante pausa. Visitante não assume posição reservada. Uma ação de bot já iniciada no servidor termina de forma atômica antes de devolver o controle.

## Preservação

`motor.js` e os 30 cenários de referência offline não foram alterados. Artes, sons, regras, pontuação, Panela sem seletor, Liquidificador, penalidades, +6 opcional, corte de 2200 ms, leque, modos, laboratório e armazenamento local continuam existentes. Mudanças no HTML/mesa apenas respeitam bloqueio de pausa/controle online. Nenhum segredo foi lido, recriado ou publicado.

Pacote `com.lucascunha.panelinha.teste`, origem `https://localhost`, assinatura permanente geração 2, landscape/imersão e workflow de versões mantidos. O APK anterior é 0.2.36/c5602; a próxima versão será calculada pelo mesmo workflow, acima do histórico.

## Testes e evidências

**Resultados locais executados:**

| Verificação | Resultado |
| --- | --- |
| Backend final | **91/91 aprovados**, zero ignorados: 14 lobby, 27 jogo, 30 paridade offline, 18 robustez e 2 transporte. |
| Web | **26 suítes aprovadas**, sendo 24 na regressão geral e partida/robustez em reexecuções focadas. |
| Partidas completas | Duplas: **75 descartes/36 compras**; Individual: **55 descartes/17 compras**, resultados e retorno ao mesmo código. |
| Interface de robustez | Quatro contextos/dois Chromium: pausa, 3–2–1, perda de transporte, quatro tentativas, Reconectar, identidade/cartas conservadas. |
| Latência/relógio | **300 ms de RTT simulado** e relógio local adiantado uma hora; prazo visual continua derivado do servidor. |
| Inatividade/toque | Limites exatos no servidor; bot mantém identidade; primeiro toque somente reassume e segundo executa. |
| ACK perdido | Compra aplicada sem resposta não é reenviada; snapshot após reconexão recupera exatamente uma carta adicional. |
| Concorrência | Dois cortes e anúncio/denúncia da mesma versão: somente uma intenção aplicada; repetição do ID recebe ACK sem reaplicar. |
| Hibernação | Evicção explícita do workerd reconstrói SQL, mãos, pausa, controladoras e cache de intenções nas mesmas conexões. |
| Android estático | Build/sync aprovados; **5 testes de versão aprovados**; script de instrumentação validado por `bash -n`. |

A falha de uma partida aleatória sob carga foi atingir o orçamento de 150 segundos, sem conclusão; a reexecução focada completou a partida mantendo o mesmo limite e todas as exigências. Foram acrescentados registros de progresso/estado para distinguir partida em andamento de travamento. O aviso de retomada foi compactado e validado em 568×320 e 844×390 sem cobrir cartas, parceiro ou descarte.

O teste de perda de conexão revelou duas falhas corrigidas: o painel de pausa interceptava Reconectar por estar em outro contexto de empilhamento; agora compartilha a camada da mesa, sem interceptar eventos fora dos botões. E o timeout de uma intenção aguardava o fechamento completo do WebSocket; agora bloqueia ações e inicia recuperação imediatamente, sem repetir a intenção. Cancelar uma reconexão HTTP pendente também não pode reabrir a sala após sair. Um teste adicional confirmou que o último snapshot indicando bot por inatividade não pode consumir o toque em Reconectar enquanto offline; o gesto de reassumir só é capturado com conexão ativa. O teste público Individual concluiu a partida, mas revelou rejeição por versão antiga em confirmações próximas de Pronto: agora só a confirmação explicitamente rejeitada com STALE_STATE pode ser repetida, até quatro vezes e apenas dentro do mesmo resultado/rodada/partida. Quatro confirmações concorrentes foram validadas no Worker local. Timeout e respostas ambíguas continuam sem reenvio de ações. O driver da partida passou a aguardar o ACK correspondente a cada comando, reconsultando o estado apenas diante de rejeição explícita STALE_STATE; antes confundia uma rejeição de anúncio com travamento ao aguardar uma flag que não deveria mudar. Nenhuma regra ou asserção de efeito foi desativada.

Evidências compactas: [testes/evidencias-multiplayer-fase3](testes/evidencias-multiplayer-fase3/). O script Android ganhou somente monitor de memória/processos do AVD no CI, sem argumentos/ambiente/Secrets, para diagnosticar a queda recorrente; os testes e critérios não foram reduzidos.

O teste de navegação revelou uma corrida na instalação do relógio virtual: tentava pausar em um horário já ultrapassado antes de carregar o jogo. A fixture agora usa origem fixa e pausa futura antes da navegação, mantendo todas as asserções. A falha intermediária é preservada nas evidências.

Os testes de evicção usam a API do Miniflare 4.20260730.0 `unsafeEvictDurableObject(..., {webSockets: 'hibernate'})`; inspeção SQL só é habilitada nos processos de testes, sem endpoint publicado ou alteração do Wrangler de produção. A leitura de uma marca persistida após a evicção comprova reconstrução do objeto; não é apenas espera sem tráfego.

Referências consultadas: [WebSocket Hibernation](https://developers.cloudflare.com/durable-objects/best-practices/websockets/), tipos e implementação da versão fixada do Miniflare. Evicção local comprovada não significa que o instante de hibernação na infraestrutura pública foi instrumentado.

## Publicação e APK

Fase 3 disponível em **https://panelinha-lobby.lucas260802.workers.dev/**. Publicação final `1f1f48ee-174f-4867-bf27-f0992ed06366`, código de aplicativo `98bb1ef3f18c0b44e9079f5402a6db28626a7436`. Saúde fase 3 e cinco scripts/estilos comparados byte a byte com o checkout. Mesmos bindings, namespaces e migração SQLite.

Testes públicos HTTPS/WSS com quatro contextos/dois Chromium:

- **Continuidade aprovada**: pausa por 70 segundos, conexões/cartas/prazos preservados; saída do anfitrião, sucessor definitivo, retorno da identidade original ao mesmo assento/mão; retomada 3–2–1 e encerramento da sala durante pausa com código invalidado.
- **Duplas aprovada**: 74 descartes/32 compras, resultado, privacidade e retorno ao mesmo lobby.
- **Individual final aprovado**: 80 descartes/42 compras, anúncio real, pontuação, confirmação e retorno ao mesmo lobby. A falha intermediária de Pronto e o problema de sincronização do driver do anúncio foram registrados e corrigidos separadamente.

**[Baixar APK 0.2.38 / código 5802 diretamente, sem ZIP](https://github.com/LucasCunh4/Panelinha/actions/runs/42243779666/artifacts/13516599197).** Exige sessão no GitHub; retenção até 04/02/2027. [Execução #38](https://github.com/LucasCunh4/Panelinha/actions/runs/42243779666). A Release automática foi pulada devido à falha nativa, e o resultado vermelho foi preservado. O candidato #37 foi substituído para incluir as correções finais de Reconectar/Pronto; não foi uma reexecução para esconder a falha do emulador.

APK baixado integralmente: **96.053.501 bytes**, SHA-256 `0f591292953689b0991dbfae4151f09ea8011e0775c9a365601a9bf052bfffa6`. O verificador independente aprovou assinatura v2, certificado da geração 2, `com.lucascunha.panelinha.teste`, código/nome, `https://localhost`, `sensorLandscape`, categoria game, compatibilidade WebView, 52 cartas, recursos oficiais e cópia exata dos scripts/estilos. Metadados locais idênticos aos do Actions.

Certificado SHA-256: `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`. O código 5802 supera 5602 e o candidato 5702; pacote/certificado/origem conservados permitem atualizar sobre a geração 2, sem desinstalar ou limpar dados. Nenhuma chave/Secret foi alterado.

**Android nativo: execução interrompida, 0/13 casos concluídos.** O primeiro teste `a_imagesAndThreeBotsOffline` iniciou, mas `emulator-5554` ficou offline. O monitor registra QEMU ainda presente; os diagnósticos não estabelecem a causa raiz nem mostram conclusão/asserção funcional reprovada desse caso. Atualização com retenção real de dados não foi executada. APK verificado/assinado não equivale à aprovação da instrumentação. Todos os testes e critérios permaneceram ativos.

## Limitações de validação

Ainda é necessário validar em quatro aparelhos físicos e redes móveis reais, inclusive suspensão prolongada pelo Android. Perda/latência de rede nos testes de navegador são controladas; não equivalem à matriz de fabricantes e operadoras. O AVD da entrega anterior perdeu a conexão no primeiro caso; isso não certifica a atualização com retenção real de dados. A disponibilidade do APK não dependerá de esconder essa limitação.
