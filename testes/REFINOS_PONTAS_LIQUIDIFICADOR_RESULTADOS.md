# Refinamentos de cantos, alimentos, Liquidificador e compras

Base preservada: `02edbdf`, branch `android/apk-testes`, APK anterior 0.2.59/c7902. HEAD remoto conferido antes de editar; nenhuma alteração anterior perdida. Nenhum PNG foi editado, substituído ou removido; os 27 arquivos de cartas/ingredientes foram comparados byte a byte com a base e permanecem idênticos.

## Implementação

- `cartas.js`: símbolos dos dois cantos aumentados de 92×92 para 104×104 na referência (+13,04%), preservando margens, centro, geometria 520×850, bordas 25 e arredondamento.
- Alimentos aproximadamente 5% maiores, com vermelho acima, verde acima e amarelo à esquerda, ajustados individualmente para continuar sobre os jatos e fora dos símbolos. Coordenadas `(x,y,tamanho)` no conteúdo 470×800:

| Carta | Vermelho | Amarelo | Azul | Verde |
| --- | --- | --- | --- | --- |
| +4 | (52,138,122) | (310,124,122) | (22,347,118) | (324,334,118) |
| +6 | (42,143,118) | (333,116,106) | (20,357,114) | (339,342,114) |
| Coringa | (52,143,124) | (324,129,114) | (27,367,118) | (324,376,118) |

O queijo da +4 também recebeu correção vertical para não encobrir a ponta do símbolo principal da ilustração. Os centros dos mirtilos foram preservados ao aumentar seu tamanho. Hitboxes do seletor usam as mesmas coordenadas; hover, proporção, transparência, mão, descarte e voos continuam no renderizador único.

- `efeitos-mesa.js/.css`: Liquidificador em etapas. Após a carta pousar, todas as cartas se recolhem das posições reais em um contêiner por jogador (690–1020 ms). Os montes se estabilizam em versos, partem em 1100 ms, chegam em 1740 ms e abrem no novo leque até 2000 ms. Somente quatro conjuntos circulam, com até seis camadas visíveis durante o trajeto; não há sprites individuais atravessando a mesa. As frentes recebidas aparecem somente no destino autorizado (humano/parceiro em Duplas). Quadro final coincide com as cartas reais do leque; pausa/retomada e retomada tardia seguem o relógio compartilhado. Redução de movimento e limpeza conservadas.
- `motor.js`: `ROTATION_TIMING` centraliza essas etapas sem aumentar os 2000 ms totais. Regras, direção, transferências, quantidade de cartas e pontuação não mudaram.
- Todos os tempos de compra/apresentação diminuíram exatamente 20%, com o ritmo fixo por carta e sem acelerar por quantidade:

| Trecho | Antes | Agora |
| --- | --- | --- |
| Compra normal / intervalo | 1960 / 2020 ms | 1568 / 1616 ms |
| Aproximação / destaque / encaixe | 760 / 620 / 100 ms | 608 / 496 / 80 ms |
| Compra fechada de outros / encaixe | 850 / 80 ms | 680 / 64 ms |
| Guardar: voo / encaixe | 380 / 120 ms | 304 / 96 ms |
| Punição: duração / intervalo / encaixe / acomodação | 120 / 80 / 20 / 40 ms | 96 / 64 / 16 / 32 ms |

Jogar/Guardar permanecem pendentes até a decisão quando permitida. Mesmos parâmetros no cliente e motor autoritativo; a próxima ação continua protegida até concluir a apresentação. Corte de 2,2 s, anúncio após corte de 300 ms, bots, modos e regras preservados.

## Verificações executadas

- `testes/refinos_pontas_liquidificador.cjs`: aprovado. 52 combinações com os cantos 104, centro intacto e sem cortes. Recolhimento real, compactação, giro e abertura em 844×390 e 1280×800, nos dois sentidos e modos, mãos de 7 a 33 cartas. Pausa congela conjunto e camadas. Versos no giro, frentes só autorizadas ao chegar, conservação integral de IDs, limpeza final. Endpoints confrontados com os elementos reais do leque, diferença inferior a 1 px.
- `testes/alimentos_nas_cartas.cjs`: aprovado. Doze posições com amostragem da cor no jato, limites e símbolo livre em repouso/hover; mão, oponentes revelados/ocultos, seleção, compra, Guardar, descarte e voos.
- `testes/refinos_cartas_punicao.cjs`: aprovado. +2/+4/+6/+20/+40, humano/bot, sobreposição individual, IDs únicos, cartas chegando e prazo autoritativo; +20 libera após 1344 ms. Compra normal e decisão preservadas. 23 artes-base íntegras e nenhuma exceção JavaScript.
- Servidor: 13 testes aprovados em `presentation.test.mjs`, `menu-rotation-score.test.mjs`, `mesa-compras-corte.test.mjs`. Rotação/cor, conservação, pausa, bots aguardando compra, cortes/anúncio e proteção autoritativa preservados.
- `npm run build`, testes de versão Android (cinco + caso de nome fixo), verificador de ícones, sintaxe e `git diff --check`: aprovados.
- Ajustes durante a verificação: queijo da +4 reposicionado após detectar sobreposição; tolerância de medição dos símbolos ajustada para arredondamento subpixel (0,3 px na referência); expectativas de tempo antigas atualizadas para os valores solicitados, mantendo todos os cenários. Nenhum teste foi removido ou desativado.

## Arquivos

Código: `IMPORTACAO_PANELAS/cartas.js`, `efeitos-mesa.js`, `efeitos-mesa.css`, `motor.js`. Instruções: `IMPORTACAO_PANELAS/AGENTS.md`, `documentacao/ESPECIFICACAO_COMPLETA.md`.
Testes: novo `testes/refinos_pontas_liquidificador.cjs`; atualizados `testes/refinos_cartas_punicao.cjs`, `testes/cartas_470x800.cjs`, `testes/mesa_artes_animacoes.cjs`, `multiplayer-server/tests/presentation.test.mjs`. Nenhum asset/arquivo antigo foi excluído, pois esta atualização altera somente parâmetros e animações.

## APK e limitações

APK final [panelinha.apk — 0.2.60/c8002](https://github.com/LucasCunh4/Panelinha/releases/download/v0.2.60/panelinha.apk), 63.050.919 bytes. [GitHub Actions 42506299233](https://github.com/LucasCunh4/Panelinha/actions/runs/42506299233): **success**, commit `641346c492f666eb125c6602587c1bb581c0e28f`. Uma única compilação Android nesta rodada, sem APK intermediário.

Na retomada de 13/11/2026, diretório limpo e HEAD local/remoto confirmados; código, registros dos testes e logs da compilação preservados. Nenhuma perda de trabalho. Não foi necessário repetir testes ou compilar novamente.

APK baixado integralmente e validado localmente com `ferramentas/verificar_apk.py`: assinatura v2 da geração 2, certificado `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`, pacote `com.lucascunha.panelinha.teste`, origem `https://localhost`, nome Panelinha, sensorLandscape, 23 artes-base, quatro alimentos, 15 variantes de ícones e código esperado. Metadados regenerados idênticos ao CI. Código 8002 superior ao anterior 7902; identidade compatível com atualização direta sem desinstalar.

SHA-256 do APK: `b300aa99a11c2e507f8d451f8b1f685693b8d514059d3859b4147771bf36b3e7`.

Versão web e Worker `d21b281a-26c7-46b1-8293-3a09c4d1fd6b` confirmados na retomada. Quatro arquivos públicos alterados conferidos byte a byte com o build e `/health` retornou `v:1, phase:3, gameplay:true`. O servidor/configurações não foram recriados.

Metadados em `testes/REFINOS_PONTAS_LIQUIDIFICADOR_APK_0.2.60.json`. Emulador não executado. Sem teste de instalação/atualização, persistência ou desempenho em Android físico, nem sessão com quatro celulares reais. Toque/layout verificados em Chromium; regras e projeções multiplayer exercitadas localmente. Esses testes pendentes não são declarados aprovados.
