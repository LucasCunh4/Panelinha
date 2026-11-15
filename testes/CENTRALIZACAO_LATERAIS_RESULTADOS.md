# Correção da centralização lateral

Base: 0.2.62/c8202, checkout e HEAD remoto `a56690d` preservados.

O ajuste anterior deslocou os assentos laterais 64 px para cima e calculava o topo do leque incluindo a altura da identificação. Em 844×390, ambos os leques ficaram 31,62 px acima do eixo do fogão. A verificação anterior cobria espaço e sobreposição, mas não media o eixo das cartas.

## Correção localizada

- Em landscape até 600 px, ambos os assentos passam a usar `--burner-y` diretamente e têm altura `--side-fan`; o leque fica em 50%. Avatar/nome deixam de participar do cálculo do centro das cartas.
- Avatar permanece acima do leque. Removido o deslocamento horizontal assimétrico de 24 px do avatar direito nas telas menores.
- Quando há três ações simultâneas e o humano tem duas cartas, os botões usam duas colunas no espaço livre à direita. Isso evita uma coluna alta invadindo a mão lateral e dispensa subir os jogadores para acomodar botões.
- Mantidos identificação local à esquerda, dimensões responsivas, chama, artes, regras, bots, multiplayer, dados e configuração Android.

Código: `partida-ui.css` e uma classe de apresentação em `mesa.js`. Nenhuma regra ou asset alterado.

## Verificações realizadas

- Diagnóstico antes/depois em Chromium: erro vertical de **−31,62 px → −0,00045 px** para ambos os lados em 844×390.
- `testes/layout_celular.cjs`: **aprovado**. Adicionadas verificações dos centros do contêiner, das cartas renderizadas e do alinhamento horizontal do avatar, com tolerância de 0,5 px; botões também são confrontados com as cartas laterais. Preservadas as 54 configurações em nove resoluções, mãos 7/20/40, fogo normal/+20, foco/expansão, três ações, nome longo e área inferior simulada de 24 px. Compra/Guardar/descarte reais no navegador aprovados.
- `testes/refinos_pontas_liquidificador.cjs`: **aprovado**. Quatro rotações em Individual/Duplas, nos dois sentidos, com alinhamento no destino, conservação/privacidade e limpeza. 52 combinações e prazos de compra preservados.
- Capturas de celular inspecionadas; `node --check` e `git diff --check` aprovados. Evidências em `evidencias-centralizacao-laterais/`; capturas locais em `/workspace/work/centralizacao-laterais/`.
- Build web e APK serão registrados após a compilação e verificação do arquivo publicado.

Sem emulador/instrumentação ou aparelho Android físico. Instalação, retenção real de dados e fluidez no aparelho continuam pendentes; nenhuma dessas verificações é declarada aprovada.
