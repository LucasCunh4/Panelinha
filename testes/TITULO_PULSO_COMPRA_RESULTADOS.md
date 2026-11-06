# Título, avatar, compra, pulso e Panela — 06/11/2026

Base `99ecb96`, HEAD remoto de `android/apk-testes`. Diretório limpo; trabalho anterior preservado.

- Tampa removida do DOM e dos estilos/animações do título. PNGs aprovados e seus manifestos preservados; nenhum novo acessório.
- Nove letras com levantamento sequencial da esquerda para a direita (110ms entre letras, ciclo 6,4s com intervalo), mantendo posição, curvatura, escala e artes. Respeita movimento reduzido.
- Seleção de avatar sem rótulos visuais e sem nome na prévia; aplicada também à galeria do editor de perfil do lobby. Nove imagens e rótulos acessíveis mantidos. Campo de nome, persistência, nomes dos resultados/anúncios e demais telas preservados. A mesa continua como já aprovada.
- Compra própria com 1450ms em vez de 1150ms, pausa de prévia maior e sequência múltipla mais espaçada, ainda com aceleração gradual. Somente quem compra vê a prévia; outros continuam com voo direto de verso em 540ms. Jogar/Guardar e validação real permanecem.
- SUA VEZ com pulso contínuo suave (1,85s, escala até 1,045 e brilho até 1,12), separado da entrada existente. Mesmo posicionamento, sem recriação em render repetido e sem aparecer fora do turno. Movimento reduzido respeitado.
- Quantidades da Panela com fonte responsiva de 28–38px (antes 22px), duração de 4200ms (antes 2400ms) e saída suave. Posicionamento evita avatar/bordas; indicadores anteriores são removidos ao começar nova troca de mãos. Redistribuição, inclusão do autor e ordem descarte→efeito intactas.

Verificações executadas:

- `testes/titulo_pulso_compra.cjs`: aprovado. Ausência de tampa; animações/timings e ordem das nove letras; geometria do título em 844×390 e 1280×800; movimento reduzido; seleção sem textos e perfil salvo; pulso somente no turno humano, preservado em novo render; compra detalhada em 1450ms/Jogar-Guardar e compra alheia com verso; Panela inicia após o voo e exibe quatro quantidades reais, maiores, com duração 4200ms e presença além dos antigos 2400ms, sem duplicação.
- Conferência adicional da tela de avatar após decodificação: nove imagens carregadas e visíveis (34×34 no celular), sem nomes junto aos avatares.
- Uma compilação web: aprovada. Manifestos, cartas, sons e fontes web conferidos. Nenhuma arte ou regra do motor alterada.
- Expectativas visuais de testes anteriores atualizadas para ausência de tampa e novos tempos; essas suítes extensas não foram executadas. Nenhum teste desativado. Capturas/logs fora do Git: `/workspace/work/titulo-pulso-compra`.

Identidade, dados locais, Secrets e workflow Android preservados. Resultado do APK será acrescentado após a execução única.
