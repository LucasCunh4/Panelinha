# Refinamentos da mesa — rodada seguinte à 0.2.11

Base: `android/apk-testes`, commit `91e24df`. A implementação continua no jogo existente, sem uma segunda lógica de regras.

## Alterações

- Chamas: máscara radial suaviza/encurta as pontas; opacidade ativa de 0,66, saturação e brilho menores. Oscilação de escala/rotação e luminosidade contínuas, discretas e com períodos diferentes. Cor ativa e transição de cor preservadas; PNGs originais intactos. Movimento reduzido mantém a chama estática.
- Compra: monte vertical na borda esquerda, fora do queimador, com toque direto, contagem e indicação de penalidade preservados.
- Oponentes: cartas apoiadas diretamente na mesa, sem painel de fundo. Mão superior na borda de cima; laterais giradas em ±90°. Somente nome/avatar/contagem usam um rótulo pequeno, com destaque de turno. Até sete versos representam a mão oculta; o rótulo conserva a contagem real. Parceiro aberto em duplas; adversários ocultos em individual. Revelação explícita do laboratório preservada.
- Jogada: captura da geometria da carta antes de substituir o DOM da mão, seguida de cópia visual com voo de 560 ms até o descarte e assentamento de 150 ms. Funciona para humano e três bots, incluindo corte. Carta oculta começa pelo verso e revela apenas a carta jogada durante o percurso. O novo topo do descarte fica oculto até o pouso. A camada não intercepta toques nem posterga o motor. Movimento reduzido mostra o resultado imediatamente; rotação cancela somente o efeito e mantém o estado.
- Corte: balão oficial de faca ampliado de 44 para 58 px, com espaço na mão para não recortar o alvo. Carta inteira e balão continuam acionando o corte original.
- Rolagem de foco: corrigido um deslocamento interno da mesa ao tocar cartas. `overflow:clip` impede esse movimento; WebViews antigos que ignoram essa propriedade recebem restauração de rolagem somente no contêiner da mesa. As mãos e o menu mantêm sua rolagem própria. A regressão usa toque real e verifica também o fallback.

## Código e estrutura

Chamas e tamanho da faca foram ajustados por CSS. Nenhum PNG, arte de carta ou manifesto de imagem mudou. Os 52 arquivos de cartas e seis recursos da mesa conservam seus SHA-256.

O monte passou a ser filho direto da mesa no HTML para ficar independente do bloco central. Os oponentes ganharam um agrupamento pequeno para identidade, separado das mãos. A animação acrescenta uma camada visual e um gancho de leitura antes do render existente. Não há novo estado de partida nem espera acrescentada às jogadas.

Comparação com a base: a única função modificada no script principal é `render`, com a chamada de apresentação antes da reconstrução das mãos. As demais funções, inclusive regras, pontuação, compra, corte e bots, são idênticas byte a byte. A pausa de corte permanece em 2800 ms. Pacote Android, origem `https://localhost`, certificado de geração 2, Secrets e mecanismo de publicação permanecem os mesmos. O workflow conserva nome, arquivo e sequência; o ajuste de infraestrutura do emulador está descrito abaixo.

## Web: executado e aprovado

- `node testes/integracao.cjs`: 16/16 regressões, incluindo penalidades acumuladas, Distribuidora, Giro, corte, pontuação, bots, laboratório e 52 imagens.
- `node testes/mesa.cjs`: 320×568, 360×640, 390×844, 412×915, 568×320, 667×375, 844×390, 915×412, 1280×800 e 1920×1080. Sem rolagem da mesa; registro fundo/chama, compra, menu, cores, corte, privacidade e mãos grandes aprovados.
- `node testes/refinamentos_mesa.cjs`: monte à esquerda/vertical, mãos físicas e orientação, máscara/intensidade/animação da chama, origem real do toque humano, voo dos três bots, versos e privacidade, pouso no descarte, rotação durante o voo, rolagem de foco e movimento reduzido. Motor avança sem esperar o efeito; pausa de corte preservada. Nenhuma exceção JS.
- `npm run build`: pacote web e hashes aprovados.
- `node testes/android-compat.cjs`: bundle de distribuição com APIs antigas simuladas, imagens e bot aprovados.
- `python3 testes/versao_android.py`: 5/5 verificações de sequência de versão.
- Sintaxe JS/shell e `git diff --check` aprovados.

Capturas Chromium (cenários de teste determinísticos):

- [Retrato 390×844](../evidencias-refinamentos/390x844-duplas.png)
- [Paisagem 568×320](../evidencias-refinamentos/568x320-duplas.png)
- [Corte em 320×568](../evidencias-refinamentos/320x568-corte.png)
- [Carta humana a caminho do descarte](../evidencias-refinamentos/voo-humano-meio.png)
- [Carta de bot a caminho do descarte](../evidencias-refinamentos/voo-bot-1-meio.png)

## Android

A compilação assinada foi aprovada e o APK real foi verificado. **A suíte de execução Android desta rodada não concluiu: o emulador deixou de responder nas três execuções abaixo.** Não há aprovação dos testes offline, de rotação, de toques ou de atualização desta rodada no Android. As evidências visuais acima são do Chromium.

A instrumentação conserva os quatro testes offline e as duas verificações de persistência (reinício e atualização), acrescentando verificação da origem da animação, toque no próprio balão, posição vertical/esquerda do monte e ausência de rolagem interna da mesa.

Somente no emulador descartável do CI, a escala global de animadores é restaurada para 1 para testar o movimento normal do WebView; transições de janelas continuam desativadas. As correções anteriores de infraestrutura, diagnósticos e agregação de falhas continuam presentes. Nenhum teste foi removido.

### Execução #12 — interrupção do emulador

[Workflow #12](https://github.com/LucasCunh4/Panelinha/actions/runs/41163139348), fonte `78a1304`, compilou e assinou 0.2.12/c3202, mas o emulador perdeu a conexão durante `a_imagesAndThreeBotsOffline`. O ADB ficou `offline` e depois a porta 5554 recusou conexão. Não houve resultado de asserção, conclusão da suíte nem captura Android; a Release foi corretamente bloqueada.

Os diagnósticos não mostram OOM do host (14 GiB disponíveis) nem exceção fatal do aplicativo antes da interrupção. O kernel registra aviso de KVM e mensagens sobre CPU, mas os dados coletados não provam a causa do encerramento. Não é evidência de aprovação do aplicativo nem foi atribuída às regras. Artefatos/diagnósticos foram preservados pelo workflow. A execução seguinte testa também a correção de rolagem de foco encontrada na web, sem desativar verificações.

### Execução #13 — APK 0.2.13/c3302 verificado; emulador interrompido

[Workflow #13](https://github.com/LucasCunh4/Panelinha/actions/runs/41163413018), fonte `d29bbd46a68195850c32fdb04506104dc9a6f04d`, inclui a correção de foco. A compilação e assinatura passaram. O APK foi baixado do [artefato](https://github.com/LucasCunh4/Panelinha/actions/runs/41163413018/artifacts/13028123544) e conferido localmente com `ferramentas/verificar_apk.py`/`apksigner`.

- Certificado SHA-256: `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`, exatamente a geração 2 de `android-identity.json`.
- SHA-256 do APK: `f67674a8030b6399c92a4cc482c5ece2ac2dfdba308174a5e01fe9014c502716`.
- Pacote permanente, release, versão/código, SDKs, origem local HTTPS, código web e 52+6 imagens aprovados.
- O emulador voltou a ficar offline no primeiro teste, sem resultado de asserção; porta de controle recusou conexão. Sem exceção fatal do app nos logs e com 14 GiB livres no host. A Release permaneceu bloqueada; testes Android ainda não concluídos nessa execução.

### Investigação de infraestrutura

O emulador 37.2.13 estava usando `swiftshader_indirect`, modo descontinuado desde 36.4.9 segundo a [documentação oficial de aceleração](https://developer.android.com/studio/run/emulator-acceleration#command-gpu), consultada nesta rodada. A execução #14 usa `-gpu software`, recomendado para ambientes sem GPU, mantendo API 35, KVM, todas as verificações e animações do WebView. Isso testa uma hipótese de incompatibilidade do renderizador; não prova a causa das falhas anteriores. A coleta em falha também passou a guardar kernel completo, CPU e relatórios de crash do emulador, quando existirem.

### Execução #14 — entrega 0.2.14/c3402 em artefato

- [Workflow #14](https://github.com/LucasCunh4/Panelinha/actions/runs/41164082119), fonte `44974dd74233ed1700e425a42fb6ff766c898d18`. Compilação e assinatura aprovadas. Mesmo código de apresentação da #13; alterações seguintes somente na infraestrutura/documentação.
- [Baixar ZIP com APK e metadados](https://github.com/LucasCunh4/Panelinha/actions/runs/41164082119/artifacts/13028780227). Requer login no GitHub e fica retido até 29/01/2027. Dentro está `Panelinha-Teste-v0.2.14-c3402.apk`, o APK distribuível; o candidato 3403 é somente de teste.
- SHA-256 do APK: `678c4efd9f32056ad4f7b0328185fbe60e40067cdccdd6992394c71876adc675`.
- APK baixado do artefato, ZIP conferido pelo digest da API, APK validado localmente com `apksigner` e `ferramentas/verificar_apk.py`: assinatura v2, certificado de geração 2, pacote, origem, versão 0.2.14/c3402, SDKs 24/36, release/fullSensor, código web exato, compatibilidade e 52+6 imagens originais aprovados. [Metadados da verificação](REFINAMENTOS_APK_0.2.14.json).
- Certificado SHA-256: `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`, igual ao registro ativo e ao APK real 0.2.11/c3102. Mesmo applicationId `com.lucascunha.panelinha.teste`, origem `https://localhost`, código 3402 maior que 3102 e 2003: identidade compatível com atualização direta da geração 2, sem desinstalação. **Não confundir isso com teste de instalação/atualização concluído no Android nesta rodada.**
- O backend escolhido pelo modo software foi lavapipe/swangle, mas a perda do emulador se repetiu no primeiro teste, sem asserção concluída. A mudança não resolveu a interrupção. Não foram produzidas novas capturas Android; verificações de persistência não concluíram. A Release permaneceu bloqueada, conforme as regras existentes do workflow.
- [Diagnósticos Android #14](https://github.com/LucasCunh4/Panelinha/actions/runs/41164082119/artifacts/13028345796): kernel completo, CPU AMD EPYC/Hyper-V/KVM, logcat, ADB offline e logs netsim. Nenhum minidump foi encontrado; os logs não mostram exceção fatal do aplicativo nem OOM do host. A causa do encerramento do emulador continua indeterminada. Não houve remoção de testes, supressão de asserções ou alteração das regras para liberar a compilação.

Próxima validação pendente: executar a suíte completa em Android estável (emulador ou aparelho dedicado), incluindo instalação por cima e persistência. O APK assinado está disponível para teste, com a limitação de execução acima explicitada.

## Limitações

Não há teste em celular físico nesta rodada. As capturas estáticas não demonstram a fluidez; o percurso e a duração são verificados por testes automatizados, com capturas intermediárias. Preferência por movimento reduzido intencionalmente evita o voo. A partida em curso continua em memória, como no protótipo anterior; a atualização preserva a identidade e os dados persistidos, sem prometer retomada da partida.
