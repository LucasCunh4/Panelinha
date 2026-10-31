# Mesa: refinamentos, mínimo da Distribuidora e APK direto

Base: `android/apk-testes` / `1ed8485`, APK 0.2.16/c3602. Mesma implementação web/Android, sem substituição do jogo e sem alterar PNGs.

## Refinamentos

- Monte vertical na área interna livre à esquerda do queimador: âncora (500,451) no plano nativo do fogão em paisagem. Em retrato, o cover recorta essa região; o monte fica na área interna superior esquerda disponível, com limite de borda e afastamento das mãos. Toque direto, pilha, alvo mínimo de 44 px e contador preservados.
- Chama amarela: opacidade normal 0,74→0,851 (+15%), limitada a 0,96 sob penalidade máxima. Não muda PNG, máscara, animação ou escala da chama. As demais cores mantêm seus valores.
- Nome/avatar humano no rodapé abaixo da mão em retrato, afastado do fogão. Em paisagem, permanece na lateral inferior com pequeno ajuste para baixo. Cartas maiores têm espaço reservado sem recortar a faca.
- Aumento moderado das cartas humanas, laterais, parceiro e descarte (aproximadamente 4–7%, conforme tamanho e limites responsivos). Mãos laterais e rótulos sobem; todos os versos/frentes permitidas e contagens continuam representados.
- Compras mais calmas: voo simples em cerca de 418 ms; sequência de vinte termina em cerca de 1,3 s. Compras grandes ainda aceleram progressivamente, com sprites individuais e duração total abaixo de 1,85 s nos testes. Estado/turnos avançam independentemente da animação.
- Brilho branco fino contorna a moldura metálica amarela do PNG: SVG no mesmo plano 1672×941, percurso alinhado à moldura e ciclo de 7,5 s. Segue o sentido atual, com fase espelhada ao inverter para não saltar de posição. Não intercepta eventos nem cobre cartas. Preferência por movimento reduzido deixa o brilho estático; indicação textual/acessível de sentido continua presente.
- Camadas inferiores do descarte: deslocamento de 9 px/4 px e rotação adicional de 4,5° por profundidade, mantendo apenas três representações e o topo lógico como única carta válida. Voo e pouso continuam integrados.

Tudo foi feito em HTML/CSS/JS/layout. As 52 artes de cartas e os seis recursos oficiais conservam seus hashes. Pontuação, bots, Giro, penalidades, laboratório, corte de 2200 ms, cronômetro final, modo imersivo, pacote, origem e chave permanecem preservados fora da restrição solicitada.

## Distribuidora: mínimo 1

A redistribuição reserva **uma carta por participante ativo** antes de sortear os excedentes. O autor recebe entre 1 e o tamanho da mão imediatamente após descartar a Distribuidora. Os demais recebem quantidades aleatórias de pelo menos 1; o total e os IDs são conservados. Penalidades continuam entrando no conjunto e terminam após a distribuição.

Consequência dos limites simultâneos: **Distribuidora não pode ser utilizada como última carta**, porque seu teto seria zero. A ação é recusada antes de remover a carta, tanto em turno normal quanto em corte/penalidade. A UI informa a restrição e permite comprar; os bots usam o mesmo filtro de legalidade. A carta não cria zeros nem um novo vencedor por redistribuição. Finalizador anterior durante uma penalidade continua excluído, com encerramento/pontuação existentes.

O caso já tratado de um único destinatário incapaz de absorver o excedente da penalidade continua indisponível, sem devolver ou apagar sobras.

## Download sem ZIP

O workflow existente usa **`actions/upload-artifact@v7` com `archive: false` e um único caminho `.apk`**. Não passa JSON, pasta ou wildcard nessa etapa. No v7, o nome original do arquivo vira o nome do artefato. Metadados e diagnósticos têm uploads separados; relatórios podem continuar em ZIP.

O output `artifact-url` aparece no resumo da execução com o resultado real da etapa Android. O link exige sessão no GitHub, mas entrega o próprio APK, sem arquivo ZIP externo nem extração. A Release continua condicionada à aprovação dos testes; um artefato disponível não significa suíte aprovada. Secrets, assinatura, verificação do APK e sequência de versões não mudam.

Documentação oficial consultada: [upload-artifact v7 — arquivo sem archive](https://github.com/actions/upload-artifact/blob/v7/README.md#upload-an-individual-file-unzipped) e [inputs/outputs do action](https://github.com/actions/upload-artifact/blob/v7/action.yml).

## Testes web aprovados

- `node testes/atualizacao_regras.cjs`: 30 cenários, incluindo 240 partilhas reproduzíveis com 20/40/80/118 cartas; mínimo/teto/conservação, penalidades até +80, teto 1, última carta recusada em Individual/Duplas com/sem punição, abertura com Distribuidora, monte curto e reciclagem, exclusão de finalizador, Giro nas quatro cores/dois sentidos e corte em 2199/2200 ms.
- `node testes/integracao.cjs`: 16/16 regressões das regras, pontuação, bots, laboratório, compras e finalização; imagens HTTP/decodificação/SHA-256.
- `node testes/mesa.cjs`: dez tamanhos, de 320×568 a 1920×1080, controles contextuais, faca, menu, fim de rodada e privacidade.
- `node testes/atualizacao_mesa.cjs`: 36 combinações de tamanhos e leques de 7/15/20/30/60/100 cartas, compras individuais +20/+40/+80/+100 com ritmo atualizado, conservação, corte durante voo, histórico de três camadas/reciclagem, Bloqueio, relógio dos quatro assentos nas duas orientações, resize e movimento reduzido.
- `node testes/refinamentos_mesa.cjs`: voo humano/três bots, verso/sigilo, poses por assento, foco/toque e cancelamento dos efeitos sem alterar cartas.
- `node testes/mesa_fina.cjs`: âncora do monte e toque, avatar abaixo da mão, aumento moderado, alinhamento do brilho, movimento nos dois sentidos e inversão sem salto, amarelo +15% com limite, compras mais lentas e três camadas.
- `npm run build`, `node testes/android-compat.cjs`, cinco testes de versionamento, sintaxe JS/shell e `git diff --check` aprovados. YAML/shell do workflow validados; etapa do APK tem um único arquivo e `archive: false`.
- Comparação da fonte: únicas funções do script principal alteradas são `redistribute`, `canDistribute`, `canPlay` e `render`. As demais, incluindo pontuação, bots, Giro e janela de corte, são idênticas à base. Nenhuma alteração na identidade, origem ou código nativo do host.

Capturas Chromium, não de aparelho físico:

- [Retrato](../evidencias-mesa-fina/390x844-mesa-fina.png)
- [Paisagem](../evidencias-mesa-fina/844x390-mesa-fina.png)
- [Tela pequena](../evidencias-mesa-fina/320x568-mesa-fina.png)
- [Camadas inferiores](../evidencias-mesa-fina/pilha-inferiores.png)

## Android e APK

Os seis testes Android e os controles de persistência após reinício/atualização continuam obrigatórios, sem desinstalar ou limpar dados. Nenhum teste foi removido ou marcado como aprovação artificial.

Certificado ativo esperado: `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`, geração 2. applicationId `com.lucascunha.panelinha.teste`, origem `https://localhost`. O próximo código supera 3602 e o candidato 3603.

### Execução #17 — 0.2.17/c3702

- [Workflow](https://github.com/LucasCunh4/Panelinha/actions/runs/41231985219), fonte `47aabea52088e081ea556b785e248d49cba892fa`. Compilação e assinatura aprovadas, incluindo o APK de instrumentação e o candidato de atualização 3703.
- O emulador deixou de responder durante `a_imagesAndThreeBotsOffline`: ADB ficou offline e a porta de controle 5554 recusou conexão. **0/6 testes concluídos nesta execução**; não houve resultado de asserção desse primeiro teste. Os diagnósticos não registram exceção fatal do Panelinha antes da interrupção. A causa exata do encerramento do emulador não foi estabelecida.
- Offline em execução Android, toques, orientações, imersão, novas regras nativas e persistência após reinício/atualização permanecem pendentes nesta rodada. Não foram geradas novas capturas Android. [Diagnósticos preservados](https://github.com/LucasCunh4/Panelinha/actions/runs/41231985219/artifacts/13053824223).
- O workflow permanece com conclusão **failure** e a Release foi bloqueada. O resumo da execução informa o resultado real da etapa Android junto do link de download; disponibilizar o APK compilado/verificado não equivale a aprovar a suíte.

### Download direto e validação do APK real

**[Baixar Panelinha-Teste-v0.2.17-c3702.apk diretamente](https://github.com/LucasCunh4/Panelinha/actions/runs/41231985219/artifacts/13053923557)** — requer sessão no GitHub, sem extração de ZIP. Retenção até 29/01/2027.

O action v7 registrou `archive: false` e criou o artefato com o nome do arquivo `.apk`, contendo **31.933.423 bytes**. O arquivo baixado já contém `AndroidManifest.xml` e DEX na raiz do pacote Android; não contém outro `.apk` nem um ZIP externo. Foi passado diretamente ao verificador, sem extração prévia. O SHA-256 coincide com o digest do artefato publicado:

`29fa6724d5d11e939ae858c056eda22c2c4c9d6242403cf65d85db1d15f8f9b0`

Validação local independente com `ferramentas/verificar_apk.py`/`apksigner`: assinatura v2 válida, certificado ativo da geração 2, versão 0.2.17/c3702, pacote/origem, SDKs 24/36, release/fullSensor, HTML/CSS/JS exatos, compatibilidade e os 52+6 PNGs aprovados. [Metadados verificados](MESA_FINA_APK_0.2.17.json).

Os APKs reais 0.2.16/c3602 e 0.2.17/c3702 foram comparados: mesmo certificado SHA-256 `3918ce17b4aeb4f8eb56fd53dc7629151fadd12f13ea0fc3056310bf951fe509`, mesmo pacote e origem, código maior. **Identidade compatível com atualização direta, sem desinstalar.** O teste prático de instalação por cima e dados locais não concluiu devido à indisponibilidade do emulador.

O [artefato de metadados](https://github.com/LucasCunh4/Panelinha/actions/runs/41231985219/artifacts/13053868923) e os diagnósticos são separados do APK. O candidato 3703 não é distribuído. As alterações seguintes neste checkout são somente documentação/evidências; o código do APK corresponde à fonte acima.

## Limitações

Sem validação em celular físico nesta rodada. Na orientação retrato, o fundo em cover não mostra a área esquerda inteira do PNG; o monte usa a alternativa interna superior esquerda descrita acima. Capturas estáticas não demonstram fluidez/FPS. A partida continua apenas em memória; atualização com a mesma identidade não implementa retomada da partida. Download do artefato requer login no GitHub e respeita sua retenção; o arquivo baixado será `.apk`.
