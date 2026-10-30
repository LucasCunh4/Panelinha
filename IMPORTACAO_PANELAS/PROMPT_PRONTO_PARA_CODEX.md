# PROMPT INICIAL PARA COLAR NO CODEX

Estou transferindo para este projeto o jogo de cartas **PANELAS**, cujo planejamento e protótipo foram desenvolvidos em outra conversa do ChatGPT.

**LEIA ANTES DE CODIFICAR:**
1. `AGENTS.md` (prioridades e práticas)
2. `documentacao/ESPECIFICACAO_COMPLETA.md` (todas as decisões e regras)
3. `documentacao/ESTADO_ATUAL_E_PROXIMOS_PASSOS.md`
4. `index.html` (protótipo local funcional V3) e `assets/cartas/` (52 PNGs com nomes reais)

**Primeira tarefa — NÃO REFAZER O JOGO DO ZERO:**
- Instale/prepare ambiente apenas se necessário, mantendo o `index.html` e as 52 imagens existentes.
- Faça o jogo rodar por HTTP local/de prévia (por exemplo `python3 -m http.server 8000`, ou outro servidor apropriado). O usuário abriu o HTML pelo Android e as imagens não apareceram, provavelmente por limitações do navegador ao usar `file://`; diagnostique e corrija também erros de caminho/rede que encontrar.
- Confira carregamento de TODOS os 52 PNGs em `assets/cartas/{vermelho,azul,amarelo,verde}/{0..9,mais_2,bloqueio,inverter}.png`, sem renomear arbitrariamente (o +2 é `mais_2.png`).
- Teste no navegador os dois modos (individual e duplas) contra 3 bots, compra de penalidade +N sem fuga, acumulação, cortes (uma carta por clique, botão sobre carta), Distribuidora com distribuição equilibrada, Giro, desafio +4/+6, UNO e fim de rodada.
- Preserve as regras e o modo laboratório, mas corrija discrepâncias comprovadas contra a especificação. Diga quais testes rodou, o que passou e quais decisões ainda exigem usuário.
- Deixe o projeto executável com passos claros para testar no navegador do celular (URL de prévia). Não declare que APK/multiplayer existe; ainda não existe.

**Depois de estabilizar, prossiga em iterações curtas**, perguntando/apresentando alternativas apenas quando uma escolha afeta regras aprovadas. Prioridade de implementação: (1) estabilizar base e PNGs; (2) refatorar lógica da interface; (3) interface de fogão com modo bots; (4) lobby e multiplayer autoritativo; (5) Android. Não avançar com modo power-ups ainda.

**Sobre o visual**: os 52 PNGs atuais são temporários e o usuário NÃO aprovou a qualidade final. Ele encontrou cortes ruins, folhas verdes em outras cores e proporção fina. NÃO tente vender esses arquivos como arte final e NÃO faça mais pranchas recortadas como solução definitiva; mantenha os atuais para validar integração e permita trocá-los no futuro por PNGs finais produzidos individualmente.

Comece verificando a estrutura, executando o jogo e relatando objetivamente as melhorias necessárias antes de reescrever qualquer componente grande.
