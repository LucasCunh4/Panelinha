# Atualização de regras, mesa e Android após 0.2.14

Base: `android/apk-testes`, `32d53de`. A versão web existente continua sendo a fonte única do APK. Não há multiplayer, nova assinatura ou alteração de PNGs.

## Regras implementadas

- Distribuidora: recolhe mãos ativas e cartas da penalidade, embaralha o conjunto e sorteia quantidades, incluindo zero. O autor recebe de zero até a quantidade que tinha após jogar. As demais quantidades vêm de cortes aleatórios do total restante, com ordem de destinatários embaralhada; não há igualdade obrigatória nem promessa de distribuição uniforme entre todas as combinações possíveis. Todos os IDs são conservados.
- Penalidade +2/+4/+6: continua permitindo Distribuidora, acrescenta as cartas efetivamente disponíveis e encerra toda a penalidade. A última carta do autor continua excluindo-o da redistribuição. Finalização em duplas e individual usa a pontuação existente.
- Zeros simultâneos: preserva finalizador anterior; sem ele, verifica primeiro o autor e depois o sentido atual. É um critério explícito para um empate surgido pela nova partilha; os critérios de pontuação/classificação não foram alterados.
- Caso inviável: se somente o autor permanece com cartas, não existe outro destinatário para absorver uma penalidade sem ultrapassar o limite dele. Nesse caso específico, a Distribuidora fica indisponível; outra resposta válida ou compra da penalidade continua funcionando. Sem penalidade, manter as cartas desse único destinatário é a única partilha possível. Nenhuma sobra é devolvida ou descartada silenciosamente.
- Giro: gira as mesmas mãos nos mesmos sentidos, sem modal e sem alterar a cor ativa, inclusive para bots e na última carta. Continua bloqueado contra penalidade.
- Corte: prazo de **2200 ms**, validado no handler pela hora atual, além da remoção visual ao expirar. Segunda cópia própria continua sem repetir efeito. A tentativa ocasional de corte dos bots foi movida para dentro da janela válida, mantendo a estratégia/probabilidade existente. As demais escolhas dos bots não mudaram.

## Apresentação implementada

- Compras individuais saindo do monte até a mão de humano/bots, com aceleração, desaceleração e encaixe. Para +20/+40/+80/+100, cada carta mantém seu próprio sprite/voo, mas os intervalos diminuem progressivamente; sequência termina em menos de 1,5 s. A lógica registra todas as cartas antes dos efeitos. Compra seguida de jogada é encadeada visualmente; jogada antecipada continua da posição visual atual, sem duplicar a carta.
- Monte vertical junto à esquerda do queimador, com pequeno ajuste vertical em retrato para separar as mãos laterais. Contador, pilha e toque direto com alvo mínimo de 44 px preservados.
- Chama normal com opacidade 0,74, conservando máscara, cores e animação anteriores. Penalidade usa progressão logarítmica limitada em +20: escala 1→1,16, opacidade 0,74→0,92 e brilho 1→1,24. Transição de 420 ms ao crescer e ao voltar ao normal; +40 mantém o mesmo máximo.
- Cartas maiores de forma responsiva: humano, oponentes, parceiro e descarte. Parceiro mantém todas as frentes abertas, com tamanho maior que antes. Leques dos adversários contêm **todas** as cartas, com sobreposição adaptativa e versos preservados.
- Mão humana compacta inicia centralizada; se não couber, conserva rolagem horizontal para alcançar qualquer carta. A troca entre leque e formato compacto tem efeito breve sem expansão temporária além da tela.
- Descarte físico com três camadas: poses discretas por jogada, mais recente por cima e anteriores parcialmente expostas. Histórico visual próprio conserva as últimas três mesmo após reciclagem do descarte para compra. Identidades visuais separam ocorrências de uma mesma carta física. Só o topo lógico determina regras e cor.
- Jogada com elevação, inclinação, deslizamento em arco, rotação e pouso, partindo da mão real dos quatro participantes. Cortes podem ocorrer durante o voo. Camadas não interceptam eventos; resize e movimento reduzido limpam efeitos sem alterar as cartas.
- Faca oficial ampliada a 68 px em retrato e 64 px em paisagem, incluindo área clicável e destaque, com espaço na mão para não recortar o alvo.
- Bloqueio: símbolo, seta para o participante efetivamente pulado e realce curto do assento, nos dois sentidos; segunda cópia própria não duplica o efeito.
- Contagem 5/4/3/2/1/0 junto ao participante atual, alimentada pelo `deadline` e ticker existentes. Não existe segundo cronômetro de partida; indicador some ao terminar o turno ou desabilitar o limite.

## Android imersivo

Plugin local Capacitor 8 `TableWindow`, registrado no host e no bundle de compatibilidade. Usa `WindowInsetsControllerCompat` para esconder barras durante a mesa e permitir reaparecimento transitório por gesto. Configurações restauram barras. O host continua reservando recortes físicos e teclado; barras transitórias sobrepõem a cena sem deslocar a mesa. Não intercepta o retorno do sistema. A web ignora a ponte nativa e funciona normalmente.

Referências oficiais consultadas: [Android imersivo](https://developer.android.com/develop/ui/views/layout/immersive) e [plugin local Capacitor 8](https://capacitorjs.com/docs/android/custom-code).

## Validação web aprovada

- `node testes/integracao.cjs`: 16/16 regressões, incluindo pontuação, penalidade, Distribuidora atualizada, Giro, corte, desafio, denúncia, laboratório, bots e finalização.
- `node testes/atualizacao_regras.cjs`: 23 cenários. Para cada conjunto de 20/40/80/118 cartas, 60 partilhas com semente reproduzível verificam IDs, total, teto do autor, variedade e zeros. Penalidades +2/+6/+12/+20/+40/+80; exclusão de finalizador, última carta, duplas, caso inviável; Giro nas quatro cores e dois sentidos; corte em 2199 ms e recusa em 2200 ms com relógio controlado.
- `node testes/mesa.cjs`: dez tamanhos de 320×568 a 1920×1080, retrato/paisagem, sem rolagem da mesa, menu, toques, compra +20, faca, fim de rodada e estado congelado sem mutação.
- `node testes/refinamentos_mesa.cjs`: origem real da carta humana, três bots, verso/privacidade, poses de assento, fogo, toque/foco, resize e movimento reduzido.
- `node testes/atualizacao_mesa.cjs`: 36 combinações (seis tamanhos × 7/15/20/30/60/100 cartas), centralização, alcance de cartas, leques completos/sigilo, parceiro aberto, monte, progressão de chama, compras individuais +20/+40/+80/+100, compra de bot, corte durante voo, pilha de três e reciclagem, Bloqueio nos dois sentidos e cronômetro humano/três bots 5..0, em retrato e paisagem pelo ticker original.
- `npm run build`, `node testes/android-compat.cjs` e cinco testes de versão aprovados. Compatibilidade simulada sem `replaceAll/getAnimations` nativos. Sintaxe JS/shell e `git diff --check` aprovados.
- Baralho, rotação de mãos, valores de pontuação, cálculo/classificação, finalização e escolha de cor dos bots preservados byte a byte em suas funções não alteradas. Os 52 PNGs de cartas e seis assets oficiais passam pelos mesmos SHA-256 do manifesto. Os novos símbolos/efeitos são código, sem editar imagens.

Capturas Chromium (não são de celular físico):

- [Retrato, sete cartas](../evidencias-atualizacao/390x844-7-cartas.png)
- [Paisagem, trinta cartas](../evidencias-atualizacao/568x320-30-cartas.png)
- [Pilha com três jogadas](../evidencias-atualizacao/pilha-tres-cartas.png)
- [Chama +20](../evidencias-atualizacao/penalidade-20.png)
- [Bloqueio em sentido invertido](../evidencias-atualizacao/bloqueio--1.png)

## Execução Android e distribuição

O resultado do workflow e a verificação do APK assinado desta atualização serão registrados após a execução. A instrumentação contém agora **seis testes**, mantendo os quatro anteriores e acrescentando imersão/recortes/retorno ao menu e Distribuidora/Giro/cronômetro. O roteiro exige também persistência após reinício a frio e após `adb install -r`, sem limpar dados ou desinstalar. Nenhum teste foi removido.

Identidade preservada: `com.lucascunha.panelinha.teste`, origem `https://localhost`, certificado de geração 2 de `android-identity.json`. Secrets, workflow, sequência de versões e mecanismo de publicação mantidos. A compilação seguinte supera 0.2.14/c3402 e seu candidato c3403.

## Limitações

Sem teste em aparelho físico nesta rodada. Movimento reduzido intencionalmente evita os voos. Mãos humanas muito grandes usam rolagem, enquanto os adversários mostram todas as cartas em leques sobrepostos; dezenas de frentes não ficam integralmente expostas ao mesmo tempo. Capturas estáticas não demonstram fluidez ou FPS; o desempenho em aparelhos reais ainda precisa de avaliação. A partida em curso continua apenas em memória; preservação de dados locais na atualização não significa retomada da partida.
