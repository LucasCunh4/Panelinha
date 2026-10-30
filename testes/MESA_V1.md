# Mesa v1 — implementação e validação

Base: commit `bb32d15`. Branch: `interface/mesa-v1`.

## Alterado

- Layout de fogão roxo-escuro feito em CSS, sem dependências ou imagens externas novas.
- Humano embaixo, Bot 2 (parceiro em duplas) em cima, Bot 3 à esquerda e Bot 1 à direita; as posições se mantêm no individual.
- Boca central com quatro cores de chama, também identificadas por texto e nome acessível. Descarte central em camadas; compra deslocada para a esquerda, com verso provisório e contagem atualizada.
- Punição em destaque, como `+12`; direção com seta e texto; mudança de sentido anima a seta. Movimento reduzido desativa/cancela a animação.
- Avatares SVG de panelas sem rosto, nome, contagem e destaque do turno. Adversários com mãos fechadas; parceiro aberto em mini-leque em duplas. Revelação do laboratório preservada.
- Leque moderado da mão própria, hover/foco e rolagem para mãos grandes ou quando não houver espaço. Os leques se adaptam ao redimensionar a tela sem depender de uma jogada.

`mesa.css` e `mesa.js` implementam apenas apresentação. A comparação do script inline com a base `bb32d15` confirmou igualdade byte a byte após retirar a única chamada nova `PanelasMesa.render(s)` de dentro de `render()`. Não foram alterados handlers, bots, timers, penalidades, cortes, pontuação ou fluxo. Os 52 arquivos PNG continuam idênticos ao manifesto original.

## Testado e aprovado

- `node testes/integracao.cjs`: 16/16 cenários de regras e verificações funcionais adicionais aprovados, sem alterações no runner existente. Os 52 PNGs carregam por HTTP, têm SHA-256 correto e são decodificados pelo navegador. Bots, laboratório, compra +20 por cronômetro e fallback textual continuam funcionando.
- `node testes/mesa.cjs`: posições e ausência de overflow da página em 320×568, 360×800, 390×844, 844×390 e 1280×900; leque responsivo ao resize; avatares e turno; parceiro aberto e adversários fechados; quatro cores da boca; punição +12; contador do monte; camadas do descarte; toque real em Inverter e animação; movimento reduzido; mãos grandes de 25/20 cartas acessíveis por rolagem.
- A apresentação também recebeu uma cópia profundamente congelada do estado e a renderizou sem mutação ou exceção. Nenhuma exceção JavaScript nos runners.
- `python3 IMPORTACAO_PANELAS/testes/verificar_assets.py`: 52 PNGs presentes e válidos.
- `node --check IMPORTACAO_PANELAS/mesa.js` e `git diff --check` aprovados.
- Inspeção visual de screenshots de mobile e desktop. O servidor HTTP interno da porta 8000 continua servindo o protótipo.
- `python3 ferramentas/gerar_previa.py /tmp/Panelas-mesa-v1.html`: HTML portátil de aproximadamente 27 MiB gerado com CSS, JS e imagens incorporados, sem mudar a origem. A cópia foi servida por HTTP e validada no Chromium móvel: decodificação das 52 imagens e jogada por toque.

## Limites

Não houve teste em aparelho físico Android/iOS ou Safari. A prévia portátil não foi validada por `file://`: a política administrativa do Chromium deste ambiente bloqueia esse esquema; a validação usou HTTP. A simulação móvel não garante comportamento idêntico em todos os celulares.

Não há ferramenta de URL pública/encaminhamento de portas disponível nesta sessão; nenhum site foi publicado. O README explica como servir e como publicar esta branch em hospedagem estática. Os versos, avatares e fogão são provisórios; os PNGs existentes permanecem as artes temporárias originais. Nenhum multiplayer ou power-up foi implementado.
