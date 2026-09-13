# Redesenho v2 — Jornada

**Data:** 2026-09-13 · **Commits:** `1f76698` e o deste dia · **Base:** os três
protótipos em `~/Documentos/Três protótipos de app mobile/` · **Ambiente:**
stack local do Supabase, telas conferidas a 390×844 e a 1280×900 pelo
Playwright.

---

## 1. A contradição que precisou de decisão

Os três arquivos não eram a mesma direção:

| | `Jornada.dc.html` (3a–3d) | `Album variacoes` (2a) | `Jornada v2` (4a–4e) |
|---|---|---|---|
| Fundo | creme `#F7F0E1` | creme `#F7F0E1` | quase-branco `#FDFBF7` |
| Tinta | `#16170F` | `#16170F` | `#070001` |
| Acento | limão `#D8F26B` | limão `#D8F26B` | verde `#33605A` |
| Pessoa 1 / 2 | `#14B88C` / `#F3B63F` | idem | `#33605A` / `#68462B` |
| Home | grade de polaroides | grade + recado | **1 cartão com carrossel** |

Você escolheu **a v2 inteira**, **só o carrossel**, e as quatro frentes. Foi o
que se fez.

---

## 2. O que mudou de mundo

O creme saiu do fundo e virou o **texto sobre superfície escura**. O limão saiu
de cena. O verde assumiu a ação e a primeira pessoa; o marrom, a segunda. O
grão do papel saiu, e o cartão passou a se separar do fundo por **contorno** em
vez de sombra.

**Três medições de contraste mudaram o que o brief dizia.** Não por gosto: o
piso vence o valor do brief, e isto é o tipo de coisa que só aparece quando
alguém mede.

| O que | Medido | Decisão |
|---|---|---|
| Sálvia `#91A398` como texto | **2.57:1** | Vira só superfície — que é como o protótipo já a usava. Sobre ela, o texto é tinta (7.82:1) |
| Verde como texto sobre tinta | **2.93:1** | Texto sobre escuro é **creme** (15.90:1), nunca verde |
| `creme/80` sobre verde | **4.10:1** | Os rótulos ali são 10.5px, então sobem para `creme/90` (4.73:1) |
| Borda `#EDE5D8` sobre branco | **1.25:1** | Em cartão tudo bem, é decoração. Em campo, select e chip o limite **é informação** e o piso é 3:1 — nasce a segunda borda, `contorno` `#7E8F84`, com 3.42:1 |

A última é a única divergência visível do protótipo: seus campos têm o
contorno um pouco mais marcado que no `.dc.html`. É o preço de o controle
dizer onde começa.

---

## 3. As quatro frentes

**Convidar.** Duas abas, etiqueta de estado por pessoa, e o cartão sálvia
**"O que essa pessoa vai ver"** — o escopo do acesso dito *antes* de convidar,
e não só no cartão de confirmação, que é quando quem lê já decidiu. O link
saiu do `<input readOnly>` e ganhou WhatsApp (`wa.me`), a folha do sistema
(`navigator.share`, que num PWA instalado abre a lista inteira de apps) e
copiar. A aba que abre é a que tem o que fazer: com pedido na mesa ou plano
cheio, "No plano"; senão, "Convidar".

**Nova jornada, dois passos.** É a melhor ideia dos três arquivos e agora
existe: chips de categoria, prazo em pílulas, e o cartão verde recalculando ao
vivo **quanto cabe por mês**. O formulário antigo respondia "quanto custa"; a
tela nova responde "dá pra fazer?", que é a pergunta que o casal realmente tem.

**Telas de porta.** Olho de mostrar a senha, rodapé colado embaixo no alcance
do polegar, "Esqueci minha senha" junto do campo, e a promessa do produto dita
na porta: *"Ninguém entra no plano de vocês sem a sua confirmação, nem por
link."*

**Jornada aberta.** Avatares do casal empilhados, "Casa · desde setembro de
2026", e o item com a caixa de 44px e a etiqueta de preço do 4b.

---

## 4. Onde me afastei do protótipo, e por quê

| O que | Por quê |
|---|---|
| **Home no desktop é destaque + álbum, não carrossel puro** | O v2 só desenhou o celular. Um cartão único numa tela de 1280px deixava dois terços de superfície vazia, e esconder cinco de seis num espaço que cabe todas não é o mesmo gesto que fazê-lo no celular |
| **O carrossel para de vez ao toque num ponto** | Conteúdo que anda sozinho precisa de mecanismo de parada. Assumir o controle já *é* a parada, e não custa um botão que ninguém entenderia. Ele também pausa sob o ponteiro e sob o foco, e não começa com `prefers-reduced-motion` |
| **O deslizante convive com o campo de texto** | Só o deslizante deixaria de fora todo valor que não cai num degrau de R$ 500, e "R$ 12.450" é um alvo tão legítimo quanto os outros |
| **O checklist do passo 2 são links de verdade** | No protótipo eles se marcam sozinhos. Uma lista de tarefas que não leva a lugar nenhum é decoração |
| **A saudação "oi, Ana e Lucas" ficou** | O 4a só tem o mês. A saudação é a voz do produto, e dois testes ancoram nela |
| **O QR ficou de fora** | Exige biblioteca nova (`qrcode`, que roda em React Native também). Isso é pergunta, não decisão minha — se quiser, é meia hora |
| **"@apelido + Copiar" ficou de fora** | O protótipo assume que a outra pessoa digita seu apelido e pede para entrar. Não é o nosso fluxo: todo pedido nasce de um convite com token. Copiar o apelido não serviria para nada, e mostrar isso seria mentir sobre como o app funciona |
| **A caixa de item é o próprio `<input>` desenhado** | Escondido atrás de um `<span>`, o alvo de clique vira 1px e o `check()` do Playwright erra o toque |
| **"este mês" e "quem colocou" saíram da home** | A home passou a mostrar uma jornada por vez; empilhar duas caixas de dinheiro antes dela enterraria a tese da tela. As duas contas vivem inteiras em `/aportes`, que é a tela do dinheiro |

---

## 5. Ideias — visual

Em ordem de quanto mudam a cara do app pelo custo que têm.

**5.1 — A foto de verdade. É a maior lacuna que sobrou.** O v2 inteiro se apoia
na foto: 268px de altura no cartão da home, contra ~40px de texto. Hoje o que
está lá é desenho nosso, e pôr a foto de verdade é um clique escondido dentro
da jornada. O Storage, o bucket, a constraint e a remoção de EXIF já existem e
estão testados — falta só o **caminho**. Duas mudanças pequenas resolvem:
pedir a capa no passo 2 da criação (o link já está lá, falta abrir o seletor
direto) e pôr um estado de "sem foto" mais convidativo dentro da jornada.
**É a coisa com maior diferença entre esforço e resultado no projeto inteiro.**

**5.2 — Ícone e splash do PWA.** Continuam os dois anéis feitos por script, em
creme. Agora que o mundo é branco, verde e marrom, eles destoam mais do que
antes. É trabalho de marca, não de restyle — mas é o que aparece na tela de
início do celular, que é onde o app compete com todos os outros.

**5.3 — Modo escuro passou a ser possível.** Antes eu recusava porque não
existia paleta escura desenhada. A v2 tem tinta `#070001`, creme `#E9E0D1`,
verde e marrom — que é exatamente a paleta de um modo escuro, já medida. O
cartão de tinta que hoje é exclusivo do pedido do parceiro vira a superfície
base, e o creme já é o texto sobre ele. Deixa de ser inventar e vira inverter.

**5.4 — A polaroide torta ficou em duas telas só.** Ela sobrevive dentro da
jornada e na jornada nova, porque foi onde o v2 a manteve. Vale decidir se ela
ainda ganha o lugar dela ou se some: uma assinatura que aparece em duas de
nove telas não assina nada.

**5.5 — Cartão de progresso para compartilhar.** "Já juntamos 60% da casa",
como imagem, pronto para mandar. É o tipo de coisa que um casal manda para a
mãe, e é o único mecanismo de divulgação que o produto teria sem gastar em
anúncio. Custa um `canvas` e nenhuma dependência.

---

## 6. Ideias — usabilidade

**6.1 — Registrar aporte de dentro da jornada em foco.** Hoje o "+" do dock vai
para `/aportes` e pede para escolher a jornada. No cartão em destaque a jornada
já é conhecida. Um segundo disco ali economiza **dois toques na ação mais
frequente do produto** — a que o casal faz todo mês, nos dois aparelhos.

**6.2 — O histórico de preço existe e nunca apareceu.** `price_quotes`, a Edge
Function de extração e 17 testes estão prontos há dias, e **nenhuma tela mostra
o resultado**. "A geladeira está R$ 210 mais barata que no mês passado" é
exatamente o "Recado no álbum" do protótipo 2a — só que com dado real em vez de
texto de exemplo. É a peça mais pronta e mais invisível do projeto.

**6.3 — Nada avisa quando o parceiro aporta.** O Realtime já entrega o evento e
já invalida a consulta; a tela atualiza em silêncio. Dizer "Lucas colocou
R$ 400 hoje" é informação que o app tem em mãos e joga fora — e é o que faz um
plano parecer compartilhado em vez de sincronizado.

**6.4 — Um "e se" na jornada aberta.** O deslizante da criação responde "dá pra
fazer?". Depois de criada, a mesma pergunta volta em outra forma: "e se a gente
colocar R$ 200 a mais por mês?". A conta já existe (`parcelaMensalCents`); é a
mesma peça, em outra tela.

**6.5 — Lembrete do aporte do mês.** O produto inteiro é sobre juntar todo mês,
e nada lembra ninguém disso. É a maior alavanca de retenção que o app tem — e a
única que exige decidir sobre notificação, que por sua vez esbarra na regra 11
do CLAUDE.md (push sem valor no corpo). Vale a conversa antes do código.

**6.6 — "Recado no álbum".** É a peça mais de-casal dos três protótipos e a
única que exige tabela nova, RLS e realtime. Entra em plan mode, separada.

**6.7 — Sem prazo, a jornada não mostra "por mês".** O cartão simplesmente não
aparece. Sugerir um prazo ("em 24 meses seriam R$ 583 por mês") transformaria
um espaço vazio numa pergunta útil.

**6.8 — `goals.priority` continua gravada e nunca lida.** Com a ordem do álbum
agora por progresso, ela ficou ainda mais órfã. Ou vira critério de ordem, ou
sai do formulário.

---

## 7. Como foi verificado

| Verificação | Resultado |
|---|---|
| `npm run typecheck` | 4 pacotes, verde |
| `npm run lint` | verde |
| `npm test` | 140 unitários (5 novos, de `ordemDoAlbum`) |
| `npx playwright test` | **41 de 41**, três rodadas |
| `npm run guardas` | 9 tabelas com RLS; `packages/` sem API de navegador |
| Detector do design system | **1 aviso**, e é o `<img>` da capa assinada, que é intencional e comentado |
| Contraste | 13 pares medidos antes de escrever o `@theme`; três mudaram o brief |
| Telas olhadas | login, home (mobile e desktop), `/jornadas`, jornada aberta, `/jornadas/nova`, `/parceiro` (duas abas), `/aportes` |

**Um teste foi reescrito, e vale dizer qual.** `metas.spec.ts` criava jornada
pelo formulário lateral de `/jornadas`, que deixou de existir. O teste agora
percorre a tela de dois passos — chip, nome, valor, "Criar jornada", "Abrir a
jornada" — e continua conferindo o mesmo: que o cartão da lista diz
`R$ 0,00 de R$ 120.000,00 · 0%`. Os outros 40 passaram sem tocar em nada.

**E uma ressalva de método.** O navegador embutido da sessão não completa a
hidratação do `next dev`, então as telas que dependem de consulta no cliente
foram fotografadas pelo Playwright, que dirige o mesmo servidor sem esse
problema. Nenhum defeito deste relatório depende de comportamento que eu não
tenha visto renderizado ou coberto por teste.

---

## 8. Contrato que não foi quebrado

- `role="progressbar"` com `aria-value*`, `role="status"` nos recados, e todo
  controle com nome acessível.
- A frase da barra (`R$ X de R$ Y · Z%`) continua um nó de texto só.
- O cartão escuro segue exclusivo do fluxo do pedido do parceiro — foi por isso
  que os primeiros passos da home voltaram a ser bloco branco.
- Nenhuma dependência nova. Nenhuma migration. Nada tocou em schema, RLS ou
  dado pessoal.
