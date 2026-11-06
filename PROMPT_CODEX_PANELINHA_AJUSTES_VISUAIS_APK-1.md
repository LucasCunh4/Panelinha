# CODEX — PANELINHA | AJUSTES VISUAIS, ANIMAÇÕES E APK

## Contexto e prioridade

Trabalhe no repositório `LucasCunh4/Panelinha`, branch **`android/apk-testes`**, a partir do **HEAD remoto mais recente**. Confira o estado do repositório antes de editar. O projeto já possui modo offline, visual e sons oficiais e **multiplayer com servidor Cloudflare em desenvolvimento/implementação**: preserve todos esses recursos e trabalhos recentes, inclusive os da Fase 2. Não volte a um commit antigo e não reimplemente o jogo.

O arquivo **`Panelinha_Ajustes_Visuais_Coringa_400x850.zip`**, enviado à raiz do repositório, contém esta instrução, a **arte aprovada `Coringa_400x850.png`** e um README. Extraia o pacote, confira a imagem (dimensões exatas **400 × 850 px**) e integre seus arquivos ao projeto. **Não recrie a carta com IA, não use outra arte e não substitua sua composição**: esta é a versão final aprovada pelo usuário.

## 1. Menu: ocupar toda a tela, sem faixas

- Na versão atual, o tablet mostra faixas horizontais acima/abaixo e o celular mostra faixas laterais. Corrigir: **o cenário de fundo do menu deve preencher 100% da tela útil em toda resolução/proporção**, sem bordas vazias, sem distorção e sem rolagem indevida.
- Usar estratégia equivalente a **cover** para o fundo, com recorte responsivo quando necessário; **não usar contain com faixas**. Manter os enfeites ancorados corretamente ao cenário apesar do crop; preferir coordenadas/transformação compartilhadas para ganchos, utensílios, vapor e panelas. Proteger partes essenciais da composição e acessibilidade dos botões em proporções estreitas/largas.
- **Centralizar** a palavra **PANELINHA** e o conjunto dos botões do menu de forma harmoniosa, tanto em telefone quanto em tablet, mantendo os botões existentes e seus destinos.
- **Título mais compacto e estilizado:** aproximar as nove letras PNG existentes, reduzindo os espaços vazios; conservar ordem, arte, brilho e legibilidade sem sobreposições desajeitadas. Não substituir pelas letras de uma fonte genérica.
- **Tampa sobre o P:** reduzir bastante o tamanho; deve ser **um pequeno acessório** e não competir com a palavra.
- **Utensílios:** mover seus pontos de ancoragem **um pouco para a direita**, de modo que cada utensílio fique preso exatamente ao próprio gancho, inclusive após redimensionamento. Manter balanço suave e vapor funcional.

## 2. Avatares da mesa

- Mostrar os avatares com **recorte perfeitamente circular**, em vez de quadrado. Usar máscara/corte na apresentação (`border-radius: 50%` / `object-fit`) sem deformar os arquivos originais.
- **Aumentar levemente** os avatares nas posições da mesa (aproximadamente 10–15%, ajustando conforme espaço), mantendo a moldura, alinhamento, nomes e cartas legíveis, sem sobreposição na mesa. Preservar os nove avatares oficiais e o perfil salvo.

## 3. Panela de Pressão: recolher e redistribuir

- Quando o efeito da carta **Panela de Pressão** for aplicado, mostrar uma sequência visual fluida: cartas **saem das mãos de todos os jogadores**, seguem em direção à panela/centro da mesa, formam um agrupamento que sugere mistura/redistribuição e depois **voam de volta para as quatro mãos**, respeitando as quantidades finais calculadas pelo motor do jogo.
- A animação deve usar sprites/versos de cartas existentes. **Não revelar cartas escondidas dos adversários** no multiplayer; somente mostrar frentes das cartas que o jogador tem autorização para ver. Não alterar a distribuição real, nem inventar compra/penalidade/efeitos: o motor (ou servidor online) decide primeiro o estado autoritativo; a animação apenas representa a transição.
- Durar o suficiente para comunicar o efeito, mas sem demora excessiva; evitar travamentos e acúmulo de animações. Respeitar redução de movimento quando aplicável.

## 4. Compra de cartas: voo do monte, prévia e escolhas

- **Toda compra exibida ao jogador** deve ter animação fluida da carta saindo do monte e chegando a uma prévia destacada, com escala e movimento suaves. Após a prévia, a carta segue para a mão.
- **Carta comprada não jogável:** mostrar sua frente por um instante curto (referência aproximada: 250–450 ms), depois mover à mão e prosseguir imediatamente, sem fazer o usuário esperar.
- **Carta comprada jogável E com jogada permitida naquele contexto:** manter a carta em destaque e mostrar dois botões claros, **“Jogar”** e **“Guardar”**, aguardando escolha antes de concluir. O primeiro joga a carta comprada; o segundo guarda na mão, respeitando os turnos e opções atuais.
- **Compra infinita / sucessiva:** repetir a animação rapidamente para cada carta não jogável até chegar a uma jogável, quando permitido pelas regras; mostrar a prévia com Jogar/Guardar na jogável. Evitar empilhar dezenas de animações; manter fluidez mesmo em sequência longa.
- **Compras por penalidade, efeito, timeout ou outras compras obrigatórias:** manter a apresentação visual das cartas quando apropriado, **mas nunca oferecer Jogar/Guardar se a regra não permitir**. Não converter punição em compra voluntária nem alterar turno, quantidade de cartas ou resolução de +2/+4/+6. Se a carta não pertencer ao jogador local, não mostrar sua frente indevidamente.
- Sincronizar eventos visuais com os sons existentes sem dispará-los duas vezes. No multiplayer, apenas representar eventos/estados confirmados pelo servidor, sem criar jogadas paralelas no cliente. Tratar interrupção, saída de tela, reconexão e redução de movimento sem travar a interface.

## 5. Substituição da carta Coringa (ARTE FINAL FORNECIDA)

- Usar **exclusivamente** o arquivo `Coringa_400x850.png` incluído no ZIP, de dimensões **exatas 400 × 850 px**, design final aprovado (panela roxa/dourada e quatro cores entrelaçadas, com adornos).
- Localizar a arte-base atual da carta **Coringa comum**, substituir pelo novo PNG e atualizar seus mapeamentos, manifestos, checksums e referências necessárias. Manter o mesmo nome/caminho que o jogo já utiliza se isso simplificar a integração. Remover referências efetivamente obsoletas somente se seguro; não apagar outras artes.
- Exibir a carta sem deformação na mão, no descarte e nas animações; manter proporção igual à das demais cartas oficiais 400 × 850.
- **Não substituir indevidamente +4, +6 ou outras cartas especiais; não alterar regras ou efeitos da Coringa.** Não produzir nenhuma outra versão desta arte.

## 6. Preservações obrigatórias

- Preservar **modo Um Jogador offline**, regras completas, mesa, bots, sons, demais cartas, perfis e dados armazenados.
- Preservar **multiplayer já implementado** (salas, lobby, partidas, Cloudflare, URL pública/configuração, WebSockets, segurança e regras servidor/autoritativo). Não desfazer Fases 1/2 nem iniciar uma nova arquitetura online.
- Android: preservar `applicationId` **`com.lucascunha.panelinha.teste`**, origem `https://localhost`, assinatura **geração 2** e seus Secrets, workflow existente de APK, localStorage e capacidade de **atualizar sem desinstalar**. Jamais gerar/substituir a chave de assinatura. Publicar código de versão **superior ao último APK existente** (a v0.2.36/c5602 já aparece no histórico; conferir versões ainda mais recentes antes de compilar).
- Não editar a especificação de multiplayer sem necessidade. Não pedir segredos em chat. Não criar dependências desnecessárias.

## 7. TESTES MÍNIMOS e entrega — PRIORIDADE ALTA

**Este pedido é intencionalmente econômico em tempo/créditos do Codex. NÃO executar a bateria completa de suítes/Playwright, testes exaustivos, dezenas de cenários, testes de estresse ou emulador Android pesado só por rotina. NÃO iniciar repetidas compilações.** Não apagar nem desabilitar permanentemente suítes existentes; elas apenas não precisam ser todas executadas nesta tarefa. Se o workflow automático já executa seus testes, não mutilá-lo para aparentar aprovação.

Executar somente o indispensável para evitar erro óbvio e obter APK utilizável:
1. **Uma compilação web** (`npm run build`) após as edições, corrigindo apenas falhas reais.
2. **Verificação visual rápida** em 1 tamanho típico de celular e 1 de tablet, validando ausência de faixas, título, tampa, ganchos e avatares.
3. **Smoke test curto** de Coringa, Panela de Pressão, compra não jogável, jogável e sucessiva, sem varredura da suíte inteira. Confirmar que o modo offline abre e que o multiplayer existente não foi quebrado no fluxo básico (sem testes de carga).
4. **Uma execução do workflow Android existente**, se viável, para gerar APK assinado. Verificar `applicationId`, certificado geração 2, `versionCode` crescente, existência e integridade do APK. Não depender do emulador instável para afirmar que a compilação foi concluída; relatar separadamente as falhas de instrumentação, se houver. Não marcar testes não executados como aprovados.

**Entregar o APK verdadeiro no fim**, preferencialmente **link direto para arquivo `.apk` sem ZIP** pelo artefato da execução ou link equivalente verificável; não fornecer apenas código, logs ou instruções para compilar. Se o GitHub Actions publicar o APK mesmo quando a etapa de emulador falhar, recuperar o link desse artefato e explicar o status. Não inventar link se não existir. Manter um único build/release válido e não reiniciar a sequência de versionamento.

**Manutenção de arquivos:** integrar o PNG aos caminhos corretos, atualizar referências/manifestos, eliminar somente arquivos temporários e pacotes brutos importados quando seguro, sem apagar assets em uso. Evitar commits de logs/capturas enormes e relatórios longos; um resumo curto com o que mudou, testes mínimos e link do APK basta.

Ao finalizar, responda em português de forma objetiva: **mudanças implementadas, status do build, problemas pendentes e link do APK**.
