# Recuperação da assinatura — 30/10/2026

## Código preservado

- Base Android: `eb55a2fa05f126fdf0cba124f7a43529380d7083` (`android/apk-testes`).
- `interface/mesa-v1` e `integracao/panelas-importacao` já são ancestrais dessa base.
- `main` em `3bbf70c108c149a864abff25677274c560f51c7e` foi integrada sem conflitos:
  preservado o ZIP adicional `Panelinha_Mesa_V1_Assets_e_Instrucoes.zip`.
- `git diff origin/android/apk-testes -- IMPORTACAO_PANELAS` vazio: nenhuma regra,
  interface, bot ou imagem foi editada.

## Assinatura e APKs efetivamente verificados

- Nova chave exclusiva RSA 3072, certificado SHA-256 ativo em `android-identity.json`.
  Certificado aposentado mantido no histórico; substituição autorizada pelo usuário.
- Diretório privado fora do Git, modo 0700; quatro arquivos modo 0600.
- PKCS#12 relido internamente; certificado, chave pública e credenciais consistentes.
- v0.2.0/c2000 e candidato `0.2.0-upgrade-check`/c2001 compilados com JDK 21,
  Gradle 8.14.3, Capacitor 8.6.0 e SDK 36. Checksums oficiais dos downloads conferidos.
- Ambos passaram em `verificar_apk.py`: assinatura v2 válida, mesmo certificado,
  applicationId `com.lucascunha.panelinha.teste`, origem `https://localhost`, API
  mínima 24/target 36, release, fullSensor, 52 PNGs com os hashes esperados e código
  web original intacto, salvo a inclusão já existente da camada de compatibilidade.
- APK histórico v0.1.1/c102 recusado pelo verificador atual por certificado aposentado.
- Ambos os APKs inspecionados: sem cópia da chave privada ou das senhas.

## Web e versões: executado e aprovado

- `node testes/integracao.cjs`: 16/16 cenários de regras e demais verificações de
  52 PNGs por HTTP/decodificação, 1 humano + 3 bots, bot automático, laboratório,
  cronômetro e fallback textual. Chromium móvel, servidor HTTP real.
- `node testes/mesa.cjs`: posições/toques/layouts 320 a 1280 px, sem overflow,
  preferências de movimento reduzido e sem exceções JavaScript.
- `node testes/android-compat.cjs`: mesa, bot e Inverter com APIs antigas simuladas.
- `python3 testes/versao_android.py`: 4/4 testes de versão, incluindo piso 2001,
  reexecução e histórico da assinatura anterior com código maior.
- Sintaxe Python/shell e `git diff --check` aprovados.

## Backup e automação

- `backup_assinatura.py` testado com senha temporária interna: cifragem GPG/AES256
  e restauração byte a byte aprovadas; cópia de teste removida, sem exibir segredos.
- Caminho de chave pública também testado com destinatário GPG temporário:
  ZIP cifrado e quatro arquivos restaurados idênticos; fixture removida.
- Backup definitivo criado fora do Git e cifrado para a chave pública OpenKeychain
  fornecida pelo usuário. Subchave destinatária conferida internamente; nenhum
  segredo ou arquivo decifrado foi publicado.
- Isso ainda **não comprova backup externo recuperável**: aguardando confirmação
  de download e decifragem no celular. A chave privada OpenKeychain permanece
  somente com o usuário. Procedimento em `BACKUP_ASSINATURA.md`.
- Configuração dos quatro GitHub Secrets tentada. A consulta prévia respondeu
  `Forbidden` em `api.github.com`; nenhum valor foi enviado. Presença e permissões
  de escrita permanecem sem confirmação. Script pronto para enviar a mesma chave
  quando a API estiver liberada e autorizada.
- Rascunho de rede salvo com `api.github.com` e `uploads.github.com`, sem publicação.
  Não descartar/republicar a máquina antes de verificar o backup externo.

## Android instalado

**Aprovado** em Android 11/API 30, emulador sem KVM:

- `OfflineGameTest`: **4/4** testes, `OK (4 tests)` conferido pelo roteiro.
  Rede nativa desconectada, 52 imagens decodificadas, 1 humano/3 bots, bot agindo,
  toques reais em carta/Última Carta/corte/compra +20, retrato/paisagem e sentinelas.
- `UpdatePersistenceTest`: **1/1**, `OK (1 test)` conferido pelo roteiro.
  Instalação c2000 → c2001 usando `adb install -r`, sem desinstalar/limpar dados;
  UID idêntico e sentinelas de localStorage/SharedPreferences preservadas.
- `testar_android.sh` terminou com código 0. Evidências atuais em
  `evidencias-android-v2/`, separadas das evidências históricas da geração 1.
- O primeiro boot e o instalador foram muito lentos e houve ANR da interface do
  próprio sistema antes de abrir o jogo. No emulador isolado foram desativados
  aplicativos de exemplo/serviços Google e backup em nuvem; consulta online de
  verificação de instalações ADB desligada. Verificação criptográfica mantida.
  O diálogo do System UI foi fechado; nenhum dado do jogo foi limpo.
- O roteiro agora aguarda a desconexão assíncrona de rede e usa instalação sem
  streaming. Nenhuma asserção foi removida, nenhum teste foi ignorado e os APKs
  testados permaneceram os mesmos. O candidato c2001 é apenas para teste.

**Não houve teste em celular físico**, alteração da instalação antiga do usuário
ou teste de migração de dados entre assinaturas diferentes. A troca de certificado
exige reinstalação manual única. A partida em memória não ganhou salvamento.
