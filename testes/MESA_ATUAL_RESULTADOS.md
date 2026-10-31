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

- **APK 0.2.18 / versionCode 3802**, gerado pelo workflow #18, commit de código `9e6389c205691e205b90b22a892f1ef3e2026c9a`.
- [Download direto do APK, sem ZIP](https://github.com/LucasCunh4/Panelinha/actions/runs/41235454746/artifacts/13055970426). Requer login no GitHub; disponível até 29/01/2027.
- [Execução e resultados reais](https://github.com/LucasCunh4/Panelinha/actions/runs/41235454746); [diagnósticos Android](https://github.com/LucasCunh4/Panelinha/actions/runs/41235454746/artifacts/13055356321).
- Compilação release, compilação dos testes Android e candidato de atualização c3803: **aprovadas**. O candidato não foi distribuído.
- APK baixado e verificado novamente com `ferramentas/verificar_apk.py`: assinatura v2, pacote `com.lucascunha.panelinha.teste`, origem `https://localhost`, 52 PNGs de cartas e seis PNGs oficiais da mesa íntegros; HTML/JS/CSS atuais no pacote.
- Certificado SHA-256: `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509` (geração 2), idêntico ao APK 0.2.17/c3702. O código 3802 é maior: **atualização direta compatível**, sem desinstalar. Não houve mudança de chave, origem ou diretório de dados.
- SHA-256 do arquivo APK: `6f98284ab002b229d31d9ec468a440b9c1a57d6707068b88a10421ce537696f3`. Igual ao digest do artefato; o conteúdo entregue contém `AndroidManifest.xml`/`classes.dex` na raiz, sem ZIP externo.

**Android: não aprovado nesta execução.** O primeiro dos seis testes começou (`a_imagesAndThreeBotsOffline`), mas nenhum terminou. Às 19:45:45 UTC o kernel Linux do runner registrou `RenderThread[3712]: segfault`, após erros `Failed to find ColorBuffer` / `invalid color buffer` no renderizador do emulador. Em seguida o dispositivo ficou `offline` e a porta 5554 recusou conexão. A coleta disponível não registra asserção reprovada do aplicativo nem `FATAL EXCEPTION` do app. Isso evidencia falha do emulador no host; a causa interna do renderizador não foi resolvida nesta rodada.

Continuam **pendentes em Android real/emulador estável**: os seis testes completos, comprovação prática da imersão permanente/recortes/retomada/orientações, execução offline e teste de instalação por cima com preservação de localStorage/SharedPreferences/UID. A compatibilidade de atualização foi verificada por identidade e código; a execução prática desse teste não foi concluída. A partida em andamento continua somente em memória, como antes.

O workflow preserva todos os testes e a aprovação exigida para Release; por isso não criou uma Release após a falha. O APK assinado e validado foi disponibilizado pelo mecanismo existente de artefato direto (`actions/upload-artifact@v7`, `archive: false`, somente `.apk`), com metadados e diagnósticos em artefatos separados. Nenhum teste foi desativado e nenhuma nova assinatura foi criada.

Capturas desta build: `evidencias-mesa-atual/` (320×568, 390×844 e 568×320).
