# PANELINHA — IMPLEMENTAR NOVA ARTE DO LIQUIDIFICADOR

Trabalhe sobre a versão mais recente do repositório na branch `android/apk-testes`. Adicionei o ZIP `Panelinha_Liquidificador_400x850_Oficial.zip`.

1. Extraia o ZIP e utilize o arquivo `liquidificador_oficial_400x850.png` para substituir **definitivamente apenas a arte antiga da carta Liquidificador/Giro**. O PNG é RGBA 400 × 850 com os cantos transparentes exatamente iguais aos da carta Panela de Pressão. A imagem de prévia não deve ser usada no jogo.
2. Preserve os componentes e tamanhos das cartas numéricas. Não adicione borda, não estique a imagem, não modifique a proporção e não deixe o verso antigo aparecer como frente.
3. Atualize todas as referências e superfícies em que a carta Liquidificador aparece (mão, descarte, animação, configurações/prévias se houver), tanto na web quanto nos assets offline do APK. Evite referências ativas à arte antiga.
4. Não altere o tipo lógico ou a regra: **Liquidificador gira as mãos dos jogadores uma posição no sentido atual do jogo**; NÃO redistribui aleatoriamente e NÃO abre seleção de cor. Sua ativação opcional nas configurações deve continuar funcionando.
5. Não altere a Panela de Pressão, as cartas +4/+6, Coringa, cartas numéricas, baralho, bots, pontuação ou qualquer outro comportamento.
6. Teste o novo asset em Individual e Duplas, com Liquidificador ativado e desativado, confirmando que ele gira as mãos e não dispara seletor de cor.
7. Preserve `com.lucascunha.panelinha.teste`, a assinatura permanente de geração 2, os secrets existentes, os dados locais, o modo horizontal e o funcionamento offline. Incremente `versionCode`; gere APK atualizável e entregue link direto, preferencialmente sem ZIP. Informe apenas testes realmente executados.
