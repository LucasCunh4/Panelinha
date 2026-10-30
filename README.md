# Panelas

Protótipo local de jogo de cartas com **1 humano + 3 bots**, modos individual/duplas e laboratório. Ainda não há multiplayer online. As 52 artes coloridas são temporárias.

O pacote foi integrado na branch `integracao/panelas-importacao`, a partir do commit `b071202`. Não havia código anterior para substituir. A estrutura original foi preservada em `IMPORTACAO_PANELAS/`, inclusive documentação e referências visuais. Na integração original, os arquivos importados foram mantidos idênticos aos do ZIP. A mesa v1 atualiza apenas a apresentação, mantendo os PNGs e o código das regras.

## Executar

Na raiz do repositório:

```sh
python3 -m http.server 8000 --bind 0.0.0.0 --directory IMPORTACAO_PANELAS
```

Abra o endereço HTTP do servidor no navegador. Para testar no celular pela mesma rede de um computador, use `http://IP_DO_COMPUTADOR:8000/`. Abrir o HTML por `file://` no Android não é o fluxo validado. O endereço de loopback da máquina na nuvem não fica acessível pelo celular.

## Prévia acessível pelo celular

O ambiente desta integração não disponibiliza uma ferramenta de URL pública nem encaminhamento público de portas. O servidor foi executado e validado internamente; **não foi publicado um site**.

Para hospedar sem backend, publique o conteúdo desta branch em uma hospedagem estática. No GitHub Pages, se disponível para o repositório: Settings → Pages → Deploy from a branch → `interface/mesa-v1` → `/ (root)` → Save. Use a URL HTTPS mostrada pelo próprio GitHub após a publicação. O `index.html` da raiz encaminha para `IMPORTACAO_PANELAS/`, mantendo os caminhos relativos das imagens. A ativação do Pages não foi feita nesta tarefa.

## Verificar

```sh
python3 IMPORTACAO_PANELAS/testes/verificar_assets.py
node testes/integracao.cjs
node testes/mesa.cjs
```

O teste de navegador requer Node.js, Playwright e Chromium. Nesta máquina já existem Playwright 1.62.1 e `/usr/bin/chromium`. Em outra máquina, instale Playwright em um diretório separado, sem alterar o projeto:

```sh
npm install --prefix /tmp/panelas-browser-tests --no-save playwright@1.62.1
NODE_PATH=/tmp/panelas-browser-tests/node_modules node testes/integracao.cjs
```

Ajuste `CHROMIUM_PATH` se necessário. O servidor deve estar iniciado; `PANELAS_TEST_URL` permite mudar o endereço HTTP usado pelos testes. O runner preserva falhas com código de saída diferente de zero. As situações controladas usam o gancho `CartasTest` do próprio protótipo e a interface, sem alterar o código do jogo.

Veja [resultados e limites dos testes](testes/RESULTADOS.md) e as [regras completas](IMPORTACAO_PANELAS/documentacao/ESPECIFICACAO_COMPLETA.md). Critérios finais de empate e alguns casos de abertura ainda precisam de definição conforme a especificação. A suíte não é uma certificação de todas as regras.

O ZIP original foi removido da árvore ativa após comparação byte a byte de todos os arquivos extraídos; continua recuperável no commit de origem. `IMPORTACAO_PANELAS/` é agora a pasta permanente do aplicativo, não uma pasta temporária.

## Mesa v1

A mesa usa um fogão roxo visto de cima, com o humano embaixo, Bot 2 em cima e os demais bots nas laterais. A boca central acompanha a cor ativa; descarte em camadas, monte com verso/contador, penalidade grande e seta de direção ficam no centro. Inverter anima a seta, respeitando movimento reduzido. Avatares de panelas e contorno destacam o turno; mãos pequenas usam leque, e mãos grandes passam para rolagem. O parceiro em duplas mostra mini-leque aberto; adversários continuam fechados, exceto quando revelados pelo laboratório.

`mesa.css` e `mesa.js` contêm a apresentação. O script original ganhou somente uma chamada de renderização visual; não houve mudanças em bots, regras, pontuação, cortes ou fluxo. Veja [validação da mesa](testes/MESA_V1.md).

Para gerar uma prévia portátil com CSS, JS e os 52 PNGs incorporados:

```sh
python3 ferramentas/gerar_previa.py /tmp/Panelas-mesa-v1.html
```

O HTML gerado tem aproximadamente 27 MiB; não é necessário versioná-lo. Ele foi validado por HTTP com imagens incorporadas e uma jogada por toque no Chromium móvel. Abrir diretamente esse arquivo em celular físico ainda não foi testado. O projeto normal continua sendo servido pelo comando HTTP acima. Não foi publicada uma URL pública nesta sessão.
