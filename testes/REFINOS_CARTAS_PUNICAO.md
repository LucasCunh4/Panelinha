# Refinos das cartas e compra punitiva — 07/11/2026

Base: `6ab9b6d`, APK 0.2.49/c6902. Checkout limpo, igual ao HEAD remoto.

Código alterado:
- `IMPORTACAO_PANELAS/cartas.js`: raios 70 externo / 45 interno e deslocamento de símbolo -20 no canvas 470×800, centralizados na geometria; bloqueio de drag/select/contextmenu nativos apenas nas cartas.
- `IMPORTACAO_PANELAS/cartas.css`: máscara proporcional nos cantos; somente a camada transparente sobe 2,5% de sua altura; tap highlight transparente, user-select/callout desativados, foco de teclado preservado. Bordas continuam 25 px e nas mesmas cores.
- `IMPORTACAO_PANELAS/motor.js`: somente cadência visual compartilhada: punição a cada 80 ms, voo de 120 ms, encaixe de 20 ms incluído e margem final reduzida de 200 para 40 ms. Quantidades, legalidade, acúmulo, pontuação e ordem dos turnos sem alteração.
- `IMPORTACAO_PANELAS/efeitos-mesa.js`: punições permitem voos sobrepostos diretamente até a mão (frente só para dono, verso para demais), sem espera pelo término da carta anterior; compras normais e decisão Jogar/Guardar permanecem.
- `MANIFESTO_CARTAS_470X800.json`: atualizada somente a geometria, sem trocar arquivos/hashes de imagens.

Verificações realizadas:
- `node testes/refinos_cartas_punicao.cjs`: aprovado. Celular 844×390 e desktop 1280×800, 13 camadas, raios/bordas/proporção, seleção/descarte, foco, ausência de highlight nativo e drag de imagens, +2/+4/+6/+20/+40 para humano e bot, sobreposição, todas as chegadas, conservação/IDs únicos e limpeza. +20 = 1.680 ms até liberação; +40 = 3.280 ms. Prazo autoritativo também verificado no motor multiplayer, sem perda de privacidade. Compra normal/decisão preservada.
- `node testes/halo_cartas_470x800.cjs`: aprovado; zero sobreposição, folga 5,25 px nos quatro lados, usando o novo raio.
- `node testes/refino_compras_online.mjs`: aprovado; projeções dono/observador, voos rápidos, bloqueio de turno pelo servidor e sigilo preservados. Não abre sala pública.
- Análise dos 13 PNGs transparentes: nenhum pixel dos símbolos com alfa >64 fora da nova máscara após subir 20 px. PNGs não editados; SHA-256 dos 23 recursos confere com o manifesto.
- Capturas inspecionadas, sem exceções JavaScript. `npm run build`, sintaxe JS e `git diff --check` aprovados. Expectativas antigas de tempo atualizadas, sem excluir testes ou executar baterias completas.

Nenhum emulador ou Android físico executado. Desempenho/gestos nativos e instalação/atualização no aparelho físico aguardam teste do usuário.

APK final e publicação: a registrar após o workflow único, com a assinatura permanente de geração 2.
