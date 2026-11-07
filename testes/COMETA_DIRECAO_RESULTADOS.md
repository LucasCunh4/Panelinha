# Cometa dourado de direção

Base recuperada: HEAD `43971d2c9ae6802ad24e4f04d849358d99334bf9`, APK 0.2.45/c6502. Diretório limpo e HEAD igual ao GitHub; nenhum trabalho perdido. A implementação do cometa ainda não havia começado antes da interrupção.

- Substituídos os oito caminhos luminosos antigos por um único cometa SVG: ponta branco-dourada, halo radial, cauda dourada contínua com gradiente, brilho externo e três partículas discretas. Nenhum PNG novo ou arte modificada. Sem anel permanente; cauda com 22,5% da trajetória.
- Volta de 3000 ms, em arco de comprimento uniforme. A órbita aprovada e seus ajustes anteriores foram mantidos: elipse horizontal, deslocamento -4 px horizontal/+2 px vertical e correção inferior anterior. Chama permanece com o mesmo deslocamento, intensidade e animações; cartas acima da camada do fogão.
- Direção vem exclusivamente de `state.direction`, compartilhada por offline e multiplayer. Inverter troca o sinal sem reiniciar a posição/fase da ponta. Movimento contínuo também na emenda da volta. Posições da cauda e ponta são calculadas ao longo do caminho, sem seta estática girando.
- Amostragem do SVG ocorre somente quando a geometria muda; por quadro, interpola-se uma tabela em memória e atualizam-se os elementos persistentes. Um único `requestAnimationFrame`, suspenso fora da mesa, em aba oculta e em movimento reduzido. Este último mantém indicador estático e oculta partículas. Sem alterar timers, ações ou regras do jogo.

Verificações essenciais efetivamente executadas:

- `node testes/cometa_direcao.cjs`: aprovado em Chromium, celular **844×390** e tablet **1280×800**. Movimento nos dois sentidos, jogada real de Inverter sem salto, cauda de 22,5%, alinhamento preservado, chama inalterada, cartas acima e indicador sem interceptar toques. Nenhum elemento do efeito antigo renderizado.
- Ciclo contínuo medido em cerca de **2979 ms**, incluindo a passagem pela emenda; maior deslocamento entre quadros ~11,4 unidades SVG em 188 amostras. Medida de navegador, não promessa de desempenho em Android físico.
- Projeções reais do motor autoritativo multiplayer nos dois sentidos: aprovadas. Sem repetir bateria de rede.
- Movimento reduzido congela órbita, oculta partículas e retoma corretamente; nenhum erro JavaScript registrado.
- `npm run build` e `git diff --check`: aprovados. Recursos/sons/hashes e 52 PNGs originais preservados. Nenhuma suíte extensa ou teste de regras executado; motor e controles não alterados.

[Baixar APK 0.2.46 / código 6602 diretamente, sem ZIP](https://github.com/LucasCunh4/Panelinha/actions/runs/42337469160/artifacts/13560432503). Requer sessão no GitHub; retenção até 05/02/2027.

[Workflow #46](https://github.com/LucasCunh4/Panelinha/actions/runs/42337469160): compilação e assinatura aprovadas. Única execução final solicitada, preservando o APK auxiliar interno do teste de atualização existente. O APK real baixado foi novamente verificado com `ferramentas/verificar_apk.py`: assinatura APK v2, certificado fixo, pacote, orientação, origem, 52 cartas/recursos/sons e código web exato conferidos. Metadados locais idênticos aos do Actions; SHA-256 igual ao digest do artefato.

- Pacote: `com.lucascunha.panelinha.teste`; origem `https://localhost`.
- Certificado geração 2: `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`.
- `versionCode` **6602 > 6502**, compatível com atualização da geração 2 sem desinstalar. Sem mudança de chave, Secrets, dados locais, landscape ou imersão.
- SHA-256 APK: `93b41d9c74f9b96da3a10a246b856e615711c4c733d4926337af041e8ce2d9d6`.

**Instrumentação Android não aprovada:** o emulador/ADB ficou `offline` durante `a_imagesAndThreeBotsOffline`. Há somente início do primeiro teste, sem conclusão: **0/13 testes Android concluídos**. Nenhuma falha de asserção do aplicativo registrada nesses resultados; causa raiz da perda do emulador não determinada. Instalação por cima com retenção de dados **não executada**, permanece pendente. Release corretamente pulada pelo gate existente; APK assinado disponível como artefato direto. Nenhum teste desativado. Verificações em navegador não substituem Android físico.

Publicação web existente atualizada, versão `1d2f3eb6-c8ed-4ef4-855f-9efb620cdfb4`; HTML, `mesa.js` e `mesa.css` publicados conferidos byte a byte com o build. Sem alteração da lógica autoritativa, bindings, conta ou credenciais.
