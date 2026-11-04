# Panelinha — especificação funcional e técnica do multiplayer
> Definições aprovadas em 04/11/2026. Fonte de verdade para implementação. Nenhuma regra do modo local deve ser modificada sem necessidade e sem testes de regressão.

## 1. Objetivo e compatibilidade
- Suportar exatamente quatro posições de jogo no multiplayer: Individual (4 competidores) ou Duplas (2 equipes de 2).
- Manter **Um jogador / modo com bots** completamente funcional **offline**, independente do backend. Multiplayer exige internet.
- Suportar navegador e APK Android Capacitor existente, inclusive atualização por cima da instalação atual.
- Trabalhar na branch `android/apk-testes`. Não alterar `appId` (`com.lucascunha.panelinha.teste`), identidade/assinatura Android, secrets existentes nem o fluxo de atualização do APK.
- Reutilizar as regras, assets, animações e lógica de bots atuais. A versão local em `IMPORTACAO_PANELAS/index.html` contém parte relevante do motor e não deve ser substituída por outro jogo.
- Não usar contas ou login. Cada participante escolhe nome (nomes repetidos são permitidos) e avatar.

## 2. Arquitetura recomendada
- Um frontend web/Capacitor mantendo o jogo e os assets locais; conexão online via **WebSocket seguro (WSS)**.
- Servidor **autoritativo**: recebe intenções (jogar carta, comprar, passar, escolher cor, cortar, desafiar, anunciar, denunciar, pausar etc.), valida contra o estado completo, aplica o resultado e transmite atualização por jogador. O cliente não pode declarar uma jogada vencedora ou manipular cartas/pontuação.
- Infraestrutura proposta: **Cloudflare Worker + Durable Objects com armazenamento SQLite**, um Durable Object por sala; API WebSocket Hibernation para economia em repouso e restauração do estado persistido. Fonte: https://developers.cloudflare.com/durable-objects/best-practices/websockets/ .
- O mecanismo de alocação de códigos deve garantir **unicidade atômica entre salas ativas** (registro/roteamento próprio, por exemplo Durable Object registrador). Não depender de sorteio isolado sem teste de colisão.
- Evitar expor qualquer mão oculta: gerar visões filtradas **por conexão**; mão completa apenas ao titular e, no modo Duplas, ao parceiro. Os demais veem quantidade de cartas e informações públicas. Não enviar baralho, sementes, mãos adversárias, cartas futuras ou informação privada no payload.
- Todas as ações precisam de identificação de sessão, validação de turno, ordem/versão do estado e idempotência. Para disputas de corte e janelas curtas, o servidor decide pela ordem/tempo de recebimento e comunica resultado a todos.
- Persistir estado suficiente para sobreviver à hibernação/reinicialização do Durable Object (sala, jogadores/tokens, cartas, histórico necessário, regras, turnos, pontuações, deadlines, pausas). Usar relógio/alarme do servidor para prazos; o tempo exibido no cliente é ilustrativo.
- Código de retorno privado: gerar token imprevisível criptograficamente e guardar localmente no dispositivo/mesma origem; nunca autenticar apenas por nome ou código da sala. Token não deve constar de links compartilhados. Uma identidade original tem somente uma conexão controladora ativa.
- Limitar tentativas de código, validar tamanho de mensagens, campos, escolhas e frequência de ações; não confiar em JavaScript no cliente.

## 3. Salas, códigos e convites
- Código **numérico de 6 dígitos** gerado pelo servidor; preservar zeros à esquerda, exclusivo entre salas ativas, fixo durante revanches; inválido após encerramento.
- Qualquer participante pode copiar e compartilhar tanto o código quanto o **link de convite**. Um convite abre a entrada na sala preenchendo automaticamente o código.
- Entrada de novos humanos é **automática** no lobby, sem aprovação, se houver vaga. Participantes expulsos continuam bloqueados nessa sala.
- Exatamente 4 posições, sem espectadores e sem chat, voz, emojis ou reações entre jogadores.
- No lobby, o anfitrião pode preencher vagas disponíveis com bots e removê-los. Um novo humano pode substituir um bot do lobby. Bots não possuem credenciais humanas.
- Durante uma **partida completa** (inclusive entre suas rodadas), **não entram humanos novos**; apenas o humano original de uma posição pode retornar. Bots que substituem desconectados permanecem reservados, não podem ser substituídos por visitantes.

## 4. Lobby e equipes
- Todo humano precisa marcar `Pronto`, inclusive o anfitrião. Bots ficam automaticamente prontos. O anfitrião inicia manualmente com as 4 posições preenchidas e todos os humanos prontos.
- Quando **qualquer regra/configuração da partida** mudar, zerar o `Pronto` de **todos** os humanos e informar alteração. Troca de nome/avatar não zera `Pronto`.
- Quando humano entrar, sair, for substituído ou mudar de equipe, preservar `Pronto` dos **não afetados**; novo humano entra `Não pronto`, quem mudar de equipe também.
- Jogadores escolhem a própria equipe (Equipe 1/2) no lobby. Máximo de 2 por equipe; bots são automaticamente distribuídos nas vagas restantes.
- Duplas sempre em posições opostas. Ao começar **cada partida** sortear posições, respeitando parceiros opostos. No Individual, sortear livremente as 4 posições. Manter posições durante todas as rodadas daquela partida, novo sorteio na revanche.
- Nome e avatar editáveis apenas no lobby (pré-partida ou revanche), não durante rodadas nem intervalos.

## 5. Anfitrião e moderação
- Só o anfitrião atual pode iniciar rodada, alterar regras no lobby, encerrar sala, pausar/retomar e expulsar jogadores no lobby.
- Se anfitrião sair/desconectar, transferir **definitivamente** o cargo por sorteio entre humanos conectados. Se houver apenas um, ele assume. Bot nunca é anfitrião. Retorno do anfitrião antigo não recupera o cargo.
- Não existe transferência voluntária do cargo.
- Anfitrião pode **encerrar a sala a qualquer momento**, inclusive durante partida, mediante confirmação. Todos recebem aviso e voltam ao menu; código e partida são invalidados.
- Expulsar humanos **somente no lobby**. A identidade expulsa fica bloqueada **até a sala ser encerrada**, incluindo revanches. Considerar limitação de um bloqueio sem contas: apagar dados locais permite obter identidade diferente; não prometer bloqueio antifraude perfeito.
- Se todos os humanos desconectarem, encerrar a sala e descartar a partida, mesmo com bots ou durante pausa.
- Desconexão confirmada no lobby **libera imediatamente a vaga**, sem reserva. Saída voluntária no lobby também libera. Reconexão ao lobby apenas com vaga; ao liberar Pronto é perdido.
- O servidor precisa distinguir oscilação transitória da **desconexão confirmada**; aplicação das regras de desconexão não deve ser disparada só por latência temporária.

## 6. Rodadas, pausa e regras
- As regras são definidas antes da partida e ficam **bloqueadas durante a partida inteira**, incluindo intervalos. Só podem mudar no lobby antes de outra partida/revanche.
- Ao iniciar qualquer rodada, distribuir cartas, determinar jogador inicial, exibir contagem sincronizada **3, 2, 1** e só então liberar ações/cronômetro.
- Primeira rodada: sorteio do primeiro jogador. Nas seguintes: **começa o jogador que descartou a última carta na rodada anterior** (em Duplas, o integrante que finalizou). Se controlado por bot, esse bot inicia.
- Todas as rodadas começam no **sentido horário**. Cartas Inverter alteram sentido durante a rodada como no motor original. O sentido não é resetado por desconexão.
- Após cada rodada, mostrar resultados e placares. Todos humanos devem marcar `Pronto` novamente; bots estão prontos. Anfitrião inicia a próxima rodada manualmente. Quem reconectar no intervalo entra como **Não pronto**, mesmo que o bot estivesse pronto.
- Ao atingir a meta, mostrar resultado final e retornar ao **lobby da mesma sala/código** para revanche; zerar pontos, permitir redefinir regras/equipes, todos `Não pronto`.
- Anfitrião pode pausar **sem limite de duração**. Congelar qualquer prazo de turno, corte, anúncio, desafio e qualquer outra janela temporal; bloquear ações enquanto pausado. Na retomada há contagem sincronizada **3, 2, 1**, então os prazos continuam com tempo restante.
- Cronômetro habilitado: se tempo esgotar, comprar automaticamente 1 carta e passar, **sem jogar carta comprada**; se estiver sob +N, comprar penalidade inteira e passar. Após **2 turnos consecutivos expirados**, o bot assume temporariamente a posição.
- Cronômetro desabilitado: se o humano permanecer **2 minutos sem ação válida durante seu turno**, bot assume temporariamente (sem precisar de dois turnos). Pausa congela essa contagem.
- Não existe opção de o humano conectado ativar voluntariamente um bot.

## 7. Saída, desconexão, bot e retorno
- Se humano sair voluntariamente ou desconectar **durante a partida**, bot assume preservando mão, equipe, posição, pontuação e estado/turno. O humano original poderá retornar.
- Retorno: entrar novamente com **código da sala** e identidade privada salva no **mesmo dispositivo/origem**. Não oferecer transferência por código de recuperação ou outro aparelho. Só código da sala não dá direito a assumir vaga alheia.
- Ao reconectar, humano reassume posição e estado atual; se bot estiver no meio de uma ação, completar ação antes de devolver o controle.
- Após substituição por inatividade enquanto conexão humana segue ativa, qualquer interação **intencional de mesa/cartas** retoma controle; primeiro toque só reassume, sem realizar jogada acidental.
- Quando bot estiver substituindo humano, manter nome e avatar originais e exibir pequeno indicador de robô para todos. Remover indicador quando controle voltar.
- Bots presentes originalmente no lobby permanecem identificados como bots.

## 8. UI e privacidade das mãos
- Para **cada participante**, a própria mão fica sempre na parte **inferior** da tela; jogador oposto na parte superior, vizinhos à esquerda e direita. Preservar relações relativas e direção do jogo.
- No modo Duplas, o parceiro sempre aparece em cima, com **todas as cartas abertas e visíveis o tempo inteiro**; não precisa tocar para revelar. A mão do parceiro é apenas consultável, não jogável.
- Mãos adversárias ocultas; mostrar contadores públicos. Renderização deve acomodar mãos extensas em aparelhos menores, sem rolagem indevida da mesa.
- Animações e sons existentes continuam sendo executados localmente com base em eventos autoritativos, sem afetar a validade do estado.

## 9. Motor de jogo: preservar regras aprovadas
- Não redesenhar baralho, pontuação, cartas, desafios, cortes, regras de compras, finais, itens e bots para “facilitar” o multiplayer.
- Reutilizar e modularizar o comportamento testado existente, incluindo: +2/+4/+6 e acúmulos; bloqueio e inverter; coringas; Panela de Pressão; Liquidificador; corte; denúncia de última carta; desafios; descarte final e pontuação; compras opcionais/infinitas e cronômetro.
- **Panela de Pressão e Liquidificador NÃO escolhem cor nova**. Parceiro pode consultar mão aberta, mas não jogar por ele.
- Testar paridade offline/online para as regras sensíveis. O servidor deve usar a mesma semântica validada e nunca aceitar “jogada pronta” enviada pelo cliente.

## 10. Plano de implementação incremental
**Fase 1 — infraestrutura e lobby, sem partida online ainda:**
1. Adicionar backend Cloudflare Worker + Durable Object de sala e registrador de códigos, com configuração `wrangler`, instruções locais/deploy e opção de URL de servidor via configuração.
2. Implementar criação, entrada por código/link, token local, lobby de 4 vagas, bots, equipe, nome/avatar, Pronto, regras do anfitrião, reset seletivo de Pronto, expulsão, saída/desconexão, sorteio de sucessor e encerramento.
3. Adaptar telas multiplayer já existentes; não afetar tela/prática offline. Se link Android profundo depender de domínio/Android App Links, implementar link web primeiro e documentar configuração pendente, sem declarar que APK abre diretamente antes da validação.
4. Testar múltiplos clientes simultâneos, rejeição de quinto humano, código colisão/zeros, bloqueio de expulsos, join/leave, desconexões, transferência de anfitrião, regras de Pronto, ausência de espectadores e limites de mensagens. **Não habilitar botão Iniciar partida online funcional até a Fase 2.**
5. Garantir `npm run build` e testes offline existentes, preservando appId e assinatura Android.

**Fase 2 — motor autoritativo e partida online:** extrair lógica reutilizável preservando regras, montar snapshots filtrados, implementar jogo, turnos, bots, cortes e penalidades, contagem inicial, resultados e revanches.

**Fase 3 — robustez:** reconexão segura, substituição por inatividade, pausa, sincronização de deadlines, concorrência, idempotência, segurança, testes reais 4 clientes (navegador e APK), atualização Android.

**Critério geral:** cada etapa deve deixar o modo offline intacto, ter testes automatizados e ser reversível. Não guardar segredos de deploy no repositório. O deploy/conta Cloudflare exigirão configuração/autorização do proprietário.

## 11. Diferenças observadas na implementação atual (não confundir com multiplayer aprovado)
- O `README.md` está desatualizado em alguns pontos e o jogo local atual é um protótipo **1 humano + 3 bots**, não multiplayer pronto.
- `IMPORTACAO_PANELAS/index.html` mantém o motor principal inline; `mesa.js` renderiza o estado, e `navegacao.js` já possui rotas para criar/entrar, hoje com telas de “em breve”.
- O motor local antigo pode iniciar uma rodada sempre com a posição 0 e adotar outra convenção de sentido; as regras acima são as decisões para o **novo multiplayer**, não autorização para alterar o comportamento offline silenciosamente.
