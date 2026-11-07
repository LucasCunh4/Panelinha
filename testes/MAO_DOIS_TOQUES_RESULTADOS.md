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

## Entrega

Execução única [42389486516](https://github.com/LucasCunh4/Panelinha/actions/runs/42389486516) **aprovada**; nenhuma etapa de emulador/KVM/instrumentação executada. Artefato registra `not-run` e `emulatorStarted: false`.

APK **0.2.48/c6802**, superior ao anterior c6702. `ferramentas/verificar_apk.py` aprovado no APK real baixado: assinatura v2, certificado geração 2, pacote `com.lucascunha.panelinha.teste`, origem `https://localhost`, landscape, código web e todos os recursos aprovados. Hash, tamanho e metadados locais conferem com a Release e o artefato bruto. Mesma identidade e código crescente permitem atualizar sem desinstalar; instalação e retenção efetiva de dados no Android físico não foram executadas.

[Download direto do APK, sem ZIP](https://github.com/LucasCunh4/Panelinha/releases/download/v0.2.48/Panelinha-Teste-v0.2.48-c6802.apk).

Web publicada no Worker existente (`693c66fc-3f77-4640-b599-c6fc34f7ffbc`), sem mudanças de configuração/motor. Hashes dos três arquivos alterados conferidos contra `dist`; saúde Fase 3 ativa. Não foram executadas baterias extensas nem gerados APKs intermediários.
