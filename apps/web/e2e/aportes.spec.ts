import { expect, test } from "@playwright/test";

import { comoPessoa, criarConta, entrar, parear } from "./apoio";

test.describe("aportes e divisão", () => {
  // R$ 1.500,01 entre duas pessoas divide mal de propósito: é o caso em que um
  // centavo se perde ou se inventa se a conta estiver errada. A soma das duas
  // partes tem que ser exatamente o total, nos três modos.
  test("um total que divide mal fecha exato nos três modos", async ({ page, request }) => {
    const ana = await criarConta(request, "ana");
    const beto = await criarConta(request, "beto");
    await parear(request, ana, beto);

    const comoAna = await comoPessoa(request, ana);
    const meta = await (await comoAna.rpc("add_goal", {
      p_title: "Entrada do apê",
      p_target_amount_cents: 12000000,
    })).json();
    await comoAna.rpc("add_contribution", { p_goal_id: meta, p_amount_cents: 150001 });

    await entrar(page, ana);
    await page.goto("/aportes");

    const saldo = page.getByRole("heading", { name: "Quanto vocês já juntaram" }).locator("..");
    await expect(saldo).toContainText("R$ 1.500,01");

    // Meio a meio: 750,01 + 750,00. O centavo ímpar tem dono.
    await expect(saldo).toContainText("R$ 1.500,01 · cabia R$ 750,01");
    await expect(saldo).toContainText("R$ 0,00 · cabia R$ 750,00");
    await expect(saldo).toContainText("Você colocou R$ 750,00 a mais até agora.");

    // Pela renda: 15 para 7, sobre o mesmo total.
    await page.getByLabel("Sua faixa de renda (opcional)").selectOption("de_5_a_10_sm");
    await page.getByRole("button", { name: "Salvar" }).click();

    // O Beto precisa de faixa TAMBÉM: consentir sem ter faixa não abre o modo,
    // porque o que falta continua faltando. Ele faz isso do aparelho dele.
    const comoBeto = await comoPessoa(request, beto);
    await comoBeto.atualizar(`couple_members?user_id=eq.${beto.userId}`, {
      income_band: "de_2_a_5_sm",
    });

    await page.reload();
    await page.getByRole("radio", { name: "Pela renda de cada um" }).check();
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(saldo).toContainText("cabia R$ 1.022,73");
    await expect(saldo).toContainText("cabia R$ 477,28");

    // Por valor combinado: 800 para 500.
    await page.getByLabel("Quanto você combina de colocar (R$, opcional)").fill("800");
    await page.getByRole("button", { name: "Salvar" }).click();
    await comoBeto.atualizar(`couple_members?user_id=eq.${beto.userId}`, {
      fixed_share_cents: 50000,
    });
    await page.reload();
    await page.getByRole("radio", { name: "Um valor combinado" }).check();
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(saldo).toContainText("cabia R$ 923,08");
    await expect(saldo).toContainText("cabia R$ 576,93");
  });

  test("aporte registrado na tela de saldo aparece na meta", async ({ page, request }) => {
    const ana = await criarConta(request, "aporte");
    await entrar(page, ana);

    const comoAna = await comoPessoa(request, ana);
    const meta = await (await comoAna.rpc("add_goal", {
      p_title: "Viagem",
      p_target_amount_cents: 500000,
    })).json();

    await page.goto("/aportes");

    // Ponto, e não vírgula: o campo é <input type="number">, e o Chromium
    // simplesmente RECUSA a vírgula ali dentro. paraCentavos sabe ler vírgula,
    // mas o campo não deixa ela chegar — quem digita "1250,50", que é como se
    // escreve dinheiro em português, não consegue. Está em Dívidas.
    await page.getByLabel("Quanto (R$)").fill("1250.50");
    await page.getByRole("button", { name: "Anotar" }).click();

    await expect(page.getByText("Anotado. Bom trabalho, vocês dois.")).toBeVisible();

    // Reais viram centavo inteiro na borda: 1250,50 é 125050, não 1250.
    const [aporte] = await comoAna.ler<{ amount_cents: number }[]>(
      "contributions?select=amount_cents",
    );
    expect(aporte.amount_cents).toBe(125050);

    await page.goto(`/metas/${meta}`);
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
  });

  // A faixa de renda é opcional. Sem ela, o modo some com uma frase — nunca
  // com uma tela de erro.
  test("sem faixa de renda, o modo proporcional fica indisponível e explicado", async ({
    page,
    request,
  }) => {
    const ana = await criarConta(request, "ana");
    const beto = await criarConta(request, "beto");
    await parear(request, ana, beto);

    await entrar(page, ana);
    await page.goto("/aportes");

    const proporcional = page.getByRole("radio", { name: "Pela renda de cada um" });
    await expect(proporcional).toBeDisabled();
    await expect(page.getByText(/precisa escolher uma faixa de renda/)).toBeVisible();

    // Nada de erro na tela: o resto continua funcionando.
    await expect(page.getByRole("radio", { name: "Meio a meio" })).toBeEnabled();
    await expect(page.getByText(/erro/i)).toHaveCount(0);
  });

  // Revogar o consentimento não pode quebrar nada: cai no mesmo caminho de
  // quem nunca informou a faixa.
  test("revogar o uso da faixa desliga o proporcional sem quebrar a tela", async ({
    page,
    request,
  }) => {
    const ana = await criarConta(request, "ana");
    const beto = await criarConta(request, "beto");
    await parear(request, ana, beto);

    for (const conta of [ana, beto]) {
      const cliente = await comoPessoa(request, conta);
      await cliente.rpc("set_consent", { p_tipo: "income_band", p_aceito: true });
    }

    const comoAna = await comoPessoa(request, ana);
    await comoAna.rpc("add_goal", { p_title: "Viagem", p_target_amount_cents: 500000 });

    await entrar(page, ana);
    await page.goto("/aportes");
    await page.getByLabel("Sua faixa de renda (opcional)").selectOption("de_5_a_10_sm");
    await page.getByRole("button", { name: "Salvar" }).click();
    await page.reload();

    await expect(page.getByRole("radio", { name: "Pela renda de cada um" })).toBeDisabled();

    // O Beto escolhe a faixa dele, e o modo abre para os dois.
    const comoBeto = await comoPessoa(request, beto);
    await comoBeto.atualizar(`couple_members?user_id=eq.${beto.userId}`, {
      income_band: "de_2_a_5_sm",
    });
    await page.reload();
    await expect(page.getByRole("radio", { name: "Pela renda de cada um" })).toBeEnabled();

    // Agora a Ana revoga o próprio consentimento, pelo perfil.
    await page.goto("/perfil");
    const caixaDaFaixa = page.getByRole("checkbox", {
      name: "Usar minha faixa de renda no cálculo",
    });
    // Esperar o perfil chegar antes de clicar: durante o carregamento a caixa
    // fica desabilitada de propósito, e clicar cedo concederia em vez de
    // revogar. O Playwright espera por "enabled" sozinho, e é essa espera que
    // este teste também exercita.
    await expect(caixaDaFaixa).toBeChecked();
    await caixaDaFaixa.click();

    // O estado da própria caixa, e não o texto "Você não disse sim." — esse
    // aparece três vezes na tela, e a asserção passaria sem a revogação ter
    // acontecido. Abaixo, a prova no banco.
    await expect(caixaDaFaixa).not.toBeChecked();

    // Filtrado pelo user_id: a policy de profiles alcança TAMBÉM o perfil de
    // quem divide o casal, então sem o filtro a primeira linha pode ser a do
    // Beto e a asserção olharia a pessoa errada.
    const [perfil] = await comoAna.ler<{ consent_income_band_at: string | null }[]>(
      `profiles?select=consent_income_band_at&user_id=eq.${ana.userId}`,
    );
    expect(perfil.consent_income_band_at).toBeNull();

    await page.goto("/aportes");
    await expect(page.getByRole("radio", { name: "Pela renda de cada um" })).toBeDisabled();
    await expect(page.getByText(/deixar o uso dela ligado no perfil/)).toBeVisible();
    await expect(page.getByText(/erro/i)).toHaveCount(0);
    await expect(page.getByText("NaN")).toHaveCount(0);
  });
});
