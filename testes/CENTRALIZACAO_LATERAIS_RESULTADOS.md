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
- Build web com verificação de assets: **aprovado**. [Workflow 43664856487](https://github.com/LucasCunh4/Panelinha/actions/runs/43664856487): **sucesso**, fonte `82bb4cc21833a3fb8479d1b50dd9d003600c8e0b`; um APK final, emulador explicitamente `skipped`.
- APK baixado da Release e novamente verificado com `ferramentas/verificar_apk.py`: assinatura v2, certificado ativo, pacote, origem, sensorLandscape, ícones, código web idêntico ao fonte e recursos aprovados íntegros; metadados locais idênticos aos publicados pela CI.

## APK final

**[Baixar panelinha.apk 0.2.63 diretamente](https://github.com/LucasCunh4/Panelinha/releases/download/v0.2.63/panelinha.apk)** — 63.054.467 bytes, sem ZIP.

Código **8302 > 8202**, pacote **com.lucascunha.panelinha.teste**, origem **https://localhost**. Compatível com atualização direta das versões da geração 2, sem desinstalar ou limpar dados.

Certificado SHA-256: `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`.

SHA-256 do APK: `a471817a97d235cb6412b7bb75e1db61eea723d0d576d5efee1165efe2153a9c`. Metadados completos em `CENTRALIZACAO_LATERAIS_APK_0.2.63.json`.

Web publicada em https://panelinha-lobby.lucas260802.workers.dev, versão Worker `944344de-0367-4bfc-9af8-5db63db2ea3b`; arquivos conferidos por SHA-256 contra o build e `/health` fase 3 saudável. Nenhuma regra/binding do servidor alterado.

Sem emulador/instrumentação ou aparelho Android físico. Instalação, retenção real de dados e fluidez no aparelho continuam pendentes; nenhuma dessas verificações é declarada aprovada.
