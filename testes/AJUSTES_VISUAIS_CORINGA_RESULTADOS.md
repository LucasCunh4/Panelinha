# Ajustes visuais e Coringa — 06/11/2026

Base recuperada sem perda: `aba8b79`, branch `android/apk-testes`.

- ZIP validado por CRC e SHA-256 `1591860e3ec4ab794e2af9e4d0bd7429cc729cd4a740681f393536d5b9c2338d`; instruções lidas integralmente.
- Coringa comum substituída pelo PNG fornecido, sem edição (400×850; o arquivo original é RGB). Manifesto/hash e teste de imagens Android atualizados. Bases/ingredientes interativos de Coringa/+4/+6 preservados.
- Menu usa cover compartilhado com utensílios/vapor; título e botões centrados, letras compactadas e tampa menor. Avatares recortados em círculo e ampliados 12% na mesa.
- Panela: autor explicitamente incluído entre participantes ativos; resultado autoritativo conserva cartas, mínimo e redução de 1–3. Contagens públicas e prazo de apresentação são compartilhados entre offline/online. Voo 540ms, pequena pausa, recolhimento, mistura e distribuição; novas mãos ficam ocultas até o término. Bloqueio autoritativo de ações durante 2s; corte mantém seus 2,2s após apresentação. Pausa/reconexão respeitam o prazo; adversários recebem apenas versos.
- Preservada a exceção existente de vitória pelo último descarte: um finalizador já isento não recebe cartas. As quatro mãos são incluídas nas jogadas com quatro participantes ativos.
- Última Carta: botão e servidor exigem próprio turno liberado, exatamente duas cartas e descarte legal que resulte em uma; Liquidificador considera a mão que será recebida. A condição estrita solicitada também recusa anúncio tardio fora dessas condições. Denúncia e punição permanecem.
- Compras têm prévia individual e voo à mão; somente carta comprada legal e ainda autorizada oferece Jogar/Guardar. Penalidades não oferecem descarte. Sequências grandes aceleram com quantidade limitada de sprites simultâneos. Sons continuam originados nos eventos existentes.
- Chamas: cor mais viva, opacidade/brilho moderadamente reforçados e deslocamento independente de 3px à esquerda.

Verificações efetivamente executadas:

1. Uma compilação web (`npm run build`): aprovada; inclui 52 PNGs numéricos/coloridos e manifestos oficiais.
2. Quatro testes direcionados de motor/servidor (`visual-update.test.mjs`): aprovados. Panela normal/+20, conservação, quatro mãos, redução, privacidade, bloqueio da transição, Última Carta e Liquidificador, compra/guardar e penalidade.
3. Um smoke WebSocket local (mesmo arquivo, filtro por nome): aprovado. Criar/entrar sala de seis dígitos, dois humanos, dois bots, Pronto, iniciar e snapshot privado.
4. Smoke navegador (`ajustes_visuais_coringa.cjs`): aprovado. Celular 844×390 e tablet 1280×800, cover/centralização, Panela sequenciada nos quatro assentos, compra não jogável, Jogar/Guardar, compra infinita, Coringa e escolha verde, penalidade sem opção indevida, quatro chamas e avatares circulares, sem erros JavaScript.

Capturas/logs de trabalho ficam fora do Git em `/workspace/work/ajustes-visuais-coringa`. Não foram executadas baterias extensas, testes de carga ou emulador local. A verificação nativa e a atualização com retenção de dados dependem do workflow existente; não são declaradas aprovadas antecipadamente. Identidade, origem, armazenamento, Secrets e workflow de assinatura não foram alterados. Resultado final do APK será registrado após a execução.

## Entrega final

- Commit do aplicativo: `310dd0f`; uma execução Actions, nº 39: https://github.com/LucasCunh4/Panelinha/actions/runs/42252692034
- APK **0.2.39 / 5902**, 94.595.889 bytes, verificado novamente após download com `ferramentas/verificar_apk.py`. Hash idêntico ao metadado do CI. Mesmo pacote, certificado de geração 2 e origem do 0.2.38/5802; código maior. Atualização compatível, sem troca de chave ou limpeza de dados.
- [Baixar APK sem ZIP](https://github.com/LucasCunh4/Panelinha/actions/runs/42252692034/artifacts/13520624190) (requer login GitHub). Metadados em `AJUSTES_VISUAIS_CORINGA_APK_0.2.39.json`.
- Instrumentação: **0/13 concluídos**; iniciou `a_imagesAndThreeBotsOffline`, mas o ADB passou a informar `emulator-5554 offline`. Nenhuma falha de assertiva do aplicativo foi registrada. A causa raiz da perda do emulador não foi isolada; não é aprovação dos testes Android. Teste real de atualização/retenção de dados não executado. Workflow terminou com falha nessa etapa, publicou o APK e não publicou Release. Nenhum teste removido e nenhuma reexecução disparada.
- Worker existente atualizado para `01116b8e-9e5d-472d-b576-55370adc4c69`, mesmos bindings/migração/URL. Health público HTTP 200 (`phase:3`, `gameplay:true`); hash público da Coringa idêntico ao PNG integrado.
