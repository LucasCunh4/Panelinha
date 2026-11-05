# CODEX — PANELINHA: IMPLEMENTAR MENU FINAL, AVATARES, TÍTULO ANIMADO E SONS APROVADOS

## Contexto obrigatório

Repositório: `LucasCunh4/Panelinha`. Trabalhe a partir da versão atual da branch `android/apk-testes`, conferindo o HEAD antes de editar. Leia o código existente e preserve alterações posteriores que possam ter ocorrido. O jogo local contra bots já funciona e sua lógica não deve ser reescrita. A arte oficial da carta Liquidificador já foi integrada em 02/11/2026: **não substitua nem reimporte cartas que já estão no projeto**. O arquivo `MULTIPLAYER_ESPECIFICACAO.md` documenta o multiplayer futuro: **não implementar multiplayer nesta tarefa** e não alterar essa especificação.

Vou disponibilizar EXATAMENTE estes quatro ZIPs, com estes nomes (se estiverem em uma pasta do repositório, localize-os; se estiverem anexados à tarefa, extraia-os):

1. `Panelinha_Menu_Animacoes_Audios_V2.zip` — fundo aprovado, 6 utensílios, 8 variantes de vapor, 30 MP3, manifestos e instruções.
2. `Panelinha_Avatares_9_Aprovados.zip` — os 9 avatares oficiais aprovados.
3. `Panelinha_Titulo_PANELINHA_9_Letras_PNG.zip` — 9 letras PNG independentes, na ordem PANELINHA.
4. `Panelinha_Tampa_e_5_Brilhos_Animados.zip` — tampa para o P e 5 brilhos PNG independentes.

Extraia os ZIPs, confira a integridade e LEIA os READMEs e manifestos internos ANTES de modificar código. Não invente artes alternativas nem baixe substituições externas. Não confunda estes pacotes com versões antigas (V1) que possam existir no projeto.

## 1) Fundo aprovado do menu

Utilize `Panelinha_Menu_Animacoes_Audios_V2/fundo/cozinha_menu_aprovada.png` como fundo da tela inicial. É a cozinha vista de frente, parede roxa, ganchos dourados vazios e duas panelas à direita.

- Mantenha a arte completa e sem deformação em landscape, com sistema único de coordenadas para o fundo e suas camadas decorativas (por exemplo, uma área com aspect ratio idêntico à arte). Não corte ganchos, panelas ou bancada.
- O PNG NÃO contém título nem botões: todos os botões atuais do menu continuam como componentes HTML acessíveis e funcionais sobre a arte, sem serem achatados no fundo.
- Reorganize o menu somente o necessário para acomodar título e botões com legibilidade, sem cobrir indevidamente as panelas nem atrapalhar a navegação. Preserve os fluxos Um Jogador, Multiplayer, Criar Sala, Entrar em Sala, Configurações e perfil.
- Se já houver uma ilustração antiga gerada por SVG/CSS para o menu, substitua apenas a apresentação para não renderizar duas cozinhas sobrepostas.

## 2) Seis utensílios animados

Use os PNGs individuais de `Panelinha_Menu_Animacoes_Audios_V2/utensilios/` na ordem concha, espátula vazada, colher de madeira, pegador de massas, batedor de arame e escumadeira. Para posicionar, consulte `utensilios/posicionamento_ganchos.json` (os ganchos já existem no PNG de fundo; NÃO desenhar ganchos extras).

Cada utensílio deve ter camada própria com transparência, ancorada no gancho correto em qualquer viewport landscape. Animar balanço pendular discreto de aproximadamente ±1,8°, pivot no topo, período de 3,5–4,4 s, fases desencontradas e `ease-in-out`. Priorizar `transform`/CSS para evitar tremulação; respeitar `prefers-reduced-motion`.

## 3) Vapor das duas panelas

Use os oito sprites de `Panelinha_Menu_Animacoes_Audios_V2/fumaca/` como **variantes de pluma**, e não como quadros sequenciais que mudam abruptamente. Cada panela à direita deve liberar vapor suave e contínuo, com 2–3 instâncias desencontradas: fade-in, subida lenta, oscilação horizontal pequena, variação sutil de escala e fade-out em ciclos de aproximadamente 4–6 s. Ao trocar variante, faça isso somente na criação de uma instância nova, com transição suave. O vapor deve nascer junto à borda/tampa, sem tampar os botões. Não incorporar vapor ao fundo.

## 4) Título PANELINHA formado por 9 imagens individuais

Use os PNGs `Panelinha_Titulo_Letras_Individuais/letras/01_P.png` até `09_A.png`, disponíveis dentro de `Panelinha_Titulo_PANELINHA_9_Letras_PNG.zip`, seguindo o `MANIFESTO_LETRAS.json`.

- Renderize cada letra como elemento separado, na ordem exata **P-A-N-E-L-I-N-H-A**. As letras A e N duplicadas têm arquivos individuais próprios; não as troque.
- Preserve os acabamentos branco brilhante, contorno dourado/roxo e a proporção das letras. Não use uma fonte comum por cima nem achate as letras em uma única imagem.
- Crie animação de entrada delicada e coordenada (pequenas translações/escala/opacidade, com defasagens); ao fim, o título permanece estável e claramente legível. Movimentos de repouso, se houver, devem ser muito sutis. Evite layout shift.
- Posicione o título de modo responsivo sobre o fundo aprovado, sem encobrir os utensílios e sem competir com os botões.

## 5) Tampa sobre o P e cinco brilhos

Extraia `Panelinha_Tampa_e_5_Brilhos_Animados.zip`, leia `MANIFESTO.json` e use `tampa/tampa_sobre_letra_P.png` como camada **independente**, alinhada à primeira letra P. A tampa deve saltitar/balançar discretamente acima da letra, sem se desprender visualmente.

Use também, em camadas independentes, as cinco imagens de `brilhos/` para cintilar ao redor do título. Animar em fases distintas com mudanças suaves de opacidade, escala e rotação, evitando exagero e flashes incômodos. Ajustar no mesmo sistema de coordenadas do título; `pointer-events: none` em todos os enfeites. Respeitar redução de movimento.

## 6) Substituir seleção de avatar pelos 9 aprovados

Extraia `Panelinha_Avatares_9_Aprovados.zip`, leia `MANIFESTO.json` e `LEIA_ME.md` e utilize os NOVE PNGs de `avatares/`:

1. frigideira chef com óculos; 2. leiteira de bigode; 3. panela de pressão; 4. panela DJ; 5. wok com monóculo; 6. panela aventureira; 7. panela gamer com controle; 8. panela piloto; 9. panela escoteira.

- Não reintroduzir o avatar de futebol, que foi rejeitado.
- Substituir os avatares provisórios da **seleção de perfil do jogador** pelos PNGs aprovados; usar o avatar escolhido consistentemente no perfil, na mesa e nos espaços já previstos na interface. Não reescrever o modo bots nem mudar os assentos por causa disso.
- Manter proporções/círculo dourado, sem recortar ou esticar os PNGs. Pré-carregar ou otimizar a exibição para evitar travamentos.
- Preservar nome e avatar escolhidos em armazenamento local. Se o avatar salvo anteriormente for um ID provisório, criar migração/fallback seguro para um dos 9 novos sem causar erro ou perda de outros dados.
- Não adicionar avatares externos ou gerar outros novos nesta etapa.

## 7) Integrar os efeitos sonoros aprovados (somente SFX, sem música)

Usar os MP3 de `Panelinha_Menu_Animacoes_Audios_V2/audio/` e ler seu manifesto. Criar/reaproveitar gerenciador SFX leve para web e Capacitor Android, com desbloqueio de áudio pela primeira interação, pré-carregamento responsável, volume, opção de silenciar e persistência local. Os sons DEVEM funcionar offline no modo contra bots e no APK; não depender de URL externa.

Mapeamento de eventos reais:
- `01_jogar_carta`, `02_comprar_carta`; `03_mais6`, `06_mais2`, `07_mais4`, `08_bloqueio`, `09_inverter`, `10_coringa_escolher_cor`;
- `04_panela_de_pressao` e `05_liquidificador`: versões aprovadas V2; NÃO modificar as regras nem fazer essas cartas escolherem cor;
- `11_corte`, `12_ultima_carta` (somente quando o anúncio realmente ocorrer);
- `13_punicao_2`, `_4`, `_6`, `_12`: selecionar a versão conforme a penalidade; para valores não exatos, estabelecer fallback consistente e documentá-lo;
- `14_tick_contagem`, `14_tick_final`: alertas do cronômetro real; **`14_demo_5_segundos.mp3` é apenas demonstração, não tocar o arquivo inteiro a cada tick**;
- `15_vitoria`, `16_derrota`; `17_botao_clique`, `17_botao_confirmar`; `18_menu_abrir`, `18_menu_fechar`; `19_embaralhar`, `19_distribuir`; `20_inicio_rodada`; `21_escolher_cor`; `22_jogador_pronto` quando existir um evento real de Pronto (não inventar lobby online agora).

Os sons devem ser disparados por transições/eventos, jamais a cada renderização. Evitar duplicar o som comum e o especial de uma mesma jogada; limitar sobreposições de compras múltiplas; não deixar áudio preso ao navegar/pausar. Sem mudança de pontuação, turnos, cortes, penalidades ou comportamento dos bots.

## 8) Preservações INEGOCIÁVEIS

- NÃO implementar multiplayer nesta etapa, NÃO alterar `MULTIPLAYER_ESPECIFICACAO.md`, NÃO criar servidor/deploy Cloudflare ainda. As telas placeholder para multiplayer podem permanecer funcionais em navegação.
- NÃO reescrever o motor local, modificar as regras, baralho, cartas existentes, panorâmica da mesa, mão do parceiro, bots ou opções.
- NÃO substituir artes das cartas já implementadas, especialmente o Liquidificador e a Panela de Pressão.
- MANTER aplicativo Android `com.lucascunha.panelinha.teste`, a assinatura permanente de **geração 2** e os quatro GitHub Actions Secrets já existentes. Não gerar chave nova, não imprimir secrets, não alterar keystore ou certificados.
- MANTER a capacidade de instalar o novo APK **por cima** da versão geração 2 instalada, sem desinstalar e sem apagar dados. `versionCode` deve crescer e o novo APK precisa ser assinado pela mesma chave de geração 2.
- MANTER telas e orientação horizontal, estética roxa/dourada aprovada e funcionamento offline.
- Se houver arquivos ZIP temporários incluídos apenas para integração, não manter pacotes brutos gigantes na árvore ativa após a importação; conservar os assets finais e a documentação necessária.

## 9) Verificação e entrega

1. Antes de editar, registrar HEAD da branch e conferir se todos os quatro ZIPs estão presentes e íntegros. Se algum estiver ausente, dizer qual e **não improvisar substituição**.
2. Implementar os quatro pacotes como uma atualização integrada, preferindo componentes/modulos isolados, sem duplicação de assets.
3. Testar menu em landscape em resoluções pequenas e grandes, título composto pelas 9 letras, tampa e 5 brilhos, 6 utensílios presos a ganchos, vapor nas 2 panelas, seleção dos 9 avatares e persistência.
4. Testar eventos sonoros, mute/volume, corte, especiais, penalidades acumuladas, cronômetro e ausência de repetição indevida de efeitos. Testar o modo offline sem internet.
5. Executar `npm run build` e as suítes atuais disponíveis; corrigir regressões que forem provocadas por esta integração. Relatar separadamente testes realmente executados, aprovados, falhos e não executados.
6. Executar workflow Android existente, verificar APK real, certificado geração 2, mesmo applicationId e versionCode crescente. Não modificar credenciais da assinatura.
7. Entregar resumo das mudanças, arquivos principais, relatório de testes e, se o workflow permitir, **link direto para o APK assinado** (de preferência sem necessidade de baixar um ZIP). Se a geração do APK não for possível, dizer exatamente o impedimento, sem afirmar que o APK está pronto.

Prioridade: integração fiel aos assets aprovados e preservação total da versão funcional já existente.
