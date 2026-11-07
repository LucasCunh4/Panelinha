# Números unitários — integração visual

Base recuperada: `0d546b6` na branch `android/apk-testes`, contendo o ZIP recém-enviado. Nenhum trabalho local perdido/sobrescrito.

## Implementação

- `cartas.js`: mesmo fundo + três instâncias do mesmo PNG unitário; centro/cantos independentes, `symbolLayout` centraliza posição, tamanho, margem, escala e ajustes ópticos de +2/Inverter. Cache mantém apenas 23 arquivos únicos. Sem fallback das imagens anteriores.
- `cartas.css`: posicionamento em percentuais da área 470×800, `object-fit: contain`, imagens sem captura de eventos. Moldura, borda externa 25 px, total 520×850 e raios 70/45 preservados.
- `mesa.css`: tamanho-base compartilhado multiplicado por 1,05; 1,02 nas telas horizontais até 340 px de altura. Leques, monte, descarte, voos e halo continuam derivados das dimensões externas reais.
- Manifesto, build, verificador de APK e verificações existentes atualizados para os tamanhos reais dos PNGs unitários. Instrumentação conservada, sem execução nesta entrega. Regras/motor, bots, pontuação, artes restantes e identidade Android sem alterações.

## Arquivos adicionados

Em `IMPORTACAO_PANELAS/`:

- `assets/cartas/elementos/bloqueio_unitario.png`
- `assets/cartas/elementos/inverter_unitario.png`
- `assets/cartas/elementos/mais2_unitario.png`
- `assets/cartas/elementos/numero_0_unitario.png`
- `assets/cartas/elementos/numero_1_unitario.png`
- `assets/cartas/elementos/numero_2_unitario.png`
- `assets/cartas/elementos/numero_3_unitario.png`
- `assets/cartas/elementos/numero_4_unitario.png`
- `assets/cartas/elementos/numero_5_unitario.png`
- `assets/cartas/elementos/numero_6_unitario.png`
- `assets/cartas/elementos/numero_7_unitario.png`
- `assets/cartas/elementos/numero_8_unitario.png`
- `assets/cartas/elementos/numero_9_unitario.png`

Novo teste: `testes/numeros_unitarios.cjs`. O ZIP aprovado `panelinha_numeros_unitarios_png.zip` permanece como pacote de origem.

## Arquivos antigos excluídos via git rm

- `IMPORTACAO_PANELAS/assets/cartas/elementos/bloqueio_retrabalhado_470x800.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/inverter_retrabalhado_470x800.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/mais2_retrabalhado_470x800.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_0_retrabalhado_470x800.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_1_retrabalhado_470x800.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_2_retrabalhado_470x800.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_3_retrabalhado_470x800.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_4_retrabalhado_470x800.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_5_retrabalhado_470x800.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_6_retrabalhado_470x800.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_7_retrabalhado_470x800.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_8_retrabalhado_470x800.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_9_retrabalhado_470x800.png`
- `panelinha_numeros_retrabalhados_470x800.zip` (também continha os símbolos substituídos).

Sem referências ativas, fallback, cópia ou backup dos símbolos antigos no repositório atual. Nomes na lista de remoção do manifesto/relatórios são apenas registro da exclusão; histórico Git preservado. Fundos, especiais, verso e demais recursos não foram excluídos.

## Verificações efetivamente realizadas

- Integridade CRC do ZIP e SHA-256 `2cf8e2d3d4bccd0ac3eeac8388fdd92443592063f028ed474c5afe22746c7a43`; 13 PNGs instalados idênticos ao pacote. Quatro fundos, cinco especiais e verso idênticos ao HEAD anterior.
- `node testes/numeros_unitarios.cjs`: aprovado. As 52 combinações, centro e cantos independentes, três imagens idênticas com contain, margens internas, nenhum recorte adicional pela montagem. Aumento de 5%/2%, proporção e ausência de rolagem global em 568×320, 844×390, 1024×768 e 1280×800.
- `testes/cartas_470x800.cjs` executado somente com escopos `assets`, `layout`, `animations`: aprovado. 58 representações (52 normais + cinco especiais + verso), oito layouts Individual/Duplas, mão de 40 cartas, compras normais/punitivas, descarte e recursos já carregados disponíveis sem rede. Sem arquivos quebrados/exceções JavaScript.
- `node testes/halo_cartas_470x800.cjs`: aprovado. Folga 5,25 px em todos os lados, zero pixels de sobreposição com as seis molduras na intensidade máxima.
- `node testes/cartas_multiplayer_470x800.mjs`: aprovado. Projeções reais do servidor no navegador para Individual/Duplas, preservando cartas ocultas. Não cria sala pública.
- `node testes/mao_dois_toques.cjs`: aprovado. Toque/seleção/descarte, hover e clique de mouse híbrido, foco/setas/Enter, mãos compactas, arraste, corte/Bloqueio/penalidades e comando validado pelo motor multiplayer.
- `npm run build`, `npx cap copy android`, sintaxe JS/Python e `git diff --check`: aprovados. Recursos antigos ausentes também dos pacotes web/Capacitor gerados.

## Limitação das artes de origem

Alguns PNGs unitários enviados têm fragmentos pretos no topo, visíveis por exemplo acima do número 7. A montagem exibe os PNGs recebidos integralmente, sem editar, recortar ou redesenhar. Logo esses fragmentos são repetidos nas três instâncias. Isso não é duplicação de camadas antigas; o SHA de cada PNG corresponde ao ZIP aprovado. Correção artística depende de nova imagem de origem.

Nenhum emulador ou aparelho Android físico utilizado. Instalação, atualização real/persistência e desempenho em hardware Android não são declarados aprovados.

APK final: compilação/assinatura/verificação pelo workflow existente a concluir após este registro. Identidade geração 2 preservada, sem criação de chave ou alteração dos Secrets.
