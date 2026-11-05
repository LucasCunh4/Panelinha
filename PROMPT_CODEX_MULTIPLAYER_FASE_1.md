# CODEX — PANELINHA / MULTIPLAYER FASE 1: SERVIDOR E LOBBY (SEM PARTIDAS ONLINE)

## Contexto e ponto de partida

Repositório: `LucasCunh4/Panelinha`. Branch obrigatória: `android/apk-testes`. Parta do HEAD atual **depois da integração visual e sonora v0.2.35**, sem sobrescrever commits recentes. Leia integralmente `MULTIPLAYER_ESPECIFICACAO.md`, que reúne as decisões aprovadas e é a fonte de verdade. Esta tarefa implementa **somente a Fase 1** ali descrita.

O usuário é iniciante e executa os passos pelo celular. Não exija que instale Node, Android SDK ou CLI localmente; organize os comandos para serem executados pelo Codex/ambiente apropriado. A conta Cloudflare já foi criada, mas **nenhum deploy é autorizado nesta tarefa**. Prepare a aplicação para deploy posterior, sem pedir senhas ou tokens em texto livre e sem publicar automaticamente.

## Objetivo desta entrega

Criar estrutura real e testável para salas multiplayer e o lobby, com backend Cloudflare Worker + Durable Objects SQLite (compatível com Workers Free), conexão WSS/WebSockets com Hibernation API, frontend integrado à navegação já existente, mas **sem executar o motor de cartas online ainda**. A tela de lobby deve funcionar com quatro dispositivos/navegadores conectados ao servidor local de desenvolvimento, inclusive seleção das equipes, bots, regras e estados Pronto.

Referências técnicas atuais:
- https://developers.cloudflare.com/durable-objects/
- https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- https://developers.cloudflare.com/workers/platform/pricing/

## Requisitos da Fase 1

### Servidor
1. Criar backend isolado (sugestão `multiplayer-server/`) com `wrangler.jsonc` ou `wrangler.toml`, arquivo de lock e scripts documentados para instalar, executar localmente, testar e fazer deploy **manualmente no futuro**. Não exigir plano pago: classes Durable Object com `new_sqlite_classes`.
2. Cada sala com Durable Object independente; registry central deve gerar, reservar e liberar **atomicamente** códigos numéricos de **exatamente seis dígitos**, preservando zeros à esquerda e impedindo colisão entre salas ativas. Não usar `Math.random()` para tokens de autenticação; utilizar fonte criptográfica.
3. Conexões WebSocket com mensagens versionadas, validação rígida de dados, limites de tamanho/frequência e respostas de erro recuperáveis. Usar Hibernation API, `acceptWebSocket` e persistência do estado/identificação; lidar com retomada após hibernação. Não deixar objetos ativos indefinidamente por temporizadores de heartbeat desnecessários.
4. IDs internos estáveis por participante e token privado imprevisível (persistido **localmente no aparelho/origem**). Código da sala e nome público **não** autenticam o titular. O link de convite nunca contém token privado.
5. Conexão duplicada com o mesmo token não pode dar dois controladores simultâneos. Considerar desconexão real versus oscilação: atualizações do lobby acontecem depois que o servidor confirmar encerramento do vínculo; não encerrar sala por mero atraso de mensagem.
6. API simples e documentada para criar sala, entrar por código, reentrar pelo mesmo dispositivo, atualizar perfil, regras, equipes, Pronto, adicionar/remover bots, expulsar, sair e encerrar. Validação autoritativa de todas as permissões no servidor (não confiar no botão do cliente).
7. Sala só deve existir enquanto houver humano conectado; ao desconectar o último humano, encerrar e invalidar código conforme especificação. No lobby, sair voluntariamente ou desconectar **libera imediatamente** a vaga, sem reserva. Quando o anfitrião sair, seu cargo é transferido **definitivamente** por sorteio entre humanos conectados.
8. Mensagens devem dar estado consistente a cada cliente, sem enviar informações desnecessárias ou tokens privados de outros participantes.
9. Código de erro claro quando sala não existe, está cheia, está bloqueada para o participante ou fechou. Proteção contra adivinhação de códigos/solicitações em excesso.

### Lobby e frontend (navegador/Capacitor)
1. Integrar à identidade visual **já implementada**: cozinha/título/avatares/som; preservar menu original e tela Um Jogador offline.
2. Usar as telas já existentes `Multiplayer`, `Criar Sala`, `Entrar em Sala` como base. Configurar endereço do backend em lugar explícito, documentando onde informar URL após deploy; durante desenvolvimento permitir servidor local de teste. **Não** embutir tokens privados ou chave da Cloudflare no APK.
3. Criar sala, entrar digitando código e aceitar link de convite (preenche código automaticamente). Todos os participantes podem compartilhar código/link. Link web é obrigatório; associação nativa Android App Links pode ficar documentada para etapa futura, sem declarar que funciona antes de testar.
4. Exatamente **quatro lugares**; entrada automática sem aprovação no lobby, desde que exista vaga. Humano pode substituir bot de lobby. **Sem espectadores, sem chat, sem reações**.
5. Individual ou Duplas: em Duplas, humanos escolhem Equipe 1/2 (duas vagas cada); bots distribuem-se automaticamente entre vagas restantes. Não iniciar partida nem sortear posições da mesa nesta fase, mas preparar o modelo de dados. Nomes repetidos são permitidos; avatar e nome podem ser alterados no lobby.
6. O anfitrião pode alterar regras antes da partida, adicionar/remover bots, expulsar humanos (expulsão bloqueia a identidade por toda a vida da sala), encerrar sala mediante confirmação. Não permitir transferência voluntária de anfitrião. Se o anfitrião sair, sorteio definitivo. Nenhum bot pode ser anfitrião.
7. Todos os humanos, inclusive anfitrião, devem marcar Pronto; bots ficam automaticamente prontos. Mudança de **regras** desmarca Pronto de **todos os humanos**; entrada/saída/troca de equipe só desmarca diretamente afetados; nome/avatar não desmarca. Mostrar estados atualizados em tempo real.
8. Exibir **Iniciar partida** como ação **desabilitada/indisponível na Fase 1**, com indicação clara de que a jogabilidade online virá na Fase 2; nenhuma partida online fictícia ou encaminhamento para modo offline.
9. Na entrada, orientar de forma simples se não houver conexão com o servidor; não apresentar ação ilusória que nada faz.
10. Não expor um sistema falso em memória local como se fosse multiplayer real. Testes com quatro clientes devem passar pelo backend.

## Preservação obrigatória
- Não mudar o motor de cartas, cortes, +2/+4/+6, Panela de Pressão, Liquidificador, bots locais, pontuação, sons, imagens, animações e layouts da mesa offline.
- Não modificar `MULTIPLAYER_ESPECIFICACAO.md` sem solicitação do usuário; se identificar conflito ou ambiguidade, documentar no relatório, resolvendo de forma conservadora.
- Preservar a versão Android do aplicativo e sua capacidade de atualização: `com.lucascunha.panelinha.teste`, origem `https://localhost`, **assinatura geração 2**, os quatro GitHub Actions Secrets existentes, workflow original `.github/workflows/android-testes.yml`, histórico de versões e `versionCode` crescente. Não gerar chaves novas nem editar credenciais.
- Não criar contas de usuário ou coletar e-mails.
- Não requerer painel Cloudflare/autorizar deploy nem alterar domínio neste momento.
- Usar dependências e APIs documentadas e testáveis, sem se apoiar em recursos premium obrigatórios.

## Testes e entrega
- Testar backend local: criação simultânea, unicidade/zeros do código, 4 ocupantes, quinto rejeitado, bot substituído, mudança de equipe, Pronto e seus resets seletivos, nome repetido, expulsão e bloqueio, encerramento/invalidação, transferência do host por sorteio, saída/desconexão de lobby, permissões, tokens de retorno, duplicidade de conexão, hibernação/restart onde viável, entradas inválidas, rate limits.
- Testar no frontend (mínimo dois navegadores independentes; ideal quatro sessões simultâneas), conectando ao **mesmo** backend; testes de regressão offline já existentes, `npm run build` e `npm run sync:android` se ambiente permitir.
- Evitar alterações que disparem APK novo por acidente se a implementação ainda não estiver pronta para teste; relatório deve separar claramente testes web, testes reais Android e simulações.
- Escrever `MULTIPLAYER_FASE_1_RESULTADOS.md` com: arquivos e rotas adicionados, comandos locais de teste, status por cenário, limitações, se o frontend atual depende da URL pública, e **passos exatos para um iniciante publicar depois na Cloudflare**. Não publicar nesta execução.
- Commitar alterações na branch de trabalho correta seguindo o fluxo do Codex. Mostrar commits/PR gerados e diferenças essenciais.
- **Não afirmar que multiplayer jogável está pronto**: esta entrega inclui servidor/lobby; cartas online são Fase 2.

## Resumo desejado ao concluir
Quero receber: o que foi implementado, como testou e o que passou/falhou, se a versão offline permanece íntegra, e **qual é o único próximo passo que eu, usuário iniciante, devo executar na Cloudflare**. Não solicitar nem exibir senhas, API tokens, secrets ou keystores.
