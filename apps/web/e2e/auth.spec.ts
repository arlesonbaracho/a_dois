import { expect, test } from "@playwright/test";

import { criarConta, entrar, SENHA } from "./apoio";

test.describe("autenticação", () => {
  // A tela de login não pode virar oráculo de quem tem conta aqui. As três
  // falhas têm que ser indistinguíveis — inclusive no tempo de resposta, mas
  // isso já é outro teste.
  test("errar a senha, o e-mail e o formato dá sempre a mesma frase", async ({ page, request }) => {
    const conta = await criarConta(request, "oraculo");

    const tentar = async (email: string, senha: string) => {
      await page.goto("/login");
      await page.getByLabel("E-mail").fill(email);
      await page.getByLabel("Senha").fill(senha);
      await page.getByRole("button", { name: "Entrar" }).click();
      return page.getByRole("status").textContent();
    };

    const senhaErrada = await tentar(conta.email, "senhaerradamesmo123");
    const emailInexistente = await tentar("ninguem-aqui@teste.invalid", SENHA);
    const emailMalformado = await tentar("nem-email@teste.invalid", "curta");

    expect(senhaErrada).toBe("E-mail ou senha inválidos.");
    expect(emailInexistente).toBe(senhaErrada);
    expect(emailMalformado).toBe(senhaErrada);
  });

  test("entrar leva para a home", async ({ page, request }) => {
    await entrar(page, await criarConta(request, "entrando"));

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Nossa jornada" })).toBeVisible();

    // Conta nova cai nos primeiros passos, e o primeiro deles é chamar quem
    // divide o plano. É a lista no lugar de um gate: a home abre, e a pessoa
    // escolhe a hora de convidar.
    await expect(page.getByRole("heading", { name: "Comecem por aqui" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Chamar quem divide o plano/ }),
    ).toBeVisible();
  });

  // O middleware protege por negação padrão: rota que ele não conhece como
  // pública exige sessão. E guarda para onde a pessoa ia.
  test("rota protegida manda para o login e devolve depois", async ({ page, request }) => {
    await page.goto("/jornadas");
    await expect(page).toHaveURL(/\/login\?proxima=%2Fjornadas/);

    const conta = await criarConta(request, "voltando");
    await page.getByLabel("E-mail").fill(conta.email);
    await page.getByLabel("Senha").fill(conta.senha);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL("/jornadas");
  });

  // "//site-falso" é caminho para o navegador e outro domínio para o usuário.
  // Sem a peneira, o login vira redirect aberto com a nossa cara.
  test("proxima para fora do app cai na home", async ({ page, request }) => {
    const conta = await criarConta(request, "redirect");

    for (const destino of ["//site-falso.test/x", "https://site-falso.test/x"]) {
      // A volta do laço precisa começar deslogada, senão a segunda tentativa
      // nem chega a ver o formulário.
      await page.context().clearCookies();
      await page.goto(`/login?proxima=${encodeURIComponent(destino)}`);
      await page.getByLabel("E-mail").fill(conta.email);
      await page.getByLabel("Senha").fill(conta.senha);
      await page.getByRole("button", { name: "Entrar" }).click();

      await expect(page).toHaveURL("/");
    }
  });

  // Regra 9. O cookie é httpOnly, então nem o nosso próprio JavaScript o lê —
  // e nada de token em localStorage. Se um dia alguém trocar o cliente do
  // browser por um que persiste sessão, é aqui que estoura.
  test("a sessão não aparece em document.cookie nem em localStorage", async ({ page, request }) => {
    await entrar(page, await criarConta(request, "cookie"));

    const vazamento = await page.evaluate(() => ({
      cookie: document.cookie,
      local: JSON.stringify(localStorage),
      session: JSON.stringify(sessionStorage),
    }));

    expect(vazamento.cookie).not.toContain("auth-token");
    expect(vazamento.cookie).not.toContain("sb-");
    expect(vazamento.local).not.toContain("access_token");
    expect(vazamento.local).not.toContain("refresh_token");
    expect(vazamento.session).not.toContain("access_token");
  });

  test("sair derruba a sessão de verdade", async ({ page, request }) => {
    await entrar(page, await criarConta(request, "saindo"));

    // Sair mora no perfil desde o visual novo: a home não tem mais lugar para
    // ele, e é para o perfil que o disco de iniciais do cabeçalho leva.
    await page.goto("/perfil");
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/login/);

    // Voltar para uma rota protegida não pode reaproveitar nada.
    await page.goto("/jornadas");
    await expect(page).toHaveURL(/\/login/);
  });

  // O nome dito no cadastro viaja no raw_user_meta_data e é a trigger
  // on_auth_user_created que o grava — set_profile não serviria, porque exige
  // sessão e não há sessão logo depois do cadastro.
  test("o nome dito no cadastro aparece na saudação", async ({ page, request }) => {
    await entrar(page, await criarConta(request, "comnome", "Lia"));
    await expect(page.getByText("oi, Lia")).toBeVisible();
  });

  test("sem nome, a saudação continua falando com os dois", async ({ page, request }) => {
    await entrar(page, await criarConta(request, "semnome"));
    await expect(page.getByText("oi, vocês")).toBeVisible();
  });
});
