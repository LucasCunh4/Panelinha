# AGENTS — Instruções ao agente no projeto PANELAS

- Leia `documentacao/ESPECIFICACAO_COMPLETA.md` e `documentacao/ESTADO_ATUAL_E_PROXIMOS_PASSOS.md` antes de alterar lógica.
- Preserve o código jogável local no `index.html`, as 52 cartas na pasta `assets/cartas/` e o modo de teste 1 humano + 3 bots.
- **Não** implementar modo power-ups sem definição do usuário.
- As cartas V3 existentes são apenas **ilustrações temporárias**. Os defeitos visuais conhecidos foram registrados, não tentar consertar com recortes de prancha sem autorização.
- Não substituir as regras personalizadas pelas regras oficiais do UNO.
- Validar comportamento com testes, em especial penalidades acumuladas obrigatórias, corte numa jogada separada, bot, Panela de Pressão com redução sorteada de 1–3 (mínimo 1), demais com diferença máxima 2 e autor isento ao bater e soma de pontos.
- Corrigir a exibição de PNGs rodando o app sob servidor HTTP, não presumir acesso a `file://` no Android.
- Manter o código legível; se reorganizar, fazê-lo em passos com teste de regressão e possibilidade de rollback.
- Não expor mãos secretas em eventos públicos do multiplayer; servidor autoritativo no futuro.
- O usuário prefere discutir grupos de decisões importantes, não uma pergunta por microdetalhe.
- Distinguir claramente **feito / testado / ainda a fazer**. Se houver ambiguidade, registrar e sugerir solução, não inventar regra final silenciosamente.

- Tela inicial e navegação ficam em `menu.css` / `navegacao.js`; reutilize `#menu` e preserve o motor. Telas Criar/Entrar são preparação visual, sem backend/códigos fictícios. Voltar deve confirmar saída de partida ativa e respeitar a hierarquia, inclusive no Android.
- A identificação em `perfil.js` fica entre Início e Configurações/Multiplayer. Nome/avatar locais usam `panelinha.player.v1`; escape nomes em HTML, preserve os bots e não apague outras chaves. O APK usa `sensorLandscape` e categoria `game`, com imersão permanente. `wild6` é opcional, ativada por padrão, aplicada somente em novas partidas. O brilho de compra usa disponibilidade real de cartas/desafio, e o crescimento da mão não sinaliza corte fora do turno como turno normal.
- Verso e frente da Panela usam somente `assets/padronizadas/*_400x850.png`, com `MANIFESTO_PADRAO_400X850.json`. Não restaurar as duas versões antigas de `assets/especiais/`; as outras 11 imagens especiais permanecem. Reutilizar os componentes e `contain`, sem cortar, esticar, adicionar bordas ou alterar as demais artes.
