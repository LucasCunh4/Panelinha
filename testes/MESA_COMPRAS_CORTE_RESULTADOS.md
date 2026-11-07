# Mesa, compras, corte e controles — verificações direcionadas

Base preservada: HEAD `496f1966f7a0b02c098db90f9a629239e0f51994` da branch `android/apk-testes`, APK anterior 0.2.43/c6302. Diretório limpo ao iniciar; nenhuma alteração anterior perdida ou sobrescrita. HEAD confirmado na API/servidor GitHub, sem reset ou force push.

## Implementado

- Somente os três avatares alheios aparecem na mesa, maiores, circulares, com nomes reais e contadores públicos. O próprio avatar permanece no perfil/pódio. Perspectivas multiplayer preservadas, inclusive substituição por bot. Contadores usam a quantidade real do snapshot, enquanto o leque representa as cartas que já chegaram visualmente.
- Chama recebe mais 3 px CSS para a esquerda, compensando o cover e preservando o deslocamento anterior. A órbita recebe 2 px CSS para baixo: tamanho, raios, correção inferior anterior, deslocamento horizontal de -4 px, sentido, velocidade e brilho preservados. Sem alterar PNGs ou intensidade.
- Cartas em voo ficam fora do layout por uma coleção de apresentação, sem remover/mudar cartas reais. Cada chegada atualiza o leque; cartas existentes ajustam-se suavemente. A mão continua compacta/expansível por cor. Guardar inclui a carta após o voo até a mão.
- Cronograma compartilhado fixo, independente da quantidade: compra normal 2400 ms por carta, intervalo 1300 ms; carta jogável alcança o destaque em 960 ms e já oferece Jogar/Guardar, permanecendo até a decisão. Punições 1000 ms por carta, intervalo 480 ms; demais clientes veem apenas versos e deslocamento direto (650 ms em punição, 850 ms em compra normal). Sem aceleração progressiva ou redução da duração pelo tamanho da sequência.
- A trava de punição permanece autoritativa: última chegada mais margem de 200 ms. Compras reais, desafios, denúncia, turno/cronômetro e desconexão não dependem de ACK do comprador. Sequências grandes podem levar mais tempo, como consequência do ritmo fixo solicitado.
- Última Carta usa a mesma validação de jogadas, agora incluindo cortes legais com duas cartas e carta comprada que deixe uma. Após corte bem-sucedido, o autor pode anunciar por 300 ms e denúncias ficam temporariamente impedidas; após o prazo, voltam normalmente. Não há proteção extra em descarte comum. Bloqueio, penalidades e efeitos de troca continuam respeitados. Pausa congela o restante; relógio e ordem do servidor decidem. Quando um efeito especial bloqueia interações por sua apresentação, os 300 ms começam depois dela.
- Na compra há somente Jogar/Guardar e Última Carta quando permitido, sem Guardar e passar separado nem botão de anúncio duplicado fora do preview. O comando Guardar mantém a regra existente de passagem.

## Resultados reais

- `node --test --test-reporter=spec multiplayer-server/tests/mesa-compras-corte.test.mjs`: **6/6** — ritmos para 1/2/20/40/118 cartas; anúncio antes/depois do corte; denúncia rejeitada até 299 ms e permitida em 300 ms; anúncio aceito antes do prazo impede punição; ausência de imunidade em descarte comum; Bloqueio/penalidade; pausa/retomada; carta comprada; conservação, privacidade e liberação sem ACK em punições de 2/6/20 cartas.
- `node --test --test-reporter=spec multiplayer-server/tests/gameplay-podium.test.mjs`: **7/7** — regressões diretamente afetadas de Bloqueio, Panela proibida sob penalidade e normal fora dela, compra forçada, desafio, desconexão, pausa/denúncia e pódio anterior.
- Chromium/Playwright, `testes/mesa_compras_corte.cjs` e cenário adicional `--online-only`: aprovados em blocos. Avatares/nomes/contadores em **844×390 e 1280×800**; geometria da chama/órbita; compra infinita com chegadas individuais sem espaços futuros; Guardar com incorporação posterior; preview/controles rápidos e anúncio válido sem duplicação; punição com duração fixa e trava até o fim; compras alheias somente verso; anúncio antes/depois do corte; leque compacto 40→41 cartas e expansão por toque; quatro perspectivas de snapshots autoritativos e contadores após Liquidificador/Panela. Sem erros JavaScript registrados nessas verificações.
- `npm run build`: **aprovado**, recursos/sons/manifestações conferidos, 52 PNGs originais e código web preparados para o APK. `git diff --check` aprovado. Nenhuma bateria completa ou repetitiva foi executada; testes existentes preservados, com expectativas de cronograma afetadas atualizadas.
- Worker existente atualizado: `b620cca9-38d9-412a-856c-8ad44bb0f397`. Bindings, migração, conta e credenciais mantidos.

## APK e limitações

[Baixar APK 0.2.44 / código 6402 diretamente, sem ZIP](https://github.com/LucasCunh4/Panelinha/actions/runs/42320244504/artifacts/13553295186). Requer sessão no GitHub; retenção até 05/02/2027.

[Workflow #44](https://github.com/LucasCunh4/Panelinha/actions/runs/42320244504), fonte `4a7de7f042e344f85c0ab23978562dd6889cdd0a`: compilação e assinatura **aprovadas**. Uma única execução final solicitada; o mecanismo anterior de APK auxiliar para o teste de atualização foi mantido. Somente o APK final é disponibilizado para uso.

O arquivo baixado do Actions foi novamente verificado com `ferramentas/verificar_apk.py`: assinatura APK v2, certificado fixo, pacote, origem, orientação, todos os recursos e módulos/HTML exatamente iguais ao fonte preparado. Metadados locais idênticos aos do Actions e SHA-256 igual ao digest do artefato.

- Pacote: `com.lucascunha.panelinha.teste`; origem `https://localhost`.
- Certificado geração 2: `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`.
- Versão `0.2.44`, código **6402 > 6302** da anterior 0.2.43.
- SHA-256 APK: `a4bfa9cfbe2653607a3c785c1038348cc276251fd853446ecf65a6a7414daf10`.
- Release sem debug; `sensorLandscape`, origem local e recursos offline preservados. Mesmo certificado/pacote/origem permitem atualização da geração 2 sem desinstalar. Nenhuma chave nova, alteração de Secrets ou limpeza de dados.

**Instrumentação Android não aprovada:** o emulador/ADB ficou `offline` durante `a_imagesAndThreeBotsOffline`. Só há registro de início do primeiro teste (`INSTRUMENTATION_STATUS_CODE: 1`), sem conclusão: **0/13 testes Android concluídos**. Nenhuma falha de asserção do aplicativo foi registrada nesses resultados; a causa raiz da perda do emulador não foi determinada. O teste real de instalação por cima com retenção de dados **não foi executado**. Release corretamente pulada pelo gate anterior; artefato APK direto disponibilizado. Nenhum teste removido/desativado e nenhuma execução pendente declarada aprovada.

As verificações de toque no navegador não substituem Android físico. Testes de servidor desta atualização usam diretamente o motor/validador autoritativo e projeções por cliente; não foi repetida a bateria extensa de rede. Atualização real com retenção de dados depende da instrumentação Android. Partida local em memória não passa a ser um salvamento persistente.


Pós-publicação: `/health` respondeu fase 3 ativa; hashes públicos de `motor.js`, `efeitos-mesa.js` e `online.js` coincidem com o código testado.
