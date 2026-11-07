# Migração definitiva das cartas — 470×800 + moldura externa

Base: `6f1928e` da branch `android/apk-testes` (inclui a versão funcional 0.2.48 e os três novos ZIPs). Nenhuma alteração anterior perdida; histórico preservado.

## Novas artes

23 PNGs originais, copiados byte a byte dos três pacotes com CRC íntegro, RGBA 470×800 e hashes registrados em `IMPORTACAO_PANELAS/documentacao/MANIFESTO_CARTAS_470X800.json`:

- `IMPORTACAO_PANELAS/assets/cartas/fundos/fundo_amarelo_retrabalhado_470x800.png`
- `IMPORTACAO_PANELAS/assets/cartas/fundos/fundo_azul_retrabalhado_470x800.png`
- `IMPORTACAO_PANELAS/assets/cartas/fundos/fundo_verde_retrabalhado_470x800.png`
- `IMPORTACAO_PANELAS/assets/cartas/fundos/fundo_vermelho_retrabalhado_470x800.png`
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
- `IMPORTACAO_PANELAS/assets/cartas/especiais/carta_curinga.png`
- `IMPORTACAO_PANELAS/assets/cartas/especiais/carta_liquidificador.png`
- `IMPORTACAO_PANELAS/assets/cartas/especiais/carta_mais4.png`
- `IMPORTACAO_PANELAS/assets/cartas/especiais/carta_mais6.png`
- `IMPORTACAO_PANELAS/assets/cartas/especiais/carta_panela_de_pressao.png`
- `IMPORTACAO_PANELAS/assets/cartas/especiais/verso_roxo.png`

## Composição e geometria

- `cartas.js`/`cartas.css`: componente único para mãos, montes, prévias e todas as animações. Normais são fundo + número/símbolo em PNG, ambos exatamente no mesmo canvas; 52 combinações usam somente 4 fundos e 13 elementos, sem gerar imagens compostas nem números HTML/CSS.
- Especiais: `wild4`, `wild6`, `wild`, `rotate`, `dist` mapeiam aos cinco PNGs completos. Nenhum overlay de arte adicional. Seletor reutiliza a carta completa, uma única imagem, com quatro zonas de toque/hover nas regiões coloridas. Bases e ingredientes antigos foram retirados; escolha e efeitos permanecem os mesmos.
- Geometria central: conteúdo 470×800, moldura EXTERNA de 25 por lado, total 520×850. `.card-frame` e `.card-face` são camadas físicas separadas; a face começa em x=25/y=25, ocupa 470/520 e 800/850 do total, sem borda sobre a arte. Normal/verso: branco sólido; especial aberta: dourado `#edbd56`; especial fechada: verso branco.
- PNGs mantidos integralmente e sem alterações: alguns têm cantos opacos e outros transparentes. A moldura arredondada externa não mascara nem recorta os cantos da imagem. Assim, não se força uma máscara uniforme destruindo partes da arte aprovada.
- Revistos: altura/largura das mãos e assentos, mini-cartas do parceiro, leques, monte de seis cartas, descarte, hitboxes, hover/seleção, prévias e trajetos/encaixes de compra/descarte, pacotes do Liquidificador e recolhimento/redistribuição da Panela. O halo usa seis silhuetas externas reais (incluindo a moldura), não o alfa da antiga carta. Sombras do descarte acompanham a nova caixa externa.
- Pré-carregamento e reutilização de 23 imagens; camadas não capturam eventos. Interação em dois toques, mouse e teclado preservada.
- Não há fallback para artes anteriores nem renderer de números por fonte. O laboratório continua com injeção, penalidades e revelação; a antiga chave para alternar para artes textuais foi substituída pela indicação fixa de artes oficiais.
- Build, verificador do APK, exportação de prévia e verificações visuais migrados. Entradas históricas dos testes de artes permanecem e executam as verificações equivalentes na suíte compartilhada; as premissas obsoletas de 400×850/alfa idêntico/bases separadas foram substituídas pelas novas medidas.

## Excluídos do repositório

Todos os caminhos abaixo foram removidos com `git rm`, depois de validar as novas representações. São 88 PNGs das pastas de cartas antigas, três imagens de prévia/pranchas, sete ZIPs de artes substituídas e seis manifestos obsoletos, total de 104 arquivos. Nenhuma cópia de backup das imagens retiradas foi criada no projeto. O histórico Git, releases/APKs históricos assinados e evidências de testes anteriores permanecem como registros de versões, sem uso como fonte/fallback de artes da nova versão.

- `IMPORTACAO_PANELAS/assets/cartas/vermelho/bloqueio.png`
- `IMPORTACAO_PANELAS/assets/cartas/vermelho/7.png`
- `IMPORTACAO_PANELAS/assets/cartas/vermelho/inverter.png`
- `IMPORTACAO_PANELAS/assets/cartas/vermelho/8.png`
- `IMPORTACAO_PANELAS/assets/cartas/vermelho/9.png`
- `IMPORTACAO_PANELAS/assets/cartas/vermelho/0.png`
- `IMPORTACAO_PANELAS/assets/cartas/vermelho/mais_2.png`
- `IMPORTACAO_PANELAS/assets/cartas/vermelho/4.png`
- `IMPORTACAO_PANELAS/assets/cartas/vermelho/2.png`
- `IMPORTACAO_PANELAS/assets/cartas/vermelho/5.png`
- `IMPORTACAO_PANELAS/assets/cartas/vermelho/6.png`
- `IMPORTACAO_PANELAS/assets/cartas/vermelho/3.png`
- `IMPORTACAO_PANELAS/assets/cartas/vermelho/1.png`
- `IMPORTACAO_PANELAS/assets/cartas/azul/bloqueio.png`
- `IMPORTACAO_PANELAS/assets/cartas/azul/7.png`
- `IMPORTACAO_PANELAS/assets/cartas/azul/inverter.png`
- `IMPORTACAO_PANELAS/assets/cartas/azul/8.png`
- `IMPORTACAO_PANELAS/assets/cartas/azul/9.png`
- `IMPORTACAO_PANELAS/assets/cartas/azul/0.png`
- `IMPORTACAO_PANELAS/assets/cartas/azul/mais_2.png`
- `IMPORTACAO_PANELAS/assets/cartas/azul/4.png`
- `IMPORTACAO_PANELAS/assets/cartas/azul/2.png`
- `IMPORTACAO_PANELAS/assets/cartas/azul/5.png`
- `IMPORTACAO_PANELAS/assets/cartas/azul/6.png`
- `IMPORTACAO_PANELAS/assets/cartas/azul/3.png`
- `IMPORTACAO_PANELAS/assets/cartas/azul/1.png`
- `IMPORTACAO_PANELAS/assets/cartas/verde/bloqueio.png`
- `IMPORTACAO_PANELAS/assets/cartas/verde/7.png`
- `IMPORTACAO_PANELAS/assets/cartas/verde/inverter.png`
- `IMPORTACAO_PANELAS/assets/cartas/verde/8.png`
- `IMPORTACAO_PANELAS/assets/cartas/verde/9.png`
- `IMPORTACAO_PANELAS/assets/cartas/verde/0.png`
- `IMPORTACAO_PANELAS/assets/cartas/verde/mais_2.png`
- `IMPORTACAO_PANELAS/assets/cartas/verde/4.png`
- `IMPORTACAO_PANELAS/assets/cartas/verde/2.png`
- `IMPORTACAO_PANELAS/assets/cartas/verde/5.png`
- `IMPORTACAO_PANELAS/assets/cartas/verde/6.png`
- `IMPORTACAO_PANELAS/assets/cartas/verde/3.png`
- `IMPORTACAO_PANELAS/assets/cartas/verde/1.png`
- `IMPORTACAO_PANELAS/assets/cartas/amarelo/bloqueio.png`
- `IMPORTACAO_PANELAS/assets/cartas/amarelo/7.png`
- `IMPORTACAO_PANELAS/assets/cartas/amarelo/inverter.png`
- `IMPORTACAO_PANELAS/assets/cartas/amarelo/8.png`
- `IMPORTACAO_PANELAS/assets/cartas/amarelo/9.png`
- `IMPORTACAO_PANELAS/assets/cartas/amarelo/0.png`
- `IMPORTACAO_PANELAS/assets/cartas/amarelo/mais_2.png`
- `IMPORTACAO_PANELAS/assets/cartas/amarelo/4.png`
- `IMPORTACAO_PANELAS/assets/cartas/amarelo/2.png`
- `IMPORTACAO_PANELAS/assets/cartas/amarelo/5.png`
- `IMPORTACAO_PANELAS/assets/cartas/amarelo/6.png`
- `IMPORTACAO_PANELAS/assets/cartas/amarelo/3.png`
- `IMPORTACAO_PANELAS/assets/cartas/amarelo/1.png`
- `IMPORTACAO_PANELAS/assets/especiais/escolher_cor_queijos_overlay_full.png`
- `IMPORTACAO_PANELAS/assets/especiais/escolher_cor_mirtilos_overlay_full.png`
- `IMPORTACAO_PANELAS/assets/especiais/escolher_cor_base.png`
- `IMPORTACAO_PANELAS/assets/especiais/escolher_cor_alfaces.png`
- `IMPORTACAO_PANELAS/assets/especiais/escolher_cor_tomates_overlay_full.png`
- `IMPORTACAO_PANELAS/assets/especiais/escolher_cor_queijos.png`
- `IMPORTACAO_PANELAS/assets/especiais/carta_escolher_cor_integrada_referencia.png`
- `IMPORTACAO_PANELAS/assets/especiais/Coringa_400x850.png`
- `IMPORTACAO_PANELAS/assets/especiais/escolher_cor_alfaces_overlay_full.png`
- `IMPORTACAO_PANELAS/assets/especiais/escolher_cor_mirtilos.png`
- `IMPORTACAO_PANELAS/assets/especiais/escolher_cor_tomates.png`
- `IMPORTACAO_PANELAS/assets/cartas_mais4_mais6/carta_mais4_tomates_overlay_full.png`
- `IMPORTACAO_PANELAS/assets/cartas_mais4_mais6/carta_mais6_alfaces_sprite.png`
- `IMPORTACAO_PANELAS/assets/cartas_mais4_mais6/carta_mais6_tomates_overlay_full.png`
- `IMPORTACAO_PANELAS/assets/cartas_mais4_mais6/carta_mais6_mirtilos_overlay_full.png`
- `IMPORTACAO_PANELAS/assets/cartas_mais4_mais6/carta_mais4_completa.png`
- `IMPORTACAO_PANELAS/assets/cartas_mais4_mais6/carta_mais6_montagem_interativa_teste.png`
- `IMPORTACAO_PANELAS/assets/cartas_mais4_mais6/carta_mais6_queijos_overlay_full.png`
- `IMPORTACAO_PANELAS/assets/cartas_mais4_mais6/carta_mais4_tomates_sprite.png`
- `IMPORTACAO_PANELAS/assets/cartas_mais4_mais6/carta_mais6_completa.png`
- `IMPORTACAO_PANELAS/assets/cartas_mais4_mais6/carta_mais4_alfaces_sprite.png`
- `IMPORTACAO_PANELAS/assets/cartas_mais4_mais6/carta_mais4_base_sem_ingredientes.png`
- `IMPORTACAO_PANELAS/assets/cartas_mais4_mais6/carta_mais4_queijos_overlay_full.png`
- `IMPORTACAO_PANELAS/assets/cartas_mais4_mais6/carta_mais4_mirtilos_sprite.png`
- `IMPORTACAO_PANELAS/assets/cartas_mais4_mais6/carta_mais6_base_sem_ingredientes.png`
- `IMPORTACAO_PANELAS/assets/cartas_mais4_mais6/carta_mais4_alfaces_overlay_full.png`
- `IMPORTACAO_PANELAS/assets/cartas_mais4_mais6/carta_mais4_montagem_interativa_teste.png`
- `IMPORTACAO_PANELAS/assets/cartas_mais4_mais6/carta_mais6_queijos_sprite.png`
- `IMPORTACAO_PANELAS/assets/cartas_mais4_mais6/carta_mais4_mirtilos_overlay_full.png`
- `IMPORTACAO_PANELAS/assets/cartas_mais4_mais6/carta_mais4_queijos_sprite.png`
- `IMPORTACAO_PANELAS/assets/cartas_mais4_mais6/carta_mais6_tomates_sprite.png`
- `IMPORTACAO_PANELAS/assets/cartas_mais4_mais6/carta_mais6_mirtilos_sprite.png`
- `IMPORTACAO_PANELAS/assets/cartas_mais4_mais6/carta_mais6_alfaces_overlay_full.png`
- `IMPORTACAO_PANELAS/assets/padronizadas/verso_oficial_400x850.png`
- `IMPORTACAO_PANELAS/assets/padronizadas/panela_de_pressao_400x850.png`
- `IMPORTACAO_PANELAS/assets/padronizadas/liquidificador_oficial_400x850.png`
- `Panelinha_escolher_cor_assets.zip`
- `Panelinha_Verso_Panela_Pressao_400x850.zip`
- `Panelinha_Cartas_4_6_Interativas_Novas.zip`
- `Panelinha_Mais4_Mais6_Padronizadas_400x850.zip`
- `Panelinha_Liquidificador_CORRIGIDO.zip`
- `Panelinha_Artes_+4_+6_Somente.zip`
- `Panelinha_Ajustes_Visuais_Coringa_400x850.zip`
- `IMPORTACAO_PANELAS/documentacao/padrao-400x850/PREVIA_COMPARATIVA.jpg`
- `IMPORTACAO_PANELAS/referencias_visuais/prancha_52_artes_atuais_preview.png`
- `IMPORTACAO_PANELAS/referencias_visuais/cartas_5_detalhadas_referencia.png`
- `IMPORTACAO_PANELAS/documentacao/MANIFESTO_52_PNG.json`
- `IMPORTACAO_PANELAS/documentacao/MANIFESTO_ESPECIAIS_V1.json`
- `IMPORTACAO_PANELAS/documentacao/MANIFESTO_INTERACAO_V2.json`
- `IMPORTACAO_PANELAS/documentacao/MANIFESTO_LIQUIDIFICADOR.json`
- `IMPORTACAO_PANELAS/documentacao/MANIFESTO_MAIS4_MAIS6.json`
- `IMPORTACAO_PANELAS/documentacao/MANIFESTO_PADRAO_400X850.json`

Tamanho dos arquivos retirados: 87,864,499 bytes; novos PNGs de execução: 8,682,512 bytes. Somente 23 PNGs na pasta de cartas atual.

## Verificações efetivamente executadas

- Integridade CRC dos três ZIPs e SHA-256/dimensões dos 23 PNGs: aprovados.
- `node testes/cartas_470x800.cjs`: aprovado na validação final após as exclusões. 52 combinações + cinco especiais + verso, duas camadas alinhadas, borda externa/cor/espessura/proporção, oito layouts de 568×320 a 1920×1080 em Individual/Duplas, mãos grandes, seletores nas quatro cores, acúmulos legais de +4/+6 e recusa de +4 sobre +6, compras normais/punitivas, descarte, Panela/Liquidificador, corte e recursos offline. As duas falhas iniciais foram do medidor de geometria com rotação e do toque sintético da fixture; ambos corrigidos, usando medidas locais sem transformação e toque real.
- `node testes/halo_cartas_470x800.cjs`: aprovado. Rasterização do halo máximo contra a silhueta das seis molduras: zero pixels de sobreposição; folga 5,25 px em cima/baixo/esquerda/direita.
- `node testes/cartas_multiplayer_470x800.mjs`: aprovado. Projeções reais do servidor, Individual/Duplas: frente só para dono/parceiro e verso branco para os demais. Não abriu salas públicas.
- `node testes/mao_dois_toques.cjs`: aprovado com os novos componentes. Toque real, troca/cancelamento, inválidas, cortes válidos/expirados, Bloqueio, penalidades, teclado, mouse híbrido, leques com 40/160 cartas e comando multiplayer validado pelo motor autoritativo.
- Inspeção das capturas da galeria, mesa, seleção de cor e halo; sem erros JavaScript ou imagens quebradas.
- `npm run build`, sintaxe JS/Python e `git diff --check`: aprovados. O build rejeita arquivos antigos/excedentes e referências de carregamento aos caminhos substituídos.
- Código do motor, servidor, Android nativo e identidade de assinatura: sem alteração. Manifestos de cenário, fontes, avatares/menu e sons preservados e validados pelo build.

Nenhum emulador/instrumentação Android executado. O código dos testes nativos foi atualizado para os novos assets, mas sua execução e instalação/atualização/retenção no aparelho físico permanecem não realizadas.

## Publicação e APK final

[GitHub Actions 42397314525](https://github.com/LucasCunh4/Panelinha/actions/runs/42397314525): **sucesso**, uma compilação assinada. KVM/emulador/instrumentação/atualização ignorados por opção; artefato `status.json`: `not-run`, `emulatorStarted: false`.

APK **0.2.49 / código 6902**, acima do anterior 6802, 62.890.790 bytes. [Download direto, sem ZIP](https://github.com/LucasCunh4/Panelinha/releases/download/v0.2.49/Panelinha-Teste-v0.2.49-c6902.apk).

Verificador executado sobre o APK realmente baixado da Release: assinatura v2, certificado geração 2 `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`, pacote `com.lucascunha.panelinha.teste`, origem `https://localhost`, landscape e recursos aprovados. Contém exatamente os 23 PNGs novos de cartas e nenhum diretório das artes substituídas. HTML/JS/CSS empacotados conferem byte a byte com o código da entrega; SHA-256, tamanho e metadados conferem com Release e artefato bruto.

Mesmo pacote/certificado/origem e código crescente permitem atualizar sem desinstalar. Nenhuma chave ou dado local alterado; instalação/atualização/retenção real no Android físico não executadas.

Web publicada no Worker existente `165c3566-c63a-407e-89a9-30b9b3fc38eb`: 32 recursos (23 PNGs + 9 arquivos de apresentação) conferidos por SHA-256 contra o build local; saúde Fase 3 ativa. Motor/servidor e configurações não alterados. A prévia web foi exportada e os recursos também copiados para Android sem reconstrução adicional ou testes de emulador.
