---
version: 1
slug: "apps-web-app-app-page-tsx"
primary_target: "apps/web/app/(app)/page.tsx"
related_targets: ["apps/web/app/(app)/inicio.tsx","apps/web/app/(app)/jornadas/[id]/detalhe.tsx","apps/web/app/(app)/aportes/page.tsx","apps/web/app/(app)/aportes/novo/anotar.tsx","apps/web/components/pecas.tsx","apps/web/components/form-ui.tsx","apps/web/components/dock.tsx"]
---

Escopo: o app inteiro — mundo visual v3, substituindo o álbum verde/marrom do v2. Nesta rodada, só o protótipo para aprovação; a implementação espera o "sim" do autor.
Modo: Operate — duas pessoas anotando e acompanhando dinheiro a dois, no celular, fora do horário de trabalho.

Público e tarefa: casal brasileiro, dois membros no máximo. Anotar aporte, ver quanto já juntaram, decidir o que comprar, confirmar quem entra no plano.

Restrições: rótulo e nome acessível são contrato da suíte e2e. `role="progressbar"` e `role="status"` não regridem. Sem dado pessoal novo. Arte 3D é Fluent Emoji (MIT), baixada com autorização. Referência fixada pelo autor: vídeo `1a9e0df3f9c7d7552af69a4affe1a043.mp4` ("Courses") — fica "bem próximo do vídeo".

## Direction contract

THESIS: A jornada do casal é uma **carta de um deck**, não uma linha de extrato — e cada aporte vira um **comprovante** que se guarda. Recusa o saldo gigante com gráfico do banco digital e também o álbum de polaroide que o v2 foi.

OWN-WORLD: As nove cores da marca e nenhuma outra: papel #FDFBF7 de fundo, peça que se pega em branco, tinta #070001 como estrutura e ação, verde #33605A e marrom #68462B como as duas pessoas, creme #E9E0D1 só sobre escuro, sálvia #91A398 de apoio e nunca texto, suave #5F6F68 no texto de apoio, areia #F1EAE0 de superfície, cinza #B3AB9C para ex-membro. Campo de categoria e contorno de campo são mistura de uma das nove com branco (o contorno é suave a 75%, 3.18:1). Única cor fora das nove: o vermelho de erro/destruição (#8a3a2a sobre #f4e6df), que é estado, não marca — quem vai perder dado precisa reconhecer o perigo (confirmado pelo autor em 2026-09-16). Lexend numa voz só, larga, 500 em título. Carta de raio 32 com arte 3D em cima e legenda branca embaixo, disco de tinta no vinco. Chips em pílula com contador em areia; botões e navegação em círculos separados.

STORY: Ela abre, vê a jornada da frente e quanto falta, arrasta para a próxima. Anota um aporte num teclado grande e recebe o comprovante. Acredita porque, quando entra aporte, moedas de R$ 1 caem sobre a tela e o total rola ao recebê-las.

FIRST VIEWPORT (390px): "oi, Lucas e Ana" com sino e avatar do casal em círculos; título "Nossa jornada"; chips de categoria com contador; o deck ocupando o centro com duas camadas pastel atrás; navegação em três círculos e o disco preto de anotar aporte à direita.

FORM: Direção 3 da lista (Comprovante), fundida com a referência fixada; seed key a5fdb515. Elevações: total que rola dígito a dígito (painel), carta da frente é a prioridade (cracktro), marca de estado em célula fixa (horários), um gesto por transformação com resistência (capa), pastel só nas bordas (nuvem).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
