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

A instrumentação contém agora **seis testes**, mantendo os quatro anteriores e acrescentando imersão/recortes/retorno ao menu e Distribuidora/Giro/cronômetro. O roteiro exige também persistência após reinício a frio e após `adb install -r`, sem limpar dados ou desinstalar. Nenhum teste foi removido.

Identidade preservada: `com.lucascunha.panelinha.teste`, origem `https://localhost`, certificado de geração 2 de `android-identity.json`. Secrets, workflow, sequência de versões e mecanismo de publicação mantidos. A compilação seguinte supera 0.2.14/c3402 e seu candidato c3403.

### Resultado das execuções

- [Workflow #15](https://github.com/LucasCunh4/Panelinha/actions/runs/41226371683), fonte `04fb67aa3db972cbf07a199a26bac4d6ae019aaf`: compilou e assinou 0.2.15/c3502. `a_imagesAndThreeBotsOffline` passou: Android sem rede ativa, compatibilidade JS, decodificação das 52 cartas, quatro participantes e três bots. O emulador registrou `Failed to find ColorBuffer` / `invalid color buffer`, depois perdeu ADB durante `b_touchCutAndBuy`, sem conclusão de asserção desse teste.
- [Workflow #16](https://github.com/LucasCunh4/Panelinha/actions/runs/41226782036), fonte final `724903b194720c3e9cc45944e3e5162152f49211`: compilou e assinou **0.2.16/c3602**. Inclui o ajuste final de posição do cronômetro. O mesmo primeiro teste passou; o segundo foi interrompido pela perda do emulador após os mesmos erros gráficos. ADB ficou offline e a porta de controle 5554 recusou conexão.
- Não houve asserção reprovada do aplicativo antes dessas interrupções. Os logs também registram ANR do **Pixel Launcher**, anterior aos testes, sem exceção fatal registrada do Panelinha. A sequência observada aponta para uma interrupção do ambiente de emulação; os diagnósticos não estabelecem a causa exata nem substituem validação em aparelho. [Diagnósticos #16](https://github.com/LucasCunh4/Panelinha/actions/runs/41226782036/artifacts/13052256350).
- **Android parcial: 1/6 testes concluído/aprovado em cada execução.** Toques/compra/corte não concluíram; retrato/paisagem, sentinelas, imersão e regras/cronômetro nativos não chegaram a executar. Persistência após reinício e atualização não foi validada nesta rodada. Não há novas capturas Android. Todas as capturas deste relatório são do Chromium.
- A Release foi corretamente bloqueada. Os APKs assinados continuam disponíveis em artefatos, conforme o fluxo existente; nenhum teste ou verificação foi eliminado para publicar um resultado verde.

### APK final e verificação independente

**[Baixar ZIP com APK 0.2.16/c3602 e metadados](https://github.com/LucasCunh4/Panelinha/actions/runs/41226782036/artifacts/13052470841)**. Requer login no GitHub; retenção até 29/01/2027. Extraia `Panelinha-Teste-v0.2.16-c3602.apk`. O candidato 3603 é reservado ao teste e não é distribuído.

O ZIP foi baixado do GitHub Actions e seu digest comparado ao da API. O APK extraído passou localmente em `ferramentas/verificar_apk.py`/`apksigner`: assinatura v2, certificado ativo, versão/código, pacote/origem, SDKs 24/36, release/fullSensor, HTML/CSS/JS exatos, bundle de compatibilidade e SHA-256 dos 52+6 PNGs. A classe do plugin imersivo e a API de controle das barras também estão no DEX assinado. [Metadados completos](ATUALIZACAO_APK_0.2.16.json).

- SHA-256 do certificado: `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509` — idêntico ao registro ativo da geração 2.
- SHA-256 do APK: `6e2f8523c2b27b055b6cc346c11eec2d6f27780f72c37827273ee76c5c911df9`.
- Comparação dos APKs reais 0.2.14/c3402 e 0.2.16/c3602: mesmo certificado, pacote e origem; código crescente. **Compatível com atualização direta da geração 2, sem desinstalar.** A verificação de identidade não deve ser confundida com um teste de instalação/atualização e dados locais concluído no Android nesta rodada.

Pendência de execução: repetir a suíte completa em um Android estável, incluindo imersão/recortes, toques, rotação e atualização com persistência. O APK validado acima está disponível para instalação de teste apesar da interrupção de infraestrutura.

## Limitações

Sem teste em aparelho físico nesta rodada. Movimento reduzido intencionalmente evita os voos. Mãos humanas muito grandes usam rolagem, enquanto os adversários mostram todas as cartas em leques sobrepostos; dezenas de frentes não ficam integralmente expostas ao mesmo tempo. Capturas estáticas não demonstram fluidez ou FPS; o desempenho em aparelhos reais ainda precisa de avaliação. A partida em curso continua apenas em memória; preservação de dados locais na atualização não significa retomada da partida.
