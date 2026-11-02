# +4/+6 padronizadas — 400×850

## Integração

Pacote `Panelinha_Mais4_Mais6_Padronizadas_400x850.zip` recuperado da revisão `251869e` da branch `android/apk-testes`, sem descartar trabalho anterior. Os três documentos foram lidos integralmente e preservados em `IMPORTACAO_PANELAS/documentacao/mais4-mais6-400x850/`.

- Substituídos somente os PNGs de `assets/cartas_mais4_mais6/`, com os bytes originais do ZIP. São 24 recursos: frentes, bases, overlays de canvas completo, sprites e previews/montagens de teste. Todas as imagens de canvas completo têm 400×850; sprites conservam seus recortes e dimensões próprias do manifesto. SHA-256/dimensões/RGBA conferidos no build e no APK.
- Frentes completas nas mãos, descarte, histórico de três camadas e animações normais. +4/+6 usam a classe visual padronizada, `object-fit:contain`, cantos transparentes da imagem, sem borda/padding/recorte CSS adicional. As mesmas caixas responsivas das numéricas continuam sendo usadas.
- O seletor existente da Coringa foi reutilizado, sem duplicar eventos ou resolução de jogada. Somente +4/+6 usam canvas lógico 400×850, altura explícita compatível com WebViews sem `aspect-ratio` e layout landscape. Coringa mantém sua arte/composição 2:3.
- **Preservação do aprimoramento dos alimentos:** os quatro PNGs de overlay da Coringa permanecem intactos. Cada um é desenhado uma única vez dentro de um viewport SVG nas coordenadas oficiais, com `meet` para preservar suas proporções. São usados os retângulos do novo manifesto e os limites alfa dos PNGs existentes. Hover, brilho pulsante, feedback de toque, destaque de seleção e commit imediato da cor permanecem no mesmo componente. Áreas de toque têm mínimo 44px; não há botões externos de cor.
- As bases fornecidas ainda continham manchas/áreas borradas de remoção dos ingredientes. Para não regredir, a composição preserva o conteúdo das duas bases limpas já aprovadas, recomposto no retângulo interior oficial `(26,29,348,792)` sobre a base nova. O recorte interno mantém a moldura branca/alpha nova; alimentos antigos não ficam aparentes por baixo. É composição SVG na interface, sem retocar/regenerar PNGs ou alterar outras artes. Os detalhes dourados e evoluídos da +6 foram preservados.

**Divergência do material de referência:** apesar do texto do ZIP mencionar numéricas 400×850, os 52 arquivos numéricos efetivos do repositório são **420×850**, com máscaras próprias. Foram preservados integralmente, conforme a restrição de não mudar outras cartas. +4/+6 são os PNGs oficiais 400×850 sem esticamento, dentro das mesmas caixas CSS das numéricas; sua máscara alfa é idêntica à do verso/Panela padronizados. Não se afirma identidade pixel a pixel com as máscaras numéricas originais. Alterar estas últimas exigiria outro escopo/recursos.

Motor no `index.html` comparado com `251869e`: arquivo idêntico, exceto pela atribuição da classe visual `standard-card` na função de renderizar +4/+6. Regras, penalidades, desafios, bots, corte, pontuação e demais efeitos não foram alterados. Mesa/rastro/halo, menus, perfil, orientação/imersão e outras artes foram preservados.

## Testes

**20 suítes Chromium aprovadas**, **5 testes de versionamento aprovados** e **build offline aprovado**. [Logs e capturas](evidencias-penalidades-padrao/). Inclui todas as 19 suítes anteriores e a nova `penalidades_padrao.cjs`; integração interna também passou em 16/16 regras. As suítes afetadas foram repetidas após o ajuste final de altura.

A inspeção encontrou Cancelar 3px além da borda em layouts altos: a reserva vertical das duas cartas foi ajustada para incluir título, instrução, retorno, espaçamentos e área segura. O teste agora mede também esses elementos individualmente, em vez de confiar apenas nos limites do diálogo. Layout da Coringa preservado. Os testes verificaram também o fallback sem `aspect-ratio`, toque mínimo 44px, 28 escolhas acumuladas, oito regiões de hover, compra/descarte/voo com a frente nova, escolha única, conservação e uso offline.

As verificações específicas incluem 24 PNGs por hash/HTTP/decodificação; máscara alfa das frentes/bases; proporção 400×850; caixas iguais às numéricas; ausência de bordas; 12 layouts das duas cartas, incluindo landscape 568×240; ingredientes únicos/proporcionais nas posições oficiais; todas as quatro cores; hover/toque; penalidades; conservação; compra real, descarte e voo; offline e movimento reduzido. A instrumentação Android existente foi atualizada para as novas dimensões e a composição preservada.

O preview geral fornecido tem pequenas diferenças de reamostragem em relação a compor as camadas já redimensionadas. O teste compara os pixels com `*_montagem_interativa_teste.png`, arquivo fornecido especificamente para essa composição, conservando a tolerância de até 1/255 por canal; não removeu nem afrouxou a verificação.

## Android

Preservados applicationId `com.lucascunha.panelinha.teste`, origem `https://localhost`, certificado da geração 2 e workflow/Secrets existentes. Nenhuma chave gerada. Execução [**#32**](https://github.com/LucasCunh4/Panelinha/actions/runs/41481763088), fonte `fa448e72d4fa045bd4c4e7f0062bcc3a044973d6`:

- **Compilação/assinatura aprovadas:** APK **0.2.32 / código 5202**. Candidato 5203 reservado ao teste de atualização, não distribuído. Workflow e verificações preservados.
- APK baixado e verificado novamente com `ferramentas/verificar_apk.py`: assinatura v2, certificado fixo, pacote, origem, landscape/categoria game, todos os 52 PNGs e demais assets anteriores, 24 novos PNGs de penalidades por SHA-256/dimensões/RGBA e cópia exata do código web desta revisão. [Metadados verificados](PENALIDADES_PADRAO_APK_0.2.32.json).
- Certificado SHA-256 **`3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`**, igual a `android-identity.json` e ao APK anterior real **0.2.31 / 5102**. Mesmo applicationId `com.lucascunha.panelinha.teste` e origem `https://localhost`; código 5202 também supera o candidato anterior 5103. [Comparação dos APKs reais](evidencias-penalidades-padrao/comparacao-identidade-apks.json). Identidade compatível com atualização direta, sem desinstalar.
- SHA-256 do APK **`2a85d367a881b645e09db1c5ef05de0cb4d75918fdbc4e6edd7db80e52405dc5`**, igual ao digest do GitHub; **52.372.865 bytes**. Metadados locais iguais aos do CI. Confirmado APK com `AndroidManifest.xml`/assets na raiz, sem ZIP externo ou APK aninhado.

**Android nativo: execução interrompida, não aprovada.** A imagem do SDK foi instalada e o AVD iniciou. A instrumentação começou `a_imagesAndThreeBotsOffline` às 16:32:43 UTC; o logcat registra `MainActivity` criada/retomada/exibida. O AVD perdeu a conexão: `adb devices` passou a listar `emulator-5554 offline`; diagnósticos por ADB falharam e a tentativa de encerramento encontrou a porta 5554 recusada. O primeiro teste possui apenas status de início (`INSTRUMENTATION_STATUS_CODE: 1`), sem resultado. **0/11 testes offline concluídos; teste adicional de atualização não executado.**

É uma interrupção do ambiente/ADB, sem asserção funcional reprovada registrada. A causa raiz da queda do AVD não foi determinada pelos arquivos disponíveis: logcat sem `FATAL EXCEPTION`/`Fatal signal` do aplicativo; kernel do host sem OOM/segfault, memória disponível aproximadamente 14GiB. Isso não comprova aprovação do aplicativo no Android. Permanecem pendentes instrumentação completa, interações/capturas nativas nas duas paisagens e instalação por cima com preservação real de UID/localStorage/SharedPreferences. Nenhum teste removido ou desativado. [Trechos da execução](evidencias-penalidades-padrao/github-android-diagnostico.txt); demais diagnósticos completos no artefato `resultados-android-32-1`.

O workflow terminou com falha nos testes; Release corretamente pulada. APK já assinado/verificado, metadados e diagnósticos foram disponibilizados separadamente pelo mecanismo existente.

[**Baixar APK 0.2.32 / 5202 diretamente, sem ZIP**](https://github.com/LucasCunh4/Panelinha/actions/runs/41481763088/artifacts/13160063954). Requer login no GitHub; retenção até 31/01/2027.

A compatibilidade de atualização foi conferida pela identidade/versão dos dois APKs reais. A atualização e a preservação efetiva de dados continuam sem execução nativa nesta rodada. O mecanismo de dados locais não foi alterado; a partida em andamento continua apenas em memória.
