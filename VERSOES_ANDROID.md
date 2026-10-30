# Histórico Android

| Versão | versionCode | Canal | Observação |
| --- | --- | --- | --- |
| v0.1.1 | 102 | Correção de compatibilidade Android | APIs JavaScript para WebViews antigos, preservando jogo e identidade de atualização. |
| v0.1 | 100 | Primeiro APK de testes | Capacitor; jogo/52 PNGs preservados; assinatura exclusiva fixa; orientações por sensor. |

O primeiro APK fica em `distribuicao/Panelinha-Teste-v0.1-c100.apk`, acompanhado de JSON e SHA-256. Ele foi incluído na branch de entrega para permitir download pelo GitHub mesmo enquanto o acesso à API de Releases está bloqueado. A chave de assinatura não está neste diretório nem no repositório.

As versões seguintes ficam no histórico de **Releases de testes**, criado pelo workflow. As numerações automáticas serão v0.1.(N+1), seguindo as execuções do Actions; falhas podem deixar lacunas. Cada Release guarda o APK, seu hash, código, certificado e commit correspondente. Não substitua APKs de versões já distribuídas.

`0.1.1-upgrade-check`/101 e `0.1.2-upgrade-check`/103 são compilações locais para teste de atualização, não versões distribuídas. A tag v0.1.1 e o código 102 identificam a correção efetivamente distribuída.
