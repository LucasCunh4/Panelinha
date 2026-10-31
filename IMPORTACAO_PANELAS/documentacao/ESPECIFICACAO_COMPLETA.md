# PANELAS — Especificação consolidada para Codex

**Data:** 30/10/2026  
**Natureza:** registro das decisões tomadas no ChatGPT, não um inventário de funcionalidades implementadas.  
**Projeto:** jogo de cartas casual com temática de panelas, inspirado na estrutura clássica de combinação de cor/número, para exatamente 4 jogadores online; modo de treino local com 1 humano + 3 bots.

## 0. Fonte de verdade e prioridades

- **Código-base efetivamente existente:** `index.html` e `assets/cartas/` na raiz deste pacote. É o protótipo local V3, com 3 bots e imagens PNG de 52 faces coloridas.
- **Regras aprovadas:** este documento. Se houver discrepância com o protótipo, identificar e corrigir a implementação cuidadosamente, mantendo jogabilidade. Mudanças de regras precisam de validação do usuário.
- **Direção visual:** painel temático de fogão roxo-escuro; ilustrações das cartas presentes são **artes temporárias**. As cartas atuais têm defeitos conhecidos: proporção fina demais, detalhes de folhas verdes em cores indevidas, recortes ampliados de uma prancha e não arte HD individual. **Não tratá-las como arte aprovada definitiva.**
- **Importante:** modo com *power-ups* foi citado como segundo modo futuro e **não está especificado**; não inventar regras para ele.
- Nunca substituir de surpresa o projeto jogável por uma tela bonita sem mecânica. Mudanças incrementais e testadas.

## 1. Modos e condições gerais

- Exatamente **4 jogadores**: individual (todos contra todos) ou duplas (2×2).
- Duplas posicionadas **em assentos opostos**, com turnos intercalados entre equipes. Os parceiros veem **todas as cartas um do outro** e podem conversar por outros aplicativos. Basta **um** jogador da equipe zerar a mão para a equipe vencer a rodada.
- Modo de testes **local separado** do online, humano embaixo + 3 bots. Permanecer disponível mesmo após o multiplayer.
- Suporte planejado a site responsivo (PC/celular, orientação retrato/paisagem) e aplicativo Android via aproveitamento do projeto web; o protótipo atual **não** é APK nem multiplayer.
- Entrar como **convidado**, escolhendo nome e avatar (sem cadastro obrigatório).

## 2. Composição EXATA do baralho

| Tipo | Quantidade | Observação |
|---|---:|---|
| Número 0–9 | 80 | **2 de cada número por cor**, inclusive dois zeros; 4 cores |
| +2 | 8 | 2 por cor |
| Bloqueio | 8 | 2 por cor |
| Inverter | 8 | 2 por cor |
| +4 | 4 | Incolor |
| +6 | 2 | Incolor |
| Coringa | 4 | Incolor |
| **Total obrigatório** | **114** | |
| Panela de Pressão | +2 | Incolor; host ativa individualmente |
| Liquidificador | +2 | Incolor; host ativa individualmente |
| **Com as duas opcionais** | **118** | |

Cores: **vermelho, azul, verde, amarelo**. Iniciar cada jogador com **7 cartas**. Cartas +4, +6, Coringa, Panela de Pressão e Liquidificador **não têm cor impressa**.

## 3. Jogada padrão, compra e liberdade de estratégia

- Jogar carta de **mesma cor** ou **mesmo número** da carta no descarte, ou carta especial legal; a cor ativa escolhida por incolores deve ser respeitada quando não há penalidade acumulada.
- Não há seleção múltipla. **Um toque na carta joga imediatamente.** Ao utilizar uma carta e possuir outra idêntica para corte, surge o comando sobre a carta correspondente; só então pode jogar a segunda separadamente.
- Compra normal: pode comprar **uma** carta e jogá-la se desejar; pode **guardar** a carta comprada mesmo que seja válida e encerrar o turno. Também pode comprar voluntariamente mesmo tendo uma jogada na mão.
- Compra infinita (opção do host): compra até obter uma carta jogável. Especial incolor comprada pode ser **guardada**, encerrando imediatamente a compra/turno sem jogar. Não obrigar uso de especiais que usuário decidiu segurar.
- Quando não há cartas no monte, embaralhar **todas as cartas do descarte, exceto a carta superior**, formando novo monte.
- Quando a primeira carta revelada é especial, o efeito deve ser aplicado. Se for +4/+6, sortear cor; se for Panela de Pressão/Liquidificador, aplicar aos quatro e sortear cor. Casos sem autor (desafio de +4 inicial, direção/turno do Bloqueio inicial) exigem definição técnica explícita e testes, sem punir um autor inexistente.
- Bloqueio **pula apenas o jogador seguinte** (no modo duplas pode entregar a vez ao parceiro do autor). Inverter só muda o sentido, sem turno extra.

## 4. +2/+4/+6 e acúmulo OBRIGATÓRIO

- Uma sequência de penalidade fica **pendente**: destinatário NÃO pode descartar carta comum nem ignorar a penalidade. Precisa usar +N de mesmo valor ou maior, Panela de Pressão se ativa, ou comprar **toda a penalidade** e perder o turno.
- É permitida resposta conforme valor **igual ou superior**: +2→+2/+4/+6; +4→+4/+6; +6→+6. **A cor NÃO importa** durante essa cadeia, nem de um +2.
- Penalidades **somam** (ex.: +2,+4,+6 = 12 cartas). Se ninguém responder, destinatário compra o acumulado integral e perde vez.
- +4 e +6 podem iniciar penalidade livremente, inclusive escolhendo a nova cor. Não é necessário escolher nova cor quando forem a última carta do vencedor.
- Quando alguém zera a mão jogando +2/+4/+6, os outros jogadores **ainda podem rebater e acumular** penalidades, pulando quem já terminou; resolve-se tudo antes da classificação. Não há desafio para a última carta com a qual a pessoa terminou a mão.
- **Não permitir bypass por cronômetro, bot ou compra comum.** Regra de tempo normal é comprar 1 carta e passar; se houver penalidade ativa, primeiro resolver a penalidade devida (a alternativa coerente para não permitir abuso é comprar o total e passar). Registrar essa exceção na implementação.

## 5. Desafio de +4 e +6 (configuração única do host)

- O host pode ativar/desativar o desafio para **ambos** +4 e +6 de uma vez.
- Só pode desafiar **o jogador que receberá a punição**; contesta **somente o último autor** da carta +4/+6 da sequência, não autores anteriores.
- Autor estava irregular se possuía, antes de jogar a carta contestada, **qualquer outra carta legalmente jogável** exceto outro +4 ou +6. Validar usando estado do momento da jogada e regras de empilhamento aplicáveis, sem revelar a mão indevidamente ao cliente adversário.
- Se desafio procedente: **último autor contestado compra TODO o acumulado**; se improcedente: desafiante compra **punição total +2**. Depois encerra-se a penalidade.
- Sem desafio contra a carta +4/+6 que foi jogada como **última carta do finalizador**.
- Casos complexos de corte e desafio concorrentes: ordem determinada pelo servidor, com testes.

## 6. Cortes de jogada e cartas idênticas

- **Uma única opção de host** ativa/desativa cortes fora do turno E o mecanismo de jogar duas idênticas em sequência. Quando desligada, nenhuma dessas jogadas especiais é permitida.
- Durante uma jogada comum (e também durante cadeia +N), qualquer jogador que possua **carta idêntica** à carta recém-colocada pode cortar na janela válida. Identidade = mesmo número e cor; ou mesmo tipo de especial e mesma cor quando colorida; ou mesmo tipo incolor. Basta **uma** carta para cortar, mesmo que a jogada anterior tenha envolvido duas idênticas em sequência.
- Após corte, o próximo turno segue **depois do jogador que cortou**, na direção vigente.
- Cortes simultâneos: **primeira ação que chegar ao servidor** vence.
- Quando alguém tem duas cartas idênticas e pretende jogar ambas, nunca selecionar duas e apertar botão 'jogar selecionadas'. Primeiro joga uma, depois aparece imediatamente o comando **CORTAR** sobre a carta idêntica para realizar a segunda jogada.
- Ao fazer duas jogadas idênticas dessa maneira, **efeito especial só é aplicado UMA vez**. Ex.: duas +2 vermelhas descartadas → punição +2, NÃO +4. A funcionalidade precisa distinguir uma jogada dupla do corte externo de outro jogador para não duplicar indevidamente efeitos.
- Janela de corte de exatamente 2,2 segundos a partir da aplicação da jogada, com expiração verificada pelo relógio do motor. O próximo turno aguarda essa janela; efeitos visuais não bloqueiam cortes nem acrescentam espera.
- Quando o jogador esvazia a mão, **não pode ocorrer corte posterior para impedir sua vitória**. Resolver apenas penalidades finais pertinentes.

## 7. Última carta / botão equivalente a UNO

- Quando o jogador estiver prestes a reduzir a mão a **uma carta**, pode anunciar preventivamente antes do descarte. Se não anunciou, pode apertar após jogar, **até o próximo jogador executar sua jogada**.
- Qualquer outro participante pode denunciá-lo na janela. Se denúncia chegar antes do anúncio, o infrator **compra +2 cartas**. Se anunciar antes, fica protegido. Primeira ação recebida pelo servidor vence.
- A janela fecha quando o próximo jogador **realiza a jogada**, não apenas no começo da animação. Tratar situações com cortes/penalidades sem criar burla.
- Não confundir ficar com uma carta com zerar a mão.

## 8. Panela de Pressão e Liquidificador

- **Panela de Pressão (incolor, 2 opcionais):** recolhe as mãos dos participantes ainda ativos, embaralha e redistribui **quantidades aleatórias**, com mínimo de uma carta por participante, conservando todas as cartas. O autor recebe entre uma carta e a quantidade que tinha imediatamente após jogar a Panela de Pressão; portanto não pode utilizá-la como última carta; quem já terminou fica excluído. Os demais não têm limite de igualdade ou equilíbrio.
- Se usada para defender-se de uma penalidade +N pendente: retirar N cartas do monte, incluir no pool de redistribuição, redistribuir aleatoriamente com o mesmo limite do autor e **encerrar completamente** a punição. Ex. +20: acrescentar 20 ao pool, não cobrar +20 de alguém depois.
- **Liquidificador (incolor, 2 opcionais):** gira as mãos entre os ainda ativos no sentido corrente; **não pode** ser usado contra penalidade acumulada.
- Nas jogadas normais, usuário de Panela de Pressão escolhe a nova cor. Liquidificador nunca abre seleção nem altera a cor ativa anterior. Panela de Pressão não pode ser jogada como última carta. Se sua **última carta** foi Liquidificador, não precisa selecionar cor; individual: efeito aplica-se entre os outros três antes de calcular classificação. Duplas: equipe vencedora encerra a rodada; não precisa aplicar efeito ao parceiro/outros para pontuação individual inexistente.
- Próximo turno após giro/distribuição normal: jogador seguinte a quem usou a carta, conforme sentido atual.

- A redistribuição nunca produz zeros nem novo finalizador. Um finalizador já existente durante a resolução de penalidades continua excluído; o encerramento/pontuação anteriores permanecem válidos.
- Caso limite sem outro destinatário ativo: uma Panela de Pressão não pode absorver penalidade mantendo o limite do autor; essa resposta inviável fica indisponível. O jogador pode rebater com outra carta válida ou comprar a penalidade. Sem penalidade, conservar a mão do único destinatário é a única partilha possível.

## 9. Rodadas e classificação

- A rodada encerra quando um jogador zerar a mão, **após** resolver punições finais, efeitos relevantes e denúncias aplicáveis.
- Pontuação **das cartas restantes na mão** usada para ordenar do 2º ao 4º: cada número 0–9=2; +2=4; Bloqueio=4; Inverter=4; +4=6; +6=8; Coringa=10; Panela de Pressão=10; Liquidificador=10.
- Menor soma residual = 2º, maior = 4º.
- Desempates residuais por: (1) menos **especiais de efeito** (+2,+4,+6,Coringa,Panela de Pressão,Liquidificador); (2) menos Bloqueio/Inverter; (3) menos cartas numéricas. Empates ainda perfeitos depois desses critérios precisam de regra estável a acordar; não inventar sorteio silencioso.
- Individual: 1º lugar recebe **3 pontos da partida**, 2º=2, 3º=1, 4º=0, por rodada. O host define meta 10/20/30/50. Rodada única também possível, com pódio completo ao fim.
- Duplas: equipe cujo jogador zera primeiro recebe **1 ponto**, oponente 0; meta definida 5/10/15, ou rodada única. Uma equipe pode ganhar mesmo que companheiro tenha cartas.
- Ao atingir a meta, vence quem tiver **mais pontos totais** se mais de um ultrapassar na mesma rodada; se empatar em pontos totais, vence quem tiver **mais rodadas vencidas**. Persistindo empate, critério final pendente.
- Tela pós-rodada: classificação, pontos conquistados na rodada, pontos acumulados; todos os jogadores precisam tocar **Continuar** para ir à próxima rodada.
- Tela fim de partida: **pódio animado + estatísticas** e celebração elaborada com panelas, tampas e ingredientes voando.

## 10. Lobby e sala ONLINE — ainda a desenvolver

- Tela inicial: **Jogar com Bots**, **Criar Sala**, **Entrar em Sala**, **Configurações** (SEM botão Regras).
- Entrada de convidado com nome e avatar; sala privada com código; exatamente 4 lugares; criação pública/matchmaking só mais tarde.
- Lobby mostra código, jogadores conectados, equipes, modo, regras ativas, Pronto e botão iniciar do host.
- Cada jogador escolhe equipe clicando nela; nas duplas, parceiros sentam em assentos opostos.
- Os quatro devem clicar **Pronto**, então **o host inicia**. Se host alterar qualquer regra, limpar o Pronto de todos.
- Host pode desconectar: sala permanece; ele pode recuperar o papel ao voltar. Outros desconectados: bot substitui temporariamente e entrega o controle ao reconectar. Se alguém sair definitivamente, bot assume até fim da partida.
- Bot conservador: evita gastar especiais, usa especiais para se defender ou se **não tiver carta comum válida**; respeita compra infinita, penalidade, cor, corte, desafio, troca de mãos. Atenção a visibilidade e mãos dos parceiros.
- No multiplayer **servidor autoritativo**, guardando baralho, mãos, regras, tempos e ordem de eventos; nunca confiar na jogada enviada pelo cliente. O adversário não deve receber mão secreta de outro jogador; no modo duplas, só o parceiro recebe a mão aberta autorizada.
- Sem chat ou emojis/reações no jogo por enquanto.
- Depois da partida, todos retornam ao lobby da **mesma sala** e podem alterar configurações para nova partida.

## 11. Configurações do host

- Disputa: individual / duplas.
- Vitória: rodada única / pontos; metas predefinidas individual 10,20,30,50 e duplas 5,10,15.
- Tempo por turno: **sem limite, 15, 30, 45, 60 segundos**. Ao esgotar em turno normal, comprar 1 carta e passar (se pendente +N, aplicar a punição completa; ver §4).
- Compra infinita ON/OFF.
- Corte + sequência de idênticas ON/OFF (uma mesma opção).
- Desafio +4/+6 ON/OFF (uma mesma opção).
- Panela de Pressão ON/OFF e Liquidificador ON/OFF **independentes**.
- Formação de duplas manual pelos participantes.

## 12. Aparência/UX aprovadas (objetivo futuro, não estado do V3)

- **Temática de panelas/cozinha**; mesa parece um **FOGÃO VISTO DE CIMA**, queimador central iluminado com compra e descarte, paleta roxo-escura com luzes vibrantes. A cena pode ser uma base estática ilustrada + efeitos 2D separados.
- Tela inicial clara, vibrante, personagens e cartas decorativas; experiência **colorida e descontraída**, party game.
- Avatares: **panelas sem rostos**, com acessórios engraçados (óculos, coroas, chapéus etc.); conjuntos ilustrados para escolher; mostrar nome+avatar, sem chat/reações.
- Orientação retrato e paisagem. Jogador local **embaixo**; parceiro em duplas **em cima**; adversários nas laterais; em individual restante dos 3 nas posições livres.
- Mão própria em **leque** quando pequena e adaptada para rolagem horizontal quando grande. Cartas alheias pequenas viradas para baixo com quantidade visível. Mão do parceiro, em duplas, **aberta em tamanho menor**.
- Toque direto na carta joga. No desktop, hover **eleva levemente** a carta. Corte deve aparecer **em cima da carta correspondente**, não em botão separado longe da mão. Pequena pausa real após cada descarte para corte; jogador da vez destacado por brilho/contorno no avatar.
- Mostrar SEMPRE carta central, direção do jogo, cor ativa, quem joga, quantidade de cartas e penalidade pendente. Mostrar penalidades grandes como **+12** no centro, com impacto visual e cartas voando; animação temática: panela derrama cartas sobre jogador punido.
- Coringa/+4/+6: escolha entre **quatro botões grandes tradicionais** de cor.
- Cartas: estilo cartoon colorido com **número/símbolo grande**, detalhes culinários sem atrapalhar legibilidade; especiais coloridas +2, Bloqueio (círculo com barra diagonal), Inverter (duas setas curvas opostas formando círculo). +4,+6,Coringa,Panela de Pressão,Liquidificador incolores ainda não têm arte definitiva.
- Cada cor terá panela com **mesmo desenho e proporções**, mas pigmentação acompanha cor: vermelho, azul, amarelo, verde.
- Elementos alimentares **EXCLUSIVOS POR COR**: vermelho tomates; azul mirtilos/blueberries; amarelo queijos; verde alfaces. **NÃO incluir folhas verdes genéricas nas cartas vermelha, azul ou amarela!** Fundo padrão, consistente; usuário achou cartas anteriores estreitas demais, quer **mais largas**. Imagens atuais do V3 são só para testar PNG no jogo, **não aprovadas como definitivas**.
- Verso futuro: roxo com panela estilizada ao centro, idêntico para todas as cartas.
- Animações expressivas nas cartas. Sons comuns de cartas; sons culinários em especiais/comemoração; música descontraída de fundo, configurável. Vitória exagerada, com panelas pulando, tampas, ingredientes e efeitos festivos.

## 13. Modo de laboratório com bots — preservar

- Separate da modalidade online, com **1 humano +3 bots** para testes; Individual e Duplas.
- Exibir mãos dos bots, forçar/adicionar cartas, simular penalidade +20 e alterar configurações durante a partida sem quebrar lógica.
- Cartas coloridas carregadas do diretório `assets/cartas` e incolores usam visual antigo. Permitir alternar temporariamente **Artes PNG** ligadas/desligadas, para comparar.
- Em qualquer caso de erro de PNG, fallback textual; **não deixar o usuário sem carta visível**.

## 14. Arquivos de arte efetivos deste pacote

`assets/cartas/<cor>/<face>.png` onde cor é `vermelho`,`azul`,`amarelo`,`verde`, e face `0`…`9`, `mais_2`, `bloqueio`, `inverter`.

- 52 imagens/arquivos: 13 faces × 4 cores, cada carta colorida aparece **duas vezes no baralho**, reutilizando a mesma imagem.
- Mapeamento do JS existente: num→0–9; `draw2`→`mais_2`; `skip`→`bloqueio`; `reverse`→`inverter`.
- Esse pacote **não** inclui a arte final de especiais incolores ou verso.
- São PNGs recortados/ampliados de prancha; podem conter artefatos, folhas verdes indevidas e proporção muito fina. Não gerar novas cartas do zero sem aprovação; implementar sistema para substituir os PNGs por imagens definitivas de mesmo nome quando chegarem.

## 15. Pendências honestas / prioridades

1. Imagens locais não apareceram quando usuário abriu `index.html` diretamente no Android (`file://`): **servir com HTTP** (ex.: `python3 -m http.server 8000` na pasta). Testar caminhos/erros, CSS, script e servidor; verificar em navegador Android real ou equivalente, não apenas assumir que funciona por duplo toque.
2. Arte futura: obter PNG individual por carta, na proporção mais larga e detalhes corretos; não fazer novos recortes de pranchas como se fossem assets finais.
3. Revisar possíveis bugs do V3, com testes automáticos em compras +N, cortes simultâneos, múltiplas cartas idênticas, bot conservador, Panela de Pressão aleatória com limite do autor e pontuação de final de rodada.
4. Definir com usuário critérios residuais de empate e casos extremos de abertura/primeira carta especial sem autor (antes de partida online).
5. Depois: UI fogão, menus/lobby e só então servidor online/Android, em etapas testáveis.
