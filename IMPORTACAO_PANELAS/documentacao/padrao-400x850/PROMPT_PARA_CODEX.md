Vamos substituir SOMENTE as artes do verso e da Panela de Pressão pelas versões novas e padronizadas.

Coloquei na raiz da branch ativa do Panelinha o arquivo `Panelinha_Verso_Panela_Pressao_400x850.zip`.

1. Trabalhe sobre a versão mais recente do jogo, sem reconstruí-lo. Extraia o ZIP, leia `LEIA_ME.md` e `MANIFESTO.json`.
2. Substitua todas as imagens de verso antigas pela nova `verso_oficial_400x850.png`. A mudança deve alcançar mãos fechadas de adversários, monte de compra, cartas viradas para baixo, previews e animações que exibam o verso.
3. Substitua apenas a arte frontal da Panela de Pressão por `panela_de_pressao_400x850.png`, em todas as superfícies onde essa carta aparece. Não altere sua regra nem suas animações funcionais.
4. As duas imagens são PNG RGBA **400 × 850 px** com a mesma máscara alfa da carta numérica de referência. Não use recortes adicionais, não estique nem adicione bordas CSS extras; reutilize o tamanho e `object-fit` já empregados nas cartas numéricas para garantir aparência e dimensão idênticas.
5. Preserve todas as demais artes e funcionalidades: números, +2, Bloqueio, Inverter, Escolher Cor e seletor interativo, +4/+6 e suas camadas, Liquidificador, bots, duplas, cronômetro, corte, menu, orientação horizontal, tela cheia e funcionamento offline. Não implemente multiplayer nesta etapa.
6. Atualize os caminhos de assets, manifestos e build web/Android conforme necessário. Garanta que não haja cache ou referências antigas causando exibição de imagens anteriores.
7. Teste: dimensões e cantos transparentes; aplicação global do verso; Panela de Pressão na mão e descarte; ausência de distorção; regressão das regras e da tela inicial; build offline.
8. Gere novo APK instalável como atualização sobre o atual, com o mesmo `applicationId`, certificado de assinatura permanente da geração 2 (`android-identity.json`) e `versionCode` superior a todos os anteriores. Não gere outra chave.
9. Entregue relatório dos testes e link direto do APK, preferencialmente sem ZIP.

Importante: este ZIP é pequeno e traz SOMENTE as duas artes novas e os documentos de integração. Não espere nele outras cartas especiais.
