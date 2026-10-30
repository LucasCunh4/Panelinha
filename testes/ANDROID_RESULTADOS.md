# Android — resultados da entrega

> Registro histórico da assinatura aposentada (v0.1/v0.1.1). Estes resultados
> não comprovam a geração 2 e não devem ser interpretados como testes atuais.
> A recuperação de 30/10/2026 está em `ASSINATURA_V2_RESULTADOS.md`.

## APKs reais

- v0.1 / código 100: primeiro APK compilado, assinado, instalado e preservado na tag v0.1.
- **v0.1.1 / código 102: APK recomendado**, com compatibilidade para WebView antigo.
- Código 103 / `0.1.2-upgrade-check`: candidato somente para testar atualização, não distribuído.
- Capacitor 8.6.0, JDK 21, Gradle 8.14.3, AGP 8.13.0, compile/target SDK 36, min SDK 24. Checksums oficiais de JDK/SDK/Gradle conferidos; TLS e verificações mantidos.
- `apksigner verify`: assinatura v2 válida, certificado SHA-256 fixo de `android-identity.json`. Pacote `com.lucascunha.panelinha.teste`, nome `Panelinha Teste`, origem `https://localhost` e `fullSensor` conferidos no APK.
- Exatamente 52 PNGs dentro do APK com SHA-256 do manifesto. CSS e script da mesa intactos. O HTML empacotado só difere pela inclusão do script de compatibilidade antes do jogo; toda a lógica web permanece byte a byte. `git diff` de `IMPORTACAO_PANELAS/` é vazio.
- APK sem assinatura persistente e APK sem versão explícita: builds recusados em verificações próprias. Não há fallback para outra debug key.

## Executado no Android: aprovado

Android 11 (API 30), WebView **83.0.4103.120**, emulador sem KVM:

- **4/4 testes de instrumentação passaram** no APK recomendado: desconexão real do SO, decodificação das 52 imagens, quatro jogadores/três bots, toques Android em carta/Última Carta/corte/compra +20, ação automática de bot e retrato/paisagem sem overflow.
- O cenário de corte controla a pausa da fixture para acomodar o emulador lento e anuncia Última Carta antes de ficar com uma. Nenhum prazo ou regra do APK foi alterado. Os toques são MotionEvents Android, não substituições por chamadas de função do jogo.
- Instalação da família 100 → 102 sem desinstalar preservou UID, localStorage e SharedPreferences; **1/1 teste** de dados aprovado. A correção final 102 foi reinstalada na mesma família, conservando as sentinelas anteriores.
- Nova instalação **102 → 103 por `adb install -r`**, sem desinstalar nem limpar dados: mesmo UID e **1/1 teste** de localStorage/SharedPreferences aprovado.
- O roteiro completo `testar_android.sh` terminou com código 0; conferiu `OK (4 tests)` e `OK (1 test)` do runner, sem considerar apenas o status do comando `am instrument`.
- Evidências em `evidencias-android/`: saída do runner offline, duas verificações de atualização e rede sem conexão padrão ativa.

## Web e automação

- `node testes/integracao.cjs`: 16/16 cenários de regras e verificações de bot/laboratório/cronômetro/fallback aprovados no pacote web servido por HTTP.
- `node testes/mesa.cjs`: posições, toques, movimento reduzido e layouts de 320 a 1280 px aprovados.
- `node testes/android-compat.cjs`: ausência simulada de replaceAll e das APIs de consulta de animações; mesa completa, bot e Inverter/cancelamento aprovados.
- `python3 testes/versao_android.py`: 3/3 invariantes de versão aprovados, incluindo reexecução e sequência fora de ordem/reiniciada. O workflow consulta o maior código publicado nas Releases e não assume zero se a consulta falhar.
- YAML, scripts Python/JS/shell e whitespace conferidos. Actions fixadas em commits concretos. O workflow publica Release somente após os testes; guarda APK e logs também nos artifacts.
- O primeiro link de APK no GitHub foi baixado e seu SHA-256 comparado ao arquivo compilado. A correção 0.1.1 também tem JSON e SHA-256 na distribuição.

## Diagnóstico e limites

A imagem Android 35 sem aceleração não concluiu o primeiro boot no prazo; a validação real foi realizada na imagem API 30 mais leve. O primeiro roteiro detectou limitações reais do WebView 83: falta de replaceAll interrompia o render antes do bot, e faltavam APIs de consulta das animações. A v0.1.1 corrige isso por uma camada de APIs do contêiner (core-js e rastreamento das animações usadas pela mesa), sem editar regras, bots ou interface originais.

Uma fixture web existente dependia da direção aleatória da rodada; agora fixa direção horária antes de conferir o próximo jogador no teste de cronômetro. Apenas o teste foi alterado.

**Não houve teste em celular físico.** O protótipo não salva a partida em andamento; a retenção dos dados gravados não adiciona autosave.

**GitHub Actions e Secrets:** a API segue bloqueada pela rede do ambiente (CONNECT 403 em api.github.com). A adição apenas de api.github.com e uploads.github.com foi salva no rascunho, preservando presets, mas ainda não foi aplicada. A chave exclusiva está privada fora do Git; seu envio aos quatro Secrets e a criação de Releases pela API permanecem pendentes. O APK está entregue por download direto no GitHub. O workflow e os scripts foram preparados/testados localmente, mas uma execução bem-sucedida hospedada no GitHub não foi confirmada. Consulte ANDROID.md para a configuração segura e não descarte a chave antes de um backup durável.
