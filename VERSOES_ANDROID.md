# Histórico Android

| Versão | versionCode | Canal | Observação |
| --- | --- | --- | --- |
| v0.2.0 | 2000 | Nova assinatura permanente, geração 2 | Rotação autorizada após perda da chave antiga; exige reinstalação única manual. |
| v0.1.1 | 102 | Correção de compatibilidade Android | APIs JavaScript para WebViews antigos, preservando jogo e identidade de atualização. |
| v0.1 | 100 | Primeiro APK de testes | Capacitor; jogo/52 PNGs preservados; assinatura exclusiva fixa; orientações por sensor. |

O primeiro APK fica em `distribuicao/Panelinha-Teste-v0.1-c100.apk`, acompanhado de JSON e SHA-256. Ele foi incluído na branch de entrega para permitir download pelo GitHub mesmo enquanto o acesso à API de Releases está bloqueado. A chave de assinatura não está neste diretório nem no repositório.

As versões seguintes ficam no histórico de **Releases de testes**, criado pelo workflow. As numerações automáticas serão v0.1.(N+1), seguindo as execuções do Actions; falhas podem deixar lacunas. Cada Release guarda o APK, seu hash, código, certificado e commit correspondente. Não substitua APKs de versões já distribuídas.

`0.1.1-upgrade-check`/101 e `0.1.2-upgrade-check`/103 são compilações locais para teste de atualização, não versões distribuídas. A tag v0.1.1 e o código 102 identificam a correção efetivamente distribuída.

## Substituição de assinatura — 30/10/2026

O certificado da família v0.1 foi aposentado por perda da chave privada.
O SHA-256 antigo permanece em `android-identity.json.previousCertificates`; não
é aceito como assinatura ativa. O pacote, origem, regras, bots e interface não
foram alterados. v0.2.0/c2000 e o candidato 0.2.0-upgrade-check/c2001 usam a nova
chave. O candidato 2001 é só para teste, não uma versão distribuída.
A sequência do workflow foi preservada; futuras versões superam 2001 e todo o
histórico publicado. Evidências atuais em `testes/ASSINATURA_V2_RESULTADOS.md`.

## Mesa V1 — 0.2.11 / código 3102

- Fonte: `4c5e9ac5e3807a410f7d629c0cd466d6af9fb51a`, branch `android/apk-testes`.
- Release/compilação automática: [v0.2.11](https://github.com/LucasCunh4/Panelinha/releases/tag/v0.2.11), workflow #11 aprovado.
- Mesa com os PNGs oficiais; regras/bots/cartas preservados. Certificado da geração 2 inalterado; pacote e origem permanentes. Código 3103 reservado ao teste de atualização, não distribuído.
- 4 testes offline + controle de persistência após reinício + teste de atualização aprovados no Android 35.
- [Relatório, capturas e download](testes/MESA_V1_RESULTADOS.md).

## Refinamentos da mesa — 0.2.14 / código 3402

- Fonte: `44974dd74233ed1700e425a42fb6ff766c898d18`, branch `android/apk-testes`.
- [APK assinado em artefato do workflow #14](https://github.com/LucasCunh4/Panelinha/actions/runs/41164082119/artifacts/13028780227), compilação e assinatura aprovadas; não publicado em Release porque o emulador caiu no primeiro teste. A suíte Android desta rodada está pendente, sem testes desativados.
- Chamas suavizadas/animadas, compra à esquerda, mãos físicas orientadas, voo da carta e faca maior. Regras, bots e imagens originais preservados.
- APK real verificado: geração 2, pacote e origem fixos, código maior que 3102/2003, apto à atualização direta por identidade. Código 3403 reservado ao teste, não distribuído.
- [Relatório, hashes, testes e limitações](testes/REFINAMENTOS_MESA_RESULTADOS.md). As execuções 0.2.12/c3202 e 0.2.13/c3302 também ficaram somente em artefatos após interrupções do emulador.

## Regras, mesa e imersão — 0.2.16 / código 3602

- Fonte: `724903b194720c3e9cc45944e3e5162152f49211`, branch `android/apk-testes`.
- [APK assinado em artefato do workflow #16](https://github.com/LucasCunh4/Panelinha/actions/runs/41226782036/artifacts/13052470841). Distribuidora aleatória com limite do autor, Giro mantendo cor, corte 2200 ms, cronômetro final, compras/voos, pilha de três, leques completos e host imersivo.
- Assinatura da geração 2, pacote e origem preservados; APK real conferido localmente. Código maior que 3402/3502, com candidato 3603 reservado ao teste.
- Web aprovada. Android: carregamento offline/imagens/três bots aprovado; emulador interrompeu durante o segundo teste, após erros de buffer gráfico. Demais testes e atualização com persistência pendentes, sem remover testes. Release bloqueada; APK disponível em artefato.
- 0.2.15/c3502 foi a compilação intermediária da mesma atualização, também em artefato após a mesma interrupção.
- [Relatório completo e confirmação do certificado](testes/ATUALIZACAO_REGRAS_MESA_RESULTADOS.md).
