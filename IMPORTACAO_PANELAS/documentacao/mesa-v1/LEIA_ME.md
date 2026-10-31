# Panelinha — Mesa V1 — Recursos aprovados

Este pacote não substitui o jogo. Contém **somente** as imagens aprovadas para a mesa:

- `assets/mesa/fogao_fundo.png`: fundo **sem** cartas, avatares, botões, pilhas ou HUD, 1672 × 941.
- `assets/mesa/chama_{vermelha,azul,verde,amarela}.png`: quatro sprites RGBA transparentes 1024 × 1024, mesmo formato; não incluem peças metálicas.
- `assets/mesa/corte_faca_balao.png`: balão com faca aprovado para a ação de corte.
- `PREVIA_chamas_no_fogao.jpg`: conferência ilustrativa do encaixe.
- `MANIFESTO_ASSETS.json`: dados de dimensões e centro de referência.

O queimador tem centro aproximado (836, 451) na imagem de 1672 × 941. A prévia usou uma imagem de chama escalada para 490 × 490, centrada nesse ponto. Isso é uma **referência inicial**, não um posicionamento definitivo para todos os dispositivos. Ao adaptar retrato/paisagem, use a mesma transformação de coordenadas para imagem e sobreposição ou a chama ficará desalinhada.

`corte_faca_balao.png` deve aparecer como ação contextual ao lado/sobre a carta igual elegível, não como botão fixo no rodapé. Os arquivos PNG de cartas já presentes no repositório devem ser preservados.

**Atenção:** o APK deve manter o mesmo applicationId, assinatura e incrementação de versionCode que o APK de teste já instalado no celular. O pacote não inclui segredo de assinatura.
