# AGENTS — Instruções ao agente no projeto PANELAS

- Leia `documentacao/ESPECIFICACAO_COMPLETA.md` e `documentacao/ESTADO_ATUAL_E_PROXIMOS_PASSOS.md` antes de alterar lógica.
- Preserve o código jogável local no `index.html`, as 52 cartas na pasta `assets/cartas/` e o modo de teste 1 humano + 3 bots.
- **Não** implementar modo power-ups sem definição do usuário.
- As cartas V3 existentes são apenas **ilustrações temporárias**. Os defeitos visuais conhecidos foram registrados, não tentar consertar com recortes de prancha sem autorização.
- Não substituir as regras personalizadas pelas regras oficiais do UNO.
- Validar comportamento com testes, em especial penalidades acumuladas obrigatórias, corte numa jogada separada, bot, Distribuidora aleatória com mínimo 1 e limite do autor e soma de pontos.
- Corrigir a exibição de PNGs rodando o app sob servidor HTTP, não presumir acesso a `file://` no Android.
- Manter o código legível; se reorganizar, fazê-lo em passos com teste de regressão e possibilidade de rollback.
- Não expor mãos secretas em eventos públicos do multiplayer; servidor autoritativo no futuro.
- O usuário prefere discutir grupos de decisões importantes, não uma pergunta por microdetalhe.
- Distinguir claramente **feito / testado / ainda a fazer**. Se houver ambiguidade, registrar e sugerir solução, não inventar regra final silenciosamente.
