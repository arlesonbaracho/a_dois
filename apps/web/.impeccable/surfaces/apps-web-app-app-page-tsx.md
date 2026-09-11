---
version: 1
slug: "apps-web-app-app-page-tsx"
primary_target: "apps/web/app/(app)/page.tsx"
related_targets: ["apps/web/app/(app)/metas/lista.tsx","apps/web/app/(app)/metas/[id]/detalhe.tsx","apps/web/app/(app)/parceiro/form.tsx","apps/web/components/form-ui.tsx"]
---

Escopo: o app inteiro (mundo visual novo, substituindo o stone/orange sem design).
Modo: Operate — duas pessoas completando uma tarefa de dinheiro, no celular, fora do horário de trabalho.

Público e tarefa: casal brasileiro, dois membros no máximo. Anotar aporte, ver quanto já juntaram, decidir o que comprar, confirmar quem entra no plano.

Restrições: rótulo e nome acessível são contrato (121 de 146 seletores e2e ancoram em role/label). `role="progressbar"` e `role="status"` não regridem. Sem dado pessoal novo. Sem dependência nova sem autorização.

## Direction contract

THESIS: O plano de um casal é um **álbum**, não um extrato. Esta superfície recusa o arranjo padrão da categoria financeira — grade de cartões iguais, gráfico no topo, saldo em número grande cinza, ícone genérico em tile — e no lugar dela põe fotos tortas sobre papel, onde cada jornada é um objeto que se pega. O dinheiro aparece como fato guardado, nunca como métrica.

OWN-WORLD: Papel creme #F7F0E1 de borda a borda; tinta quase preta #16170F; limão #D8F26B como acento único, nunca fundo de página. A peça-assinatura é a polaroide: cartão branco girado 1–2°, raio 6px, sombra 0 10px 20px rgb(22 23 15/.1). Todo controle é pílula de 99px. Progresso é bicolor por pessoa (#14B88C / #F3B63F), nunca preenchimento único. Outfit carrega estrutura e número (700–800, tracking −.02 a −.04em); Manrope carrega tudo que é dito em voz humana. O cartão escuro #16170F é reservado ao único momento que concede acesso: o pedido do parceiro.

STORY: Ela abre e vê, em um viewport, o que os dois estão construindo e quanto já é real. Acredita porque o número está sobre as fotos das próprias metas, não numa caixa de dashboard. Age anotando um aporte pelo botão preto do dock, ou abrindo uma jornada para marcar um item comprado.

FIRST VIEWPORT (mobile, 390px): saudação em Manrope com o mês em negrito ao lado, iniciais do casal em disco preto à direita. Abaixo, faixa rolável de chips de categoria com contagem. Então a pílula preta larga, total em limão, largura total. Então a grade de polaroides em duas colunas de alturas desiguais, giradas em sentidos opostos, com o cartão limão "este mês" ancorando a coluna direita. Dock fixo no rodapé: pílula branca com dois destinos e, separado, o disco preto com "+" em limão — a ação primária.

FIRST VIEWPORT (desktop, ≥1024px): o mesmo álbum, aberto sobre a mesa em vez de na mão. O dock vira trilho vertical à esquerda, mesma pílula, mesmo disco preto. As polaroides espalham em três colunas; o total e o "este mês" sobem para uma coluna à direita. Medida de texto presa em 65–75ch para o corpo não esticar. Nada de layout novo: é o mesmo mundo em outra distância.

FORM: Direção **fixada pelo brief**, não sorteada. O autor do produto entregou `A DOIS - Jornada.dc.html` com paleta, tipografia, raios, sombras e quatro telas completas; o playbook manda o pin vencer o roll, então nenhum `concept-seed` rodou e não há seed key. Duas notas de calibração assumidas de olhos abertos: Outfit está na lista de faces-padrão do skill, e "fundo creme quente" é o clichê nº 1 de interface gerada — os dois vêm do brief, e o brief vence. O desktop é a única metade derivada por mim, porque o design só desenhou o celular.

Interação-assinatura (o code-led carrega a ambição aqui): marcar um item como comprado endireita a polaroide — a rotação vai a 0° e a etiqueta vira pílula preta com o texto em limão. É o gesto de "colar no álbum", e é o único momento de movimento autoral da superfície.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
