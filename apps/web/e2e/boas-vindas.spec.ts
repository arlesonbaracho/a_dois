import { expect, test } from "@playwright/test";

import { comoPessoa, criarConta, entrar } from "./apoio";

test.describe("boas-vindas", () => {
  // Não é gate: as telas moram por cima da própria home, e a URL continua "/".
  // Uma vez por navegador — o cookie é o que lembra —, e só para casal novo.
  test("conta nova vê as boas-vindas uma vez, e cai no deck de começo", async ({ page, request }) => {
    await entrar(page, await criarConta(request, "chegando", "Lia"), "/", { boasVindas: true });

    await expect(page).toHaveURL("/");
    const apresentacao = page.getByRole("dialog", { name: /Boas-vindas/ });
    await expect(apresentacao).toBeVisible();
    await expect(page.getByRole("heading", { name: "O plano de vocês dois, num lugar só." })).toBeVisible();

    await page.getByRole("button", { name: "Próximo" }).click();
    await page.getByRole("button", { name: "Próximo" }).click();
    await page.getByRole("button", { name: "Começar" }).click();

    await expect(apresentacao).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Comecem por aqui" })).toBeVisible();
    await expect(page.getByText("0 de 3 feitos")).toBeVisible();

    // O cookie ficou: voltar à home não repete a apresentação.
    await page.reload();
    await expect(page.getByRole("heading", { name: "Comecem por aqui" })).toBeVisible();
    await expect(apresentacao).toHaveCount(0);
  });

  test("quem já tem jornada nunca vê as boas-vindas", async ({ page, request }) => {
    const conta = await criarConta(request, "veterana");
    await (await comoPessoa(request, conta)).rpc("add_goal", {
      p_title: "Viagem",
      p_target_amount_cents: 100000,
    });

    await entrar(page, conta, "/", { boasVindas: true });
    await expect(page.locator("[data-frente] h2")).toHaveText("Viagem");
    await expect(page.getByRole("dialog", { name: /Boas-vindas/ })).toHaveCount(0);
  });
});

// O convidado que pediu para entrar está num plano solo. Criar jornada ali é o
// único jeito de ele mesmo quebrar o próprio pedido — `confirm_invite` recusa
// plano com movimentação —, então a home e a jornada nova param de empurrar.
test("quem pediu para entrar espera, e não é mandado criar jornada", async ({ page, request }) => {
  const dona = await criarConta(request, "dona", "Ana");
  const convidado = await criarConta(request, "convidado", "Beto");

  const [{ token }] = (await (
    await (await comoPessoa(request, dona)).rpc("create_invite", { p_channel: "link" })
  ).json()) as { token: string }[];
  await (await comoPessoa(request, convidado)).rpc("claim_invite", { p_token: token });

  await entrar(page, convidado);
  await expect(page.getByRole("heading", { name: "Esperar a confirmação" })).toBeVisible();
  await expect(page.getByText(/impede a confirmação/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Criar a jornada" })).toHaveCount(0);

  await page.goto("/jornadas/nova");
  await expect(page.getByText(/esse pedido não vai poder ser confirmado/)).toBeVisible();
});
