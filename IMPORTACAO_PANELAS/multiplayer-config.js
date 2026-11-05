/* Público, sem credenciais. URL vazia mantém o multiplayer indisponível e o modo offline intacto.
   Após deploy autorizado: serverUrl='https://panelinha-lobby.<subdominio>.workers.dev'.
   inviteBaseUrl deve apontar à versão WEB do jogo, nunca a https://localhost do APK. */
window.PanelinhaServerConfig=Object.freeze(Object.assign({serverUrl:'',inviteBaseUrl:'',allowInsecureDevelopment:false},window.PanelinhaServerConfig||{}));
