import { expect, test } from "@playwright/test";

import { chaves, comoPessoa, criarConta, entrar, parear } from "./apoio";

/** Um PNG de 8x8 e 74 bytes. Pequeno para o teste ser rápido, e imagem de
 *  verdade para o canvas do navegador conseguir decodificar. */
const PNG_MINUSCULO =
  "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGM4EaCBFTEMLQkAaplQAc/OcKAAAAAASUVORK5CYII=";

test.describe("metas e itens", () => {
  test("criar meta, listar, abrir e anotar item", async ({ page, request }) => {
    await entrar(page, await criarConta(request, "metas"));
    await page.goto("/jornadas");

    await expect(page.getByText("Ainda não tem jornada nenhuma")).toBeVisible();

    await page.getByLabel("O que vocês querem").fill("Entrada do apê");
    await page.getByLabel("Quanto vocês querem juntar (R$)").fill("120000");
    await page.getByLabel("Categoria").fill("casa");
    await page.getByRole("button", { name: "Criar jornada" }).click();

    const cartao = page.getByRole("link", { name: /Entrada do apê/ });
    await expect(cartao).toBeVisible();
    await expect(cartao).toContainText("R$ 0,00 de R$ 120.000,00 · 0%");

    await cartao.click();
    await expect(page.getByRole("heading", { name: "Entrada do apê" })).toBeVisible();

    await page.getByLabel("O que", { exact: true }).fill("Geladeira");
    await page.getByLabel("Quanto deve custar (R$, opcional)").fill("4199");
    await page.getByRole("button", { name: "Adicionar item" }).click();

    await expect(page.getByText("Geladeira")).toBeVisible();
    await expect(page.getByText("R$ 4.199,00")).toBeVisible();

    // check(), e não click(): o check do Playwright exige que a caixa mude de
    // estado no MESMO instante do clique. Ele falhava antes do estado otimista
    // — é essa a diferença que este teste agora tranca.
    const comprado = page.getByRole("checkbox", { name: "Marcar Geladeira como comprado" });
    await comprado.check();

    // E tem que sobreviver ao recarregar: sem isso, o teste passaria com um
    // estado que só existe no navegador.
    await page.reload();
    await expect(page.getByRole("checkbox", { name: "Marcar Geladeira como comprado" })).toBeChecked();
  });

  test("a barra de progresso sai dos aportes", async ({ page, request }) => {
    const ana = await criarConta(request, "barra");
    await entrar(page, ana);

    const comoAna = await comoPessoa(request, ana);
    const meta = await (await comoAna.rpc("add_goal", {
      p_title: "Viagem",
      p_target_amount_cents: 800000,
    })).json();

    await page.goto(`/jornadas/${meta}`);
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");

    await page.getByLabel("Quanto (R$)").fill("2000");
    await page.getByRole("button", { name: "Anotar" }).click();

    // 2.000 de 8.000 é um quarto, e a barra tem que dizer isso para quem
    // enxerga E para quem usa leitor de tela.
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
    await expect(page.getByText("R$ 2.000,00 de R$ 8.000,00 · 25%")).toBeVisible();
  });

  // O que faz o plano ser compartilhado: sem F5, e sem recarregar a página.
  test("o que o parceiro escreve aparece sozinho", async ({ page, request }) => {
    const ana = await criarConta(request, "ana");
    const beto = await criarConta(request, "beto");
    await parear(request, ana, beto);

    const comoAna = await comoPessoa(request, ana);
    const meta = await (await comoAna.rpc("add_goal", {
      p_title: "Cozinha",
      p_target_amount_cents: 1000000,
    })).json();
    const item = await (await comoAna.rpc("add_goal_item", {
      p_goal_id: meta,
      p_name: "Geladeira",
    })).json();

    await entrar(page, ana);
    await page.goto(`/jornadas/${meta}`);
    await expect(page.getByText("Geladeira")).toBeVisible();

    // Marcador que só sobrevive se a página NÃO recarregar. Sem ele, o teste
    // passaria igual se alguém trocasse o Realtime por um refresh burro.
    await page.evaluate(() => {
      (window as unknown as { __vivo: boolean }).__vivo = true;
    });

    const comoBeto = await comoPessoa(request, beto);
    await comoBeto.rpc("add_goal_item", { p_goal_id: meta, p_name: "Cooktop" });
    await comoBeto.rpc("add_contribution", { p_goal_id: meta, p_amount_cents: 250000 });
    await comoBeto.apagar(`goal_items?id=eq.${item}`);

    await expect(page.getByText("Cooktop")).toBeVisible();
    await expect(page.getByText("Geladeira")).toHaveCount(0);
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");

    expect(
      await page.evaluate(() => (window as unknown as { __vivo?: boolean }).__vivo),
      "a página recarregou; isto devia ser Realtime",
    ).toBe(true);
  });

  // O freio de mão: meta com dinheiro dentro não some no primeiro clique.
  test("apagar meta com aporte pede confirmação", async ({ page, request }) => {
    const ana = await criarConta(request, "apagando");
    await entrar(page, ana);

    const comoAna = await comoPessoa(request, ana);
    const meta = await (await comoAna.rpc("add_goal", {
      p_title: "Meta com dinheiro",
      p_target_amount_cents: 100000,
    })).json();
    await comoAna.rpc("add_contribution", { p_goal_id: meta, p_amount_cents: 50000 });

    await page.goto(`/jornadas/${meta}`);
    await page.getByRole("button", { name: "Apagar esta jornada" }).click();

    await expect(page.getByText(/já tem dinheiro dentro/)).toBeVisible();
    await expect(page).toHaveURL(`/jornadas/${meta}`);
    expect(await comoAna.ler<unknown[]>(`goals?select=id&id=eq.${meta}`)).toHaveLength(1);

    await page.getByRole("button", { name: "Apagar mesmo assim" }).click();

    await expect(page).toHaveURL("/jornadas");
    expect(await comoAna.ler<unknown[]>(`goals?select=id&id=eq.${meta}`)).toHaveLength(0);
  });

  /**
   * A capa da jornada, de ponta a ponta.
   *
   * É o único teste que atravessa a costura inteira: navegador reduz e
   * reencoda, o Storage aceita pela policy, a coluna aceita pela constraint, e
   * a tela volta com a foto. Cada pedaço tem prova própria em outro lugar; a
   * emenda entre eles só existe aqui.
   */
  test("pôr uma capa, e a capa é do nosso bucket", async ({ page, request }) => {
    const ana = await criarConta(request, "capa");
    await entrar(page, ana);

    const comoAna = await comoPessoa(request, ana);
    const meta = await (await comoAna.rpc("add_goal", {
      p_title: "Praia em janeiro",
      p_target_amount_cents: 800000,
    })).json();

    await page.goto(`/jornadas/${meta}`);

    // Antes: polaroide sem foto, e isso é estado legítimo — a chapa segura.
    await expect(page.locator('img[src*="/capas/"]')).toHaveCount(0);

    // getByLabel, e não um seletor de CSS: rótulo acessível é contrato nesta
    // base, e um controle de arquivo sem nome é invisível para leitor de tela.
    await page.getByLabel("Capa da jornada").setInputFiles({
      name: "praia.png",
      mimeType: "image/png",
      buffer: Buffer.from(PNG_MINUSCULO, "base64"),
    });

    const foto = page.locator('img[src*="/capas/"]');
    await expect(foto).toBeVisible();

    // O ponto da tarefa: o endereço é NOSSO e é assinado. URL de terceiro faria
    // o navegador de quem abre a tela buscar um destino escolhido por outra
    // pessoa, entregando IP e horário.
    const src = await foto.getAttribute("src");
    expect(src).toContain("/storage/v1/object/sign/capas/");
    expect(new URL(src ?? "").origin).toBe(new URL(chaves().API_URL).origin);

    // E a coluna guardou CAMINHO, nunca URL.
    const [linha] = await comoAna.ler<{ cover_path: string }[]>(
      `goals?select=cover_path&id=eq.${meta}`,
    );
    expect(linha.cover_path).not.toContain("http");
    expect(linha.cover_path).toMatch(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/);

    // Tem que sobreviver ao recarregar: senão o teste passaria com uma foto
    // que só existe nesta aba.
    await page.reload();
    await expect(page.locator('img[src*="/capas/"]')).toBeVisible();
  });

  /**
   * `price_quotes` guardava a série desde o prompt 6 — append-only, com RLS e
   * com teste de auditoria — e NADA no app lia. Este teste é o que faz a
   * tabela existir para alguém.
   */
  test("o histórico de preço aparece no item", async ({ page, request }) => {
    const ana = await criarConta(request, "preco");
    await entrar(page, ana);

    const comoAna = await comoPessoa(request, ana);
    const meta = await (await comoAna.rpc("add_goal", {
      p_title: "Cozinha nova",
      p_target_amount_cents: 2000000,
    })).json();
    const item = await (await comoAna.rpc("add_goal_item", {
      p_goal_id: meta,
      p_name: "Geladeira",
    })).json();

    await page.goto(`/jornadas/${meta}`);
    // Uma cotação só não é histórico: a linha não pode aparecer ainda.
    await expect(page.getByText(/caiu|subiu/)).toHaveCount(0);

    // Pela RPC, que é o único caminho de escrita — insert direto é negado.
    await comoAna.rpc("add_price_quote", {
      p_goal_item_id: item,
      p_price_cents: 419900,
      p_source_url: "https://loja.test/geladeira",
    });
    await comoAna.rpc("add_price_quote", {
      p_goal_item_id: item,
      p_price_cents: 399000,
      p_source_url: "https://loja.test/geladeira",
    });

    await page.reload();
    await expect(page.getByText("R$ 4.199,00 → R$ 3.990,00")).toBeVisible();
    await expect(page.getByText(/caiu 5%/)).toBeVisible();
  });

  /**
   * A prioridade era gravada e nunca lida: a pessoa escolhia "É o que a gente
   * mais quer" e o app ignorava. Pedir uma decisão e ignorá-la é pior que não
   * perguntar.
   */
  test("a prioridade ordena o álbum", async ({ page, request }) => {
    const ana = await criarConta(request, "prioridade");
    await entrar(page, ana);
    const comoAna = await comoPessoa(request, ana);

    // A ordem de criação é A ALTA PRIMEIRO, e isso é o teste inteiro.
    //
    // A consulta desempata por `created_at desc`. Criando da baixa para a
    // alta, a data sozinha já devolveria alta-media-baixa e o teste passaria
    // mesmo com a ordenação por prioridade removida — foi o que aconteceu na
    // primeira versão disto. Criando ao contrário, data e prioridade discordam,
    // e só a prioridade dá o resultado esperado.
    for (const [titulo, prioridade] of [
      ["O que mais queremos", "alta"],
      ["Importante sem pressa", "media"],
      ["Um dia quem sabe", "baixa"],
    ] as [string, string][]) {
      await comoAna.rpc("add_goal", {
        p_title: titulo,
        p_target_amount_cents: 100000,
        p_priority: prioridade,
      });
    }

    await page.goto("/jornadas");
    // A lista é client-side: sem esperar, `allInnerTexts` lê a página antes de
    // a consulta voltar e devolve array vazio — o teste falharia por corrida,
    // não por ordem errada.
    await expect(page.getByRole("link", { name: /quem sabe/ })).toBeVisible();

    const titulos = await page
      .getByRole("link", { name: /quem sabe|sem pressa|mais queremos/ })
      .allInnerTexts();
    expect(titulos, "as três jornadas deviam estar na tela").toHaveLength(3);

    expect(titulos[0], "a de prioridade alta devia vir primeiro").toContain("O que mais queremos");
    expect(titulos[titulos.length - 1]).toContain("Um dia quem sabe");
  });
});
