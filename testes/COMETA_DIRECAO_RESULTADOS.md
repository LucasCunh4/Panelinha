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

APK final, certificado, código de versão, link e resultado da etapa Android serão acrescentados após o workflow existente. Verificações em navegador não substituem Android físico. Nenhuma alteração de applicationId, assinatura, Secrets, origem, dados locais ou orientação.
