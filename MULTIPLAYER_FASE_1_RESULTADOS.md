# Panelinha — resultados da Fase 1 do multiplayer

Registro histórico da Fase 1. A etapa seguinte está em [MULTIPLAYER_FASE_2_RESULTADOS.md](MULTIPLAYER_FASE_2_RESULTADOS.md), incluindo partidas autoritativas e suas validações; as restrições de jogabilidade abaixo descrevem a entrega original.

Data: 05/11/2026. Branch: `android/apk-testes`. Base conferida na API do GitHub: `b66b6605ef67fbf57899258110787d5d3da5efa6`, após a integração visual/sonora 0.2.35. Os dois documentos de requisitos foram lidos integralmente. O checkout e o histórico existentes foram preservados.

**Atualizado em 06/11/2026:** após autorização explícita do proprietário, servidor e lobby publicados em **https://panelinha-lobby.lucas260802.workers.dev/**. Resultados da publicação e dos testes públicos na última seção deste documento. Partidas online continuam desabilitadas.

## Entrega implementada

Servidor e lobby reais, sem partidas online. A entrega original de 05/11 foi apenas local, sem publicação. Em 06/11 o proprietário autorizou a publicação na sua conta, executada conforme registro ao final. Não houve alteração de domínio próprio ou solicitação de senha/token em texto livre.

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
| `multiplayer-server/wrangler.jsonc` | Bindings SQLite, migração e hospedagem de `dist` junto da API. |
| `multiplayer-server/package*.json`, `.gitignore`, `README.md` | Dependências fixadas, scripts locais e documentação do protocolo/operação. |
| `IMPORTACAO_PANELAS/multiplayer-config.js` | Configuração pública com o endereço HTTPS publicado em 06/11. |
| `multiplayer-connection.js`, `multiplayer.js`, `multiplayer.css` | Transporte, lobby e apresentação. |
| `IMPORTACAO_PANELAS/index.html`, `navegacao.js`, `perfil.js` | Pontos de integração; motor de cartas preservado. |
| `ferramentas/build-web.cjs`, `verificar_apk.py` | Inclusão e verificação dos quatro novos arquivos web no empacotamento offline. |
| `multiplayer-server/tests/`, `testes/multiplayer_lobby.cjs` | Testes de servidor e navegadores com backend real. |

Rotas HTTP: `GET /health`, `POST /v1/sessions`, `POST /v1/rooms`, `GET /v1/rooms/:code`, `GET /v1/rooms/:code/ws`. Contrato completo em [multiplayer-server/README.md](multiplayer-server/README.md).

Na entrega original, `serverUrl` estava vazio. Após a publicação autorizada em 06/11, `serverUrl` e `inviteBaseUrl` passaram a apontar ao Worker público, com HTTPS/WSS e desenvolvimento inseguro desabilitado. Se a URL for explicitamente esvaziada, Criar/Entrar continuam informando a indisponibilidade; não há sala fictícia nem fallback para partida offline. Um jogador não depende da conexão. O build e a sincronização Capacitor foram repetidos com a URL pública; o APK anterior instalado não se atualiza automaticamente.

## Testes e evidências

Resultados da entrega original de 05/11, sem falhas na rodada final. Logs e capturas: [testes/evidencias-multiplayer-fase1](testes/evidencias-multiplayer-fase1/), com [resultados.json](testes/evidencias-multiplayer-fase1/resultados.json). As verificações repetidas/adicionadas para a publicação em 06/11 estão na última seção.

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
| Cloudflare publicada e WSS público | Pendentes em 05/11; **publicados e testados em 06/11**, conforme última seção. Hibernação efetiva não foi instrumentada. |

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
- HTTPS/WSS público foi validado em 06/11, inclusive após 70 segundos sem comandos. Hibernação efetiva não foi instrumentada e diferentes condições de rede móvel continuam pendentes. Repouso, persistência e reinício não demonstram por si só que o provedor hibernou o objeto.
- Reconexão de lobby não reserva lugar: sem humanos conectados a sala termina, conforme especificação. Sem contas, apagar armazenamento local permite criar outra identidade; não é possível prometer bloqueio antifraude absoluto.
- Existe uma reserva técnica de até 15 segundos entre HTTP de criação e autenticação do criador. Somente o criador pode ativá-la; nunca fica um lobby vazio permanente. Não é uma reserva de participante desconectado.
- Convite web foi testado localmente e no endereço público. Android App Links e abertura direta do APK por convite não foram configurados nem declarados funcionais.
- As quotas do plano Free devem ser acompanhadas após deploy. A arquitetura não exige plano pago, mas não oferece uso ilimitado.

## Procedimento de publicação e futuras atualizações

O proprietário já forneceu o Account ID e aprovou o acesso pelo fluxo oficial no navegador. Não é necessário repetir esse passo. Não envie senha, API token, Secrets ou chave Android. Referência oficial para conferência futura: [onde encontrar o Account ID](https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/).

O procedimento abaixo documenta publicação/atualizações **explicitamente autorizadas**, com comandos executados no ambiente do Codex. O proprietário participa pelo navegador do celular quando é necessário consentimento Cloudflare; não precisa instalar Node/CLI/SDK. A publicação de 06/11 usou o subdomínio `workers.dev` já disponível na conta.

1. Conferir o Account ID, o plano Free e a disponibilidade de Workers/Durable Objects SQLite na conta. Configurar `account_id` público no Wrangler, sem credenciais no Git.
2. Autorizar acesso pelo fluxo oficial `npx wrangler login --device --browser=false --scopes account:read user:read workers_scripts:write`; verificar conta e escopos com `wrangler whoami --json --account <Account ID>`. O fluxo foi validado pelo proprietário no celular. A aprovação acontece no site Cloudflare; não se enviam senhas/tokens na conversa. Leitura de conta/perfil sozinha não autoriza deploy.
3. Confirmar ou cadastrar o subdomínio `workers.dev` no painel **Workers & Pages → Overview / Visão geral** quando solicitado pela Cloudflare. Não é necessário comprar domínio para o primeiro teste.
4. O Codex informa o endereço HTTPS previsto em `IMPORTACAO_PANELAS/multiplayer-config.js`: `serverUrl` para a origem do Worker e `inviteBaseUrl` para a página web no mesmo Worker. Conservar `allowInsecureDevelopment: false`. Conferir `ALLOWED_ORIGINS`, mantendo `https://localhost` para o APK e acrescentando apenas origens web realmente utilizadas.
5. No ambiente do Codex, instalar as dependências fixadas e executar novamente `npm run build`, testes web/servidor e `npm --prefix multiplayer-server run check`. O bundle deve incluir os assets locais e os bindings SQLite.
6. Só com autorização de publicação, executar `npm --prefix multiplayer-server run deploy:manual`. A primeira publicação cria o Worker e aplica a migração `v1` para `RoomRegistry`/`LobbyRoom`. Não renomear classes, apagar migrações ou reiniciar o registro de códigos numa atualização comum.
7. Validar o endereço real `/health`, HTTPS/WSS e convites; conectar quatro aparelhos/navegadores em redes adequadas e repetir criação, Pronto, equipes, permissões, expulsão, reconexão e encerramento. Verificar quotas/erros reais no painel, evitando registrar tokens privados.
8. Depois do lobby público validado, preparar o APK com a configuração pública, `npm run sync:android` e workflow Android existente, assinatura de geração 2 e versionCode crescente. Verificar certificado/pacote e atualização preservando dados. Partidas online só serão habilitadas após a Fase 2.

Na entrega original de 05/11 esses passos eram apenas preparação, sem login/deploy/publicação. A execução autorizada em 06/11 está registrada abaixo. Não foi feita compilação Android de distribuição nesta etapa.

## Preparação da conta — 06/11/2026

O proprietário forneceu o Account ID público `29f97cde80537cc4691142d5b86d115f`, registrado em `multiplayer-server/wrangler.jsonc`. O dry-run foi executado novamente e aprovado. A consulta inicial informou `loggedIn: false`; após o OAuth, `whoami --json --account` confirmou login e associação ao Account ID correto.

A versão fixada do Wrangler suporta `login --device --browser=false`, fluxo oficial adequado à autorização pelo navegador do celular, sem callback localhost. Para conferir conta e associação, basta solicitar `--scopes account:read user:read`, sem conceder publicação de Workers. Não colocar credenciais ou códigos temporários no Git. Uma futura publicação continuará dependendo de autorização explícita e das permissões adicionais necessárias. Referência: [login por dispositivo](https://developers.cloudflare.com/workers/wrangler/commands/general/#use-wrangler-login-without-a-local-callback-server).

Esta preparação não publicou o lobby, não alterou a conta Cloudflare, não gerou APK e não mudou o jogo ou sua identidade Android.

## Publicação autorizada e testes públicos — 06/11/2026

O proprietário autorizou explicitamente a publicação do servidor/lobby e aprovou o consentimento oficial por dispositivo. O CLI confirmou a conta correta e os escopos `user:read`, `account:read`, `workers_scripts:write` e `offline_access`. Não foram solicitados escopos de D1, Pages, KV, rotas de domínio ou faturamento. Credenciais permanecem fora do repositório; nenhum token ou código temporário faz parte desta entrega.

- Web e API: **https://panelinha-lobby.lucas260802.workers.dev/**.
- Saúde pública: **https://panelinha-lobby.lucas260802.workers.dev/health**, resposta `{"v":1,"phase":1,"gameplay":false}`.
- Worker: `panelinha-lobby`; bindings `REGISTRY` e `ROOMS` com SQLite, migração `v1`. Foi utilizado o subdomínio já existente `lucas260802.workers.dev`; nenhum domínio próprio foi modificado.
- Primeira versão publicada: `8c3030dc-561e-4e80-8f47-61c68c33d820`. Após confirmar o endereço e configurar o frontend, versão vigente **`1954da26-323d-440d-b9e8-017f19e55a02`**.
- `serverUrl` e `inviteBaseUrl` atualizados na fonte e no build, usando HTTPS; `allowInsecureDevelopment` permanece `false`. A configuração servida foi comparada byte a byte à fonte (SHA-256 `ed13440622af54332ca0fa3127855550101aa7c1a6c21c175918c48d1c3111e3`).
- Nenhum motor, arte, som, regra ou código nativo foi alterado nesta publicação. Nenhum plano pago foi solicitado/ativado pela execução; limites do plano continuam aplicáveis.

### Resultados efetivamente executados

| Cenário | Resultado |
| --- | --- |
| Backend local repetido antes de publicar | **14/14 aprovados**, zero ignorados. |
| Chromium na URL pública, com validação TLS normal | HTTP 200, título Panelinha e servidor configurado. |
| Dois processos Chromium / quatro contextos independentes via HTTPS/WSS público | **Aprovado**: criação, convite/código, nomes repetidos e identidades distintas, quinto rejeitado, Pronto/som, perfil, regras, reset seletivo, bots e substituição, expulsão/bloqueio, sucessão, retorno, encerramento e Voltar. Sem tokens nos snapshots/convites nem erros JS. |
| Layout público em 568×320, 844×390 e 1280×800 | **Aprovado**; código/ações principais acessíveis e nomes preservados. |
| Configuração realmente publicada, sem injeção do endereço pelo teste | **Aprovado**: dois humanos e dois bots, somente transportes WSS. |
| Repouso público de 70 segundos, sem comandos/heartbeat de aplicação | **Aprovado**: conexões, host, versão e Pronto preservados; ação posterior sincronizada. Não instrumenta se o provedor efetivamente hibernou o objeto. |
| Desconexão confirmada e retorno no mesmo contexto/origem | **Aprovado**: libera vaga, conserva identidade ao retornar, perde Pronto e conserva anfitrião correto. |
| Encerramento público | **Aprovado**: clientes voltam ao menu e consulta do código recebe 404. Salas ativas de teste foram encerradas; reservas sem autenticação expiram. |
| Origem Android `https://localhost` | **Aprovado na API/CORS**: HTTP 200 e `Access-Control-Allow-Origin` correto. Uma origem não autorizada recebeu 403. Não equivale a execução em APK físico. |
| Regressões locais após ativação da URL | **6 suítes aprovadas**: navegação, identificação/orientação, preparação dos menus, integração visual/sonora, compatibilidade web Android e lobby. |
| Build/sync Capacitor, dry-run e versão Android | **Aprovados**; versão Android com **5/5 verificações**. |
| APK, atualização instalada, emulador e quatro aparelhos físicos | **Não executados nesta etapa**. |

Na regressão inicial, `horizontal_identidade.cjs` falhou porque ainda exigia o campo de código sempre desabilitado, expectativa da preparação sem servidor. A verificação agora exige estado coerente com a configuração real do servidor, assim como `navegacao.cjs`; as demais verificações foram mantidas. A suíte completa de identificação foi reexecutada e aprovada. O log da falha inicial e o da execução corrigida estão preservados nas evidências, sem ocultar o resultado anterior.

Logs e capturas desta publicação: [testes/evidencias-multiplayer-publicacao](testes/evidencias-multiplayer-publicacao/). Testes públicos reproduzíveis: `testes/multiplayer_lobby.cjs` e `testes/multiplayer_publico.mjs`, com comandos em [multiplayer-server/README.md](multiplayer-server/README.md). Os testes públicos usam proxy quando exigido pelo ambiente, mantendo verificação TLS, e apenas salas temporárias anônimas. Não foram simulados quatro celulares ou falhas de rede móvel.

### Como testar agora

Abra **https://panelinha-lobby.lucas260802.workers.dev/** no navegador do celular. Entre em **Multiplayer → nome/avatar → Criar sala**. Em outro navegador/aparelho, entre pelo código de seis dígitos ou pelo link compartilhado. O anfitrião pode preencher vagas com bots, escolher regras e testar Pronto. **Iniciar partida continua indisponível**, pois jogar cartas online será a Fase 2.

O último APK distribuído é o 0.2.35; o APK que você já tem instalado permanece como está. Nesta etapa foram publicados servidor e versão web; não houve novo APK nem validação nativa de atualização. Uma futura build Android deverá usar a URL já integrada, o workflow existente, versionCode crescente e assinatura permanente de geração 2, com os testes nativos e a verificação de atualização correspondentes.
