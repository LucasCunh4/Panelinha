# Integração visual e sonora oficial

Base: `e90ff4b81ee2cf17d41e17de762e824bda359894`, branch `android/apk-testes`, conferida antes das alterações. Nenhum trabalho anterior foi perdido. A API confirmou o mesmo HEAD remoto; o transporte Git anunciou uma referência antiga, ancestral, sem divergência de conteúdo a incorporar.

## Implementação

- Quatro ZIPs íntegros, verificação CRC completa, SHA-256 e caminhos seguros antes de editar. Os 39 PNGs e 30 MP3s foram decodificados; os arquivos finais são cópias exatas dos aprovados. Manifesto com tamanho/hash/dimensões/duração exigido no build e no APK. Pacotes brutos desta integração removidos da árvore ativa depois da importação, com documentação e histórico preservados.
- Cozinha aprovada em contain, com enquadramento único para fundo, seis utensílios e vapor nas duas panelas. Título com nove letras individuais, tampa sobre P e cinco brilhos. Animações suaves e modo de movimento reduzido; nenhuma cozinha SVG antiga permanece renderizada.
- Nove avatares oficiais, sem futebol, com proporção integral, galeria, prévia e avatar humano na mesa. Migração segura dos seis IDs temporários, nomes e outros dados preservados. Bots independentes.
- SFX WebAudio locais, desbloqueio pela interação, volume/silêncio persistentes, carregamento limitado a duas cargas simultâneas e seis vozes. Sons ligados a ações confirmadas; renderizar não emite som. Compras em lote têm limitação de sobreposição. Página oculta/saída/silêncio interrompem fontes pendentes. Não há música nem serviços externos.
- Especiais substituem o som comum do descarte. Última carta toca somente após aceitação/deduplicação do anúncio. Cronômetro lê o deadline real: ticks 5–2 e final em 1; demo não é reproduzida. Penalidades 2–3 usam faixa 2, 4–5 usam 4, 6–11 usam 6, 12+ usam 12. Jogador Pronto está reservado, sem criar lobby fictício.
- Regras, artes de cartas, Mesa V1, posição dos jogadores, bots, opções e especificação de multiplayer preservados. Comparação direta confirmou onze funções centrais de regras/bots idênticas à base. Host Android, origem, assinatura, pacote, landscape e imersão não foram alterados.

Arquivos principais: `menu-arte.js/css`, `sons.js/css`, `perfil.js`; observadores mínimos em `index.html`, `mesa.js`, `anuncios.js` e `navegacao.js`. Detalhes em `IMPORTACAO_PANELAS/documentacao/integracao-visual-sonora/INTEGRACAO.md`.

## Testes executados

- `npm run build` e `npm run sync:android`: aprovados.
- `python3 testes/versao_android.py`: cinco testes aprovados.
- 23 suítes web Chromium/Playwright: aprovadas. Incluem todas as 22 anteriores e `visual_sonoro.cjs`. Logs individuais e resultados em `evidencias-visual-sonoro/`.
- Nova suíte: 69 hashes, seis landscapes 568×320 a 1920×1080, nove letras, tampa/cinco brilhos, ganchos, vapor, nove seleções de avatar, migração/fallback, persistência, três layouts de perfil, volume/silêncio, 30 MP3s reais decodificados por WebAudio, sons de nove tipos de cartas, corte, compras, penalidades 2/4/6/8/12/20, conservação, cor, Panela sem seletor, Liquidificador sem seletor, anúncio humano/três bots, vitória/derrota, relógio sem duplicação, opções e execução offline com recursos carregados.
- Regressões preservadas: penalidades/desafios, +6 opcional, Panela e conservação, corte 2,2 s, mãos até 100 cartas, estabilidade das mãos dos bots, seleção interativa, direção/halo, navegação e compatibilidade do pacote web Android.
- `git diff --check`, sintaxe JS/Python: aprovados.

Os testes do navegador comprovaram decodificação e disparo das fontes WebAudio; não equivalem a uma avaliação auditiva no alto-falante de um celular. O teste offline do navegador usa os recursos locais já carregados. A ausência de rede real no Android é verificada pela instrumentação própria, separadamente.

## Android

Instrumentação ampliada para 13 testes offline, preservando os anteriores, mais atualização/persistência. O novo caso confere cenário, letras, avatares, áudio local e configurações; persistência inclui também volume/silêncio. Compilação, verificação do APK real, resultado do emulador e link serão registrados após concluir o workflow existente.
