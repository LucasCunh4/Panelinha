# PANELAS — transferindo o projeto para o Codex

Este ZIP é uma **fotografia do projeto em 30/10/2026**: protótipo local V3 + 52 imagens atuais + regras/UI discutidas com o usuário. A conversa inteira não é transferida automaticamente ao Codex; a documentação deste pacote reúne as decisões relevantes.

## Passos para usar

1. Descompacte **TODO** este ZIP preservando pastas (`index.html` precisa ficar na mesma raiz de `assets/`).
2. Abra a pasta `PANELAS_PROJETO_PARA_CODEX` como projeto no seu ambiente de programação/Codex. Se já possuir um projeto do jogo no GitHub, transfira estes arquivos para **uma branch nova**, sem apagar trabalho mais recente.
3. Cole o conteúdo de `PROMPT_PRONTO_PARA_CODEX.md` como primeira mensagem da tarefa no Codex. Não precisa colar toda a conversa.
4. Peça ao Codex para rodar uma prévia HTTP; se estiver no PC, execute `python3 -m http.server 8000` nesta pasta e acesse `http://localhost:8000/`.
5. No celular, abrir o arquivo diretamente com `file://` pode impedir as imagens. Use a URL fornecida pelo servidor/ambiente de desenvolvimento.

## Conteúdo
- `index.html`: jogo V3 com bots + suporte a PNGs (não é ainda a versão multiplayer).
- `assets/cartas/<cor>/...`: 52 PNGs exatos existentes, **temporários**.
- `AGENTS.md`: instruções de desenvolvimento para agente.
- `PROMPT_PRONTO_PARA_CODEX.md`: mensagem pronta para copiar.
- `documentacao/ESPECIFICACAO_COMPLETA.md`: regras e design, detalhados.
- `documentacao/ESTADO_ATUAL_E_PROXIMOS_PASSOS.md`: implementado x planejado, defeitos e próximo trabalho.
- `testes/verificar_assets.py`: verificação local de nomes/quantidade/assinatura PNG.
- `referencias_visuais/`: imagens apenas de referência, incluindo o fogão e exemplos de cartas. Não substituem os assets ativos.

## Importante
Se você já iniciou um repositório para este projeto com Codex, faça backup ou commit antes de copiar os arquivos. O objetivo é **continuar**, não sobrescrever trabalho valioso mais recente.
