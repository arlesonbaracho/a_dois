import { expect, test, type Browser, type Page } from "@playwright/test";

import { comoPessoa, criarConta, entrar, type Conta } from "./apoio";

/** Uma segunda pessoa, em outro navegador. Não é aba: é sessão separada. */
async function outroAparelho(browser: Browser, conta: Conta): Promise<Page> {
  const contexto = await browser.newContext();
  const page = await contexto.newPage();
  await entrar(page, conta);
  return page;
}

test.describe("quem divide o plano", () => {
  // É por aqui que uma pessoa passa a ver o histórico financeiro de outra.
  // O teste existe para provar as duas metades: reivindicar NÃO concede, e
  // confirmar concede.
  test("reivindicar não dá acesso; só a confirmação dá", async ({ page, browser, request }) => {
    const ana = await criarConta(request, "ana");
    const beto = await criarConta(request, "beto");

    // A Ana tem um plano com dinheiro dentro. É esse o segredo em jogo.
    const comoAna = await comoPessoa(request, ana);
    const meta = await (await comoAna.rpc("add_goal", {
      p_title: "Entrada do apê",
      p_target_amount_cents: 12000000,
    })).json();
    await comoAna.rpc("add_contribution", { p_goal_id: meta, p_amount_cents: 150000 });

    await entrar(page, ana);
    await page.goto("/parceiro");

    await page.getByLabel("Como você quer convidar").selectOption("link");
    await page.getByRole("button", { name: "Criar convite" }).click();

    const link = await page.getByLabel("Link do convite").inputValue();
    expect(link).toContain("/convite?t=");

    // ---- O Beto, no aparelho dele ----
    const betoPage = await outroAparelho(browser, beto);
    await betoPage.goto(new URL(link).pathname + new URL(link).search);
    await betoPage.getByLabel("Como você quer aparecer para ela").fill("Beto");
    await betoPage.getByRole("button", { name: "Pedir para entrar" }).click();
    await expect(betoPage.getByRole("heading", { name: "Pedido enviado" })).toBeVisible();

    // O ponto do arquivo inteiro: ele reivindicou, e continua sem ver nada.
    await betoPage.goto("/jornadas");
    await expect(betoPage.getByText("Entrada do apê")).toHaveCount(0);

    const antes = await (await comoPessoa(request, beto)).ler<unknown[]>("goals?select=id");
    expect(antes, "reivindicar não pode devolver linha nenhuma").toHaveLength(0);

    // ---- A Ana confirma ----
    await page.goto("/parceiro");
    await expect(page.getByText("Alguém pediu para entrar no plano de vocês")).toBeVisible();
    await page.getByRole("button", { name: "Confirmar" }).click();

    // O nome que o Beto digitou foi para `profiles`; `confirm_invite` cria o
    // vínculo SEM display_name. Se a tela ler só o do vínculo, ele vira
    // "Sua dupla" para sempre — que foi exatamente o defeito relatado.
    await expect(page.getByText("Beto")).toBeVisible();
    await expect(page.getByText("Sua dupla")).toHaveCount(0);

    // E a etiqueta "você" segue quem está olhando, não quem abre a lista: a
    // ordem começa pelo dono, e do lado do Beto o dono é a outra pessoa.
    await betoPage.goto("/parceiro");
    await expect(betoPage.getByText("Beto").locator("xpath=../..")).toContainText("você");

    // ---- Agora sim ----
    await betoPage.goto("/jornadas");
    await expect(betoPage.getByText("Entrada do apê")).toBeVisible();

    const depois = await (await comoPessoa(request, beto)).ler<unknown[]>(
      "contributions?select=amount_cents",
    );
    expect(depois).toHaveLength(1);

    await betoPage.context().close();
  });

  test("o e-mail de quem pede aparece mascarado para quem confirma", async ({
    page,
    browser,
    request,
  }) => {
    const ana = await criarConta(request, "ana");
    const beto = await criarConta(request, "beto");

    await entrar(page, ana);
    await page.goto("/parceiro");
    await page.getByLabel("Como você quer convidar").selectOption("link");
    await page.getByRole("button", { name: "Criar convite" }).click();
    const link = await page.getByLabel("Link do convite").inputValue();

    const betoPage = await outroAparelho(browser, beto);
    await betoPage.goto(new URL(link).pathname + new URL(link).search);
    await betoPage.getByLabel("Como você quer aparecer para ela").fill("Beto");
    await betoPage.getByRole("button", { name: "Pedir para entrar" }).click();
    // Esperar o pedido aterrissar antes de olhar a tela da Ana. Sem isto, sob
    // carga a página dela carrega antes do claim e o teste falha por corrida,
    // não por defeito.
    await expect(betoPage.getByRole("heading", { name: "Pedido enviado" })).toBeVisible();

    await page.goto("/parceiro");
    const pedido = page.getByText("Alguém pediu para entrar no plano de vocês").locator("..");

    // A pessoa precisa reconhecer quem apareceu, sem que o e-mail em claro
    // saia do banco. auth.users não é exposta por policy nenhuma.
    await expect(pedido).toContainText("•");
    await expect(pedido).not.toContainText(beto.email);

    await betoPage.context().close();
  });
});
