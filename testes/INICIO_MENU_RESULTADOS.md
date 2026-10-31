# Tela inicial Panelinha e refinamentos da mesa

Base: 0.2.19/c3902, assinatura permanente geração 2.

## Implementação

- Tela inicial própria, com somente **Um jogador** e **Multiplayer**. Cozinha decorativa vetorial em roxo/violeta, cobre/dourado e iluminação quente, reutilizando as formas de panela do jogo, sem tabuleiro, jogadores, mãos ou pilhas no menu.
- Título PANELINHA em **Lilita One**, escolhida pela aparência encorpada e arredondada próxima dos números ilustrados nos PNGs. Não se afirma ser a fonte original das artes. Arquivo oficial e licença SIL OFL 1.1 incluídos offline; hashes em `MANIFESTO_MENU_V1.json`. As 52 artes de cartas e os seis PNGs oficiais da mesa não mudaram.
- Entrada curta do título/botões, vapor e utensílios discretos, resposta ao toque e movimento reduzido. Sem partículas ou dependências externas.
- Um jogador reutiliza **o mesmo `#menu` e seus campos**. Mantém as escolhas ao navegar; início de partida continua sendo o motor existente, com um humano e três bots, Individual/Duplas e todas as opções.
- Multiplayer tem seleção Criar/Entrar e duas telas futuras separadas. Avisos claros; campo de código vazio/desabilitado. Não cria salas, códigos, backend, autenticação, sockets ou conexão fictícia.
- `navegacao.js` separa rotas/apresentação dos hooks mínimos de iniciar/sair. Histórico por fragmento na mesma origem. Voltar fecha escolha de cor/opções antes da confirmação de saída; cancelar mantém a partida. Ao encerrar, retorna às configurações. Avançar não ressuscita uma partida encerrada.
- Android usa `OnBackPressedDispatcher` na mesma hierarquia, dá prioridade ao teclado e pede confirmação no início antes de colocar o app em segundo plano. Não termina a Activity inesperadamente. Imersão e reservas de teclado/recortes continuam no host existente.
- Transição de até 240 ms apenas visual/opacidade: não desloca geometria, bloqueia controles, posterga o motor ou altera deadline. Cópia temporária da configuração é inerte, sem IDs duplicados e removida no fim da animação.
- Card superior com largura/altura naturais, espaçamento, quebra de palavras e adaptação de nomes longos. Continua **ao lado** do leque elevado.
- Brilho agora em **círculo de raio 206**, centrado em (836,451) no plano nativo do fogão. Cabeça branca mais luminosa, cauda de três intensidades até 220/1000 do percurso. Desenhado acima das chamas e atrás das cartas, sem cobrir o descarte. Todas as camadas usam `direction` do motor; Inverter espelha a fase e troca as caudas suavemente. Não reintroduz texto de direção.

## Preservação e testes aprovados

Treze funções centrais foram comparadas com a 0.2.19 e estão idênticas: criação do baralho, avanço de turno, Panela de Pressão, Liquidificador, início de turno, validações, jogada, penalidade, desafio, bot e finalização. Os únicos hooks novos no fluxo do motor são de apresentação/navegação. Pontuação, corte 2200 ms, cronômetro, bots, leque e animações permanecem.

- `preparacao_menu.cjs`: 18 layouts adicionais de Multiplayer/Criar/Entrar nos mesmos seis tamanhos, sem sobreposição, rolagem ou bloqueio dos botões de retorno.
- `navegacao.cjs`: seis viewports (320×568, 390×844, 412×915, 568×320, 844×390, 1280×800), fonte local carregada, só dois botões, alvos de toque, telas futuras sem rede, configuração reutilizada/valores preservados, três bots, deadline inalterado durante transição, nomes curtos/longos/palavra contínua e 118 cartas, círculo/registro no queimador, Inverter sem salto de fase, Voltar/Avançar, confirmações/cancelamento, movimento reduzido e ausência de erros JS/sockets/requisições externas.
- `integracao.cjs`: 16/16 regras e PNGs/carregamento, modos, bots, laboratório e fallback.
- `atualizacao_regras.cjs`: 40 cenários (Panela com reduções, equilíbrio, mínimos, última carta e penalidades; Liquidificador/corte), sem alteração das regras.
- `mesa.cjs`: dez tamanhos, interação, corte, opções, laboratório, fim de rodada e apresentação sem mutação.
- `leque_continuo.cjs`: 30 layouts e mãos 15/20/30/40/60/100, expansão por toque/mouse, compras fechadas/abertas, conservação, corte e movimento da cauda.
- `atualizacao_mesa.cjs`: 36 layouts, compras +20/+40/+80/+100, chamas, descarte/reciclagem, Bloqueio, corte durante voo, cronômetro, orientação e movimento reduzido. O cenário de dois voos pausa a primeira animação para verificar o corte antes do pouso independentemente da carga do host; o relógio do motor não é alterado por essa pausa visual.
- `refinamentos_mesa.cjs`, `mesa_fina.cjs`, `mesa_atual.cjs`: voos de humano/bots, privacidade, fonte de direção, fase de inversão, chamas/amarelo, contagem/monte, dimensões e cronômetro preservados.
- `android-compat.cjs`: pacote gerado sob simulação de APIs ausentes de WebView antigo.
- `npm run build`, cinco testes de `versao_android.py`, sintaxe JS/Python e `git diff --check`.

As suítes existentes agora percorrem Um jogador antes de interagir com a configuração. A instrumentação preserva os sete testes anteriores, acrescenta o oitavo (`h_homeNavigationAndSystemBack`) e mantém o teste de atualização/persistência. O oitavo testa Back do sistema e gesto real pela borda com navegação gestual habilitada apenas no dispositivo exclusivo de instrumentação. Nenhum teste foi removido/desativado.

## Evidências visuais

- [Início em retrato](../evidencias-inicio/inicio-retrato.jpg)
- [Início em paisagem](../evidencias-inicio/inicio-paisagem.jpg)
- [Mesa e indicador circular](../evidencias-inicio/mesa-circular.jpg)

## Android e APK

- **APK 0.2.20 / versionCode 4002**, gerado pelo [workflow #20](https://github.com/LucasCunh4/Panelinha/actions/runs/41254097830), código-fonte `578d33b295b776331261d70df393b9b44780b757`.
- [Download direto do APK, sem ZIP](https://github.com/LucasCunh4/Panelinha/actions/runs/41254097830/artifacts/13062023253). Requer sessão no GitHub; disponível até 29/01/2027.
- Compilação release, instrumentação dos oito testes e candidato de atualização c4003: aprovadas. O candidato é apenas interno ao teste e não foi distribuído.
- APK baixado e novamente aprovado por `ferramentas/verificar_apk.py`: assinatura v2, pacote `com.lucascunha.panelinha.teste`, origem `https://localhost`, 52 PNGs de cartas, seis PNGs da mesa e os dois recursos da fonte íntegros; HTML e quatro arquivos JS/CSS atuais no pacote, além do bundle de compatibilidade.
- Certificado SHA-256 geração 2: `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`, idêntico à 0.2.19/c3902. O código sobe para 4002: atualização direta compatível, sem desinstalar. Nenhuma alteração de Secrets, chave, pacote ou origem.
- SHA-256 do APK: `01c9133be6d82aef5c4906df6eaeb1d2fef19fdd820b8b15259753de336228d7`, igual ao digest do artefato. Conteúdo já é o próprio APK (manifesto/classes na raiz, sem ZIP externo).
- Metadados públicos verificados: `testes/INICIO_MENU_APK_0.2.20.json`.

**Execução Android não aprovada:** o primeiro dos oito testes iniciou (`a_imagesAndThreeBotsOffline`), mas nenhum terminou. O emulador ficou `offline`; o ADB falhou e a porta 5554 recusou conexão. A coleta disponível não registra asserção reprovada do aplicativo nem `FATAL EXCEPTION` do app. A causa raiz da perda do emulador não foi confirmada; não se atribui automaticamente à aplicação nem se declara Android aprovado.

[Diagnósticos Android separados](https://github.com/LucasCunh4/Panelinha/actions/runs/41254097830/artifacts/13061694138). Permanecem pendentes em dispositivo/emulador estável os oito testes completos, incluindo Back/gesto nativo, imersão/recortes/orientações, execução offline real e atualização por cima com preservação de UID/localStorage/SharedPreferences. A compatibilidade de atualização foi verificada por identidade e código; a instalação prática não terminou.

O workflow preservou todas as verificações e bloqueou a Release após a falha, disponibilizando o APK validado como artefato direto (`actions/upload-artifact@v7`, `archive: false`, somente o `.apk`). Metadados e diagnósticos permanecem separados. Nenhum teste foi removido ou desativado para forçar sucesso.

O jogo continua offline e o histórico não altera a origem `https://localhost` nem as chaves de dados. A partida permanece em memória, como antes; não foi criado nem removido um sistema de salvamento de partida.
