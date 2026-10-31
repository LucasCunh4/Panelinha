# Panela de Pressão e leque contínuo — atualização após 0.2.18

## Recuperação

O ambiente e o checkout originais continuaram acessíveis após a interrupção remota. Os arquivos modificados e o teste novo não commitado foram preservados. Não houve perda identificada. Os processos de teste já tinham terminado; restavam apenas processos Chromium encerrados, sem testes ativos a cancelar. A retomada utilizou os arquivos e logs existentes, sem reconstruir o projeto.

O teste novo havia parado ao consultar `getAnimations()[0]`: uma transição de opacidade da cauda podia ocupar essa posição. A verificação passou a localizar a animação `stove-flow` pelo nome e medir movimento, sentido e repetição infinita. Nenhuma verificação foi eliminada.

## Implementação

- Panela de Pressão: autor com N cartas após descartar recebe N menos uma redução sorteada entre 1 e min(3,N−1); com N=1 permanece com 1. Outros participantes recebem identidades embaralhadas e quantidades com diferença máxima de 2, sempre mínimo 1. Todas as cartas são conservadas.
- Pode ser jogada como última carta: a vitória decorre do descarte real, o autor fica isento e a redistribuição ocorre só entre quem continua com cartas. Em Individual e Duplas, incorpora a penalidade disponível e a encerra antes da finalização/pontuação existentes. Um finalizador anterior continua preservado. Não cria zeros por redistribuição.
- Caso extremo sem outro destinatário: não permite uma redução obrigatória ou repasse de penalidade impossível de conservar; manter a única carta sem penalidade e efetuar o último descarte normal continuam possíveis.
- Mão humana grande: mesmos botões/IDs em um único leque, ordenados vermelho/azul/verde/amarelo/sem cor fixa, sem caixas nem espaços entre grupos. Só muda a sobreposição. Primeiro toque expande; toque seguinte numa carta válida pode jogar. Outra cor troca a expansão; toque/clique fora recolhe. A faca mantém acesso direto durante os 2200 ms.
- Mouse: intenção de 180 ms evita oscilações; clique fixa a expansão sem jogar a primeira carta. Sair com o mouse não recolhe a expansão fixada; clique externo fecha.
- Uma cor com dezenas de cartas pode usar rolagem apenas da mão; a carta tocada acompanha a expansão. Compras/descarte usam posições reais, inclusive em grupos abertos; não mudam a lógica nem o prazo de corte.
- Card superior ao lado do leque, que sobe. Bots a 90% da base; parceiro a 94%, com frentes visíveis. Humano, descarte e monte mantêm o tamanho anterior. Laterais continuam centralizadas.
- Centro sem rótulos visuais redundantes de cor, descarte ou sentido. Informação acessível permanece nas opções/leitor de tela. Chamas e controles funcionais preservados.
- Brilho: cabeça mais evidente e cauda em duas intensidades de até 155/1000 do percurso; faixa fina, sem contorno permanente. Todas as camadas usam `direction` do motor. Inverter espelha a fase, muda o sentido e cruza suavemente as opacidades das caudas.

Permanecem: 52 PNGs de cartas e seis PNGs da mesa, bots, Individual/Duplas, Liquidificador sem trocar cor, pontuação, laboratório, seis camadas do monte, compras individuais, três descartes, Bloqueio, chamas por cor/penalidade/amarelo, cronômetro 5–1 e imersão Android. Sem multiplayer, novas artes ou nova chave.

## Testes web aprovados

- `integracao.cjs`: 16/16 regras e verificações de imagens, bots, laboratório, fallback e modos.
- `atualizacao_regras.cjs`: 40 cenários, incluindo centenas de sorteios com pools 20/40/80/118, autor com 1/2/3/4/7/20/40/80 cartas, penalidades até +80, mínimo, equilíbrio, redução aleatória, conservação/IDs, última Panela em Individual/Duplas, finalizador anterior, Liquidificador e fronteiras 2199/2200 ms.
- `leque_continuo.cjs`: 30 layouts de 320×568 a 1280×800, mãos 15/20/30/40/60/100, continuidade e centralização; toque/mouse, troca/fechamento, carta inválida, seleção correta, cor única grande, compra +20 fechada e aberta por timeout, conservação de IDs, voo a partir da carta real, faca, centro limpo e movimento real da cauda nos dois sentidos.
- `mesa.cjs`: dez tamanhos, menu/compra/corte, laboratório, classificação, privacidade e apresentação sem mutação do estado.
- `atualizacao_mesa.cjs`: 36 layouts, compra +20/+40/+80/+100, fogo, três descartes e reciclagem, Bloqueio, corte durante voo, cronômetro e rotação/movimento reduzido.
- `refinamentos_mesa.cjs`: voos de humano e três bots, orientação responsiva, sigilo e movimento reduzido.
- `mesa_fina.cjs`: monte interno, amarelo, fase do brilho antes/depois da inversão, compras e camadas do descarte.
- `mesa_atual.cjs`: 18 layouts, base humana/monte/descarte, seis camadas, centralização, cronômetro, direção por jogadas reais/Inverter e nomes.
- `android-compat.cjs`: pacote gerado em simulação de WebView sem replaceAll/getAnimations nativos.
- `npm run build`, cinco testes de `versao_android.py`, sintaxe JS e `git diff --check`.

A bateria de centenas de sorteios isola regras em movimento reduzido para não acumular animações durante um único lote síncrono. As animações normais permanecem cobertas pelas suítes de interface. A instrumentação Android preserva os seis testes anteriores, atualiza os critérios da Panela e acrescenta um sétimo teste de toque no leque contínuo; o teste de atualização/persistência continua exigido. Nenhum teste Android foi desativado.

## APK e Android

Aguardar a execução do mesmo workflow após salvar esta atualização. O APK precisa conservar o certificado de `android-identity.json`, applicationId `com.lucascunha.panelinha.teste`, origem `https://localhost` e versionCode superior ao 3802 distribuído (3803 reservado ao teste anterior). O arquivo será verificado novamente após o download. Resultados do emulador, metadados e link direto serão registrados aqui quando disponíveis; a falha de infraestrutura da execução anterior não aprova a execução atual.
