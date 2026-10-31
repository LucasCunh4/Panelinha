# Mesa atual — nomes, direção, tamanho comum e tela cheia

Base: `android/apk-testes`, após APK 0.2.17/c3702 (geração 2).

## Implementação

- Um tamanho-base responsivo maior para mão humana, oponentes, parceiro, descarte e monte. Todas as cartas de cada adversário continuam presentes, com sobreposição adaptativa e sigilo preservado.
- Laterais centralizadas na altura **incluindo** nome/avatar e leque. Em retrato os leques ficam em pé para não invadir o centro com cartas maiores; em paisagem mantêm rotação lateral. O avatar superior em paisagem fica à esquerda do leque, livre do menu.
- Correção do arredondamento acumulado em mãos longas: usa largura fracionária no cálculo do leque.
- Monte com seis camadas decorativas, um contador real e um único botão de compra. Sem criar cartas na lógica.
- Cronômetro global grande, à direita, espelhado no eixo do monte: lê o mesmo deadline do motor, mostra 5/4/3/2/1 e some no fim/expiração, sem outro temporizador.
- Disposição real dos assentos: 0 embaixo → 1 direita → 2 cima → 3 esquerda. `direction=+1` é **anti-horário**, `-1` é **horário**. Brilho, texto, seta e log da transferência agora seguem isso, inclusive após Inverter. A sequência do motor não mudou.
- Nomes visíveis: Distribuidora → **Panela de Pressão**; Giro → **Liquidificador**. Renderização textual, acessibilidade, opções, mensagens, histórico e laboratório atualizados; os identificadores internos e os efeitos foram preservados. Nenhum PNG alterado.
- Android imersivo em toda a experiência: menu/partida/retorno ao app/foco. Barras temporárias por gestos continuam permitidas pelo Android e são ocultadas automaticamente. Recortes e teclado reservados, Back e diálogos preservados. Tema também oculta status bar na abertura.

Os ajustes são feitos por CSS/JS e pelo host Android existente. Há mudança de estrutura de apresentação no cronômetro único e nas seis camadas do monte; não há novo motor, artes ou chave. Chamas, animações de compra/jogada, corte 2200 ms, regras, pontuação, bots, laboratório, Individual e Duplas foram preservados.

## Verificações web e build

- `node testes/integracao.cjs`: regras 16/16; carregamento/decodificação/hash dos 52 PNGs, bots, penalidades, laboratório, fallback e modos.
- `node testes/atualizacao_regras.cjs`: 30 cenários; redistribuição aleatória/conservação/mínimo 1/teto do autor, 20/40/80/118 cartas, penalidades, Liquidificador mantendo cor e corte em 2199/2200 ms.
- `node testes/mesa.cjs`: dez tamanhos, interação de compra/corte/menu, laboratório, fim de rodada, privacidade e apresentação sem mutação.
- `node testes/refinamentos_mesa.cjs`: voos de humano/três bots, orientação responsiva, sigilo e movimento reduzido.
- `node testes/mesa_fina.cjs`: monte interno, brilho com fase contínua nos dois sentidos, amarelo +15%, compras individuais e três camadas do descarte.
- `node testes/mesa_atual.cjs`: 18 layouts, mesmo tamanho-base, seis camadas/contador, centralização completa, cronômetro espelhado, direção real após jogada/Inverter e novos nomes.
- `node testes/android-compat.cjs`: pacote gerado no navegador simulando WebView sem replaceAll/getAnimations nativos.
- `npm run build` e `python3 testes/versao_android.py`: build web e cinco testes de versionamento.
- `node testes/atualizacao_mesa.cjs`: aprovado. Inclui 36 layouts com 7/15/20/30/60/100 cartas, compras +20/+40/+80/+100, chama, Bloqueio e ticker 5–1. Os cenários de relógio foram isolados dos efeitos anteriores, com tempo controlado e respeito à fase do ticker de 250 ms; nenhum teste foi suprimido.

## Android e entrega

A execução desta atualização será registrada aqui após o GitHub Actions. A assinatura/pacote/origem devem ser verificados no APK real antes de disponibilizá-lo. Os seis testes Android e o teste de atualização continuam obrigatórios para aprovar a Release. Se houver falha de infraestrutura, o APK validado fica disponível no artefato direto, com metadados/diagnósticos separados e o resultado real informado.

Capturas desta build: `evidencias-mesa-atual/` (320×568, 390×844 e 568×320).
