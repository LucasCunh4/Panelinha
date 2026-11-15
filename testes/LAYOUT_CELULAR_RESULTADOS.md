# Mesa proporcional e identificação lateral

Base preservada: `android/apk-testes`, HEAD local/remoto `133fb25`, APK 0.2.61/c8102. Sem alterações anteriores perdidas.

## Ajustes

- Identificação local movida da faixa inferior para a esquerda da mão: avatar circular, nome real e contador. Texto inserido com `textContent`; nomes longos ocupam até duas linhas, com nome completo no título/descrição acessível. No multiplayer usa o nome da perspectiva local.
- Faixa inferior organizada em três regiões: identificação, cartas e ações. Reservas laterais simétricas mantêm o leque centralizado e liberam sua altura, com o contador fora da área das cartas. Botões continuam acessíveis e mantêm seus estilos/ações. Resultados/pódio mantêm o modal existente.
- Landscape com até 600 px de altura: tamanho-base das cartas passa a `clamp(34px,10.8vh,60px)`, conservando a escala proporcional do componente, conteúdo 470×800, moldura externa 25 e total 520×850. Leques e avatares alheios adaptados; parceiro permanece aberto em Duplas. Em 844×390, o tamanho-base humano cai aproximadamente 12%, ao mesmo tempo em que a faixa de identificação deixa de empurrar a mão para cima.
- Chama adaptada à altura útil, incluindo celulares muito largos em que `cover` ampliava o cenário. Limite uniforme por altura e área segura; centro, fundo oficial, cores, animações e crescimento relativo com penalidades preservados. Nenhum PNG foi deformado ou editado.
- Área segura inferior aplicada uma vez, evitando somar deslocamento inferior e padding. Avatares laterais acima dos leques no celular, liberando a região dos botões. Nomes evitam identificação/ações, além das cartas/avatares já considerados.

Código alterado: `partida-ui.css` (organização/escala responsiva), `mesa.js` (identificação, orçamento da chama e posicionamento dos nomes) e `efeitos-mesa.css` (composição da escala responsiva da chama com a intensidade da penalidade). Motor, servidor, armazenamento, artes, sons e configuração Android preservados.

## Verificações efetivamente executadas

- `testes/layout_celular.cjs`: **aprovado**. 54 verificações estáticas em 568×320, 667×375, 740×360, 844×390, 915×412, 1000×360, 1024×600, 1280×800 e 1366×768, com mãos de 7/20/40 cartas e fogo normal/+20. Cartas proporcionais, identificação à esquerda, avatares circulares, sem rolagem da mesa ou contato com o envelope visível da chama. Nove casos adicionais de foco/grupo expandido e de três ações simultâneas com nome longo. Área inferior de 24 px simulada em quatro celulares. Compra/Guardar/descarte com animações reais, contador correto e descarte por um toque. Sem erros JS.
- O teste com foco revelou um contato residual em 740×360; o limite da chama foi corrigido e a verificação final passou, incluindo grupo expandido e área segura.
- `testes/refinos_pontas_liquidificador.cjs`: **aprovado**. 52 combinações sem cortes, quatro sequências do Liquidificador em Individual/Duplas e ambos os sentidos, recolhimento/pilha/giro/leque, privacidade, conservação, alinhamento final e ritmos de compra preservados.
- `testes/estabilidade_snapshots.cjs`: **aprovado**. Perspectiva local e nome correto nos snapshots do motor autoritativo, Individual/Duplas, mãos persistentes, compras alheias ocultas, Panela com quatro mãos sem reinício e conservação. Simulação local de snapshots, sem partida real entre quatro dispositivos.
- `testes/mesa_artes_animacoes.cjs`: **aprovado**. Distribuição inicial/nova rodada, apresentação do descarte e cancelamento seguro, seletor e pressionar para visualizar mesa, Inverter, Liquidificador, compra do bot antes do descarte, bloqueio autoritativo e cortes. Expectativa do contador ajustada à nova identificação.
- Inspeção das capturas de celular/tablet, `node --check` e `git diff --check`: **aprovados**.

Somente verificações direcionadas no Chromium/Playwright. Nenhum emulador ou instrumentação Android. Evidências textuais em `evidencias-layout-celular/`; capturas locais em `/workspace/work/layout-celular/final/`.

## APK e limitações

APK final será registrado após a compilação pelo workflow existente e verificação do arquivo real. Pacote, certificado geração 2 e origem local preservados; versionCode deve superar 8102.

Pendentes: instalação/fluidez em Android físico, atualização com retenção real de dados e conferência dos recortes de um aparelho real. A área segura foi simulada no navegador, sem alegar teste físico. Nenhum teste existente removido ou desativado.
