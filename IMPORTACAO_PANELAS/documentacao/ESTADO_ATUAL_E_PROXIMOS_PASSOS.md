# Estado atual e próximos passos

## O que há de verdade funcionando hoje
- `index.html`: protótipo **local** em HTML/CSS/JS (sem framework) para um jogador humano e três bots. Contém opções e laboratório para testar as principais regras.
- `assets/cartas/`: **52 PNGs** coloridos de números 0–9, +2, Bloqueio e Inverter; as cartas incolores ainda aparecem em estilo antigo.
- `index.html` já usa `cardAssetPath` e fallback textual, com opção de desligar imagens e mostrar cartas antigas.
- Protótipo anterior V2 era jogável; a V3 foi testada para carregamento dos PNGs e uma jogada no navegador. **Isso não equivale a bateria completa de testes automatizados, produção ou multiplayer.**

## Problema relatado pelo usuário
- Em Android, ao extrair o ZIP e tocar em `index.html`, **as imagens não apareceram**. Não presumir que só falta extrair: verificar se as pastas estão presentes e servir por HTTP para evitar bloqueios de `file://`.

## O que existe somente no design / futuro
- Mesa visual de fogão roxo-escuro, personagens panelas, entrada convidado, lobby, código de sala, sincronização online, host, reconexão por bot, site público, Android APK, música e animações refinadas.
- Modo power-ups: futuro, sem regras fechadas.
- Artes oficiais em alta qualidade, com melhor largura e alimentos corretos; estas 52 artes de prévia não são as definitivas.

## Plano mínimo de primeira tarefa
1. Confirmar caminhos e nomes do ZIP.
2. Executar servidor HTTP de prévia e abrir no browser.
3. Mostrar por que os PNGs não carregavam no Android / garantir carregamento por HTTP.
4. Implementar regressões automatizadas (ou, no mínimo, roteiro reproduzível) para regras críticas.
5. Melhorar organização do código sem reescrever lógica validada sem necessidade.
6. Entregar link local/de preview utilizável no celular ou indicar exatamente como hospedar o projeto.

## Riscos a evitar
- Não substituir o `index.html` pelo HTML de uma nova interface sem reconectar a lógica.
- Não desenvolver multiplayer enviando mãos secretas a todos os clientes.
- Não mudar valor de pontuação ou baralho para regras oficiais de UNO, pois são personalizadas.
- Não dizer que PNG individual foi criado em alta definição: veio de prancha recortada.
- Não usar dependências desnecessárias na etapa inicial.


## Atualização da mesa funcional (31/10/2026)

As seções de planejamento acima registram o protótipo original. Hoje a Mesa V1 web/Android, bots e laboratório estão implementados; confira `ANDROID.md` e os relatórios em `testes/` para validações e limitações atuais. Os nomes especiais visíveis são **Panela de Pressão** (`dist`) e **Liquidificador** (`rotate`), com as regras documentadas na especificação completa. Esta rodada muda apresentação e nomes; não altera os efeitos dessas cartas.
