---
name: Jornada
description: O plano de um casal como um álbum de fotos sobre superfície clara, conduzido por verde de tinta e marrom de terra — nunca como extrato.
colors:
  papel: "#FDFBF7"
  tinta: "#070001"
  verde: "#33605A"
  marrom: "#68462B"
  salvia: "#91A398"
  creme: "#E9E0D1"
  suave: "#5F6F68"
  suave-forte: "#3D4A44"
  areia: "#F1EAE0"
  divisa: "#F1EAE0"
  borda: "#EDE5D8"
  contorno: "#7E8F84"
  listra: "#DCD2C2"
  pessoa-1: "#33605A"
  pessoa-2: "#68462B"
  pessoa-fora: "#B3AB9C"
  alerta: "#8A3A2A"
  alerta-suave: "#F4E6DF"
  branco: "#FFFFFF"
  material-casa-luz: "#A8B7AD"
  material-casa-meio: "#91A398"
  material-casa-fundo: "#6F8179"
  material-viagem-luz: "#8B6340"
  material-viagem-meio: "#68462B"
  material-viagem-fundo: "#4A3120"
  material-reserva-luz: "#4B7C74"
  material-reserva-meio: "#33605A"
  material-reserva-fundo: "#24463F"
  material-casamento-luz: "#C09C7A"
  material-casamento-meio: "#9D7E58"
  material-casamento-fundo: "#74593A"
  material-bebe-luz: "#AFBAC4"
  material-bebe-meio: "#8494A1"
  material-bebe-fundo: "#5F6E79"
  material-geral-luz: "#A6B2A8"
  material-geral-meio: "#7E8F84"
  material-geral-fundo: "#5A6A61"
typography:
  display:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  secao:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  legenda:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  micro:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10.5px"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "normal"
rounded:
  chapa: "4px"
  polaroide: "8px"
  quadro: "16px"
  bloco: "20px"
  cartao: "24px"
  pilula: "9999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "14px"
  xl: "16px"
  tela: "20px"
  tela-lg: "40px"
components:
  botao-primario:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.creme}"
    typography: "{typography.title}"
    rounded: "{rounded.pilula}"
    padding: "16px 20px"
  botao-secundario:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.tinta}"
    borderColor: "{colors.contorno}"
    rounded: "{rounded.pilula}"
    padding: "10px 16px"
  botao-conceder:
    backgroundColor: "{colors.verde}"
    textColor: "{colors.creme}"
    rounded: "{rounded.pilula}"
    padding: "14px 16px"
  botao-perigo:
    backgroundColor: "transparent"
    textColor: "{colors.alerta}"
    borderColor: "{colors.alerta}"
    rounded: "{rounded.pilula}"
    padding: "10px 16px"
  chip:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.tinta}"
    borderColor: "{colors.contorno}"
    rounded: "{rounded.pilula}"
    padding: "10px 14px"
  chip-ativo:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.creme}"
    rounded: "{rounded.pilula}"
    padding: "10px 14px"
  campo:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.tinta}"
    borderColor: "{colors.contorno}"
    rounded: "{rounded.bloco}"
    padding: "12px 16px"
  bloco:
    backgroundColor: "{colors.branco}"
    borderColor: "{colors.borda}"
    rounded: "{rounded.cartao}"
    padding: "16px"
  cartao-hero:
    backgroundColor: "{colors.branco}"
    borderColor: "{colors.borda}"
    rounded: "{rounded.cartao}"
    padding: "10px"
  cartao-destaque:
    backgroundColor: "{colors.verde}"
    textColor: "{colors.creme}"
    rounded: "{rounded.bloco}"
    padding: "14px"
  cartao-tinta:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.creme}"
    rounded: "{rounded.cartao}"
    padding: "16px"
  polaroide:
    backgroundColor: "{colors.branco}"
    rounded: "{rounded.polaroide}"
    padding: "8px 8px 12px"
  linha:
    backgroundColor: "{colors.branco}"
    borderColor: "{colors.borda}"
    rounded: "{rounded.cartao}"
    padding: "10px 12px"
  etiqueta:
    backgroundColor: "{colors.areia}"
    textColor: "{colors.suave}"
    rounded: "{rounded.pilula}"
    padding: "4px 10px"
  pilula-total:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.creme}"
    rounded: "{rounded.pilula}"
    padding: "10px 16px"
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

# Design System: Jornada (v2)

## Overview

**Creative North Star: "A foto é o conteúdo"**

O plano de um casal é um álbum, não um extrato. Este mundo recusa o arranjo
padrão da categoria financeira — grade de cartões iguais, gráfico no topo,
saldo cinza em número grande — e no lugar dele põe **uma jornada por vez**, com
a foto ocupando a maior parte da tela e o dinheiro entrando como legenda.

Esta é a segunda versão do mundo. A primeira era creme `#F7F0E1` com limão
`#D8F26B` e uma grade de polaroides tortas; ela viveu em produção e foi
substituída em 2026-09-13 pelo protótipo v2 do autor do produto. O que mudou:
a superfície virou quase branca, a tinta virou quase preta, o acento virou
**verde de tinta** `#33605A`, a segunda pessoa virou **marrom de terra**
`#68462B`, o grão do papel saiu, e o cartão passou a se separar do fundo por
**contorno**, não por sombra. A polaroide torta sobreviveu, mas só onde o
protótipo a manteve: dentro da jornada e na jornada nova.

O tom emocional continua caloroso e sem cerimônia: minúscula na saudação
("oi, Lucas e Ana"), e a promessa de privacidade dita na porta, antes do
login. Nada de azul de sistema, nada de cinza corporativo, nada de modo
escuro — o app se compromete com o claro (`color-scheme: light`) porque não
existe paleta escura desenhada.

**Key Characteristics:**
- Superfície quase branca de borda a borda; cartão branco separado por 1px de
  contorno, nunca por sombra dura.
- A foto é o conteúdo: 268px de altura no cartão da home, e todo o resto é
  legenda.
- Verde conduz a ação e é a primeira pessoa; marrom é a segunda.
- Todo controle é pílula (raio 9999px).
- Progresso é bicolor por pessoa, nunca preenchimento único.
- Outfit carrega estrutura e número, em peso 600; Manrope carrega o que é dito
  em voz humana.
- Ícones desenhados à mão em SVG, grid de 24, traço 1.75 — inclusive a marca
  de categoria dentro da chapa.
- Dois movimentos autorais e nenhum a mais.

## Colors

### Primary
- **Tinta** (`tinta` `#070001`): o texto principal, o botão primário, o chip
  ativo, a pílula do total e o único cartão escuro do app. É o preto quase
  absoluto do protótipo — e mede 20.13:1 sobre a superfície.
- **Verde** (`verde` `#33605A`): a cor da ação. O disco do dock, o botão de
  conceder, o cartão de destaque, o link, o anel de foco, o polegar do
  controle deslizante. 6.86:1 sobre a superfície.
- **Marrom** (`marrom` `#68462B`): a segunda pessoa, e o material da categoria
  viagem. 8.13:1.

### Pessoas
- **Verde da pessoa 1** (`pessoa-1`) e **marrom da pessoa 2** (`pessoa-2`): de
  quem é o dinheiro. Atribuídas por `coresDoCasal` em
  `packages/core/src/album.ts`, com ordem estável (papel `dono` primeiro,
  empate pelo `user_id`).
- **Cinza de quem saiu** (`pessoa-fora` `#B3AB9C`): aportes de ex-membro. O
  valor continua inteiro; só a identidade esfria.

### Superfícies
- **Papel** (`papel` `#FDFBF7`): o fundo de tudo. É o mesmo valor cru em
  `THEME_COLOR` e `BACKGROUND_COLOR` (`packages/core/src/constants.ts`), para
  que a barra do sistema e a splash do PWA sumam dentro da tela.
- **Branco puro** (`#FFFFFF`): a superfície de toda peça que se pega — cartão,
  polaroide, chip inativo, campo, pílula do dock.
- **Sálvia** (`salvia` `#91A398`): superfície de destaque tranquilo — o cartão
  "o que essa pessoa vai ver" e o recado de aviso. **Nunca texto**: mede
  2.57:1 sobre o papel. Sobre ela o texto é tinta, que dá 7.82:1.
- **Creme** (`creme` `#E9E0D1`): deixou de ser fundo e virou **o texto sobre
  superfície escura**. 15.90:1 sobre a tinta, 5.42:1 sobre o verde.
- **Areia** (`areia`) e **divisa** (`divisa`): etiqueta, chip de contagem,
  trilho, linha divisória.
- **Listra** (`listra` `#DCD2C2`): a hachura do trilho vazio e do esqueleto.

### Texto
- **Suave** (`suave` `#5F6F68`, 5.13:1): preço, data, legenda, explicação.
- **Suave-forte** (`suave-forte` `#3D4A44`, 8.98:1): rótulo de campo e todo
  texto que precisa ser lido sem esforço.

### Material da chapa
Seis tricromias, uma por categoria, só dentro da chapa — nunca como cor de
interface. Cada uma é um `radial-gradient` de três paradas (`luz`, `meio`,
`fundo`) com a marca da categoria em `white/30` por cima. Vivem no frontmatter
como `material-<categoria>-<parada>` porque são cor do sistema tanto quanto o
verde: dezoito valores que alguém vai querer mexer um dia. Ver **Chapa**.

### Named Rules

**A Regra das Duas Bordas.** `borda` (`#EDE5D8`) contorna **cartão**: é
decoração, e 1.25:1 basta porque a superfície branca já se separa do papel.
`contorno` (`#7E8F84`, 3.42:1 sobre o branco) fecha **controle** — campo,
select, chip, botão de contorno. Ali o limite não é decoração: é o que diz
onde o controle começa, e o piso de 3:1 do WCAG para componente vale. O
protótipo usava `#EDE5D8` nos dois; nos campos isso é um controle sem
contorno visível.

**A Regra do Creme Sobre o Escuro.** Sobre tinta ou verde, o texto é creme —
nunca verde e nunca branco puro. Verde sobre tinta mede 2.93:1 e some. E o
creme rebaixado tem piso: `creme/90` sobre verde dá 4.73:1 e passa; `creme/80`
dá 4.10:1 e não passa, o que importa porque os rótulos ali são de 10.5px.

**A Regra da Sálvia Muda.** Sálvia é superfície e só. Como texto ela reprova
em qualquer tamanho, e como fundo ela é o único tom do sistema que consegue
ser convite sem ser alarme.

**A Regra do Cartão de Tinta Reservado.** O fundo `tinta` como superfície de
cartão pertence a um único fluxo: o pedido do parceiro. É o único momento do
app que concede a outra pessoa acesso a dado financeiro. Um segundo cartão
escuro em qualquer outro lugar faz o primeiro parar de sinalizar — e foi por
isso que os primeiros passos da home voltaram a ser bloco branco.

**A Regra da Mesma Pessoa, Mesma Cor.** A cor de uma pessoa vem sempre de
`coresDoCasal`, nunca do índice do array na tela.

**A Regra do Rótulo de Gente.** Valor de coluna não vai para a tela. A
tradução é `rotuloDaCategoria` em `packages/core`, e vale para o chip, para a
legenda do cartão e para o cabeçalho da jornada.

## Typography

**Display Font:** Outfit (fallback `ui-sans-serif, system-ui, sans-serif`)
**Body Font:** Manrope (fallback `ui-sans-serif, system-ui, sans-serif`)

As duas são self-hosted via `next/font` — baixadas no build e servidas da
própria origem. Nunca um `<link>` para `fonts.googleapis.com`: isso mandaria o
IP de cada visitante para um terceiro, e desfaria pela porta dos fundos a razão
de o banco estar em `sa-east-1`.

**Character:** Outfit é geométrica e apertada — carrega estrutura, título e
número, sempre com tracking negativo. O v2 a usa em **600**, e não em 700/800:
a superfície clara e os contornos finos pedem um peso que não grite. Manrope é
humanista e aberta — carrega tudo que é dito em voz de gente.

### Hierarchy
- **Display** (Outfit 600, 28px, tracking −0.03em, leading 1): o título de tela
  de primeiro nível — "Nossa jornada", "Jornadas de vocês", "Aportes". E o
  total em `/aportes`, que é o número que a tela veio dizer.
- **Headline** (Outfit 600, 21px): título de tela interna (jornada aberta,
  quem está no plano, nova jornada), título de tela de porta, número grande
  dentro de cartão, e a frase de estado vazio.
- **Seção** (Outfit 600, 17px): o `<h2>` de bloco. Vem do componente `Secao`.
- **Title** (Outfit 600, 13.5px): nome de jornada em cartão de lista, rótulo de
  interruptor, texto de botão.
- **Body** (Manrope 400, 12.5px, leading `relaxed`): explicação, recado. Vem do
  componente `Explica`. Sempre com a classe `.font-corpo`.
- **Label** (Manrope 600, 11.5px): rótulo de campo, saudação.
- **Legenda** (Manrope 400, 11px): a linha sob a barra de progresso.
- **Micro** (Manrope 400/600, 10.5px): categoria sob o título, contagem de
  chip, data de aporte, etiqueta, rótulo dentro de cartão escuro ou verde.

Oito degraus, e nenhum a mais. O redesenho chegou a produzir 25, 19, 18 e
14.5px em uma tarde — todos foram absorvidos.

### Named Rules

**A Regra do Espaço Entre Palavras.** `.font-corpo` carrega
`word-spacing: 0.12em`. O Manrope fecha as palavras em 10–12px a ponto de
ligá-las ("o usodela", "juntandodinheiro"). 0.05em ali dava 0.6px e sumia no
arredondamento — o valor precisa sobreviver à rasterização no tamanho em que o
defeito mora.

**A Regra das Duas Vozes.** Se o texto é dito por uma pessoa a outra, é
Manrope. Se é estrutura, título ou número, é Outfit. Não existe terceira face,
e nenhuma das duas é a fonte do sistema.

**A Regra do Degrau com Nome.** `text-sm`, `text-xs` e `text-base` são a escala
padrão do Tailwind, não a nossa — e como o `body` fixa a fonte de display, cada
um deles pede 14, 12 ou 16px em **Outfit** para frases que são conversa. Todo
degrau da rampa tem componente (`Secao`, `Explica`, `Campo`, `Escolha`,
`Saida`); classe de tamanho solta numa tela é drift.

## Layout

Uma coluna no celular, presa em `max-w-sm` (24rem) com respiro de 20px nas
bordas. Telas de formulário e de leitura usam `max-w-2xl`; a home abre para
`max-w-5xl` no desktop, com respiro de 40px.

**A home no celular mostra UMA jornada por vez** — é a decisão estrutural do
v2. A lista completa vive em `/jornadas`, que virou o segundo destino do dock
justamente por isso: com um cartão na tela, a lista deixou de ser atalho e
passou a ser o caminho.

**No desktop (`lg`, ≥1024px) a home vira duas colunas:** `27rem` para o cartão
em destaque e o resto para o álbum, em grade de duas colunas. O protótipo só
desenhou o celular; um cartão único numa tela de 1280px deixava dois terços de
superfície vazia, e esconder cinco jornadas de seis num espaço que cabe todas
não é o mesmo gesto que fazê-lo no celular.

O dock é fixo: pílula branca no rodapé no celular, trilho vertical de 6rem à
esquerda no desktop. Três destinos — Início, Jornadas, Perfil — mais o disco
verde de ação, separado.

## Elevation & Depth

O sistema é quase plano, e a profundidade vem de **contorno**, não de camada.
Cartão branco sobre papel quase branco se separa por 1px de `borda`. Existem
três sombras, e todas são suaves e deslocadas para baixo.

### Shadow Vocabulary
- **Sombra de polaroide** (`0 12px 26px rgb(7 0 1 / 0.11)`): só na polaroide.
- **Sombra de peça** (`0 14px 30px rgb(7 0 1 / 0.10)`): o cartão em destaque e
  o dock, que flutuam sobre o que rola por baixo.
- **Sombra de disco** (`0 8px 18px rgb(7 0 1 / 0.24)`): o disco de ação e o
  disco de seta do cartão. Mais fechada porque o objeto é pequeno.

### Named Rules

**A Regra da Sombra em Repouso.** As sombras são de repouso, não de estado:
pertencem ao objeto, não ao mouse. Hover muda cor, opacidade, translação ou
escala — nunca acrescenta sombra.

**A Regra do Contorno Único.** Quem tem borda não tem sombra, e vice-versa. A
exceção é o cartão em destaque, que tem os dois porque é a única peça que
precisa se descolar da superfície e se fechar ao mesmo tempo.

## Shapes

Seis raios, e cada um quer dizer uma coisa:

- **4px** (`chapa`): o plano de imagem dentro da polaroide.
- **8px** (`polaroide`): a moldura branca da peça torta.
- **16px** (`quadro`): a chapa do cartão de lista, e a caixa de item comprado.
- **20px** (`bloco`): campo, select, cartão de destaque, a chapa do cartão em
  destaque.
- **24px** (`cartao`): todo cartão branco, toda linha de item e de aporte, o
  cartão de tinta.
- **Pílula** (9999px): **todo** controle. Botão, chip, dock, disco, barra de
  progresso, etiqueta.

### Named Rules

**A Regra da Pílula.** Se é clicável e não é uma peça do álbum, é pílula. Um
botão de canto arredondado a 8px não pertence a este mundo.

## Motion

Dois momentos autorais, e nada mais. O piso é: se o movimento não fala do
dinheiro nem da posse de um objeto, ele não entra.

1. **A barra cresce.** Ao montar e a **cada valor novo**, o grupo de fatias
   escala de 0 a 1 a partir da esquerda, em 900ms com desaceleração
   (`cubic-bezier(.16,1,.3,1)`). O `key` no total aportado é o que faz o gesto
   repetir quando o parceiro aporta do outro aparelho.
2. **A polaroide endireita.** Marcar um item como comprado leva a rotação a 0°
   em 500ms. É o gesto de colar no álbum.

O carrossel da home tem um terceiro movimento que **não é autoral, é
navegação**: o trilho desliza 500ms em `ease-out` a cada 5 segundos, levando o
cartão que sai e o que entra ao mesmo tempo. Um trilho, e não uma entrada por
opacidade: o cartão precisa *ir embora* para o de trás poder chegar, senão a
troca lê como pisca. Com uma jornada só não há trilho que mover, e o cartão
fica parado.

Fora isso: a peça levanta sob o mouse e sob o foco de teclado (translação,
nunca sombra nova), o disco de ação cresce 5%, e todo controle encolhe ao
toque. `prefers-reduced-motion: reduce` zera animação e transição para o app
inteiro, num bloco só em `globals.css`.

### Named Rules

**A Regra da Parada.** Conteúdo que anda sozinho precisa de como parar. O
carrossel **para de vez** assim que alguém toca num dos pontos — assumir o
controle já é a parada, e não custa um botão que ninguém entenderia. Ele
também pausa enquanto houver **foco de teclado** dentro dele, senão o cartão
trocaria com o foco num link e o foco cairia no vazio. E nem começa quando o
sistema pede menos movimento.

A pausa **por ponteiro** foi tentada e removida: no desktop o mouse repousa
sobre o cartão sem intenção nenhuma, e o carrossel ficava parado até alguém
mexer no mouse — que é indistinguível de estar quebrado.

O cartão fora de cena continua no DOM e leva `inert`, não `aria-hidden`:
precisa sair do caminho do teclado também, senão a tabulação entra num cartão
invisível.

## Components

### Buttons
- **Shape:** pílula total (9999px).
- **Primary (`Enviar`):** tinta com texto creme, 16px/20px de padding, 13.5px
  semibold. `largo` ocupa a linha inteira, que é a forma de rodapé do v2.
  Desabilitado vai a 50% e o rótulo vira "Um instante…".
- **Secondary (`Secundario`):** branco com `contorno` e texto tinta.
- **Conceder:** fundo verde com texto creme, para a ação que cria vínculo.
- **Perigo (`Perigo`):** contorno em `alerta/40` com texto `alerta`, para
  apagar e sair. O preenchido em `alerta` fica reservado à confirmação final
  em `/perfil`.
- **Foco:** todos herdam o anel global — 2px sólidos de verde, offset 3px.
  Nunca removido.
- **Toque:** todo controle encolhe 2–5% enquanto está pressionado.

### Chips
Pílula branca com `contorno/60`, 12.5px medium, 10px/14px de padding.
Selecionado inverte para tinta e creme, com `aria-pressed`. A contagem é um
disco dentro do chip.

### Cards / Containers
- **Bloco (`Bloco`):** raio 24, branco, borda `borda`, padding 16. O fundo de
  quase tudo.
- **Cartão em destaque (`CartaoHero`):** a peça-assinatura. Cartão branco de
  raio 24 com 10px de padding, a chapa de 268px (300 no desktop) em raio 20, a
  porcentagem em pílula branca no canto superior, a categoria em pílula
  `papel/90` no inferior, e o disco de seta em tinta **sangrando para fora da
  foto** — irmão da chapa, nunca filho, porque `overflow-hidden` o cortaria.
- **Cartão de lista (`CartaoJornada`):** o mesmo objeto em metade do tamanho,
  em grade de duas colunas. O v2 não desenhou a lista; esta é a derivação.
- **Cartão de destaque (`CartaoDestaque`):** verde com texto creme, raio 20.
  Ancora "faltam", "precisam guardar" e "este mês".
- **Cartão de tinta:** raio 24, fundo `tinta`, texto creme. **Só no fluxo do
  parceiro.**
- **Linha (`LinhaAporte`, item, membro):** branco com borda, raio 24, disco de
  pessoa à esquerda, valor à direita.
- **Etiqueta (`Etiqueta`):** pílula pequena de estado — "você", "no plano",
  "comprado", ou o preço. `forte` a pinta de verde.

### Inputs / Fields
- **Style:** branco com `contorno/60` de 1px, raio 20, padding 12/16, texto
  16px (abaixo disso o iOS dá zoom no foco). Foco muda a borda para verde.
- **Rótulo:** sempre presente e associado, 11.5px semibold em `suave-forte`.
  Nome acessível é contrato de API, não decoração.
- **Senha (`CampoSenha`):** o campo carrega o olho de mostrar/esconder. O
  rótulo do botão **nunca contém a palavra "senha"** — `getByLabel("Senha")`
  casa por substring, e "Mostrar a senha" faria a suíte encontrar dois
  controles onde há um. É "Ver o que digitei".
- **Select:** mesma casca do campo, com a seta desenhada por nós.
- **Deslizante:** pista de 5px em `areia`, polegar de 24px em verde com anel
  branco de 4px. Existe ao lado do campo de texto, nunca no lugar dele: só o
  deslizante deixaria de fora todo valor que não cai num degrau de R$ 500.
- **Caixa de item:** o próprio `<input type=checkbox>` desenhado como o quadrado
  de 44px, com círculo de contorno quando vazio e verde com o traço de confere
  quando marcado. Desenhado, e não escondido atrás de um `<span>`: escondido, o
  alvo de clique vira 1px e a suíte passa a errar o toque.
- **Erro / aviso (`Recado`):** raio 20, `alerta-suave`/`alerta` para erro e
  `salvia`/`tinta` para aviso, sempre com `role="status"`.
- **Dinheiro:** `type="text"` com `inputMode="decimal"` — `type="number"` lia
  "1.234" como R$ 1,23.

### Navigation
- **Dock:** pílula branca com borda e `shadow-peca`, **três** destinos em
  discos de 44px. Ativo é tinta com ícone creme e `aria-current="page"`.
- **Ação primária:** separada da pílula, disco de 52px em verde com o "+" em
  creme. Hover cresce 5%.
- **Desktop:** o mesmo dock deitado como trilho de 6rem à esquerda.
- Todo ícone é `aria-hidden`; o nome do destino vai em texto `sr-only`.

### Icons
Quinze ícones de interface e seis marcas de categoria em
`components/icones.tsx`, todos no mesmo grid de 24, traço 1.75, pontas e
junções arredondadas, `fill="none"`, `currentColor`.

As marcas (`MarcaCasa`, `MarcaViagem`, `MarcaReserva`, `MarcaCasamento`,
`MarcaBebe`, `MarcaGeral`) vivem dentro da chapa, grandes. Como o SVG escala
junto, o traço engrossa com o desenho — que é o que dá o ar de traço feito à
mão em vez de ícone de barra. `MarcaViagem` é serra e sol, e não avião de
papel, porque avião de papel lê como "enviar".

### Chapa
O plano de imagem. Um `radial-gradient` de três paradas por categoria, com a
marca da categoria em `white/30` por cima, e a foto de verdade do Storage
entrando por cima de tudo quando existe.

A marca não é enfeite, é conserto. Sem ela o gradiente lê como imagem que não
carregou — era o defeito mais visível do app. Com o desenho dentro, cada
jornada vira um objeto diferente dos outros.

### Polaroide
Moldura branca, raio 8, padding 8/12, `shadow-polaroide`, girada por índice
(nunca por `Math.random`, que daria ângulo diferente no servidor e no cliente e
quebraria a hidratação). Duas escalas de giro: `-2°, 1°, -1°, 2°` no geral, e
`-0.4°, 0.25°, -0.25°, 0.4°` (via `sutil`) em linha larga.

Sobrevive em dois lugares, que são onde o v2 a manteve: **dentro da jornada** e
na **jornada nova**. A home é cartão reto.

### Progresso
Trilho de 6px em `creme`, pílula, com as fatias lado a lado nas cores das
pessoas. Sem aporte nenhum, o trilho ganha uma listra diagonal
(`creme`/`listra` a 115°) — barra lisa e vazia lê como defeito; listra lê como
"ainda não começou". Sem fatias volta a um preenchimento verde.

Sempre `role="progressbar"` com `aria-valuenow/min/max` e `aria-label` em voz
humana. A legenda embaixo é **um nó de texto só** — a suíte e2e ancora na frase
inteira — com o valor já guardado em peso forte e o resto em `whitespace-nowrap`
para a linha quebrar num ponto só.

### Estados de carregamento
`components/esqueleto.tsx`. A forma do que vem: os mesmos cartões, na mesma
grade, com a chapa listrada. A tela não muda de layout quando os dados chegam.
`aria-busy` mais um `sr-only`, nunca `role="status"`.

### Jornada nova, passo 2
A capa entra **aqui**, e não num link para outra tela. O mundo v2 se apoia na
foto — no cartão da home são 268px de foto contra quarenta de texto — e pedir
a capa três telas depois é o mesmo que não pedir. A polaroide inteira é o
alvo: um `<label>` sobre ela abre o seletor do aparelho, e enquanto não há
foto o convite fica em pílula sobre a chapa. O envio é o mesmo caminho do
detalhe, com a foto reduzida e reencodada no navegador antes de subir — o que
tira o EXIF e a coordenada de GPS junto.

### Tela de porta
`Cartao`, em `components/form-ui.tsx`, é a moldura de login, cadastro, senha e
convite. Carrega a marca: pílula de tinta com o `APP_NAME` em creme, com
`letter-spacing` largo, no topo da tela e separada do título por um vão de
verdade — rótulo colado em cabeçalho é etiqueta, não marca. O botão principal e
a saída ficam colados embaixo, no alcance do polegar, e acima deles vai a
promessa que o produto inteiro sustenta.

## Do's and Don'ts

### Do:
- **Do** puxar toda cor, raio e sombra do bloco `@theme` em
  `apps/web/app/globals.css`. Valor solto na tela é o começo do drift.
- **Do** medir contraste sobre o papel (`#FDFBF7`) antes de usar um tom novo. O
  piso é 4.5:1 para texto pequeno e 3:1 para limite de controle, e ele vence o
  valor do brief.
- **Do** usar `contorno` em controle e `borda` em cartão.
- **Do** usar `creme` para todo texto sobre tinta ou verde.
- **Do** usar `coresDoCasal` de `packages/core` para toda cor de pessoa.
- **Do** dar `role="progressbar"` com `aria-value*` a toda barra, e
  `role="status"` a todo recado.
- **Do** rotular todo controle com nome acessível — a suíte e2e ancora nele.
- **Do** usar `tabular-nums` em todo número que muda.
- **Do** passar toda categoria por `rotuloDaCategoria` antes de mostrar.
- **Do** ordenar jornada por `ordemDoAlbum` — mais adiantada primeiro.
- **Do** mostrar a forma do que vem enquanto carrega.
- **Do** usar só classes Tailwind básicas: a fase 2 reescreve o `@theme`, não
  as telas.

### Don't:
- **Don't** usar o cartão de tinta fora do fluxo do pedido do parceiro.
- **Don't** usar sálvia como cor de texto: 2.57:1 em qualquer tamanho.
- **Don't** usar verde como texto sobre tinta: 2.93:1.
- **Don't** rebaixar o creme abaixo de 90% sobre o verde.
- **Don't** pôr `borda` (`#EDE5D8`) em campo, select ou chip — é 1.25:1, e ali
  o limite é informação.
- **Don't** usar preenchimento único onde há fatia por pessoa.
- **Don't** escrever `text-sm`, `text-xs` ou `text-base`.
- **Don't** montar `<label>` com `<select>` ou `<input>` à mão ao lado de
  campos que vêm de `form-ui`.
- **Don't** usar glifo Unicode, emoji ou biblioteca de ícones no lugar dos
  desenhos autorais.
- **Don't** carregar fonte por `<link>` para um CDN de terceiro.
- **Don't** remover o anel de foco global nem deixar superfície de navegador
  com o azul de sistema.
- **Don't** desenhar tema escuro: o app declara `color-scheme: light`.
- **Don't** sortear a inclinação da polaroide com `Math.random`.
- **Don't** acrescentar um quarto momento de movimento.
- **Don't** montar classe Tailwind por concatenação (`bg-${cor}`): a varredura
  de texto não a encontra e a cor some.
