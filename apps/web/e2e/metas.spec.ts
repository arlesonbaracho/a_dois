import { expect, test } from "@playwright/test";

import { comoPessoa, criarConta, entrar, parear } from "./apoio";

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
});
