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

Instrumentação ampliada para 13 testes offline, preservando os anteriores, mais atualização/persistência. O novo caso confere cenário, letras, avatares, áudio local e configurações; persistência inclui também volume/silêncio.

Workflow [#35](https://github.com/LucasCunh4/Panelinha/actions/runs/42052803380), fonte `e7a056e74803ca1e29d6560e3c3f8e7901b5140d`, implementação `b331c208dde103322147b3c4c5d6a7b53df8f3ab`:

- Compilação release, instrumentação, assinatura permanente e verificação: **aprovadas**. APK **0.2.35 / código 5502**, candidato de teste de atualização 5503 reservado.
- APK efetivamente baixado e verificado com `apksigner`, `aapt` e `ferramentas/verificar_apk.py`. Metadados idênticos aos do CI; hash/tamanho correspondem ao artefato GitHub: **96.032.507 bytes**, SHA-256 `2321d5a666a8377d4f9845339750a0a2df5e267380c4fc34f2e638bfd9fbc3d0`.
- Pacote `com.lucascunha.panelinha.teste`, origem `https://localhost`, release, assinatura v2, landscape por sensor e categoria game confirmados. Certificado geração 2: `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`.
- 52 PNGs numéricos/coloridos, todas as artes especiais anteriores, Liquidificador e 69 recursos desta integração conferidos byte a byte dentro do APK; todos os scripts/estilos e HTML da fonte presentes. MP3s empacotados localmente, sem servidor remoto.
- Comparação com o APK real anterior 0.2.34/c5402: mesmo pacote, certificado e origem; código 5502 também supera o candidato 5403. **Compatibilidade de atualização direta confirmada**, sem necessidade de desinstalar. Não houve limpeza de dados nem alteração da identidade.
- **Emulador: falhou / execução incompleta.** Anunciou 13 testes e iniciou `a_imagesAndThreeBotsOffline`; nenhum caso concluiu. Em seguida o ADB ficou `offline` e a porta 5554 recusou conexão. O aplicativo chegou a CREATED/STARTED/RESUMED/Displayed. Não há FATAL EXCEPTION, Fatal signal, ANR ou asserção funcional falhada nos logs coletados; kernel sem OOM/kill/segfault e runner com 14 GiB disponíveis. A causa raiz do encerramento do AVD não foi confirmada. Isso não comprova aprovação funcional no Android.
- **Pendentes:** 13 casos nativos, instalação real por cima com teste de retenção de dados e avaliação visual/auditiva em celular físico. A identidade compatível foi verificada, mas não se declara o teste de instalação como executado. Nenhum teste foi desativado; Release permaneceu bloqueada e a falha do workflow está visível.

[**Baixar Panelinha-Teste-v0.2.35-c5502.apk diretamente, sem ZIP**](https://github.com/LucasCunh4/Panelinha/actions/runs/42052803380/artifacts/13428785379). O artefato exige sessão no GitHub. O arquivo baixado contém o próprio APK, sem ZIP externo; metadados e diagnósticos ficam em artefatos separados.

## Problemas encontrados e resolvidos durante a integração

A primeira verificação do cenário falhou em mobile após redimensionar: medidas em pixels obtidas de `innerWidth` podiam realimentar o enquadramento da viewport. O plano passou a usar diretamente unidades da viewport com `min()`, mantendo o mesmo contain para fundo e camadas; as seis dimensões e as regressões finais passaram. O primeiro caso offline da suíte nova também apontava para a primeira carta da mão ordenada, que era uma carta azul indisponível; o teste foi corrigido para tocar especificamente na Panela, sem contornar validação ou modificar o jogo. Logs desses diagnósticos iniciais foram preservados junto das execuções finais aprovadas. A falha de infraestrutura Android acima permanece pendente.
