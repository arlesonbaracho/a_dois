---
name: Jornada
description: O plano de um casal como um deck de cartas sobre papel claro, com cada aporte guardado como comprovante — nunca como extrato.
colors:
  papel: "#fdfbf7"
  tinta: "#070001"
  verde: "#33605a"
  marrom: "#68462b"
  creme: "#e9e0d1"
  salvia: "#91a398"
  suave: "#5f6f68"
  areia: "#f1eae0"
  cinza: "#b3ab9c"
  branco: "#ffffff"
  pessoa-1: "#33605a"
  pessoa-2: "#68462b"
  pessoa-fora: "#b3ab9c"
  borda: "#f1eae0"
  divisa: "#f1eae0"
  contorno: "#87938e"
  listra: "#e9e0d1"
  campo-casa: "color-mix(in srgb, #91a398 55%, white)"
  campo-viagem: "color-mix(in srgb, #68462b 30%, white)"
  campo-reserva: "color-mix(in srgb, #33605a 30%, white)"
  campo-casamento: "#e9e0d1"
  campo-bebe: "color-mix(in srgb, #b3ab9c 55%, white)"
  campo-geral: "#f1eae0"
  alerta: "#8a3a2a"
  alerta-suave: "#f4e6df"
typography:
  numero:
    fontFamily: "Lexend, ui-sans-serif, system-ui, sans-serif"
    fontSize: "52px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.04em"
    fontFeature: "tnum"
  display:
    fontFamily: "Lexend, ui-sans-serif, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Lexend, ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Lexend, ui-sans-serif, system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  secao:
    fontFamily: "Lexend, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Lexend, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "Lexend, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  legenda:
    fontFamily: "Lexend, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  chapa: "12px"
  quadro: "16px"
  bloco: "20px"
  cartao: "24px"
  carta: "32px"
  pilula: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  tela: "20px"
  lg: "24px"
  tela-lg: "40px"
components:
  botao-primario:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.creme}"
    rounded: "{rounded.pilula}"
    height: "56px"
    padding: "0 24px"
  botao-secundario:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pilula}"
    height: "44px"
    padding: "0 20px"
  botao-perigo:
    backgroundColor: "transparent"
    textColor: "{colors.alerta}"
    rounded: "{rounded.pilula}"
    height: "44px"
    padding: "0 20px"
  chip:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.tinta}"
    typography: "{typography.body}"
    rounded: "{rounded.pilula}"
    height: "40px"
    padding: "0 8px 0 16px"
  chip-ativo:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.creme}"
    rounded: "{rounded.pilula}"
    height: "40px"
    padding: "0 8px 0 16px"
  chip-contador:
    backgroundColor: "{colors.areia}"
    textColor: "{colors.tinta}"
    typography: "{typography.legenda}"
    rounded: "{rounded.pilula}"
    height: "26px"
  campo:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.bloco}"
    height: "52px"
    padding: "0 16px"
  carta:
    backgroundColor: "{colors.branco}"
    rounded: "{rounded.carta}"
    padding: "10px"
  cartao-jornada:
    backgroundColor: "{colors.branco}"
    rounded: "{rounded.cartao}"
    padding: "8px"
  bloco:
    backgroundColor: "{colors.branco}"
    rounded: "{rounded.cartao}"
    padding: "16px"
  etiqueta:
    backgroundColor: "{colors.areia}"
    textColor: "{colors.tinta}"
    typography: "{typography.legenda}"
    rounded: "{rounded.pilula}"
    padding: "4px 10px"
  etiqueta-forte:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.creme}"
    rounded: "{rounded.pilula}"
    padding: "4px 10px"
  pilula-total:
    backgroundColor: "{colors.areia}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.cartao}"
    padding: "12px 16px"
  disco-de-acao:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.creme}"
    rounded: "{rounded.pilula}"
    size: "56px"
  dock-destino:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pilula}"
    size: "56px"
  dock-destino-ativo:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.creme}"
    rounded: "{rounded.pilula}"
    size: "56px"
  tecla:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pilula}"
    height: "64px"
  recado-erro:
    backgroundColor: "{colors.alerta-suave}"
    textColor: "{colors.alerta}"
    rounded: "{rounded.bloco}"
    padding: "12px 16px"
  recado-aviso:
    backgroundColor: "{colors.salvia}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.bloco}"
    padding: "12px 16px"
---

# Design System: Jornada (v3)

## Overview

**Creative North Star: "A carta e o comprovante"**

A jornada do casal é uma **carta de um deck**, não uma linha de extrato, e cada
aporte vira um **comprovante** que se guarda. A home mostra a carta da frente
com duas camadas em pastel atrás; a pessoa arrasta para a próxima. Anotar é um
teclado grande que termina num recibo com picote. Quando entra dinheiro, moedas
de R$ 1 caem sobre a tela e o total do mês rola dígito a dígito ao recebê-las.

O mundo recusa o saldo gigante com gráfico do banco digital. É claro, largo e
tátil: papel quase branco, peças brancas que se pegam, tinta quase preta para
estrutura e ação, arte 3D de categoria no lugar de ícone de meta. O app se
compromete com o claro (`color-scheme: light`); não existe paleta escura
desenhada.

**O mundo substituído.** O v2 ("A foto é o conteúdo") era um álbum:
Outfit para estrutura e Manrope para a voz, polaroides tortas, chapas em
gradiente com marca desenhada à mão, e verde `#33605a` como cor de ação além de
primeira pessoa. O v3 troca o álbum pelo deck, as duas faces por Lexend, a
polaroide pela carta de raio 32, e tira do verde o papel de botão: uma cor que
quer dizer "de quem é o dinheiro" não pode também querer dizer "aperte". Nada
do v2 vale como regra aqui.

**Key Characteristics:**
- Nove cores de marca e nenhuma outra; o vermelho de erro é estado, não marca.
- Tinta é estrutura e ação; verde e marrom são só as duas pessoas.
- Uma face, Lexend, em 400 e 500.
- Carta, comprovante e disco flutuam com sombra; o resto se separa por borda.
- Botões, chips e navegação são pílulas e círculos soltos.
- Arte de categoria em Fluent Emoji 3D sobre um campo de cor misturada com branco.
- Quatro movimentos com significado, e nenhum outro.

## Colors

Um papel quente, uma tinta quase preta e dois tons terrosos que pertencem a
gente, não a botão.

### Primary
- **Tinta** (`tinta`): texto principal, botão primário, chip ativo, destino
  ativo do dock, disco de ação, disco de seta da carta, marca de item comprado,
  seleção de texto, anel de foco e o cartão de pedido do parceiro. 20:1 sobre
  o papel.

### Pessoas
- **Verde da pessoa 1** (`pessoa-1` = `verde`) e **marrom da pessoa 2**
  (`pessoa-2` = `marrom`): fatia da barra, disco de iniciais, ponto ao lado do
  nome. Atribuídas por `coresDoCasal` em `packages/core`, nunca pelo índice na
  tela.
- **Cinza de quem saiu** (`pessoa-fora` = `cinza`): aportes de ex-membro; o
  valor continua inteiro, só a identidade esfria.

### Neutral
- **Papel** (`papel`): o fundo de tudo, e o mesmo valor de `THEME_COLOR` e
  `BACKGROUND_COLOR` em `packages/core/src/constants.ts`.
- **Branco** (`branco`): toda peça que se pega — carta, bloco, chip inativo,
  campo, destino do dock.
- **Areia** (`areia`): trilho da barra, contador de chip, etiqueta, pílula do
  total, fundo da tela do comprovante, hover de peça branca. Também é `borda`
  e `divisa`.
- **Creme** (`creme`): texto e ícone sobre tinta ou pessoa; a listra do trilho
  vazio; o toque na tecla.
- **Sálvia** (`salvia`): superfície de aviso tranquilo (recado de aviso, o
  cartão "o que essa pessoa vai ver"), sempre com texto tinta.
- **Suave** (`suave`): texto de apoio — rótulo, legenda, prazo, explicação.
  5.13:1 no papel, 5.30:1 no branco.
- **Contorno** (`contorno`): suave a 75% sobre o branco, 3.18:1. Limite de
  campo, botão secundário, rádio, caixa de marcar e marca de item.
- **Campos de categoria** (`campo-*`): o fundo da arte e a cor da carta quando
  ela está atrás no deck. Cada um é uma das nove misturada com branco; verde e
  marrom entram a 30% para não lerem como pessoa.

### Estado
- **Alerta** (`alerta` sobre `alerta-suave`): erro e ação destrutiva. A única
  cor fora das nove, porque quem vai perder dado precisa reconhecer o perigo.

### Named Rules

**A Regra das Nove.** Nenhuma cor nova. Precisa de um tom? Misture uma das nove
com branco. A exceção é `alerta`, e ela é estado.

**A Regra da Tinta que Age.** Tudo que se aperta ou marca ativo é tinta com
creme. Verde e marrom nunca são botão, link, foco ou chip ativo.

**A Regra do Nome ao Lado.** Cor de pessoa sempre acompanha o nome da pessoa
(texto visível ou `sr-only` no mesmo grupo). Verde contra marrom mede 1.18:1 de
luminância: sozinha, a cor não distingue ninguém.

**A Regra do Creme no Escuro.** Creme só aparece como texto sobre tinta ou cor
de pessoa. Sobre papel ou branco ele some.

**A Regra da Sálvia Muda.** Sálvia é superfície e nunca texto.

**A Regra da Areia.** Texto sobre areia é tinta. Suave ali mede 4.44:1, abaixo
do piso.

**A Regra das Duas Bordas.** `borda` contorna cartão e chip, onde é decoração.
`contorno` fecha campo e botão de contorno, onde o limite é informação e o piso
de 3:1 vale.

## Typography

**Display Font:** Lexend (fallback `ui-sans-serif, system-ui, sans-serif`)
**Body Font:** Lexend, a mesma

Self-hosted via `next/font` na variável `--fonte`. Nunca um `<link>` para
`fonts.googleapis.com`: mandaria o IP de cada visitante a um terceiro.

**Character:** Lexend é larga e feita para leitura. Uma voz só: o peso separa
estrutura de conversa — 500 para título, número e botão; 400 para o que é dito.
Títulos com tracking negativo; números sempre em `tabular-nums` (`.num`).

### Hierarchy
- **Número** (500, 52px, −0.04em, leading 1): o valor no teclado de anotar. O
  comprovante usa 44px no mesmo desenho; o total do mês, 24px no odômetro.
- **Display** (500, 30px, −0.03em, leading 1.1): título de tela de primeiro
  nível — "Nossa jornada", "Jornadas", título de moldura dentro do app. A porta
  usa 28px.
- **Headline** (500, 26px, −0.03em): título de jornada aberta e da jornada nova
  (30px no desktop).
- **Title** (500, 21px, −0.02em): o título na legenda da carta. A frase de
  estado vazio usa 22px.
- **Seção** (500, 18px, −0.02em): o `<h2>` de bloco, via `Secao`.
- **Body** (400, 14px, leading relaxed): explicação (`Explica`, `.font-corpo`),
  chip, recado, botão secundário. Botão primário sobe a 16px/500 e nome em
  linha a 15px.
- **Label** (400, 13px): rótulo de campo, sempre em `suave`.
- **Legenda** (400, 12px): data de aporte, contador, etiqueta, a nota "É uma
  anotação".

### Named Rules

**A Regra da Voz Única.** Lexend e nenhuma outra face; não existe fonte de
sistema como display. Hierarquia vem de tamanho e de 400/500 — 600 e 700 não
pertencem ao v3.

**A Regra Sem Sobretítulo.** Título não leva rótulo pequeno em cima. A tela diz
o que é pelo próprio título; a saudação "oi, Lucas e Ana" é frase, não
etiqueta, e não vai em caixa alta.

## Layout

Uma coluna no celular, presa em `max-w-sm` com respiro de 20px nas bordas e
16px entre blocos. Formulários e leitura abrem para `max-w-2xl`; a home, para
`max-w-5xl` com respiro de 40px no desktop.

**Home no celular:** saudação com o avatar do casal, título, faixa de chips que
rola, o deck no centro e o cartão "Guardado em <mês>" embaixo. O deck reserva
17px por camada de trás (no máximo duas) para as cartas aparecerem.

**Home no desktop (`lg`, ≥1024px):** duas colunas, `27rem` para deck e total, o
resto para as outras jornadas como `CartaoJornada` em grade de duas.

**Dock:** círculos soltos fixos no rodapé sobre um degradê de papel; três
destinos à esquerda e o disco de ação à direita. No desktop deita num trilho de
6rem à esquerda. O conteúdo reserva `pb-28` no celular.

**Anotar** é tela cheia: o dock some, o valor centralizado ocupa o meio, o
teclado 3×4 e o botão ficam no alcance do polegar.

**A Regra da Faixa que Esmaece.** Faixa horizontal que termina dentro de um
contêiner esmaece nos últimos 2.5rem (`.faixa-que-rola`); cortada seco, lê como
defeito.

## Elevation & Depth

Quase plano. Peça branca sobre papel se separa por 1px de `borda`; só o que
flutua tem sombra, e toda sombra é tinta em baixa opacidade, suave e para baixo.

### Shadow Vocabulary
- **Carta** (`box-shadow: 0 18px 40px rgb(7 0 1 / 0.08)`): a carta do deck, a
  carta da jornada nova, o comprovante e as chapas do leque da porta.
- **Peça** (`box-shadow: 0 14px 30px rgb(7 0 1 / 0.08)`): aviso flutuante de
  instalar o PWA.
- **Disco** (`box-shadow: 0 8px 18px rgb(7 0 1 / 0.24)`): disco de ação do dock
  e disco de seta da carta. Mais fechada porque o objeto é pequeno.
- A arte 3D leva `drop-shadow(0 16px 20px rgb(7 0 1 / 0.14))`; a moeda,
  `drop-shadow(0 6px 6px rgb(7 0 1 / 0.2))`.

### Named Rules

**A Regra do Contorno ou Sombra.** Quem tem borda não tem sombra, e vice-versa.

**A Regra da Sombra em Repouso.** Sombra pertence ao objeto, não ao mouse.
Hover muda fundo para areia, opacidade, translação ou escala — nunca acrescenta
sombra.

## Shapes

Raios generosos, e cada um diz um tamanho de objeto:

- **12px** (`chapa`): miniatura de arte na linha de oferta.
- **16px** (`quadro`): peça média interna.
- **20px** (`bloco`): campo, select, recado, chapa do cartão de lista, linha de
  oferta.
- **24px** (`cartao`): bloco branco, cartão de lista, chapa dentro da carta,
  cartão de total, pílula do total.
- **32px** (`carta`): a carta do deck e o comprovante.
- **Pílula / círculo** (9999px): botão, chip, contador, etiqueta, destino do
  dock, disco, tecla, barra, rádio e marca de item.

**O Picote.** O comprovante é a única forma recortada: dois semicírculos de 28px
na cor do fundo nas laterais e uma linha tracejada de 2px em `cinza` a 60%.

**A Regra do Círculo que Age.** Clicável que não é carta é pílula ou círculo.
Navegação é círculo solto, nunca barra.

## Components

### Buttons
Largos, redondos, com a tinta fazendo o peso.
- **Primário (`Enviar`):** tinta com creme, 56px de altura, 24px laterais,
  16px/500. `largo` ocupa a linha. Hover 90% de opacidade, toque encolhe a
  98%, desabilitado a 40% com "Um instante…".
- **Secundário (`Secundario`):** branco, 1px de `contorno`, texto tinta, 44px,
  14px. Hover areia.
- **Perigo (`Perigo`):** contorno `alerta` a 50%, texto `alerta`, hover
  `alerta-suave`. Preenchido em `alerta` só na confirmação final em `/perfil`.
- **Foco:** anel global de 2px sólidos em tinta com offset 3px. Nunca removido.

### Chips
- **Style:** pílula de 40px, branca com `borda`, 14px tinta, hover areia.
- **Contador:** disco de 26px em areia com tinta; no chip ativo, `creme` a 20%.
- **State:** ativo inverte para tinta com creme, com `aria-pressed`. A escolha
  de jornada em Anotar é o mesmo chip com a arte de 22px e `role="radio"`.

### Cards / Containers
- **Carta (`CartaoHero`):** a peça-assinatura. Branca, raio 32, 10px de
  padding, sombra de carta. Chapa de 262px (300 no desktop) em raio 24, com a
  categoria em pílula branca (texto suave) à esquerda e a porcentagem em pílula
  branca à direita. Disco de seta de 56px em tinta no vinco entre arte e
  legenda — irmão da chapa, nunca filho, porque o `overflow-hidden` o cortaria.
  Legenda: título 21px, "Faltam R$ … · até mês/ano" em suave, barra sem legenda
  visível.
- **Cartão de lista (`CartaoJornada`):** a mesma carta em meia escala: raio 24
  com borda, chapa de 128px (176 no desktop), título 15px, barra com legenda.
  Hover sobe 2px.
- **Bloco (`Bloco`):** branco, raio 24, borda, 16px. O fundo de quase tudo.
- **Total do mês:** bloco com "Guardado em <mês>", odômetro de 24px e os pontos
  de pessoa com nome.
- **Cartão de pedido:** tinta com creme, raio 24, quando alguém pediu para
  entrar no plano.
- **Linha de aporte (`LinhaAporte`):** disco de iniciais de 44px na cor da
  pessoa, nome e legenda, valor à direita em 500.
- **Linha de oferta (`LinhaOferta`):** raio 20 com borda; a imagem é a chapa da
  categoria, nunca a foto da loja; "Publicidade" vem antes da loja;
  `rel="sponsored noopener noreferrer"`.
- **Etiqueta (`Etiqueta`):** pílula de 12px em areia com tinta; `forte` em
  tinta com creme.

### Inputs / Fields
- **Style:** branco, 1px de `contorno`, raio 20, 52px, texto 16px (abaixo disso
  o iOS dá zoom), rótulo de 13px em suave acima.
- **Focus:** borda vira tinta e ganha anel de 3px em areia.
- **Senha (`CampoSenha`):** olho em disco de 40px; o rótulo do botão nunca
  contém "senha" ("Ver o que digitei").
- **Select (`Escolha`):** mesma casca, seta desenhada em suave.
- **Rádio e caixa de marcar:** 20px, contorno 1.5px; marcados em tinta, com o
  confere em creme.
- **Marca de item (`.caixa-item`):** o próprio checkbox desenhado como círculo
  de 44px — vazio em contorno, comprado em tinta com confere creme; encolhe a
  92% ao toque.
- **Deslizante:** pista de 5px em areia, polegar de 24px em tinta com anel
  branco de 4px. Sempre ao lado de um campo de texto, nunca no lugar dele.
- **Recado (`Recado`):** raio 20, `role="status"`; erro em alerta sobre
  alerta-suave, aviso em tinta sobre sálvia.

### Navigation
- **Dock:** três destinos em círculos de 56px (branco com borda; ativo em tinta
  com ícone creme e `aria-current="page"`), ícones de traço de `components/icones.tsx` a 22px com
  nome em `sr-only`. Separado, o disco de ação de 56px em tinta com sombra de
  disco leva a `/aportes/novo`; hover cresce 5%.
- Some em `/aportes/novo`, que tem o próprio botão de fechar (círculo de 44px).

### Chapa
O plano de imagem: o campo da categoria com a arte Fluent Emoji 3D de
`public/arte/<categoria>.png` a 62% da altura. Com capa, a foto do casal cobre
tudo e o campo é o que se vê enquanto ela carrega. `alt` vazio: o nome é o
título da jornada.

### Deck
A carta da frente com até duas camadas atrás, na cor do campo da categoria de
cada uma, deslocadas 17px para baixo, encolhidas 4.5% e giradas por índice
(−2°, 2.5°, −1.5°, 2°) por camada. Gira sozinho a cada 5s; arrastar dá
resistência depois de 110px (a 40%), passa a carta a partir de 90px e a joga
para fora em 360ms; soltar antes volta em 420ms. Quem arrasta ou usa as setas
para o giro de vez; foco de teclado dentro pausa. Cartas de trás levam `inert`
e `aria-hidden`.

### Anotar e Comprovante
Teclado 3×4 de teclas redondas de 64px (26px de dígito, hover areia, toque
creme); os dígitos entram pela direita como centavos inteiros, até 9 dígitos, e
o teclado físico também vale. Abaixo: "É uma anotação: o dinheiro não sai
daqui." Anotado, a tela vira areia e o comprovante sobe: carta branca de raio
32 com a arte do selo, "Anotado!", o valor em 44px, o picote, a lista
Quem/Quando/Agora vocês têm/Código, e "Nenhum dinheiro foi transferido".
Rodapé com Compartilhar (secundário) e Pronto (primário), lado a lado.

### Progresso
Trilho de 8px em areia com as fatias das pessoas lado a lado, 2px de vão. Sem
aporte, listra diagonal areia/listra a 115°. Sem fatias, preenchimento em
tinta. Sempre `role="progressbar"` com `aria-value*`; `semLegenda` esconde a
legenda só visualmente.

### Chuva e Odômetro
Dezesseis moedas bimetálicas de R$ 1 (anel dourado, miolo prateado — desenho da
moeda real, não cor de interface) caem em 1.1–1.8s girando no próprio eixo. O
odômetro rola cada dígito em 900ms com 900ms de atraso, para o número mudar
quando as moedas chegam; o cartão do mês pulsa a 103.5%. Dispara com aporte
novo do parceiro (realtime) ou com a marca de sessão deixada por Anotar.

### Porta (`Cartao`)
Disco de tinta com a inicial do `APP_NAME` em creme, o nome ao lado, e um leque
de três chapas (viagem e casamento a ±9°, casa à frente) antes do título.
Dentro do app, `porta={false}` tira marca e leque.

### Boas-vindas (`BoasVindas`)
Três telas em tela cheia sobre a própria home, fundo papel: o leque da porta
(`Leque`), o casal com a cadeira vazia e o selo de tinta (`ArteDoCasal`), e o
comprovante com duas moedas (`Moeda`). Três segmentos no topo (tinta os feitos,
areia os que faltam), "Pular" em texto sublinhado, título de 30px, e o botão de
tinta "Próximo" → "Começar". A troca é scroll-snap nativo. Só para casal sem
jornada nem aporte, e uma vez por navegador (cookie `jornada-boas-vindas`).

### Deck de começo e próximo passo
Sem jornada, os primeiros passos são o deck: a carta da frente com campo de
200px (parceiro em creme, jornada em sálvia, aporte em verde a 30%), a arte do
passo, título de 21px, a dica e o botão que resolve; os que faltam atrás, nas
cores de campo, como as camadas do deck de jornadas. Passo "esperando" leva
pílula "esperando" e botão de contorno. Com jornada, o passo pendente vira uma
linha: mini-campo de 48px, título, verbo e seta.

### Motion
Quatro movimentos, todos em `cubic-bezier(.16,1,.3,1)`:
1. **O deck** passa e gira.
2. **A chuva** cai e **o odômetro** rola.
3. **A barra cresce** da esquerda (900ms) a cada valor novo.
4. **O comprovante sobe** (700ms) e o selo encaixa (650ms, 180ms de atraso).

Fora isso, só microrresposta: hover em areia, disco cresce 5%, controle encolhe
ao toque.

**A Regra do Movimento, Não do Conteúdo.** `prefers-reduced-motion` zera
animação e transição e não faz chover, mas o conteúdo continua mudando: o deck
ainda alterna as jornadas, sem arremesso, e o número muda sem rolar.

## Do's and Don'ts

### Do:
- **Do** puxar toda cor, raio e sombra do `@theme` em `apps/web/app/globals.css`.
- **Do** usar tinta com creme para toda ação e todo estado ativo.
- **Do** pôr o nome da pessoa ao lado de toda cor de pessoa, e tirar a cor de
  `coresDoCasal`.
- **Do** escrever texto tinta sobre areia e sobre sálvia.
- **Do** usar `contorno` em campo e botão de contorno, `borda` em cartão e chip.
- **Do** fazer um fundo novo de categoria misturando uma das nove com branco.
- **Do** usar a arte Fluent Emoji 3D de `public/arte/` (licença MIT em
  `LICENSE-fluent-emoji.txt`) para categoria, e a chapa da categoria para
  oferta.
- **Do** receber dinheiro pelo teclado de valor, em centavos inteiros.
- **Do** manter `role="progressbar"`, `role="status"` e nome acessível em todo
  controle — a suíte e2e ancora neles.
- **Do** usar `.num` (`tabular-nums`) em todo número que muda.
- **Do** usar mapa estático de classes por categoria e por pessoa.

### Don't:
- **Don't** usar verde ou marrom como botão, link, foco ou chip ativo.
- **Don't** usar sálvia como texto, nem creme sobre papel ou branco.
- **Don't** pôr texto suave sobre areia (4.44:1).
- **Don't** distinguir pessoas só pela cor (verde×marrom 1.18:1).
- **Don't** introduzir cor fora das nove, além de `alerta` para erro.
- **Don't** colocar sobretítulo ou rótulo em caixa alta acima de título.
- **Don't** usar outra face além de Lexend, nem peso 600/700.
- **Don't** carregar imagem de loja por hotlink: o CDN veria IP e horário de
  quem só abriu a tela.
- **Don't** acrescentar movimento fora do deck, da chuva com odômetro, da barra
  e do comprovante.
- **Don't** aceitar valor monetário em campo de texto livre na tela de anotar.
- **Don't** sortear ângulo com `Math.random` em render; gire por índice.
- **Don't** carregar fonte por `<link>` de CDN de terceiro.
- **Don't** desenhar tema escuro: o app declara `color-scheme: light`.
