# PANELINHA — INTEGRAÇÃO DO FUNDO, UTENSÍLIOS, FUMAÇA E TODOS OS SONS

Trabalhe na versão mais recente e funcional da branch `android/apk-testes`, sem perder alterações posteriores do projeto. O ZIP enviado é `Panelinha_Menu_Animacoes_Audios_V2.zip`. Extraia o pacote e leia o `MANIFESTO.json`, o `README.md` e `utensilios/posicionamento_ganchos.json`.

## 1. Novo fundo da tela inicial

Substitua o **fundo visual** do menu inicial por `fundo/cozinha_menu_aprovada.png`, a arte já aprovada, com a cozinha vista de frente, paredes roxas, bancada de madeira, seis ganchos vazios e duas panelas à direita. Use toda a área útil horizontal com `object-fit: contain` (ou equivalente) e mantenha um **único sistema de coordenadas responsivas** para fundo e camadas. Não estique nem corte a arte ou faça overlays desacoplados do seu enquadramento.

**Importante:** o PNG não deve conter título ou botões incorporados. Preserve a funcionalidade dos controles de navegação existentes do jogo como componentes separados; não redesenhe nem adicione título definitivo/botões ilustrados dentro da imagem.

## 2. Utensílios animados nos seis ganchos

Use exatamente os seis PNGs de `utensilios/`, **cada um em sua própria camada transparente**, e siga as posições do `posicionamento_ganchos.json`. Alinhe visualmente as argolas ao gancho dourado correto, da esquerda para a direita: concha, espátula vazada, colher de madeira, pegador de massas, batedor de arame e escumadeira.

- Os ganchos já são parte da imagem do fundo: **não desenhar ganchos extras**.
- Balanço pendular lateral bem discreto, amplitude aproximada de ±1,8°, `transform-origin: center top`, `ease-in-out`, períodos entre 3,5 e 4,4 segundos.
- Defasar as fases para que não balancem todos juntos; não usar movimento que puxe o objeto inteiro verticalmente.
- Animar preferencialmente somente `transform`, sem rerenderizações que façam os elementos tremular.
- Cada utensílio permanece fixado ao respectivo gancho enquanto o cenário se ajusta à tela.

## 3. Fumaça animada nas duas panelas

Os oito arquivos em `fumaca/` são **plumas transparentes de referência**, não uma sequência de quadros perfeitamente interpolados. Não trocá-los bruscamente em loop, pois isso causaria tremulação/mudanças artificiais de forma.

Criar uma animação **suave e contínua** em camadas independentes:
- Uma emissão na panela roxa grande e outra na panela roxa menor, ambas sobre o fogão à direita.
- O vapor deve nascer nas juntas da tampa/bordas de cada panela, subir lentamente, oscilar suavemente para os lados, ficar um pouco mais transparente e desaparecer.
- Sobrepor 2–3 instâncias por panela com fases diferentes e ciclos de aproximadamente 4–6 segundos; aplicar fade-in, `translateY` gradual, leve `translateX`, pequenas variações de escala e fade-out.
- Para variar visualmente, alternar entre sprites **somente em instâncias novas e cruzadas**, nunca mudar a imagem de uma pluma visível de um frame para outro.
- Manter o efeito sutil (opacidade baixa/moderada), sem cobrir menus, utensílios, lâmpada ou a panela inteira. Não incluir fumaça no PNG do fundo.
- Consultar o manifesto para coordenadas iniciais aproximadas, depois ajustar olhando a imagem renderizada em landscape.

## 4. Implementar todos os efeitos sonoros aprovados

Os MP3s em `audio/` são as versões aprovadas pelo usuário. Preservar exatamente a seleção, especialmente **Panela de Pressão V2** e **Liquidificador V2**.

Criar/reaproveitar um gerenciador de efeitos sonoros (SFX) offline compatível com Android WebView e web, com pré-carregamento, desbloqueio após a primeira interação do usuário, controle de volume e opção de silenciar, persistidos localmente. Não incluir música de fundo nesta etapa.

Mapear os áudios às ações reais:
- `01` jogar carta; `02` comprar carta;
- `03` +6, `06` +2, `07` +4, `08` Bloqueio, `09` Inverter, `10` Coringa;
- `04` Panela de Pressão, `05` Liquidificador, sem alterar as regras desses especiais;
- `11` corte bem-sucedido; `12` anúncio real de **Última Carta!**, perceptível para todos os jogadores presentes;
- `13_punicao_2/4/6/12` selecionar a versão adequada à quantidade resolvida, inclusive penalidades acumuladas;
- `14_tick_contagem` nos segundos finais, `14_tick_final` no último; a faixa `14_demo_5_segundos` é **prévia** e não deve ser reproduzida inteira de novo a cada segundo;
- `15` vitória, `16` derrota;
- `17` clique e confirmação; `18` abrir e fechar menus; `19` embaralhar/distribuir; `20` início da rodada; `21` confirmação de seleção de cor; `22` jogador pronto.

Disparar sons por **eventos de jogo** e não por renderização de componentes ou simples reavaliação de estado. Evitar efeitos duplicados: por exemplo, cartas especiais não devem tocar simultaneamente o som comum da jogada e o som especial se isso causar sobreposição indesejada. Sons de compra em sequência devem ter limite de vozes simultâneas. Interrupções, pause/resume e mudanças de tela não devem manter efeitos presos em loop. Evitar atrasar a resolução de jogadas esperando o som terminar.

## 5. Qualidade e testes

Validar a tela inicial em landscape em resoluções diversas, preservando orientação horizontal, visual e responsividade.

Testar:
1. Fundo correto e completo; sem título/botões embutidos.
2. Seis utensílios, um por gancho, ancorados corretamente sem saltos nem tremulação.
3. Fumaça visível nas **duas** panelas e não nos ganchos/fora do fogão.
4. Loop de fumaça sem cortes bruscos ou imagens piscando.
5. Sons sincronizados às ações; volume/mute persistentes; nenhuma reprodução duplicada.
6. Penalidades de 2/4/6/12+, último segundo do cronômetro e anúncio de última carta.
7. Áudio e imagens funcionando **completamente offline** no APK Android.
8. Sem mudanças nas regras do jogo, na arte das cartas, nos bots ou nos fluxos de partida.

Testes realmente executados devem ser informados; não inventar aprovação.

## 6. Entrega

Manter o mesmo `applicationId` (`com.lucascunha.panelinha.teste`), certificado de assinatura permanente **geração 2**, GitHub Actions Secrets existentes, dados locais e versionCode crescente. Não gerar nova chave.

Gerar um novo APK assinado que atualize o instalado, fornecer preferencialmente link **direto para o APK**, explicar o que foi integrado e eventuais limitações de testes no emulador.
