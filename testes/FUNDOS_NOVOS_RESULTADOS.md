# Substituição definitiva dos fundos normais

Base: `d6f145f` em `android/apk-testes`, contendo o novo ZIP; checkout limpo, sem perda ou sobrescrita de trabalho.

## Arquivos instalados

Em `IMPORTACAO_PANELAS/`:

- `assets/cartas/fundos/fundo_amarelo_novo_470x800.png`
- `assets/cartas/fundos/fundo_azul_novo_470x800.png`
- `assets/cartas/fundos/fundo_verde_novo_470x800.png`
- `assets/cartas/fundos/fundo_vermelho_novo_470x800.png`

Todos idênticos byte a byte ao ZIP `panelinha_fundos_normais_novos_470x800.zip`, CRC íntegro, SHA-256 `203442471e7f50b21a9f186b56d8a67f300d35fb8696b26f2c646c1c6ad271c7`. São PNGs RGB opacos 470×800, sem borda branca incorporada, inspecionados visualmente antes da integração. Nenhuma conversão ou edição das imagens.

## Arquivos antigos excluídos via git rm

- `IMPORTACAO_PANELAS/assets/cartas/fundos/fundo_amarelo_retrabalhado_470x800.png`
- `IMPORTACAO_PANELAS/assets/cartas/fundos/fundo_azul_retrabalhado_470x800.png`
- `IMPORTACAO_PANELAS/assets/cartas/fundos/fundo_verde_retrabalhado_470x800.png`
- `IMPORTACAO_PANELAS/assets/cartas/fundos/fundo_vermelho_retrabalhado_470x800.png`
- `panelinha_fundos_retrabalhados_470x800.zip`, que continha os fundos substituídos.

Instalação e validação no navegador ocorreram antes das exclusões. Sem fallback, cópias ou backups dos fundos anteriores no repositório atual. Lista de remoção do manifesto e relatórios históricos são registros, não dependências ativas. Histórico Git preservado.

## Componentes alterados e preservação

- `cartas.js`: exclusivamente a troca do caminho do fundo para `fundo_<cor>_novo_470x800.png`. Cores red/blue/yellow/green continuam mapeadas para vermelho/azul/amarelo/verde. Composição mantém fundo + três instâncias do símbolo unitário.
- `MANIFESTO_CARTAS_470X800.json`: caminhos, dimensões e hashes dos quatro fundos novos, pacote de origem e registro das exclusões.
- `ferramentas/build-web.cjs` / `verificar_apk.py`: conferem o formato RGB original dos quatro fundos; os outros 19 PNGs continuam obrigatoriamente RGBA. Hashes, inventário de 23 PNGs e 52 combinações, identidade e assinatura permanecem verificados.
- `testes/cartas_470x800.cjs`: reforçada a asserção do caminho exato do fundo de cada cor nas 52 combinações.
- Instrução visual atualizada em `IMPORTACAO_PANELAS/AGENTS.md`.

Comparação com a base confirmou os 19 PNGs de números/símbolos/especiais/verso intactos. `cartas.css`, `mesa.css`, `mesa.js`, efeitos, motor, servidor e identidade Android sem mudanças. Portanto preservados geometria 470×800 + borda externa 25 = 520×850, raios 70/45, bordas branca/dourada, tamanhos renderizados da 0.2.52, espaçamento, sobreposição, posições e animações. Sem segunda moldura ou margem nova.

## Verificações executadas

- CRC, leitura das dimensões/formato e inspeção das prévias das quatro cores; correspondência byte a byte ao pacote.
- `testes/cartas_470x800.cjs`, somente escopos `assets`, `layout`, `animations`: aprovado. 52 combinações de 0–9/+2/Bloqueio/Inverter nas quatro cores, cinco especiais e verso, bordas externas/proporção/contagem de camadas; oito layouts Individual/Duplas em 568×320, 844×390, 1280×800 e 1920×1080. Mão compacta de 40 cartas, seleção, montes, compras normais/punitivas e descarte. Recursos previamente carregados disponíveis offline; sem imagens quebradas ou exceções JavaScript. Capturas de galeria e mesa móvel inspecionadas.
- `npm run build` / `npx cap copy android`: aprovados, somente os quatro fundos novos também em dist/Capacitor; sem imagens antigas no pacote gerado.
- Sintaxe JS/Python, `git diff --check`, comparação dos 19 PNGs preservados e comparação do renderizador (alteração única do caminho do fundo): aprovadas.

## Cache e carregamento

Não há service worker/precache/CacheStorage no cliente atual. `PanelinhaCards` mantém cache de imagens em memória por caminho; os quatro caminhos novos impedem reutilização dos PNGs anteriores em uma página atualizada. Build reconstrói dist e cópia do Capacitor foi renovada, sem fundos antigos. Nenhuma limpeza dos dados locais do usuário.

## Publicação e APK final

Versão web publicada no Worker existente (`11a618eb-6034-410a-acea-0636a6ed88d8`). `cartas.js` e os quatro fundos publicados conferidos byte a byte com o build; os quatro caminhos antigos já não servem PNGs. Cache-Control confirmado `public, max-age=0, must-revalidate`, com ETags atuais; nomes novos das imagens impedem reutilização dos fundos antigos. `/health` confirmou Fase 3 ativa, sem alterar servidor, bindings/configuração ou criar sala pública.

[APK direto 0.2.53/c7302](https://github.com/LucasCunh4/Panelinha/releases/download/v0.2.53/Panelinha-Teste-v0.2.53-c7302.apk), 68.794.461 bytes, HTTP 200.

[Workflow 42418210937](https://github.com/LucasCunh4/Panelinha/actions/runs/42418210937): aprovado, execução 53, fonte `7493f86dc5f556529fe2fa02ad266cde78c821ec`. Um único APK compilado/assinado, emulador ignorado por opção.

Verificador `ferramentas/verificar_apk.py` executado também sobre o APK real baixado da Release: aprovado. SHA-256 `bf8456f05907509ca1f6412a5a1ff0da7f00d79876d0334c2b5f1c1258a62736`. Metadados regenerados idênticos ao CI: 23 PNGs, 52 combinações, quatro fundos novos RGB, demais recursos e código web conferidos, sem fundos substituídos. Mesma geometria, pacote `com.lucascunha.panelinha.teste`, origem `https://localhost`, certificado registrado em `android-identity.json` e geração 2 da versão anterior; assinatura v2 e sensorLandscape confirmados. Código 7302 > 7202, compatível com atualização direta. Nenhuma chave/Secret criado ou alterado.

Emulador e aparelho Android físico não utilizados; instalação, atualização e preservação efetiva de dados em dispositivo não foram executadas. Não são declaradas aprovadas.
