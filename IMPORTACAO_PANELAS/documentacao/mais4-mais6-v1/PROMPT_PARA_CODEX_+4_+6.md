Estamos continuando o desenvolvimento do Panelinha.

Adicionei ao repositório um pacote reduzido contendo SOMENTE as artes novas das cartas +4 e +6:
`Panelinha_Artes_+4_+6_Somente.zip`

Trabalhe sobre a versão mais recente e funcional do jogo.
Extraia o pacote e leia `LEIA_ME.md` e `MANIFESTO_ASSETS_+4_+6.json`.

## Objetivo desta etapa
Integrar apenas as novas artes das cartas +4 e +6.

## O que implementar
1. Substitua a frente visual da carta +4 por `carta_mais4_completa.png`.
2. Substitua a frente visual da carta +6 por `carta_mais6_completa.png`.
3. Preserve as regras atuais dessas cartas.
4. Quando o jogador humano usar +4 ou +6 e precisar escolher a cor, apresente a carta ampliada no centro da tela.
5. Nessa apresentação ampliada, use a base correspondente (`base_sem_ingredientes`) junto com os ingredientes separados da própria carta.
6. Os ingredientes devem ser interativos:
   - tomates = vermelho
   - queijos = amarelo
   - mirtilos = azul
   - alfaces = verde
7. Antes da escolha, cada ingrediente deve ter brilho suave ao redor.
8. No desktop, hover deve aumentar e destacar o ingrediente.
9. No celular, toque deve gerar feedback visual e selecionar a cor.
10. Ao confirmar a cor, o ingrediente escolhido deve fazer uma animação curta de destaque.
11. Reaproveite, sempre que possível, a lógica já existente da carta Escolher Cor, apenas trocando os assets.
12. Não crie botões externos para escolher a cor; a interação deve acontecer diretamente nos ingredientes da carta.

## Preservar
- Panela de Pressão, Liquidificador e demais cartas.
- Mesa, bots, regras, pontuação e APK atualizável.
- Assinatura permanente Android atual.

## Entrega
- testar o comportamento das cartas +4 e +6;
- gerar novo APK atualizável sobre o anterior;
- manter o mesmo applicationId e a mesma assinatura.
