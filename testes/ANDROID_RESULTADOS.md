# Android — resultados da entrega v0.1

## Concluído

- Capacitor 8.6.0, JDK 21, Gradle 8.14.3, AGP 8.13.0, compile/target SDK 36. Gradle baixado com SHA-256 oficial fixado; JDK e ferramentas SDK conferidos contra checksums oficiais. TLS e verificação de integridade mantidos.
- APK **release real** v0.1/versionCode 100 compilado e assinado com chave exclusiva de testes fora do Git. Uma segunda compilação v0.1.1-upgrade-check/101 também foi gerada e assinada com o mesmo certificado.
- `apksigner verify`: assinatura v2 válida nos dois APKs. Certificado SHA-256 fixo em `android-identity.json`. Identificador `com.lucascunha.panelinha.teste`, nome `Panelinha Teste`, origem local `https://localhost`, API mínima 24, target 36 e orientação `fullSensor` verificados no APK.
- Inspeção do ZIP interno: exatamente **52 PNGs** com SHA-256 igual ao manifesto. `index.html`, `mesa.css` e `mesa.js` do APK são cópias byte a byte da origem web. Nenhum servidor remoto configurado.
- Recusa de build sem assinatura persistente testada: falha explícita, sem chave de debug substituta.
- Regressões no `dist/` servido por HTTP: **16/16 cenários de regras aprovados**, 52 imagens decodificadas e verificações de bot, laboratório, cronômetro e fallback aprovadas. Testes da mesa em 320–1280 px aprovados, incluindo toques simulados, Inverter, rolagem e orientações.
- O teste de cronômetro existente tinha uma fixture dependente da direção aleatória da rodada. A fixture passou a fixar direção horária antes de conferir o próximo jogador. Não houve mudança no jogo: `git diff` da pasta `IMPORTACAO_PANELAS/` é vazio.
- Workflow YAML analisado; Actions fixadas em commits concretos. Scripts Python/JS e shell conferidos. Os testes de instrumentação Android foram compilados em APK separado.

## Em validação / limitações

O emulador Android 35 foi iniciado sem KVM, disponível apenas por emulação de software. Não concluiu o primeiro boot no prazo tentado; a tentativa de instalação antes de o sistema estar pronto falhou em um serviço interno de armazenamento/pacotes. Isso não foi uma falha de assinatura ou de compilação do APK. Uma imagem Android 30 mais leve foi preparada para uma segunda tentativa. Resultados de execução e instalação serão registrados após essa tentativa; não devem ser presumidos aprovados apenas pela compilação.

A API do GitHub estava bloqueada pela política de rede (CONNECT HTTP 403 para `api.github.com`). O rascunho do ambiente recebeu apenas `api.github.com` e `uploads.github.com`, preservando os presets. Até a aplicação dessa configuração e confirmação das permissões da conta, o envio dos quatro Secrets e a criação de uma Release permanecem pendentes. O primeiro APK é entregue diretamente em `distribuicao/` para download pelo GitHub, sem material privado. O workflow foi configurado, mas sua execução bem-sucedida no GitHub ainda não foi confirmada.

Não houve teste em celular físico. O protótipo não salva partidas em andamento; preservar dados gravados na atualização não adiciona esse recurso.
