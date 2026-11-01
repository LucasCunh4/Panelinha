# Landscape, identidade e destaques — 01/11/2026

Base: `android/apk-testes` após 0.2.22/c4202, commit `c0cb608`.

## Implementação

- **Android exclusivamente horizontal:** `sensorLandscape` na única Activity, aceitando os dois sentidos horizontais. Categoria `game` declarada: a documentação do Android 16/API 36 exclui jogos da regra que ignora orientação em telas grandes. Imersão permanente, recortes, teclado e Back existentes preservados. O verificador do APK exige orientação e categoria. Referência oficial: https://developer.android.com/about/versions/16/behavior-changes-16#adaptive-layouts.
- **Nome e avatar:** tela intermediária comum aos fluxos Um jogador e Multiplayer, com campo de nome, seis ícones SVG temporários locais, prévia, Continuar e Voltar. `perfil.js` grava somente `panelinha.player.v1`, não apaga outros dados e captura a identidade ao iniciar a partida. Nomes são escapados ao entrar em HTML. Nome/avatar aparecem no humano, placares, classificação e equipe; bots continuam independentes. Sem rede, conta ou multiplayer real.
- **Mesa limpa:** removido o texto de liberação da próxima jogada/cortes abertos e o lembrete permanente de corte. Mantidos faca, controles contextuais, registros e a janela de 2200 ms.
- **SUA VEZ!:** surge quando o turno humano fica disponível; entrada curta, seguida de redução visual. Próximo ao card humano, sem ocupar o descarte e sem reiniciar em cada render. Altura ajustada ao card para nomes longos. Em landscape baixo, o card humano usa duas linhas de nome e uma linha para avatar/contagem, sem sobrepor o adversário; nomes extensos podem ser truncados visualmente, com valor completo no perfil, resultados, título e identificação acessível. Os rótulos de Voltar levam corretamente à identificação.
- **Compra obrigatória:** brilho pulsante no contorno do monte somente no turno humano disponível, sem carta válida, sem compra já realizada, sem modal pendente e sem desafio disponível. Respostas legais à penalidade, inclusive Panela de Pressão, impedem o destaque. O efeito some no mesmo render em que a condição termina. Toque direto, contador, seis cartas do monte e compras individuais preservados.
- **+6 opcional:** ativada por padrão; `settings().wild6` é capturado em uma nova partida. `buildDeck` inclui duas +6 salvo `wild6 === false`, mantendo compatibilidade com opções antigas. Com Panela/Liquidificador: 118 cartas ativada, 116 desligada. Todas as novas rodadas usam a opção capturada; a reciclagem não cria cartas. Laboratório informa a opção e impede injetar +6 desligada. Desafios +4 continuam disponíveis; os de +6 mantêm o comportamento quando ativada.
- **Mão humana:** escala uniforme de 1 para 1,06 em 240 ms quando a vez é liberada; retorno ao tamanho original no fim. Espaço lateral reservado mantém a mão centralizada. O leque contínuo, compactação/expansão e rolagem exclusivamente interna continuam funcionando. A geometria real, incluindo a escala, alimenta a origem dos descartes e os destinos das compras. Corte fora da vez mantém a mão normal e a faca acessível.

Nenhum PNG aprovado foi alterado. Chamas, fogo amarelo, penalidades, indicador circular, pontuação, regras dos especiais e três bots preservados. Comparação direta com a base confirmou **18 funções centrais idênticas**, incluindo redistribuição, rotação, validação/aplicação de jogadas, turnos, corte, compras, desafios, bots e classificação; o criador de baralho recebe somente a opção +6 solicitada. Textos de nomes e apresentação foram adaptados.

## Testes locais aprovados

**14 suítes Chromium**, cinco testes de versionamento, `npm run build`, `npm run sync:android` e `git diff --check`. Logs/capturas em [evidencias-horizontal](evidencias-horizontal/).

- Nova `horizontal_identidade.cjs`: dois fluxos de identificação; seis avatares locais; prévia e nome tratado como texto; bots independentes; recarga/persistência e retorno; identificação acessível em seis tamanhos horizontais; 200 baralhos on/off e 20 rodadas sem +6; snapshot da opção e laboratório; desafios procedentes/improcedentes de +4 desligando +6 e de +6 ativada; 13 condições de compra obrigatória; pagamento por toque/conservação; 42 layouts com 7/15/20/30/40/60/100 cartas; escala 1,06/1, centralização, sem rolagem da mesa, sem repetir o aviso; nomes longos sem sobrepor o aviso; corte fora do turno e ausência de mensagens de espera; nome nos resultados, movimento reduzido e menu offline.
- Preservadas e aprovadas: `integracao.cjs`, `atualizacao_regras.cjs`, `escolher_cor.cjs`, `artes_penalidades.cjs`, `mesa.cjs`, `refinamentos_mesa.cjs`, `atualizacao_mesa.cjs`, `mesa_fina.cjs`, `mesa_atual.cjs`, `leque_continuo.cjs`, `navegacao.cjs`, `preparacao_menu.cjs`, `android-compat.cjs`.
- Os testes de entrada passaram a percorrer a identificação. O teste de Back inclui a nova hierarquia; o de movimento reduzido aguarda a entrega do evento do sistema. O teste de voo mantém origem real, trajetória e pouso, medindo o progresso em função da distância efetiva após a escala da mão. Nenhum caso de regras foi removido ou desativado.

A versão web mantém fallback funcional em retrato; o APK solicita somente landscape. Menus/configurações podem rolar quando necessário para preservar alvos acessíveis; a mesa permanece sem rolagem.

## Android e distribuição

Mantidos certificado da geração 2, applicationId `com.lucascunha.panelinha.teste`, origem `https://localhost`, quatro Secrets e workflow/versionamento existentes. Upload somente do `.apk` com `actions/upload-artifact@v7`, `archive: false`.

Atualizada a instrumentação para ambos os sentidos landscape, navegação via perfil e **11 testes nativos**. O novo caso confere a orientação declarada, identidade, +6 desligada, SUA VEZ e compra obrigatória. O teste de atualização mantém UID/localStorage/SharedPreferences e acrescenta a comparação do perfil, quando registrado pelo teste anterior. Compilação, assinatura e execução real do Android serão relatadas separadamente após o workflow.

### APK final verificado

- **0.2.25 / código 4502**, fonte `eb283a2148355323d3e08d9ef9c763d4252d651d`, [workflow #25](https://github.com/LucasCunh4/Panelinha/actions/runs/41344535934). Compilação release, compilação da instrumentação e candidato interno 4503 aprovados; assinatura da geração 2 conferida no CI.
- [Baixar diretamente Panelinha-Teste-v0.2.25-c4502.apk](https://github.com/LucasCunh4/Panelinha/actions/runs/41344535934/artifacts/13098608821). Exige sessão no GitHub; retenção até 30/01/2027. Arquivo APK direto, sem ZIP externo para extrair.
- O arquivo foi baixado e conferido independentemente com `apksigner`, `aapt` e `ferramentas/verificar_apk.py`: pacote permanente, origem `https://localhost`, assinatura v2, certificado SHA-256 `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`, release, min SDK 24/target 36, **`sensorLandscape` e categoria `game`** no manifesto real. O script novo de perfil e os demais arquivos web correspondem exatamente às fontes, incluindo somente a inclusão esperada do bundle de compatibilidade.
- Conferidos por hash 52 PNGs de cartas, seis da mesa, dois recursos de fonte/menu, 13 artes especiais anteriores e 22 de +4/+6. Nenhuma imagem aprovada alterada.
- SHA-256 do APK: `348f267328ab65b5a6a5b777746fe7375607b14c6c4d870cc728e2bff655fe57`, idêntico ao digest do artefato GitHub. `AndroidManifest.xml`/`classes.dex` presentes na raiz e nenhum outro `.apk` interno. [Metadados verificados](HORIZONTAL_IDENTIDADE_APK_0.2.25.json).

### Resultado real dos testes Android

**O workflow final ficou vermelho na etapa do emulador.** A instrumentação anunciou 11 testes e iniciou `a_imagesAndThreeBotsOffline`, mas **zero testes concluíram**. Em seguida, o dispositivo ficou `offline` no ADB e a porta TCP 5554 do emulador recusou conexão. Os logs coletados não apresentam resultado de asserção nem crash/ANR do aplicativo; não foi encontrado registro de OOM/segfault do host. A causa raiz da interrupção do ambiente não está comprovada.

Portanto, ficam pendentes a execução real dos 11 testes, incluindo orientação/imersão no dispositivo, os novos fluxos e a instalação de atualização com conferência de UID/localStorage/SharedPreferences/perfil. A orientação foi comprovada no manifesto do APK e os layouts nos testes web; isso não substitui uma execução Android concluída. Nenhum teste foi removido/desativado, e a Release continua bloqueada pela falha. O artefato assinado foi preservado pelo mecanismo existente.

[Diagnósticos completos do workflow final](https://github.com/LucasCunh4/Panelinha/actions/runs/41344535934/artifacts/13098677982); extratos originais em `evidencias-horizontal/android-*`.

Histórico desta atualização, sem reiniciar versões: #23 gerou 0.2.23/c4302 e teve desconexão durante o primeiro teste; #24 compilou 0.2.24/c4402, mas ficou esperando `sys.boot_completed` e foi cancelado explicitamente para liberar a revisão final com o card humano corrigido. Não havia iniciado a instrumentação. #25 mantém todos os testes e contém o layout final e os rótulos acessíveis corretos. Os dois resultados anteriores não foram tratados como aprovação do aplicativo.

### Atualização direta e dados

Comparação independente dos APKs reais **0.2.22/c4202 → 0.2.25/c4502** confirmou mesmo applicationId, mesmo certificado da geração 2, mesma origem e código estritamente maior. O novo APK é compatível com instalação por cima, sem desinstalação; também supera os códigos intermediários desta atualização. Nenhum armazenamento existente foi limpo ou migrado; o perfil acrescenta sua própria chave local. A comprovação real da retenção de dados por instalação no emulador permanece pendente, como descrito acima. A partida em andamento continua sendo apenas em memória, conforme o comportamento anterior.
