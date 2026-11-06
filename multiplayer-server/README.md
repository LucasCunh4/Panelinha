# Panelinha — servidor, lobby e partidas da Fase 2

Cloudflare Worker com um registrador de códigos e um Durable Object SQLite por sala. O servidor executa partidas autoritativas Individual/Duplas usando o mesmo núcleo de regras do jogo offline. O anfitrião inicia com quatro lugares preenchidos e todos os humanos Pronto. Cada cliente recebe somente sua mão, a do parceiro em Duplas e informações públicas dos adversários.

Fonte funcional: [MULTIPLAYER_ESPECIFICACAO.md](../MULTIPLAYER_ESPECIFICACAO.md). Entrega e limites atuais: [MULTIPLAYER_FASE_2_RESULTADOS.md](../MULTIPLAYER_FASE_2_RESULTADOS.md). Preparação original da conta: [Fase 1](../MULTIPLAYER_FASE_1_RESULTADOS.md).

Publicado com autorização em 06/11/2026: **https://panelinha-lobby.lucas260802.workers.dev/**. A versão web e a API usam esse endereço; `multiplayer-config.js` já aponta para ele. O APK anteriormente instalado não recebe essa configuração automaticamente.

## Desenvolvimento local

Os comandos são para o ambiente de desenvolvimento/Codex. O proprietário não precisa instalar ferramentas no celular. Use Node 24 LTS; o teste de persistência utiliza `node:sqlite`.

Na raiz do repositório:

```bash
npm ci
npm run build
npm --prefix multiplayer-server ci
npm --prefix multiplayer-server test
npm --prefix multiplayer-server run check
npm run sync:android
```

`check` executa **somente** `wrangler deploy --dry-run`: valida bindings, migração, bundle e assets sem publicar. `deploy:manual` publica de fato e deve ser usado somente no escopo autorizado pelo proprietário.

Para servir a versão web e a API juntas:

```bash
cd multiplayer-server
npm run dev
```

O Wrangler local serve `../dist` e a API em `http://127.0.0.1:8787`. Em `IMPORTACAO_PANELAS/multiplayer-config.js`, configure temporariamente `serverUrl` e `inviteBaseUrl` com esse endereço e refaça `npm run build`. Não versione um endereço local como configuração de produção. Para testar o código-fonte diretamente, sirva `IMPORTACAO_PANELAS` em HTTP na porta 8000 e mantenha a API local em 8787.

Com os dois serviços acima ativos:

```bash
node testes/multiplayer_lobby.cjs
node testes/multiplayer_partida.cjs
PANELAS_TEST_MODE=solo node testes/multiplayer_partida.cjs
```

O teste precisa de Playwright e Chromium, como as suítes web existentes. Aceita `CHROMIUM_PATH`, `PANELAS_TEST_URL`, `PANELINHA_TEST_SERVER`, `PANELAS_SCREENSHOTS` e, quando necessário no ambiente, `PANELAS_BROWSER_PROXY`. Abre dois processos Chromium, com quatro contextos simultâneos e identidades independentes, além dos contextos de teste de rejeição/erro. As comunicações passam pelo Worker informado, local ou público. A configuração de teste também ajusta o endereço dos convites para o mesmo ambiente; a verificação offline desabilita explicitamente o servidor.

Para repetir a verificação pública, em ambiente autorizado a criar salas temporárias:

```bash
PANELAS_TEST_URL=https://panelinha-lobby.lucas260802.workers.dev/ PANELINHA_TEST_SERVER=https://panelinha-lobby.lucas260802.workers.dev node testes/multiplayer_lobby.cjs
PANELINHA_PUBLIC_TEST_URL=https://panelinha-lobby.lucas260802.workers.dev/ node testes/multiplayer_publico.mjs
```

O segundo comando não injeta configuração no jogo: verifica a URL realmente distribuída, dois humanos e dois bots, 70 segundos sem comandos, sincronização posterior, retorno da mesma identidade e encerramento. Requer uma URL HTTPS explícita e não faz parte do glob de testes locais. Se o ambiente exige proxy, informe `PANELAS_BROWSER_PROXY` sem desabilitar a validação TLS. O repouso valida o comportamento observado, sem demonstrar diretamente que o objeto foi hibernado pelo provedor.

Para testar pela rede local em aparelhos separados, o desenvolvedor pode iniciar `wrangler dev --local --ip 0.0.0.0 --port 8787`, usar a origem LAN da máquina nos dois campos de configuração e habilitar temporariamente `allowInsecureDevelopment`. Essa exceção aceita apenas HTTP em IP privado com página também HTTP. Não resolve acesso entre redes diferentes e não substitui HTTPS/WSS de produção. Esses testes físicos ainda não foram executados nesta entrega.

## Configuração pública

`IMPORTACAO_PANELAS/multiplayer-config.js` contém apenas configuração pública:

- `serverUrl`: origem HTTPS do Worker, sem caminho, query, senha ou token;
- `inviteBaseUrl`: URL da **versão web** do jogo; o convite acrescenta somente `?sala=NNNNNN`;
- `allowInsecureDevelopment`: `false` por padrão, para exceção LAN local explícita.

Uma URL vazia desabilita claramente Criar/Entrar; Um jogador permanece offline. Depois de configurar, execute build e sync antes de uma futura compilação Android. A origem `https://localhost` do APK continua autorizada em `ALLOWED_ORIGINS`. O próprio domínio do Worker é aceito para a versão web; acrescente outras origens web explicitamente se forem usadas. CORS não substitui autenticação.

O `account_id` público fornecido pelo proprietário já consta no Wrangler; isso seleciona a conta, mas não autentica nem publica recursos. Para verificação inicial por celular, o Wrangler fixado oferece `login --device --browser=false --scopes account:read user:read`. A aprovação ocorre no site oficial Cloudflare; tokens e códigos temporários nunca devem ser colocados no Git. A publicação continua separada, dependente de autorização e permissões de escrita apropriadas.

O Worker hospeda os arquivos web e a API no mesmo endereço. `assets.run_worker_first` encaminha `/v1/*` e `/health` ao código do Worker; os demais arquivos vêm de `dist`.

## HTTP v1

Todas as respostas da API usam `Cache-Control: no-store`. Erros possuem `v`, `code`, `message` e `recoverable`. A criação não devolve estado privado de outro participante.

| Método e rota | Finalidade |
| --- | --- |
| `GET /health` | Saúde: fase 2 e `gameplay: true`. |
| `POST /v1/sessions`, corpo `{}` | Gera token privado criptográfico para esta origem/aparelho. |
| `POST /v1/rooms`, Bearer privado, corpo `{id, profile}` | Reserva código exclusivo; `id` torna a criação idempotente. |
| `GET /v1/rooms/:code` | Confirma existência pública; não autentica jogador. |
| `GET /v1/rooms/:code/ws`, Upgrade WebSocket | Abre transporte; autenticação vai na primeira mensagem, nunca na URL. |

`profile` é `{name, avatar}`: nome não vazio de até 32 caracteres, sem caracteres de controle, e um dos nove IDs de avatar já aprovados. Nomes repetidos são permitidos.

Entre a resposta HTTP de criação e a autenticação WebSocket do criador há uma **reserva técnica de até 15 segundos**. Ainda não é um lobby ocupado; só o criador pode ativá-la. Sem autenticação, a reserva expira e o código é liberado. Essa janela curta evita códigos abandonados e não reserva vaga após a desconexão de um participante.

## Protocolo WebSocket

Primeiro envio: `{v: 1, id, type: "auth", data: {token, profile, clientPhase: 2}}`. O campo aditivo `clientPhase` permite informar clientes antigos para atualizar antes de iniciar. Os demais envios acrescentam `version` com a versão mais recente recebida do servidor. `id` deve ser único por intenção, com 1–64 caracteres alfanuméricos, `_` ou `-`.

| `type` | `data` | Permissão / efeito |
| --- | --- | --- |
| `ready` | `{ready: boolean}` | Próprio participante; anúncio real de Pronto produz evento `player-ready`. |
| `profile` | `{name, avatar}` | Próprio perfil; conserva Pronto. |
| `team` | `{team: 1 ou 2}` | Própria equipe em Duplas; máximo dois humanos por equipe; mudança desmarca só o autor. |
| `rules` | `{rules}` | Anfitrião; mudança efetiva desmarca todos os humanos. |
| `add-bot` | `{}` | Anfitrião; preenche vaga. |
| `remove-bot` | `{playerId}` | Anfitrião; remove bot. |
| `kick` | `{playerId}` | Anfitrião; bloqueia identidade humana até encerrar a sala. |
| `leave` | `{}` | Libera vaga no lobby; na partida preserva assento/mão com bot substituto. Sorteia sucessor conectado se necessário. |
| `close-room` | `{}` | Anfitrião; invalida código e avisa todos. |
| `start` | `{}` | Anfitrião, quatro prontos e clientes atualizados; sorteia assentos e inicia contagem 3–2–1. |
| `next-round` | `{}` | Anfitrião, rodada encerrada e quatro prontos; mantém assentos/pontos. |
| `play`, `cut` | `{cardId, color?}` | Carta própria válida; cor exigida somente para Coringa/+4/+6 quando ainda há cartas. |
| `draw`, `pass`, `challenge` | `{}` | Validados pelo motor e pelo relógio do servidor. |
| `announce`, `report` | `{}` | Anúncio/denúncia reais de última carta. |

`rules` tem exatamente os campos `duo`, `single`, `goal`, `timeout`, `infinite`, `cut`, `challenge`, `wild6`, `dist`, `rotate`, reutilizando opções e valores do jogo local. Regras/perfis/equipes ficam bloqueados durante toda a partida. Não há transferência voluntária de anfitrião, espectadores, chat ou reações. Pausa e substituição por inatividade ficam para a Fase 3.

Respostas: `joined` informa o próprio `selfId`; `state` transmite a visão por destinatário; `ack` confirma a intenção; `error` informa rejeição; `closed` encerra a sala. Durante partida, `game` contém mãos filtradas, últimos descartes, ações válidas, eventos filtrados e prazos do servidor. Não inclui baralho, mãos adversárias, tokens, IDs de conexão ou marcador privado de desafio. `canStart` reflete quatro prontos e suporte dos clientes à Fase 2. `ready` também confirma resultados; após a partida, todos confirmam para retornar ao mesmo lobby.

Reenvio idêntico de uma intenção já processada recebe ACK sem reaplicar. São mantidas as últimas 128 intenções; comandos com versão antiga recebem `STALE_STATE` e snapshot atual. Reutilizar ID com conteúdo diferente é rejeitado. O cliente atualiza a tela e permite tentar novamente, sem reenviar automaticamente uma intenção ambígua.

## Persistência e conexões

- `RoomRegistry`: códigos e reservas únicos, hashes SHA-256 dos tokens, IDs internos, controle de duplicidade, limites e IDs de criação. Reserva usa transação síncrona SQLite, parâmetros vinculados e chave única; códigos preservam zeros à esquerda.
- `LobbyRoom`: snapshot canônico em SQLite, incluindo partida completa, permissões, bloqueios e deduplicação. O token original não é gravado no servidor. Classe e binding existentes foram mantidos, sem recriar namespaces.
- `acceptWebSocket` e `serializeAttachment` preservam identificação mínima de cada transporte; o construtor restaura SQL e reconcilia com `getWebSockets()` após retomada.
- Token com 256 bits de entropia salvo localmente por origem do servidor em `panelinha.multiplayer.identities.v1`; último código em `panelinha.multiplayer.room.v1`. Não são apagadas as chaves existentes de perfil, áudio ou jogo.
- Uma identidade tem uma única controladora, inclusive entre salas. A conexão substituída não consegue remover a nova vaga ao fechar. Reentrada após desconexão ocupa vaga disponível e começa Não pronto; não existe reserva no lobby.
- Não há polling/heartbeat da aplicação nem temporizador recorrente mantendo objetos ativos. Alarmes pontuais tratam reservas, autenticação e prazos de turno/corte/bots. Latência isolada não causa expulsão. Reconexão de transporte no cliente usa até quatro tentativas com espera limitada.
- No lobby, desconexão confirmada libera vaga. Na partida, o titular conserva assento/mão e pode retornar com sua identidade local; visitantes não entram. O bot substituto preserva nome/avatar. Se o anfitrião sair, o sucessor é sorteado criptograficamente entre humanos conectados, definitivamente. Sem humanos, bots não mantêm a sala viva.

## Limites e segurança

Corpo HTTP e mensagem WebSocket: até 4096 bytes UTF-8. Por IP: 10 novas identidades/minuto, 6 criações/minuto e 24 consultas/upgrades de sala/minuto. Cada entrada normalmente usa consulta e upgrade. Por conexão: 30 mensagens/10 segundos; até oito transportes por objeto, incluindo os ainda sem autenticação. Estes expiram após 15 segundos. A ocupação continua limitada a quatro participantes.

Campos desconhecidos, perfis/avatares/regras inválidos e comandos sem permissão são rejeitados no servidor. Códigos não autenticam participantes e não existem dados secretos em convites. Excluir dados locais permite criar outra identidade: **sem contas, o bloqueio por identidade não é antifraude absoluto**. Não envie tokens em relatórios, logs, URLs ou mensagens ao proprietário.

SQLite Durable Objects e os recursos utilizados são compatíveis com Workers Free, sujeitos às quotas oficiais. Não há garantia de operação gratuita ilimitada. HTTPS/WSS público e o funcionamento após repouso foram testados após a publicação. Hibernação efetiva não foi instrumentada; falhas de rede móvel e APK físico ainda exigem validação posterior.

Referências: [Hibernation/WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/), [SQLite](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/), [preços/quotas](https://developers.cloudflare.com/workers/platform/pricing/).
