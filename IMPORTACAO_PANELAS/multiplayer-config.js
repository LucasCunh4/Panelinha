/* Configuração pública do lobby da Fase 1, sem credenciais. Um jogador continua offline.
   Uma URL vazia desabilita a conexão; testes podem substituir estes valores antes deste script.
   Convites apontam à versão web, nunca a https://localhost do APK. */
window.PanelinhaServerConfig=Object.freeze(Object.assign({serverUrl:'https://panelinha-lobby.lucas260802.workers.dev',inviteBaseUrl:'https://panelinha-lobby.lucas260802.workers.dev/',allowInsecureDevelopment:false},window.PanelinhaServerConfig||{}));
