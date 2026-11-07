# Números refeitos e cartas 8% maiores

Base: `02b053f` na branch `android/apk-testes`, com o ZIP recém-enviado. Checkout anterior limpo, sem perda ou sobrescrita de trabalho.

## Pacote e qualidade

`panelinha_numeros_refeitos_separados.zip`: CRC íntegro; SHA-256 `2b3bd011a1a9679a39c3324eff928eca766a8891cdeb18a85f8c6cd17bd8127c`. Exatamente 13 PNGs RGBA, todos 1254×1254, com alfa real de 0 a 255. Prévia dos 13 inspecionada, com atenção a 1, 4, 7, +2, Bloqueio e Inverter: um desenho correspondente por arquivo, sem os fragmentos pretos anteriores e sem corte perceptível dos símbolos. Nenhum pixel com alfa >64 nas extremidades do canvas.

Limitação identificada antes da integração: `nove_branco_glossy_em_estilo_cartoon.png` tem ruído de transparência muito leve, com alfa de 0 a 10/255 nos cantos (38.001 de 40.000 pixels dos quatro quadrados de canto têm alfa não nulo). Os demais têm no máximo 13 pixels residuais de alfa 1 nessas áreas. Nenhuma correção silenciosa do desenho, limpeza de alfa, redimensionamento ou recorte de PNG foi feita. Arquivos instalados idênticos byte a byte ao ZIP.

## Novos arquivos instalados

Renomeados apenas para caminhos ASCII estáveis em `IMPORTACAO_PANELAS/assets/cartas/elementos/`:

| Arquivo no pacote | Arquivo instalado |
| --- | --- |
| `ícone_de_proibição_branco_brilhante.png` | `bloqueio_refeito.png` |
| `ícone_de_setas_invertidas_brilhantes.png` | `inverter_refeito.png` |
| `ícone_cartunesco_brilhante_2.png` | `mais2_refeito.png` |
| `zero_brilhante_estilo_game.png` | `numero_0_refeito.png` |
| `número_1_branco_brilhante_em_estilo_jogo.png` | `numero_1_refeito.png` |
| `número_2_brilhante_em_estilo_cartoon.png` | `numero_2_refeito.png` |
| `número_3_brilhante_em_estilo_cartum.png` | `numero_3_refeito.png` |
| `número_4_branco_glossy_estilizado.png` | `numero_4_refeito.png` |
| `número_5_brilhante_em_estilo_adesivo.png` | `numero_5_refeito.png` |
| `seis_branco_brilhante_em_estilo_cartoon.png` | `numero_6_refeito.png` |
| `número_7_branco_brilhante_em_estilo_cartoon.png` | `numero_7_refeito.png` |
| `número_8_brilhante_em_estilo_cartum.png` | `numero_8_refeito.png` |
| `nove_branco_glossy_em_estilo_cartoon.png` | `numero_9_refeito.png` |

## Arquivos antigos excluídos via git rm

- `IMPORTACAO_PANELAS/assets/cartas/elementos/bloqueio_unitario.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/inverter_unitario.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/mais2_unitario.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_0_unitario.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_1_unitario.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_2_unitario.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_3_unitario.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_4_unitario.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_5_unitario.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_6_unitario.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_7_unitario.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_8_unitario.png`
- `IMPORTACAO_PANELAS/assets/cartas/elementos/numero_9_unitario.png`
- `panelinha_numeros_unitarios_png.zip`, que continha as imagens substituídas.

Sem cópia/fallback dos símbolos antigos. As referências no registro de exclusão do manifesto e em relatórios históricos não são carregamentos ativos. Fundos, especiais, verso, cenário e sons não foram alterados/excluídos.

## Renderização e tamanho

- `cartas.js`: mantém fundo + três instâncias do mesmo PNG. `symbolArt` centraliza os limites visíveis medidos nos novos arquivos (alfa >64); `symbolLayout` define independentemente centro, canto superior e inferior. A escala é sempre isotrópica; o PNG inteiro é renderizado, sem cortar suas margens. O enquadramento usa o contorno do desenho para compensar o espaço transparente, sem reaproveitar automaticamente deslocamentos anteriores.
- Centro óptico em (235,374) no conteúdo 470×800, 26 px acima do centro geométrico. Limite visual de 320×300 para números; +2 usa largura até 350 e Bloqueio até 315×315. Cantos limitados a 92×92 visíveis com margens de 40 px horizontal e 38 px vertical. Cada símbolo conserva sua proporção real, incluindo 1/4/7, +2, Bloqueio e Inverter.
- `cartas.css`: posições/larguras/alturas próprias por instância, `object-fit: contain`, sem eventos nos overlays; as bordas externas 25 px, cores, referência 520×850 e raios 70/45 permanecem.
- `mesa.css`: novo multiplicador `--card-growth:1.08` sobre as escalas anteriores. Escala geral 1,05 → 1,134; landscape baixo 1,02 → 1,1016. Aumento efetivo de 8% em todos os tamanhos verificados. Mão, adversários, parceiro, compra, descarte e destinos dos voos derivam do tamanho compartilhado; o leque mantém sua compactação e hitboxes reais.
- Manifesto, build/verificador do APK e expectativas de testes atualizados para os novos nomes/dimensões. Instrumentação preservada e atualizada, sem execução. Código do motor, regras/bots/pontuação, servidor, identidade Android e workflow sem alterações.

## Verificações executadas

- `node testes/numeros_unitarios.cjs`: aprovado; 52 combinações, mesma imagem nas três instâncias, encaixe proporcional, centros/cantos/margens, controle independente, sem captura de eventos. Aumento medido de 8% em 568×320, 844×390, 1024×768 e 1280×800; sem rolagem global. Captura regenerada após restaurar o estilo usado temporariamente no teste de independência do centro.
- `testes/cartas_470x800.cjs`, somente escopos `assets`, `layout`, `animations`: aprovado; 52 normais + cinco especiais + verso, oito layouts Individual/Duplas, mão de 40 cartas, seis camadas do monte, bordas/raios, compras normais/punitivas, descarte e recursos previamente carregados disponíveis offline. Sem imagens quebradas ou exceções JavaScript.
- `node testes/halo_cartas_470x800.cjs`: aprovado; folga 5,25 px nos quatro lados e zero sobreposição entre halo máximo e as seis cartas.
- `node testes/mao_dois_toques.cjs`: aprovado; primeiro toque/segundo toque, hover/clique, foco/setas/Enter, mãos compactas, arraste e restrições de corte/turno preservados, incluindo comando aceito pelo motor multiplayer real.
- `node testes/cartas_multiplayer_470x800.mjs`: aprovado; projeções Individual/Duplas preservam sigilo e frentes do parceiro. Nenhuma sala pública criada.
- `npm run build`, `npx cap copy android`, sintaxe JS/Python e `git diff --check`: aprovados. Somente os 13 símbolos novos em fonte/dist/Capacitor; quatro fundos, cinco especiais e verso idênticos ao HEAD anterior.

Não executado: emulador, aparelho Android físico, instalação/atualização/persistência real de dados e desempenho em hardware Android. Nenhuma bateria extensa ou suite de regras completa foi reexecutada.

APK/publicação: workflow existente será acompanhado após registrar o código, com a mesma assinatura de geração 2, sem emulador e sem APKs intermediários.
