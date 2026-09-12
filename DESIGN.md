---
name: Jornada
description: O plano de um casal como álbum de fotos tortas sobre papel creme, nunca como extrato.
colors:
  papel: "#F7F0E1"
  tinta: "#16170F"
  limao: "#D8F26B"
  limao-tinta: "#4A5A15"
  suave: "#63695D"
  suave-forte: "#4C5345"
  corpo: "#3F4239"
  areia: "#EFEADD"
  borda: "#E3DDCC"
  divisa: "#F0EBDD"
  noite-suave: "#A7AC95"
  noite-corpo: "#C9CDB8"
  pessoa-1: "#14B88C"
  pessoa-2: "#F3B63F"
  pessoa-fora: "#C6C3B4"
  alerta: "#A8322E"
  alerta-suave: "#F7E4E1"
typography:
  display:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "27px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  secao:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  numero:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.04em"
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
  micro:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10.5px"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "normal"
rounded:
  chapa: "3px"
  polaroide: "6px"
  bloco: "18px"
  cartao: "22px"
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
    textColor: "#FFFFFF"
    typography: "{typography.title}"
    rounded: "{rounded.pilula}"
    padding: "14px 20px"
  botao-secundario:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pilula}"
    padding: "10px 16px"
  botao-conceder:
    backgroundColor: "{colors.limao}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pilula}"
    padding: "12px 16px"
  chip:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pilula}"
    padding: "8px 12px"
  chip-ativo:
    backgroundColor: "{colors.tinta}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pilula}"
    padding: "8px 12px"
  campo:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.tinta}"
    rounded: "{rounded.bloco}"
    padding: "10px 14px"
  polaroide:
    backgroundColor: "#FFFFFF"
    rounded: "{rounded.polaroide}"
    padding: "8px 8px 12px"
  bloco:
    backgroundColor: "#FFFFFF"
    rounded: "{rounded.cartao}"
    padding: "16px"
  cartao-limao:
    backgroundColor: "{colors.limao}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.bloco}"
    padding: "12px"
  cartao-tinta:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.papel}"
    rounded: "{rounded.cartao}"
    padding: "16px"
  pilula-total:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.limao}"
    rounded: "{rounded.pilula}"
    padding: "10px 16px"
  recado-erro:
    backgroundColor: "{colors.alerta-suave}"
    textColor: "{colors.alerta}"
    rounded: "{rounded.bloco}"
    padding: "10px 14px"
  recado-aviso:
    backgroundColor: "{colors.areia}"
    textColor: "{colors.corpo}"
    rounded: "{rounded.bloco}"
    padding: "10px 14px"
---

# Design System: Jornada

## Overview

**Creative North Star: "O álbum sobre a mesa da cozinha"**

O plano de um casal é um álbum, não um extrato. Este mundo recusa o arranjo
padrão de app de dinheiro — grade de cartões iguais, gráfico no topo, saldo
cinza em número grande — e no lugar põe fotos tortas sobre papel creme, onde
cada jornada é um objeto que dá vontade de pegar. O dinheiro aparece como fato
guardado ("R$ 12.450,00 juntos"), nunca como métrica de painel.

A densidade é de coisa na mão, não de planilha: uma coluna no celular, o mesmo
álbum aberto sobre a mesa no desktop. O papel é papel de verdade — o fundo
creme leva um grão de ruído SVG embutido, e até as superfícies que o navegador
desenha sozinho (seleção de texto, anel de foco, cursor, barra de rolagem, o
triângulo do `<details>`, a seta do `<select>`) foram trazidas para dentro da
paleta. É o detalhe mais barato que separa uma tela montada de uma desenhada.

O tom emocional é caloroso e sem cerimônia: minúscula na saudação ("oi, Lucas e
Ana"), negrito apertado no título, e o limão aparecendo só onde há motivo de
comemorar ou de decidir. Nada de azul de sistema, nada de cinza corporativo,
nada de modo escuro — o app se compromete com o claro (`color-scheme: light`)
porque não existe paleta escura desenhada.

**Key Characteristics:**
- Papel creme de borda a borda, com grão; nunca chapa de cor lisa.
- Polaroide girada 1–2° como peça-assinatura; branco sobre creme.
- Limão como acento único, nunca fundo de página.
- Todo controle é pílula (raio 9999px).
- Progresso é bicolor por pessoa, nunca preenchimento único.
- Outfit carrega estrutura e número; Manrope carrega o que é dito em voz humana.
- Ícones desenhados à mão em SVG, grid de 24, traço 1.75 — e a mesma mão
  desenha a marca de categoria dentro da chapa.
- Dois movimentos autorais e nenhum a mais: a barra que cresce e a polaroide
  que endireita.

## Colors

Uma paleta de papelaria: creme, tinta quase preta, uma família sálvia inteira
para o que é dito em voz baixa, e um limão que só aparece quando importa.

### Primary
- **Tinta de caneta** (`tinta`): o texto principal, o disco do dock, o chip
  ativo, o botão primário, a pílula do total. É o preto esverdeado da paleta —
  nunca `#000`.
- **Limão** (`limao`): acento único. Vive sobre tinta (o total, o "+" do dock,
  a etiqueta de item comprado) ou como o cartão "este mês". Nunca é fundo de
  página, nunca é cor de texto sobre papel.
- **Limão-tinta** (`limao-tinta`): os rótulos pequenos dentro do cartão limão,
  onde a tinta cheia pesaria demais.

### Secondary
- **Verde da pessoa 1** (`pessoa-1`) e **âmbar da pessoa 2** (`pessoa-2`): de
  quem é o dinheiro. Atribuídas por `coresDoCasal` em `packages/core/src/album.ts`,
  com ordem estável (papel `dono` primeiro, empate pelo `user_id`).
- **Cinza de quem saiu** (`pessoa-fora`): aportes de ex-membro. O valor
  continua inteiro; só a identidade esfria.

### Material da chapa
Seis duotones, um por categoria, só dentro da polaroide — nunca como cor de
interface. Os primeiros eram dessaturados a ponto de seis deles lado a lado
lerem como galeria de imagem que não carregou; shipam mais quentes e mais
separados entre si: sálvia (`casa`), azul de mar (`viagem`), mel (`reserva`),
rosé (`casamento`), lilás (`bebe`) e a sálvia neutra da casa (`geral`). Cada um
carrega a marca da categoria em `white/35` — ver **Chapa**.

### Tertiary
- **Alerta** (`alerta`) sobre **alerta-suave** (`alerta-suave`): o único par
  fora da família sálvia, e existe só para recado de erro. O design de
  referência não trouxe cor de erro; esta foi derivada para conviver com ele.

### Neutral
- **Papel creme** (`papel`): o fundo de tudo. É o mesmo valor cru em
  `THEME_COLOR` e `BACKGROUND_COLOR` (`packages/core/src/constants.ts`), para
  que a barra do sistema e a splash do PWA sumam dentro da tela.
- **Branco puro** (`#FFFFFF`): a superfície de toda peça que se pega —
  polaroide, bloco, chip inativo, campo, pílula do dock.
- **Sálvia clara** (`suave`, 4.99:1 sobre o creme): preço, data, legenda,
  rótulo secundário.
- **Sálvia escura** (`suave-forte`, 7.29:1): rótulo de campo e todo texto de
  explicação que precisa ser lido sem esforço.
- **Corpo** (`corpo`): parágrafo longo dentro de bloco branco.
- **Areia** (`areia`), **borda** (`borda`), **divisa** (`divisa`): trilho da
  barra de progresso, contorno de campo, linha divisória. Três tons quase
  iguais, de propósito.
- **Noite suave** (`noite-suave`) e **noite corpo** (`noite-corpo`): os únicos
  textos que existem sobre o cartão de tinta.

### Named Rules

**A Regra do Contraste Vence o Pin.** O design fixado trazia `#8A8C7C` e
`#6E7566` como tons apagados. Medidos sobre o papel creme dão **3.02:1** e
**4.21:1** — os dois abaixo do piso de 4.5:1 para texto pequeno, e é neles que
estão preço, data e toda explicação. Shipam escurecidos para **4.99:1**
(`suave`) e **7.29:1** (`suave-forte`), na mesma família sálvia. Valor de
paleta não sobrevive a um teste de contraste reprovado, nem quando vem do
brief.

**A Regra do Cartão de Tinta Reservado.** O fundo `tinta` como superfície de
cartão pertence a um único fluxo: o pedido do parceiro (o aviso de pedido
pendente em `inicio.tsx` e o cartão de pedido em `parceiro/form.tsx`). É o
único momento do app que concede a outra pessoa acesso a dado financeiro. Um
segundo cartão escuro em qualquer outro lugar faz o primeiro parar de sinalizar.

**A Regra da Mesma Pessoa, Mesma Cor.** A cor de uma pessoa vem sempre de
`coresDoCasal`, nunca do índice do array na tela. Se a mesma pessoa for verde
na home e âmbar na jornada, a barra bicolor deixa de querer dizer qualquer
coisa.

**A Regra do Rótulo de Gente.** Valor de coluna não vai para a tela. A faixa
de chips mostrava `bebe` e `geral` — minúscula, sem acento — porque era o texto
cru de `goals.category`, no meio de uma interface que escreve em português de
gente. A tradução é `rotuloDaCategoria` em `packages/core`, e ela vale para o
chip, para a legenda do cartão e para o cabeçalho da jornada.

**A Regra do Limão Escasso.** O limão nunca é fundo de página nem texto sobre
papel. Ele aparece em três lugares por tela, no máximo: o total, o cartão
"este mês", e o que acabou de ser conquistado.

## Typography

**Display Font:** Outfit (fallback `ui-sans-serif, system-ui, sans-serif`)
**Body Font:** Manrope (fallback `ui-sans-serif, system-ui, sans-serif`)

As duas são self-hosted via `next/font` — baixadas no build e servidas da
própria origem. Nunca um `<link>` para `fonts.googleapis.com`: isso mandaria o
IP de cada visitante para um terceiro, e desfaria pela porta dos fundos a razão
de o banco estar em `sa-east-1`.

**Character:** Outfit é geométrica e apertada — carrega estrutura, título e
número, sempre com tracking negativo. Manrope é humanista e aberta — carrega
tudo que é dito em voz de gente: saudação, explicação, preço, recado. A
diferença entre as duas é o que separa o que o app afirma do que o app conversa.

### Hierarchy
- **Display** (Outfit 700, 27px mobile / 36px desktop, tracking −0.04em): o
  título da tela ("Nossa jornada"). Um por tela.
- **Headline** (Outfit 700, 20–22px, tracking −0.03em, leading apertado): a
  chamada de estado vazio e do convite, presa em 22–26ch para quebrar em linhas
  curtas de propósito.
- **Number** (Outfit 800, 20px, tracking −0.04em, `tabular-nums`): o valor
  dentro do cartão limão. Todo número que muda usa `tabular-nums` — sem isso a
  linha dança a cada centavo.
- **Seção** (Outfit 700, 17px, tracking −0.03em): o `<h2>` de bloco dentro de
  uma tela — "Nova jornada", "Como vocês dividem", "Os últimos". Existia de
  fato e sem nome, em quatro tamanhos diferentes (17, 16, 15 e o `text-sm` do
  Tailwind, que nem é do sistema). Agora tem um nome e um componente,
  `Secao`, e é por isso que a quinta variante não nasce.
- **Title** (Outfit 600, 13.5px, tracking −0.02em): o nome da jornada na
  polaroide, o rótulo de interruptor, o texto de botão.
- **Body** (Manrope 400, 12.5px, leading `relaxed`): explicação, legenda,
  recado. Sempre com a classe `.font-corpo`.
- **Label** (Manrope 600, 11.5px): rótulo de campo, saudação.
- **Micro** (Manrope 400/600, 10.5px): a categoria sob o título da polaroide, a
  contagem do chip, a data de um aporte, os rótulos do cartão de tinta e a
  etiqueta "comprado". É o menor degrau que existe — abaixo dele o Manrope
  fecha as palavras e nem `word-spacing` salva.

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
um deles pedia 14, 12 ou 16px em **Outfit** para frases que eram conversa.
Chegaram a conviver no mesmo formulário: em /aportes o rótulo "Em qual jornada"
saía 14px em Outfit e o "Quanto (R$)" logo abaixo saía 11.5px em Manrope. Todo
degrau da rampa tem componente (`Secao`, `Explica`, `Campo`, `Escolha`,
`Saida`); classe de tamanho solta numa tela é drift.

## Layout

Uma coluna no celular, presa em `max-w-sm` (24rem) com respiro de 20px nas
bordas. Telas de formulário e de leitura usam `max-w-2xl`; a home abre para
`max-w-5xl` no desktop, com respiro de 40px.

No desktop (`lg`, ≥1024px) a home vira duas colunas:
`minmax(0,1fr) 17rem` — o álbum à esquerda, e o total mais o cartão "este mês"
subindo para uma coluna fixa (`sticky top-10`) à direita. Sem isso o desktop
era o mobile esticado com meia tela de creme vazio. Não há layout novo no
desktop: é o mesmo mundo a outra distância.

O álbum é uma grade de duas colunas de alturas desiguais no celular e três no
desktop, com as polaroides giradas em sentidos opostos. O ritmo de espaço é
curto e repetido: 6/8/12/14/16px entre peças, 20px de margem de tela, 40px no
desktop. A faixa de chips rola horizontalmente no celular (sangrando com
`-mx-5` para os chips tocarem a borda) e quebra em linhas no desktop.

O dock é fixo: pílula branca no rodapé no celular, trilho vertical de 6rem à
esquerda no desktop. Mesma pílula, mesmo disco preto, só deitado.

A medida de texto é limitada pelo contêiner (`max-w-sm` / `max-w-2xl`), não por
uma regra em `ch`; só as chamadas display carregam limite explícito (22–26ch).
O contrato de direção pedia corpo preso em 65–75ch no desktop — o que shipou
resolve o mesmo problema por largura de contêiner.

## Elevation & Depth

O sistema é quase plano, e a profundidade vem de material, não de camada: o
grão do papel no `body`, o branco puro das peças sobre o creme, e a inclinação
que faz uma polaroide parecer largada sobre outra. Existem exatamente duas
sombras, e nenhuma delas é dura ou deslocada.

### Shadow Vocabulary
- **Sombra de polaroide** (`box-shadow: 0 10px 20px rgb(22 23 15 / 0.1)`): só
  na polaroide. É a foto levantando do papel.
- **Sombra de peça** (`box-shadow: 0 8px 18px rgb(22 23 15 / 0.08)`): o dock e
  o disco de ação, que flutuam sobre o conteúdo que rola por baixo.

### Named Rules

**A Regra da Sombra em Repouso.** As duas sombras são de repouso, não de
estado: pertencem ao objeto, não ao mouse. Hover muda cor, opacidade ou escala
— nunca acrescenta sombra.

**A Regra do Contorno Único.** Onde uma borda é necessária (campo, chip
inativo, botão secundário), é 1px de `borda` ou `tinta/10`. Nunca duas bordas,
nunca borda mais sombra na mesma peça.

## Shapes

Quatro raios, e cada um quer dizer uma coisa:

- **3px** (`chapa`): o plano de imagem dentro da polaroide, quase reto, porque
  papel fotográfico cortado é quase reto.
- **6px** (`polaroide`): a moldura branca da peça-assinatura.
- **18px** (`bloco`): campo, select, cartão limão, recado — o retângulo macio.
- **22px** (`cartao`): o bloco branco grande e o cartão de tinta.
- **Pílula** (9999px): **todo** controle. Botão, chip, dock, disco de avatar,
  barra de progresso, etiqueta.

A polaroide tem padding assimétrico (8px em volta, 12px embaixo), que é a
margem larga de baixo de uma foto instantânea de verdade.

### Named Rules

**A Regra da Pílula.** Se é clicável e não é uma peça do álbum, é pílula. Um
botão de canto arredondado a 8px não pertence a este mundo.

## Components

### Buttons
- **Shape:** pílula total (9999px).
- **Primary (`Enviar`):** tinta com texto branco, 14px/20px de padding,
  13.5px semibold. Hover baixa a opacidade para 90%; desabilitado vai a 50% e
  o rótulo vira "Um instante…".
- **Secondary (`Secundario`):** transparente com borda `borda` e texto tinta;
  hover preenche de branco.
- **Conceder (só no cartão de tinta):** fundo limão com texto tinta, para a
  ação que cria vínculo. Ao lado dele, o recusar é contorno em `papel/25`, e o
  terciário é texto sublinhado em `noite-suave`.
- **Perigo (`Perigo`):** contorno em `alerta/35` com texto `alerta`, para
  apagar e sair. Contorno e não preenchimento: o preenchido em `alerta` fica
  reservado à confirmação final em /perfil. Antes estas ações eram texto
  sublinhado solto, indistinguível de link de rodapé.
- **Foco:** todos herdam o anel global — 2px sólidos de tinta, offset 3px.
  Nunca removido.
- **Toque:** todo controle encolhe 2–5% enquanto está pressionado
  (`active:scale-*`). O mundo é de coisa na mão; coisa na mão afunda quando se
  aperta. É a única resposta que todo controle do app dá, e ela custa uma
  classe.

### Chips
- **Style:** pílula branca com borda `tinta/10`, 12.5px medium; hover escurece
  a borda para `tinta/25`.
- **Selected:** inverte para fundo tinta e texto branco, com `aria-pressed`.
- **Contagem:** um pequeno disco dentro do chip — `areia`/`suave` quando
  inativo, `branco 20%`/branco quando ativo.

### Cards / Containers
- **Bloco (branco):** raio 22px, fundo branco, padding 16px, sem sombra. É o
  fundo de quase tudo que não é polaroide.
- **Cartão limão:** raio 18px, padding 12px, rótulo 10.5px em `limao-tinta` e o
  número 20px extrabold em tinta. Ancora o "este mês".
- **Cartão de tinta:** raio 22px, fundo `tinta`, texto `papel`, com
  `noite-suave` e `noite-corpo` para os secundários. **Só no fluxo do parceiro.**

### Inputs / Fields
- **Style:** branco com borda `borda` de 1px, raio 18px, padding 10px/14px,
  texto 16px (abaixo disso o iOS dá zoom no foco). Placeholder em `suave`.
- **Rótulo:** sempre presente e associado, 11.5px semibold em `suave-forte`,
  1.5px de espaço acima do campo. Nome acessível é contrato de API, não
  decoração — 121 dos 146 seletores e2e ancoram em role ou label.
- **Select:** mesma casca do campo, com a seta desenhada por nós (chevron 16px,
  traço 1.75 em `suave-forte`, a 0.85rem da direita).
- **Erro / aviso (`Recado`):** raio 18px, `alerta-suave`/`alerta` para erro e
  `areia`/`corpo` para aviso, sempre com `role="status"`.
- **Dinheiro:** `type="text"` com `inputMode="decimal"` — `type="number"` lia
  "1.234" como R$ 1,23.

### Navigation
- **Dock:** pílula branca com `shadow-peca`, dois destinos em discos de 44px.
  Ativo é tinta com ícone branco e `aria-current="page"`; inativo é ícone
  `suave` com hover em `areia`.
- **Ação primária:** separada da pílula, disco de 48px em tinta com o "+" em
  limão. Hover cresce 5%. É o único elemento que escala no hover em todo o app.
- **Desktop:** o mesmo dock deitado como trilho de 6rem à esquerda.
- Todo ícone é `aria-hidden`; o nome do destino vai em texto `sr-only`.

### Icons
Oito ícones de interface e seis marcas de categoria em `components/icones.tsx`,
todos no mesmo grid de 24, traço 1.75, pontas e junções arredondadas,
`fill="none"`, `currentColor`. É o que faz um conjunto parecer um conjunto. O
design de referência usava glifos Unicode (`◎ ▤ ✓ ‹`); glifo não é ícone — o
peso do traço muda com a fonte do sistema e no Android alguns viram emoji
colorido.

As marcas (`MarcaCasa`, `MarcaViagem`, `MarcaReserva`, `MarcaCasamento`,
`MarcaBebe`, `MarcaGeral`) vivem dentro da chapa, grandes. O traço é o mesmo
1.75 do grid de 24, e como o SVG escala junto ele engrossa com o desenho — que
é o que dá o ar de traço feito à mão em vez de ícone de barra. `MarcaViagem` é
serra e sol, e não avião de papel, porque avião de papel lê como "enviar";
`MarcaGeral` é o brilho de quatro pontas, e nenhuma das outras pode se parecer
com ele.

### Polaroide (peça-assinatura)
Moldura branca, raio 6px, padding 8/12, `shadow-polaroide`, girada por índice
(nunca por `Math.random`, que daria ângulo diferente no servidor e no cliente e
quebraria a hidratação). Duas escalas de giro:
- **Álbum** (`-2°, 1°, -1°, 2°`): a grade de jornadas.
- **Linha larga** (`-0.4°, 0.25°, -0.25°, 0.4°`, via `sutil`): a 690px de
  largura, 2° cisalham 24px e a linha encosta na de baixo.

**Interação-assinatura:** marcar um item como comprado **endireita** a
polaroide — a rotação vai a 0° em 500ms — e a etiqueta vira pílula de tinta com
o texto em limão. É o gesto de colar no álbum. Ver **Motion** para o outro
momento autoral, a barra que cresce.

### Progresso
Trilho de 6px de altura em `areia`, pílula, com as fatias lado a lado nas cores
das pessoas. Sem aporte nenhum, o trilho ganha uma listra diagonal
(`areia`/`borda` a 115°) — barra lisa e vazia lê como defeito; listra lê como
"ainda não começou", que é estado legítimo. Sem fatias (lista, onde ainda não
se sabe quem colocou) volta a um preenchimento de tinta que anima a largura.

Sempre `role="progressbar"` com `aria-valuenow/min/max` e `aria-label` em voz
humana ("Quanto vocês já juntaram desta jornada"). Inclui a barra do mês. Não
regride.

## Motion

Dois momentos autorais, e nada mais. O piso é: se o movimento não fala do
dinheiro nem da posse de um objeto, ele não entra.

1. **A barra cresce.** Ao montar e a **cada valor novo**, o grupo de fatias
   escala de 0 a 1 a partir da esquerda, em 900ms com desaceleração
   (`cubic-bezier(.16,1,.3,1)`). A barra chega, não bate. O `key` no total
   aportado é o que faz o gesto repetir quando o parceiro aporta do outro
   aparelho — sem ele a animação só rodaria na primeira montagem e o valor
   mudaria num salto. É o único movimento da tela que fala do que o casal
   veio ver.
2. **A polaroide endireita.** Marcar um item como comprado leva a rotação a 0°
   em 500ms e a etiqueta vira pílula de tinta com o texto em limão. É o gesto
   de colar no álbum.

Fora isso: a peça do álbum **levanta** (translação, nunca sombra nova) sob o
mouse e sob o foco de teclado, o disco de ação cresce 5%, e todo controle
encolhe ao toque. `prefers-reduced-motion: reduce` zera animação e transição
para o app inteiro, num bloco só em `globals.css` — é por isso que ele mora lá
e não em cada peça.

### Chapa (o material da foto)
O plano de imagem da polaroide é um duotone autoral em CSS: gradiente radial
com horizonte por categoria (casa, viagem, reserva, casamento, bebê, geral),
grão SVG em `mix-blend-overlay`, a **marca da categoria** por cima em
`white/35`, e um brilho oblíquo de luz de sala.

A marca não é enfeite, é conserto. Sem ela o álbum eram seis retângulos de
gradiente dessaturado lado a lado, e retângulo de gradiente lê como imagem que
não carregou: era o defeito mais visível do app inteiro. Com o desenho dentro,
cada polaroide vira um objeto diferente dos outros, que é o que a tese
prometia.

**Continua não sendo uma fotografia**, e a tese diz "fotos tortas sobre papel".
A diferença é que agora o que está lá é assumidamente um desenho nosso, e não
um retângulo esperando virar foto. A correção de verdade continua sendo a capa
de verdade pelo Supabase Storage — que já existe e entra por cima quando há
`cover_path`. O material é o que se vê enquanto a foto não chegou, e o que fica
quando a jornada não tem capa.

### Estados de carregamento
`components/esqueleto.tsx`. Três telas de cliente (`/jornadas`, a jornada
aberta, o perfil) abriam com a palavra "Carregando…" em cinza claro no canto de
uma tela inteira de creme vazio — a primeira coisa que se via, e a que mais
parecia erro. O esqueleto é a **forma do que vem**: polaroides em branco na
grade certa, com a chapa listrada em `areia`/`borda`, a mesma listra que a
barra de progresso sem aporte usa. A tela não muda de layout quando os dados
chegam.

`aria-busy` mais um `sr-only`, nunca `role="status"`: quem usa leitor de tela
ouve "Carregando" uma vez, e as caixas vazias ficam mudas.

### Pessoas
`DiscoDePessoa` (32px, iniciais em branco) e `PontoDePessoa` (10px, só a cor)
são as duas únicas formas de mostrar de quem é o dinheiro. A cor sempre de
`coresDoCasal`. `LinhaAporte` é a linha de aporte — quem, quando, quanto —
e existe porque o mesmo fato aparecia de duas formas: bloco branco com disco
colorido na jornada, e duas colunas de texto pelado em /aportes.

### Tela de porta
`Cartao`, em `components/form-ui.tsx`, é a moldura de login, cadastro, senha e
convite. Carrega a marca: uma pílula de tinta com o `APP_NAME` em limão, no
topo da tela, separada do título por um vão de verdade — rótulo colado em
cabeçalho é etiqueta, não marca. Antes eram seis telas de creme vazio com um
título no meio, e eram a primeira coisa que alguém via do produto.

## Do's and Don'ts

### Do:
- **Do** puxar toda cor, raio e sombra do bloco `@theme` em
  `apps/web/app/globals.css`. Valor solto na tela é o começo do drift.
- **Do** medir contraste sobre o papel creme (`#F7F0E1`) antes de usar um tom
  novo. O piso é 4.5:1 para texto pequeno, e ele vence o valor do brief.
- **Do** usar `coresDoCasal` de `packages/core` para toda cor de pessoa.
- **Do** dar `role="progressbar"` com `aria-value*` a toda barra, e
  `role="status"` a todo recado.
- **Do** rotular todo controle com nome acessível — a suíte e2e ancora nele.
- **Do** usar `tabular-nums` em todo número que muda.
- **Do** manter `.font-corpo` em tudo que é dito em voz humana.
- **Do** desenhar ícone novo no grid de 24 com traço 1.75 e pontas redondas, em
  `components/icones.tsx`.
- **Do** usar só classes Tailwind básicas: a fase 2 reescreve o `@theme`, não
  as telas.
- **Do** puxar todo degrau de texto de um componente — `Secao`, `Explica`,
  `Campo`, `Escolha`, `Saida`. Tamanho solto numa tela é o começo da quinta
  variante.
- **Do** passar toda categoria por `rotuloDaCategoria` antes de mostrar.
- **Do** mostrar a forma do que vem enquanto carrega, e nunca a palavra
  "Carregando" sozinha numa tela vazia.

### Don't:
- **Don't** usar o cartão de tinta (`#16170F`) fora do fluxo do pedido do
  parceiro. Um segundo cartão escuro apaga o sinal do primeiro.
- **Don't** pôr limão como fundo de página nem como texto sobre o papel creme.
- **Don't** usar preenchimento único onde há fatia por pessoa.
- **Don't** usar glifo Unicode, emoji ou biblioteca de ícones no lugar dos
  sete desenhos autorais.
- **Don't** carregar fonte por `<link>` para um CDN de terceiro; `next/font` e
  origem própria, sempre.
- **Don't** remover o anel de foco global (2px tinta, offset 3px) nem deixar
  superfície de navegador com o azul de sistema.
- **Don't** desenhar tema escuro: o app declara `color-scheme: light` porque
  não existe paleta escura desenhada.
- **Don't** sortear a inclinação da polaroide com `Math.random` — índice, e o
  gesto de endireitar reservado a "item comprado".
- **Don't** girar 2° em linha larga; ali a escala é `sutil`.
- **Don't** montar classe Tailwind por concatenação (`bg-${cor}`): a varredura
  de texto não a encontra e a cor some.
- **Don't** escrever `text-sm`, `text-xs` ou `text-base`: são a escala do
  Tailwind, não a nossa, e como o `body` fixa a fonte de display elas entregam
  conversa na voz de afirmação.
- **Don't** montar `<label>` com `<select>` ou `<input>` à mão ao lado de
  campos que vêm de `form-ui`. Dá para ver na tela: era o defeito de /aportes e
  de /parceiro.
- **Don't** acrescentar um terceiro momento de movimento. Dois bastam, e o
  terceiro apaga os dois.
