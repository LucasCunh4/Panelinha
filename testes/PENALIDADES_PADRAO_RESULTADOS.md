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

Preservados applicationId `com.lucascunha.panelinha.teste`, origem `https://localhost`, certificado da geração 2 e workflow/Secrets existentes. Nenhuma chave gerada. A sequência de versionamento será a mesma, com código superior ao APK 0.2.31 / 5102 e ao candidato reservado 5103. A verificação será feita no APK real antes da entrega. Testes web não substituem execução nativa; qualquer falha de infraestrutura será explicitada.
