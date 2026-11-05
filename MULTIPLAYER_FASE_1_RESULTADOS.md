# Panelinha — resultados da Fase 1 do multiplayer

Data: 05/11/2026. Branch: `android/apk-testes`. Base conferida na API do GitHub: `b66b6605ef67fbf57899258110787d5d3da5efa6`, após a integração visual/sonora 0.2.35. Os dois documentos de requisitos foram lidos integralmente. O checkout e o histórico existentes foram preservados.

## Entrega implementada

Servidor e lobby reais, testáveis localmente, sem partidas online. **Nenhum recurso foi publicado na Cloudflare**, nenhum domínio foi alterado e não foram solicitadas credenciais da conta.

- Worker com dois bindings Durable Objects SQLite: `REGISTRY` para registro atômico de códigos e `ROOMS` para um objeto independente por sala. Migração `new_sqlite_classes`, compatível com Workers Free e suas quotas.
- Código numérico de seis dígitos, incluindo zeros à esquerda; chave única e transação SQLite impedem colisões. Criações repetidas com o mesmo ID não geram uma segunda sala.
- Token privado criptográfico por aparelho/origem, salvo localmente; servidor guarda seu hash. Código e nome não autenticam ninguém. Convites contêm somente código público.
- Exatamente quatro posições, entrada automática, quinto humano rejeitado, substituição de bot por humano, nomes repetidos, edição de perfil com os nove avatares já existentes.
- Individual/Duplas, escolha da própria equipe com limite de dois humanos, bots distribuídos nas vagas restantes, regras existentes e estados Pronto sincronizados pelo servidor. Não há sorteio de posições nem início de partidas nesta fase.
- Regras alteradas desmarcam todos os humanos; troca de equipe desmarca só o autor; entrada/saída preservam os não afetados; nome/avatar não desmarcam. Bots estão sempre prontos. O som já aprovado de Pronto é acionado pelo evento confirmado do servidor, com deduplicação de ACK/snapshot.
- Permissões autoritativas: somente anfitrião muda regras/bots, expulsa e encerra. Expulsão bloqueia a identidade durante a vida da sala. Não existe transferência voluntária do cargo.
- Saída/desconexão confirmada libera vaga sem reserva. Sucessor sorteado entre humanos conectados; retorno do antigo anfitrião não recupera o cargo. Sem humanos a sala fecha, mesmo com bots, e seu código é invalidado.
- Uma identidade tem uma controladora por vez, inclusive em salas distintas. Reentrada usa a identidade salva, mas depende de vaga no lobby e retorna Não pronto após desconexão.
- Hibernation API com `acceptWebSocket`, attachments e estado canônico SQLite. Sem heartbeat/polling recorrente; alarmes pontuais cuidam de reservas e conexões ainda não autenticadas. Silêncio de cliente autenticado não significa desconexão.
- Validação de campos, permissões, origem, versão, idempotência, tamanho UTF-8 e frequência. Nenhuma mensagem pública envia tokens, IDs privados de conexão, baralho ou mãos.

## Interface e arquivos

As telas Criar/Entrar existentes foram aproveitadas. O novo lobby reutiliza cozinha, fontes, avatares, sons e seletores próprios do Panelinha. Confirmações, Voltar, código/link, regras, perfil, equipes e Pronto estão integrados à navegação. Voltar durante uma entrada em andamento cancela a entrada; não redireciona inesperadamente para o lobby quando a resposta HTTP chegar.

| Arquivo / área | Alteração |
| --- | --- |
| `multiplayer-server/src/worker.mjs` | HTTP, CORS, roteamento e erros. |
| `src/registry.mjs`, `src/room.mjs` no servidor | Registry e sala SQLite com WebSocket Hibernation. |
| `src/protocol.mjs`, `src/lobby-model.mjs` no servidor | Contrato, validação, códigos, equipes e sorteio de sucessor. |
| `multiplayer-server/wrangler.jsonc` | Bindings SQLite, migração e hospedagem futura de `dist` junto da API. |
| `multiplayer-server/package*.json`, `.gitignore`, `README.md` | Dependências fixadas, scripts locais e documentação do protocolo/operação. |
| `IMPORTACAO_PANELAS/multiplayer-config.js` | Lugar explícito para a futura URL pública. |
| `multiplayer-connection.js`, `multiplayer.js`, `multiplayer.css` | Transporte, lobby e apresentação. |
| `IMPORTACAO_PANELAS/index.html`, `navegacao.js`, `perfil.js` | Pontos de integração; motor de cartas preservado. |
| `ferramentas/build-web.cjs`, `verificar_apk.py` | Inclusão e verificação dos quatro novos arquivos web no empacotamento offline. |
| `multiplayer-server/tests/`, `testes/multiplayer_lobby.cjs` | Testes de servidor e navegadores com backend real. |

Rotas HTTP: `GET /health`, `POST /v1/sessions`, `POST /v1/rooms`, `GET /v1/rooms/:code`, `GET /v1/rooms/:code/ws`. Contrato completo em [multiplayer-server/README.md](multiplayer-server/README.md).

O código mantém `serverUrl` vazio por padrão. Sem deploy autorizado, Criar/Entrar mostram que o servidor ainda não foi configurado; não existe sala fictícia ou fallback para uma partida offline. O lobby testado foi conectado explicitamente ao servidor local. Após a publicação futura, a URL HTTPS precisará ser informada no arquivo de configuração e incluída em novo build.

## Testes e evidências

Todos os resultados abaixo foram executados nesta revisão. **Nenhuma falha permanece na rodada final.** Logs e capturas: [testes/evidencias-multiplayer-fase1](testes/evidencias-multiplayer-fase1/), com [resultados.json](testes/evidencias-multiplayer-fase1/resultados.json).

| Verificação executada | Resultado |
| --- | --- |
| Backend no workerd/SQLite real: códigos/colisão/zeros, 12 criações simultâneas, lotação, bots, equipes, Pronto, permissões, expulsão, saída/host/retorno, controladora única entre salas, versões, erros e limites | **14/14 testes aprovados**, zero ignorados. |
| Persistência SQLite e reinício | Estado Pronto persistido; token presente apenas como hash SHA-256; reinício sem transportes não deixa sala fantasma. Incluído nos 14 testes. |
| Expiração sem autenticação | Reserva expira, socket recebe código 4008 e humano autenticado ocioso conserva conexão/cargo/Pronto. Incluído nos 14 testes. |
| Lobby integrado ao Worker, dois processos Chromium e quatro contextos simultâneos | **Aprovado**; criação, convite, código, quinto rejeitado, perfil, Pronto/som, regras, moderação, bots, sucessão, retorno, encerramento, falha de conexão e cancelamento durante entrada. |
| Suítes web existentes de regressão | **23/23 aprovadas**, incluindo regras, Panela/Liquidificador, penalidades, corte, leques, seletores, navegação, artes, áudio e compatibilidade web Android. |
| Total de suítes web, contando o lobby novo | **24/24 aprovadas**. |
| Versão/identidade Android (`python3 testes/versao_android.py`) | **5/5 verificações aprovadas**. |
| `npm run sync:android` (inclui `npm run build`) | **Aprovado**; fonte web e assets copiados pelo Capacitor. |
| `npm --prefix multiplayer-server run check` | **Aprovado**; dry-run com dois bindings SQLite e 210 arquivos web, sem publicação. |
| Emulador/instalação/atualização APK em aparelho | **Não executados nesta fase**; sem APK novo. |
| Cloudflare publicada, WSS público e hibernação real na conta | **Pendentes por ausência de deploy autorizado**. |

Comandos locais reproduzíveis estão em [multiplayer-server/README.md](multiplayer-server/README.md). As suítes web usam HTTP local nas portas 8000 (fonte) e 8002 (build); o teste do lobby nesta rodada usou a API Wrangler em 8788. O teste de backend sobe seus próprios runtimes locais isolados.

Os navegadores se conectam ao mesmo Worker local: dois processos Chromium independentes, quatro contextos simultâneos com identidades diferentes, mais contextos para quinto jogador, erro e cancelamento. Isso não equivale a quatro celulares físicos, nem a quatro motores de navegador diferentes.

Os layouts do lobby cobrem 568×320, 844×390 e 1280×800. Em telas baixas a região interna dos participantes pode rolar para alcançar seus controles, mantendo código e ações principais acessíveis; a mesa offline continua sem rolagem. As telas de entrada também conservam os testes existentes em retrato e paisagem. A animação de navegação reutiliza o sistema atual, respeitando movimento reduzido.

Uma verificação adicional de expiração identificou um comportamento do workerd local: ele emite Close no prazo de 15 segundos, mas pode manter o TCP aberto depois do handshake. O comportamento foi reproduzido num Worker mínimo independente do jogo, também com outro cliente WebSocket. O teste usa cliente `ws` com espera de encerramento TCP limitada a um segundo e continua exigindo o **código 4008 real do servidor**. A reserva abandonada precisa desaparecer e o participante autenticado ocioso precisa continuar conectado/Pronto. Não foi removida a verificação de expiração nem reduzida sua exigência funcional.

Durante o desenvolvimento também foram corrigidos o fechamento da conexão substituída entre salas, a atribuição de equipe ao entrar numa vaga anterior e o recorte inicial do conteúdo dos cards em alturas pequenas. As verificações correspondentes permanecem nos testes. A primeira execução em lote foi interrompida junto dos serviços locais; resultados incompletos não foram contados como aprovados. A rodada final foi executada novamente com os serviços sob o mesmo processo de acompanhamento.

## Preservação do offline e Android

Comparação com o commit-base confirmou o motor inline de cartas, `mesa.js`, `mesa.css`, assets versionados, identidade Android, origem, workflow e especificação multiplayer preservados byte a byte. O perfil somente ganhou um método reutilizável de salvamento e uma lista de IDs de avatar; suas chaves e normalização existentes foram mantidas. Não houve migração ou limpeza de dados locais.

- Pacote preservado: `com.lucascunha.panelinha.teste`.
- Origem preservada: `https://localhost`.
- Certificado registrado de geração 2 preservado: `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`.
- Orientação `sensorLandscape`, modo imersivo e código nativo não alterados.
- Os quatro GitHub Actions Secrets não foram alterados ou exibidos; não foi criada chave.
- `.github/workflows/android-testes.yml` e sua sequência de versões permanecem intactos.

Não foi gerado APK novo nesta fase, para evitar distribuir uma compilação com servidor ainda sem URL pública. O commit usa `[skip ci]` para não disparar o workflow Android por acidente. O último APK distribuído continua 0.2.35/código 5502. Uma compilação futura deve usar o mesmo workflow, código superior a todos os já distribuídos, assinatura registrada e validação real de atualização sem desinstalar. Não se afirma que instalação/atualização Android ou emulador passaram nesta entrega: não foram executados.

## Limitações e próximas fases

- **Cartas online ainda não implementadas.** Iniciar permanece desabilitado na tela e é rejeitado pelo servidor. Fase 2 precisa do motor autoritativo reutilizando a semântica existente, snapshots filtrados, turnos, cartas, bots, pontuação, contagens, resultados e revanches. Não foi feita adaptação parcial das regras offline.
- WSS público, retomada por hibernação na infraestrutura Cloudflare e diferentes condições de rede móvel continuam pendentes. Persistência e reinício locais não demonstram automaticamente a hibernação real com transportes preservados.
- Reconexão de lobby não reserva lugar: sem humanos conectados a sala termina, conforme especificação. Sem contas, apagar armazenamento local permite criar outra identidade; não é possível prometer bloqueio antifraude absoluto.
- Existe uma reserva técnica de até 15 segundos entre HTTP de criação e autenticação do criador. Somente o criador pode ativá-la; nunca fica um lobby vazio permanente. Não é uma reserva de participante desconectado.
- Convite web foi testado localmente. Android App Links e abertura direta do APK por convite não foram configurados nem declarados funcionais.
- As quotas do plano Free devem ser acompanhadas após deploy. A arquitetura não exige plano pago, mas não oferece uso ilimitado.

## Como preparar a publicação futura na sua conta

**Única ação do proprietário agora:** no painel Cloudflare, abra **Workers & Pages**, localize **Account Details / Detalhes da conta** e copie o **Account ID / ID da conta**. Informe somente esse identificador público ao Codex. Não envie senha, API token, Secrets ou chave Android. Referência oficial: [onde encontrar o Account ID](https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/).

Depois disso, em uma etapa de deploy **explicitamente autorizada**, o Codex executará os comandos no ambiente de desenvolvimento. O proprietário continuará pelo navegador do celular quando houver autorização segura da Cloudflare; não precisará instalar Node/CLI/SDK.

1. Conferir o Account ID, o plano Free e a disponibilidade de Workers/Durable Objects SQLite na conta. Configurar `account_id` público no Wrangler, sem credenciais no Git.
2. Autorizar o acesso por `npx wrangler login` no fluxo oficial OAuth, quando viável no ambiente; verificar com `wrangler whoami`. A interação de autorização acontece no site da Cloudflare, sem colar senhas/tokens na conversa. A viabilidade desse fluxo no ambiente remoto precisa ser verificada nessa etapa; não foi simulada aqui.
3. Confirmar ou cadastrar o subdomínio `workers.dev` no painel **Workers & Pages → Overview / Visão geral** quando solicitado pela Cloudflare. Não é necessário comprar domínio para o primeiro teste.
4. O Codex informa o endereço HTTPS previsto em `IMPORTACAO_PANELAS/multiplayer-config.js`: `serverUrl` para a origem do Worker e `inviteBaseUrl` para a página web no mesmo Worker. Conservar `allowInsecureDevelopment: false`. Conferir `ALLOWED_ORIGINS`, mantendo `https://localhost` para o APK e acrescentando apenas origens web realmente utilizadas.
5. No ambiente do Codex, instalar as dependências fixadas e executar novamente `npm run build`, testes web/servidor e `npm --prefix multiplayer-server run check`. O bundle deve incluir os assets locais e os bindings SQLite.
6. Só com autorização de publicação, executar `npm --prefix multiplayer-server run deploy:manual`. A primeira publicação cria o Worker e aplica a migração `v1` para `RoomRegistry`/`LobbyRoom`. Não renomear classes, apagar migrações ou reiniciar o registro de códigos numa atualização comum.
7. Validar o endereço real `/health`, HTTPS/WSS e convites; conectar quatro aparelhos/navegadores em redes adequadas e repetir criação, Pronto, equipes, permissões, expulsão, reconexão e encerramento. Verificar quotas/erros reais no painel, evitando registrar tokens privados.
8. Depois do lobby público validado, preparar o APK com a configuração pública, `npm run sync:android` e workflow Android existente, assinatura de geração 2 e versionCode crescente. Verificar certificado/pacote e atualização preservando dados. Partidas online só serão habilitadas após a Fase 2.

Esses passos são preparação documentada. **Nenhum login, deploy, publicação web, alteração de conta Cloudflare ou compilação Android de distribuição foi executado por esta tarefa.**
