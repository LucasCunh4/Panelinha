# Mão em dois toques e cometa longo — 07/11/2026

Base: HEAD `d2d5dd2`, APK 0.2.47/c6702, checkout limpo e idêntico à branch remota. Trabalho anterior preservado.

- Toque/caneta: uma única carta selecionada, elevada 12 px por transform; segundo toque tenta jogar a mesma carta pelo validador existente. Outra carta troca a seleção; toque fora cancela. Deslocamento/rolagem cancela o gesto sem jogar.
- Mouse, inclusive em híbridos: hover e clique único; teclado com foco visível, setas, Home/End, Enter/Espaço e Escape. A origem real do evento decide a interação, sem classificar o aparelho inteiro por suporte a toque.
- Leque contínuo por cor, expansão e rolagem preservados. Seleção por ID resiste a render sem mudança; mão, turno, redistribuição, rotação ou bloqueio de apresentação limpam a seleção. Captura da origem do descarte preserva a posição levantada.
- Cartas inválidas permitem inspeção; segundo acionamento recebe o feedback existente e não passa pela validação. Regras offline/servidor, bots e controles de compra inalterados.
- Cometa com cauda de 90% da mesma órbita e mesmo período 3,6 s. Três camadas afuniladas e máscara gradual ao longo da curva evitam que o gradiente apague o lado oposto; sem aro completo estático.

## Executado

- `node testes/mao_dois_toques.cjs`: aprovado após corrigir a precedência CSS do hover sobre a seleção. Toque real no Chromium, seleção/troca/cancelamento, vizinhas estáveis, descarte, inválidas, corte válido/expirado, Bloqueio/penalidade, transição, limpeza por mudança, leque com 40 cartas em 844×390 e 1280×800, arraste interno com 160 cartas, mouse híbrido, setas/Enter e comando online validado no motor autoritativo. Transporte online simulado, sem criar sala pública.
- `node testes/cometa_direcao.cjs`: aprovado; duas resoluções, duas direções, Inverter real, cauda de 90%, alinhamento/chama preservados, período medido ~3592 ms, sem salto na emenda, projeções multiplayer e movimento reduzido.
- Capturas de seleção e cometa inspecionadas; sem erros JavaScript.
- `npm run build`, sintaxe JS e `git diff --check`: aprovados; artes/manifestos preservados.

Nenhum emulador ou teste de instrumentação, instalação/atualização ou persistência Android executado. Desempenho e sensação no dispositivo físico aguardam teste do usuário. Testes anteriores mantidos; apenas expectativa da cauda atualizada no teste específico.

APK final e publicação: a registrar após o GitHub Actions.
