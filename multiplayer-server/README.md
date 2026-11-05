# Panelinha — servidor e lobby da Fase 1

Cloudflare Worker com um registrador de códigos e um Durable Object SQLite por sala. A implementação atende ao lobby; **não executa partidas de cartas online**. O botão de início permanece desabilitado e o servidor rejeita essa ação.

Fonte funcional: [MULTIPLAYER_ESPECIFICACAO.md](../MULTIPLAYER_ESPECIFICACAO.md). Entrega, evidências e preparação da conta: [MULTIPLAYER_FASE_1_RESULTADOS.md](../MULTIPLAYER_FASE_1_RESULTADOS.md).

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

`check` executa **somente** `wrangler deploy --dry-run`: valida bindings, migração, bundle e assets sem publicar. `deploy:manual` fica reservado para autorização posterior.

Para servir a versão web e a API juntas:

```bash
cd multiplayer-server
npm run dev
```

O Wrangler local serve `../dist` e a API em `http://127.0.0.1:8787`. Em `IMPORTACAO_PANELAS/multiplayer-config.js`, configure temporariamente `serverUrl` e `inviteBaseUrl` com esse endereço e refaça `npm run build`. Não versione um endereço local como configuração de produção. Para testar o código-fonte diretamente, sirva `IMPORTACAO_PANELAS` em HTTP na porta 8000 e mantenha a API local em 8787.

Com os dois serviços acima ativos:

```bash
node testes/multiplayer_lobby.cjs
```

O teste precisa de Playwright e Chromium, como as suítes web existentes. Aceita `CHROMIUM_PATH`, `PANELAS_TEST_URL`, `PANELINHA_TEST_SERVER` e `PANELAS_SCREENSHOTS`. Abre dois processos Chromium, com quatro contextos simultâneos e identidades independentes, além dos contextos de teste de rejeição/erro. As comunicações passam pelo Worker e pelos Durable Objects reais do workerd local.

Para testar pela rede local em aparelhos separados, o desenvolvedor pode iniciar `wrangler dev --local --ip 0.0.0.0 --port 8787`, usar a origem LAN da máquina nos dois campos de configuração e habilitar temporariamente `allowInsecureDevelopment`. Essa exceção aceita apenas HTTP em IP privado com página também HTTP. Não resolve acesso entre redes diferentes e não substitui HTTPS/WSS de produção. Esses testes físicos ainda não foram executados nesta entrega.

## Configuração pública

`IMPORTACAO_PANELAS/multiplayer-config.js` contém apenas configuração pública:

- `serverUrl`: origem HTTPS do Worker, sem caminho, query, senha ou token;
- `inviteBaseUrl`: URL da **versão web** do jogo; o convite acrescenta somente `?sala=NNNNNN`;
- `allowInsecureDevelopment`: `false` por padrão, para exceção LAN local explícita.

Uma URL vazia desabilita claramente Criar/Entrar; Um jogador permanece offline. Depois de configurar, execute build e sync antes de uma futura compilação Android. A origem `https://localhost` do APK continua autorizada em `ALLOWED_ORIGINS`. O próprio domínio do Worker é aceito para a versão web; acrescente outras origens web explicitamente se forem usadas. CORS não substitui autenticação.

O Worker está preparado para hospedar os arquivos web e a API no mesmo endereço. `assets.run_worker_first` encaminha `/v1/*` e `/health` ao código do Worker; os demais arquivos vêm de `dist`. Não existe hospedagem publicada por esta tarefa.

## HTTP v1

Todas as respostas da API usam `Cache-Control: no-store`. Erros possuem `v`, `code`, `message` e `recoverable`. A criação não devolve estado privado de outro participante.

| Método e rota | Finalidade |
| --- | --- |
| `GET /health` | Saúde: fase 1 e `gameplay: false`. |
| `POST /v1/sessions`, corpo `{}` | Gera token privado criptográfico para esta origem/aparelho. |
| `POST /v1/rooms`, Bearer privado, corpo `{id, profile}` | Reserva código exclusivo; `id` torna a criação idempotente. |
| `GET /v1/rooms/:code` | Confirma existência pública; não autentica jogador. |
| `GET /v1/rooms/:code/ws`, Upgrade WebSocket | Abre transporte; autenticação vai na primeira mensagem, nunca na URL. |

`profile` é `{name, avatar}`: nome não vazio de até 32 caracteres, sem caracteres de controle, e um dos nove IDs de avatar já aprovados. Nomes repetidos são permitidos.

Entre a resposta HTTP de criação e a autenticação WebSocket do criador há uma **reserva técnica de até 15 segundos**. Ainda não é um lobby ocupado; só o criador pode ativá-la. Sem autenticação, a reserva expira e o código é liberado. Essa janela curta evita códigos abandonados e não reserva vaga após a desconexão de um participante.

## Protocolo WebSocket

Primeiro envio: `{v: 1, id, type: "auth", data: {token, profile}}`. Os demais envios acrescentam `version` com a versão mais recente recebida do servidor. `id` deve ser único por intenção, com 1–64 caracteres alfanuméricos, `_` ou `-`.

| `type` | `data` | Permissão / efeito |
| --- | --- | --- |
| `ready` | `{ready: boolean}` | Próprio participante; anúncio real de Pronto produz evento `player-ready`. |
| `profile` | `{name, avatar}` | Próprio perfil; conserva Pronto. |
| `team` | `{team: 1 ou 2}` | Própria equipe em Duplas; máximo dois humanos por equipe; mudança desmarca só o autor. |
| `rules` | `{rules}` | Anfitrião; mudança efetiva desmarca todos os humanos. |
| `add-bot` | `{}` | Anfitrião; preenche vaga. |
| `remove-bot` | `{playerId}` | Anfitrião; remove bot. |
| `kick` | `{playerId}` | Anfitrião; bloqueia identidade humana até encerrar a sala. |
| `leave` | `{}` | Libera vaga; se necessário sorteia sucessor conectado. |
| `close-room` | `{}` | Anfitrião; invalida código e avisa todos. |
| `start` | `{}` | Sempre rejeitado com `PHASE_UNAVAILABLE`. |

`rules` tem exatamente os campos `duo`, `single`, `goal`, `timeout`, `infinite`, `cut`, `challenge`, `wild6`, `dist`, `rotate`, reutilizando opções e valores do jogo local. Não há ações de cartas, transferência voluntária de anfitrião, espectadores, chat ou reações.

Respostas: `joined` informa o próprio `selfId`; `state` transmite a visão pública; `ack` confirma a intenção; `error` informa rejeição; `closed` encerra o lobby. Estados contêm versão, código, regras, anfitrião e quatro posições públicas (`id`, nome, avatar, bot, equipe, Pronto/conectado), sem baralho, mãos, tokens ou IDs de conexão. `canStart` permanece `false` mesmo com quatro prontos.

Reenvio idêntico de uma intenção já processada recebe ACK sem reaplicar. São mantidas as últimas 128 intenções; comandos com versão antiga recebem `STALE_STATE` e snapshot atual. Reutilizar ID com conteúdo diferente é rejeitado. O cliente atualiza a tela e permite tentar novamente, sem reenviar automaticamente uma intenção ambígua.

## Persistência e conexões

- `RoomRegistry`: códigos e reservas únicos, hashes SHA-256 dos tokens, IDs internos, controle de duplicidade, limites e IDs de criação. Reserva usa transação síncrona SQLite, parâmetros vinculados e chave única; códigos preservam zeros à esquerda.
- `LobbyRoom`: snapshot canônico em SQLite, incluindo permissões, bloqueios e deduplicação. O token original não é gravado no servidor.
- `acceptWebSocket` e `serializeAttachment` preservam identificação mínima de cada transporte; o construtor restaura SQL e reconcilia com `getWebSockets()` após retomada.
- Token com 256 bits de entropia salvo localmente por origem do servidor em `panelinha.multiplayer.identities.v1`; último código em `panelinha.multiplayer.room.v1`. Não são apagadas as chaves existentes de perfil, áudio ou jogo.
- Uma identidade tem uma única controladora, inclusive entre salas. A conexão substituída não consegue remover a nova vaga ao fechar. Reentrada após desconexão ocupa vaga disponível e começa Não pronto; não existe reserva no lobby.
- Não há polling/heartbeat da aplicação nem temporizador recorrente mantendo objetos ativos. Alarmes pontuais expiram reservas, conexões sem autenticação e limites. Latência e silêncio de cliente autenticado não causam expulsão. Reconexão de transporte no cliente usa até quatro tentativas com espera limitada.
- Ao fechar a conexão confirmadamente, libera-se a vaga. Se o anfitrião sair, o sucessor é sorteado criptograficamente entre humanos conectados, definitivamente. Sem humanos, bots não mantêm a sala viva.

## Limites e segurança

Corpo HTTP e mensagem WebSocket: até 4096 bytes UTF-8. Por IP: 10 novas identidades/minuto, 6 criações/minuto e 24 consultas/upgrades de sala/minuto. Cada entrada normalmente usa consulta e upgrade. Por conexão: 30 mensagens/10 segundos; até oito transportes por objeto, incluindo os ainda sem autenticação. Estes expiram após 15 segundos. A ocupação continua limitada a quatro participantes.

Campos desconhecidos, perfis/avatares/regras inválidos e comandos sem permissão são rejeitados no servidor. Códigos não autenticam participantes e não existem dados secretos em convites. Excluir dados locais permite criar outra identidade: **sem contas, o bloqueio por identidade não é antifraude absoluto**. Não envie tokens em relatórios, logs, URLs ou mensagens ao proprietário.

SQLite Durable Objects e os recursos utilizados são compatíveis com Workers Free, sujeitos às quotas oficiais. Não há garantia de operação gratuita ilimitada. Hibernação real na infraestrutura Cloudflare, WSS público, falhas de rede móvel e APK físico exigem validação posterior; os testes locais não substituem esses cenários.

Referências: [Hibernation/WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/), [SQLite](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/), [preços/quotas](https://developers.cloudflare.com/workers/platform/pricing/).
