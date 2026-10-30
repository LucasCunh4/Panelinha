# Panelinha — desenvolvimento web e Android

- Use o checkout existente; não crie worktree sem pedido explícito. Leia também `IMPORTACAO_PANELAS/AGENTS.md` e a documentação do jogo ao trabalhar nessa pasta.
- A versão web é a origem: o Android usa Capacitor e cópias preparadas por `npm run build` / `npm run sync:android`. Não reescreva o jogo nativamente nem mantenha uma segunda lógica de regras.
- Identidade de atualização fixa: `com.lucascunha.panelinha.teste`, nome `Panelinha Teste`, origem do WebView `https://localhost`. Preserve o certificado público de `android-identity.json`. Não altere pacote, origem ou certificado numa atualização comum.
- A chave de testes já existe fora do Git. Consulte `ANDROID.md` e use os Secrets da chave ATIVA (geração 2). Se faltar assinatura, pare a distribuição e resolva o acesso; nunca gere uma chave substituta, use uma debug key descartável ou versione keystore/senhas. Não imprima seus valores.
- Nunca desinstale ou limpe dados como parte da atualização. O APK seguinte deve ter código maior. A partida atual do protótipo existe somente em memória: não prometa retomada de partida sem implementar esse recurso numa tarefa própria.
- Não reinicie a sequência nem renomeie/recrie o workflow `android-testes.yml` sem migrar versionCode acima de todos os APKs anteriores. As próximas versões saem pelo mesmo workflow com a mesma assinatura.
- Valide o APK real com `ferramentas/verificar_apk.py`; conserve as 52 imagens e o código web no pacote. Testes de Android ficam em `androidTest`, fora do APK distribuído. Distinga verificações estáticas, testes no navegador e execução real no Android.
- Preserve versão web, três bots e laboratório. Não implemente multiplayer nem mude regras/identidade visual sem pedido do usuário. Veja `ANDROID.md` para compilação e `testes/ANDROID_RESULTADOS.md` para evidências e limitações da primeira entrega.

- Exceção autorizada em 30/10/2026: a chave antiga inacessível foi substituída pela geração 2, registrada em `android-identity.json`. Nunca repetir a rotação automaticamente. APKs v0.1/v0.1.1 exigem reinstalação manual única; atualizações da geração 2 preservam a assinatura. Consulte `BACKUP_ASSINATURA.md`.
