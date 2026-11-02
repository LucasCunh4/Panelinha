# Panelinha — Carta Liquidificador oficial (400 × 850 px)

## Conteúdo

- `liquidificador_oficial_400x850.png` — arte final aprovada, no mesmo estilo da Panela de Pressão.
- `PREVIA_COMPARATIVA.jpg` — imagem de comparação com a Panela de Pressão (não é asset para o aplicativo).
- `MANIFESTO.json` — dimensões, hash e requisitos.
- `PROMPT_PARA_CODEX.md` — instruções para instalar no projeto.

A arte final é **PNG RGBA, 400 × 850 px**, com **máscara de transparência idêntica à carta Panela de Pressão**, inclusive os cantos arredondados. A ilustração foi reduzida preservando proporções (sem a deformação do pacote antigo +4/+6). Não adicione bordas nem force outra proporção no código.

## Atenção às regras

Esta é a carta **Liquidificador**, não a Panela de Pressão: ela **gira as mãos uma posição no sentido atual da partida**, sem escolher uma cor. A atualização substitui apenas a imagem; não reescreva as regras. Preserve a opção para ativar/desativar a carta no menu, assim como a composição e a contagem do baralho.

## Aplicação

Na branch `android/apk-testes` do projeto, localize a referência visual da carta Liquidificador/Giro. Substitua o PNG associado ou atualize a referência, sem mudar o identificador lógico da carta. Garanta que a imagem seja empacotada em `assets/public` para funcionamento offline no APK. Teste a exibição na mão, no descarte, nas animações e com vários modos de jogo. Gere APK com assinatura permanente de geração 2 e `versionCode` crescente.
