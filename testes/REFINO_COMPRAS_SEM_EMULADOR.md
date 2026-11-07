# Refinamento das compras e do cometa — 07/11/2026

Base recuperada: `fe33316`, APK anterior 0.2.46/c6602. Nenhuma alteração anterior foi descartada.

- Cometa: volta de 3,6 s (velocidade 16,7% menor), três fitas afuniladas com gradientes, núcleo branco-dourado, halo e reflexos. Mesma trajetória e posição.
- Compras: o intervalo anterior (1300/480 ms) era menor que o voo (2400/1000 ms), sobrepondo apresentações. Agora há fila com uma carta ativa por comprador; próximo início só após terminar a anterior. Ritmos fixos 2460/1060 ms, mantendo duração normal de 2400 ms e punitiva de 1000 ms. Escolha Jogar/Guardar permanece até decisão.
- Curvas com transform/opacity, leituras de geometria agrupadas e encaixe na posição real da carta. Removida busca repetida da timeline em cada render; correção somente para retomada/desvio autoritativo relevante. Leque incorpora cada carta ao chegar.
- Botões finais com mais espaço; em tela baixa, padding ajustado para evitar os 5 px de rolagem identificados na primeira verificação.
- Workflow existente: emulador opcional, desligado por padrão; assinatura, integridade e versão continuam obrigatórias. Testes antigos mantidos.

## Verificações efetivamente executadas

- `npm run build`: aprovado; manifestos e recursos preservados.
- `node testes/refino_compras_sem_emulador.cjs`: cometa/direções/Inverter/movimento reduzido, compras normais/infinitas/punitivas, decisão Jogar/Guardar/Última Carta, privacidade, conservação e leque progressivo aprovados. Detectou rolagem residual no resultado; corrigida.
- `node testes/refino_compras_sem_emulador.cjs --result-only`: espaçamento/pódio/botões sem rolagem adicional aprovados em 844×390 e 1280×800.
- `node testes/refino_compras_online.mjs`: duas projeções do motor real; cartas privadas só para o dono, sequência individual, bloqueio autoritativo de 2260 ms para punição de duas cartas, liberação ao fim. Aprovado após corrigir a ordem dos assentos da fixture.
- Inspeção visual das capturas de mesa, compra e resultado; sintaxe JS/YAML/shell/Python e `git diff --check` aprovados.
- Expectativas de cadência/cauda nos testes anteriores atualizadas; essas suítes extensas não foram reexecutadas.

Nenhum emulador, instrumentação, instalação/atualização ou teste de retenção de dados Android executado nesta entrega, conforme pedido. Desempenho e sensação no aparelho físico aguardam os testes do usuário.

## APK final verificado

GitHub Actions [42386294678](https://github.com/LucasCunh4/Panelinha/actions/runs/42386294678): **sucesso**, uma compilação release, KVM/emulador/instrumentação/atualização ignorados por opção (artefato `status.json`: `not-run`, `emulatorStarted: false`). Nenhuma falha de infraestrutura nesta entrega.

APK **0.2.47/c6702**, superior a 0.2.46/c6602, pacote `com.lucascunha.panelinha.teste`, origem `https://localhost` e certificado geração 2 `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`. Verificador real `ferramentas/verificar_apk.py` aprovado sobre o APK baixado da Release: assinatura v2, identidade, landscape, 52 PNGs, recursos aprovados e bytes do código web. SHA-256 e tamanho conferem com o artefato bruto e a Release; metadados locais idênticos aos do CI.

[Baixar APK diretamente, sem ZIP](https://github.com/LucasCunh4/Panelinha/releases/download/v0.2.47/Panelinha-Teste-v0.2.47-c6702.apk).

Mesma identidade e código crescente permitem atualizar a família geração 2 sem desinstalar; instalação/atualização e retenção efetiva de dados no Android não foram executadas. Nenhum código de armazenamento local alterado.

Worker existente atualizado (`9a20530c-3e1f-406b-a310-41bfcc6212d2`), bindings/configurações preservados, health Fase 3 ativo; seis arquivos publicados conferidos por SHA-256 contra o build. Nenhuma nova sala pública criada na verificação. Reflexos do cometa conferidos no navegador após separar o posicionamento orbital da animação local das partículas.
