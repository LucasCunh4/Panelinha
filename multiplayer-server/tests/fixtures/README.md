# Referência de paridade offline

`paridade-offline.json` registra 30 cenários executados no motor anterior à extração, commit `a560c24`, com relógio em 5000 ms e gerador LCG inicial `0x50414e4c`. Cada entrada contém estado inicial, intenção e resultado observado, incluindo cartas/IDs, penalidades, sequência, redistribuição e pontuação. Os dados são inteiramente sintéticos, sem jogadores ou credenciais reais.

O teste aplica as mesmas intenções ao núcleo compartilhado e compara os campos registrados. A interface, os sons e os timers do navegador foram substituídos por callbacks sem apresentação ao capturar a referência; a lógica anterior das regras foi executada. Campos novos de transporte e identificação do vencedor não fazem parte dessa referência.

Não regenere o resultado esperado apenas para eliminar uma divergência. Uma mudança de regras precisa de autorização e revisão específica dos cenários afetados. O arquivo é referência de teste; não entra no build web, no Worker ou no APK.
