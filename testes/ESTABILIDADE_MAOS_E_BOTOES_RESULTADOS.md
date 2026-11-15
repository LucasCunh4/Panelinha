# Estabilidade das mãos e ações da mesa

## Recuperação e correções

Checkout e HEAD remoto preservados em `67c02f8`, sem alterações não commitadas perdidas. Base publicada: 0.2.60/c8002.

- **Compras:** a mão humana era recriada integralmente por `innerHTML` a cada render. O diagnóstico contou 7 botões e 28 imagens substituídos numa atualização sem mudança de cartas; após a correção, zero substituições. `renderHand` reconcilia por ID, preservando imagens, hover, foco e ouvintes. O layout só reaplica posições quando sua geometria muda.
- **Chegadas:** animações de reorganização podiam disputar o mesmo `transform`, sobretudo nas punições sobrepostas. Uma única interpolação é recalculada a partir da posição visível atual, nos quatro leques; deslocamentos são convertidos para o plano dos leques laterais. A posição final é medida sem transições CSS concorrentes, evitando também o nascimento da carta nova numa posição padrão intermediária. Leitura de geometria e escrita de animações são agrupadas.
- **Panela de Pressão:** os sprites eram removidos aos 1900 ms e as mãos só voltavam aos 2000 ms, causando um vazio de 100 ms. A representação animada agora permanece até a troca pelas mãos finais. O destino é calculado sem transições CSS ocultas. Mantidos os quatro participantes elegíveis, conservação, redução do autor, privacidade, prazo e regras existentes.
- **Botões:** denúncia de última carta, desafio +4/+6, anúncio, Jogar, Guardar e Visualizar mesa usam acabamento comum dourado/roxo, relevo, resposta ao toque e foco acessível. Cores semânticas anteriores preservadas: verde, vermelho e violeta. Nenhuma ação/regra foi alterada.
- **Visualizar mesa:** pressionar mostra a mesa; soltar retorna imediatamente à carta. Captura do ponteiro permite soltar fora do botão. Cancelamento de toque, perda de foco/visibilidade, Escape e Voltar também restauram a escolha. Espaço/Enter funcionam enquanto pressionados. O botão conserva sua posição; não existe mais botão separado de retorno. A cor e a jogada ficam pendentes, sem ações incompatíveis ou revelação de cartas ocultas.

## Verificações executadas

Chromium `/usr/bin/chromium`, Playwright, sem emulador:

- `testes/estabilidade_maos_botoes.cjs`: compras normais humanas/alheias e +20; persistência das cartas/imagens, sem transforms concorrentes, leque progressivo, conservação e limpeza. Panela Individual/Duplas em 844×390 e 1280×800; transição sem vazio e sem seletor de cor. Botões/cores/ações. Pressionar/soltar com mouse, toque, teclado, cancelamento e perda de foco nas três especiais em 568×320, 844×390 e 1280×800; seleção/offline preservados. **Aprovado.**
- `testes/estabilidade_snapshots.cjs`: snapshots privados gerados pelo motor autoritativo, Individual/Duplas; compra alheia fechada, mãos persistentes, Panela com quatro mãos, sem reinício em atualizações repetidas e conservação. **Aprovado.** São simulações locais de snapshots; não uma partida entre quatro dispositivos reais.
- `testes/elementos_cores.cjs`: três especiais em cinco tamanhos, 12 escolhas por mouse/toque, transparência, hover, teclado, cancelamento, movimento reduzido e recursos carregados offline. Teste anterior adaptado para pressionar/soltar. **Aprovado.**
- `testes/mesa_artes_animacoes.cjs`: distribuição inicial e nova rodada, bloqueio visual do descarte, cancelamento seguro, seletor pendente, Inverter, Liquidificador Individual/Duplas, bot comprando antes de descartar e proteção autoritativa do próximo descarte/corte. **Aprovado.**
- `node --check` nos scripts alterados, `git diff --check` e build web com verificação dos hashes dos assets: **aprovados**.
- Inspeção de capturas de celular e tablet: escolha de cor e botões legíveis/contidos, mão e mesa preservadas.

Evidências textuais em `evidencias-estabilidade-maos-botoes/`. Capturas locais em `/workspace/work/estabilidade-maos-botoes/`.

## Android e publicação

Compilação final pelo workflow existente, sem emulador, com os quatro Secrets atuais e verificador de identidade/integridade preservados. Dados do APK real e link serão registrados após a conclusão da execução.

Não executados: emulador/instrumentação, abertura em Android físico, atualização com conferência de retenção real de dados e medição de desempenho em aparelhos reais. Nenhum teste removido ou marcado como aprovado sem execução. Regras, `motor.js`, servidor, assets, sons, armazenamento, pacote e certificado não foram alterados.
