# Resultados da integração

Base: `b071202` (`origin/HEAD`). Branch: `integracao/panelas-importacao`.

## Integração

O repositório continha somente o ZIP; não havia aplicação anterior nem alterações locais a substituir. Os **67 arquivos** extraídos foram comparados byte a byte com o arquivo original antes de remover o ZIP da árvore ativa. A estrutura `IMPORTACAO_PANELAS/` e seus arquivos foram preservados integralmente. O arquivo original continua no histórico Git. Adicionados apenas entrada na raiz, instruções e testes; nenhuma regra, arte ou função do jogo foi reescrita.

## Executado com sucesso

- `python3 IMPORTACAO_PANELAS/testes/verificar_assets.py`: 52 arquivos esperados presentes, assinatura PNG e resolução mínima válidas.
- `node testes/integracao.cjs`: saída 0, **16/16 cenários controlados de regras aprovados**.
- Os 52 PNGs correspondem aos SHA-256 do manifesto, retornam HTTP 200 com tipo `image/png` e são decodificados pelo Chromium.
- Início individual e duplas com 1 humano + 3 bots; mão do parceiro oposto visível em duplas.
- Baralho de 114/118 cartas e dois zeros de cada cor; bloqueio de carta comum contra +20; compra integral com perda de vez; acúmulo +2→+4→+6; resposta igual/maior independente de cor.
- Distribuidora soma +20 ao pool, distribui com diferença máxima de uma carta e encerra a punição; Giro segue a direção e fica indisponível contra +N.
- Duas +2 idênticas em cliques separados não duplicam efeito; corte externo redireciona a vez e acumula; desligar cortes remove o comando; duas cópias de Bloqueio mantêm apenas um jogador pulado.
- Desafio procedente cobra o último autor; improcedente cobra o desafiante com +2 extra; denúncia de última carta cobra +2; compra voluntária pode ser guardada.
- Penalidade final permanece pendente antes da classificação; em um cenário funcional adicional, o bot compra a penalidade final antes do encerramento. Valores personalizados e pontos 3/2/1/0 conferidos.
- Bot joga automaticamente; laboratório revela mãos e desliga PNGs; cronômetro com +20 cobra o total; requisição de PNG deliberadamente abortada mostra fallback textual.
- Chromium com toque e viewport 390×844; jogo também visível em 844×390 e 1280×800. Sem exceções JavaScript durante o runner. A falha de rede do teste de fallback é intencional.

## Limites / ainda a fazer

Não houve teste em celular físico. Mudar viewport e emular toque não valida todos os navegadores Android/iOS nem garante ausência de todos os problemas de layout. A causa exata da falha anterior em `file://` não foi reproduzida; o fluxo HTTP foi validado.

A suíte é de regressão representativa, não cobertura completa da especificação: não certifica todos os casos de primeira carta especial, desafios encadeados com cortes, empates perfeitos, partidas longas nem todas as configurações. Ambiguidades de regras continuam documentadas na especificação original.

Servidor HTTP executado internamente na porta 8000. Não há ferramenta de URL pública/encaminhamento de portas disponível nesta sessão, portanto não foi entregue nem testada uma prévia remota no celular. O README explica a publicação estática; não foi ativado GitHub Pages. Não houve implementação de multiplayer, APK ou power-ups.

As instruções de reinício do servidor foram salvas no campo `start_skill` do rascunho do ambiente. Isso não publica o ambiente nem o aplicativo.
