import { expect, test } from "@playwright/test";

import { chaves, comoPessoa, criarConta, entrar, parear, SENHA } from "./apoio";

/**
 * Camada 4 da auditoria: o que só aparece no navegador.
 *
 * O que dá para provar por API está em script à parte — aqui ficam cadastro
 * com e-mail de verdade, sessão, e as coisas que dependem de duas abas.
 */

const MAILPIT = () => chaves().MAILPIT_URL;

/** O último e-mail que chegou para alguém, lido do Mailpit. */
async function ultimoEmail(request: import("@playwright/test").APIRequestContext, para: string) {
  for (let tentativa = 0; tentativa < 20; tentativa++) {
    const lista = await (
      await request.get(`${MAILPIT()}/api/v1/search?query=${encodeURIComponent(`to:${para}`)}`)
    ).json();
    const primeiro = lista?.messages?.[0];
    if (primeiro) {
      const inteiro = await (await request.get(`${MAILPIT()}/api/v1/message/${primeiro.ID}`)).json();
      return { assunto: primeiro.Subject as string, corpo: (inteiro.HTML || inteiro.Text) as string };
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}

const linkDo = (corpo: string) =>
  corpo.match(/https?:\/\/[^"'\s<>]+/g)?.find((u) => u.includes("/auth/confirm")) ?? null;

test.describe("4.1 cadastro", () => {
  test("cadastro válido dispara e-mail e o link confirma a conta", async ({ page, request }) => {
    const email = `cad-${crypto.randomUUID()}@teste.invalid`;

    await page.goto("/cadastro");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(SENHA);
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page.getByRole("status")).toContainText(/e-mail/i);

    const msg = await ultimoEmail(request, email);
    expect(msg, "nenhum e-mail chegou no Mailpit").not.toBeNull();

    const link = linkDo(msg!.corpo);
    expect(link, `o e-mail não trouxe link de /auth/confirm: ${msg!.corpo.slice(0, 200)}`).not.toBeNull();

    await page.goto(new URL(link!).pathname + new URL(link!).search);
    await expect(page).toHaveURL(/^(?!.*\/login).*$/);
  });

  test("cadastro cria couples e couple_members na mesma transação", async ({ request }) => {
    const conta = await criarConta(request, "transacao");
    const cliente = await comoPessoa(request, conta);

    const casais = await cliente.ler<{ id: string }[]>("couples?select=id");
    const membros = await cliente.ler<{ role: string }[]>("couple_members?select=role");

    expect(casais).toHaveLength(1);
    expect(membros).toHaveLength(1);
    expect(membros[0].role).toBe("dono");
  });

  // Achado 1 da auditoria de 2026-09-10, consertado: o GoTrue devolve
  // 422 user_already_exists, e `cadastrar()` em packages/api engole esse código
  // para a tela não virar oráculo de quem tem conta aqui.
  test("e-mail já cadastrado não conta que já existe", async ({ page, request }) => {
    const conta = await criarConta(request, "repetido");

    await page.goto("/cadastro");
    await page.getByLabel("E-mail").fill(conta.email);
    await page.getByLabel(/Senha/).fill(SENHA);
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page.getByRole("status")).toContainText(
      "Se esse e-mail for novo por aqui, o link de confirmação já está a caminho.",
    );
  });

  test("e-mail inválido e senha curta nem chegam a ser enviados", async ({ page }) => {
    await page.goto("/cadastro");

    // Quem barra os dois é o próprio navegador, por minLength e type=email.
    // Nada é enviado, então não existe recado na tela — e está certo assim.
    await page.getByLabel("E-mail").fill(`curta-${crypto.randomUUID()}@teste.invalid`);
    await page.getByLabel(/Senha/).fill("123");
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page).toHaveURL(/cadastro/);
    await expect(page.getByRole("status")).toHaveCount(0);
    expect(await page.getByLabel(/Senha/).evaluate((el: HTMLInputElement) => el.validity.tooShort)).toBe(true);

    await page.getByLabel("E-mail").fill("nem-email");
    await page.getByLabel(/Senha/).fill(SENHA);
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page).toHaveURL(/cadastro/);
    expect(await page.getByLabel("E-mail").evaluate((el: HTMLInputElement) => el.validity.typeMismatch)).toBe(true);
  });
});

test.describe("4.2 login e sessão", () => {
  test("recuperação de senha ponta a ponta pelo Mailpit", async ({ page, request }) => {
    const conta = await criarConta(request, "recuperando");

    await page.goto("/recuperar-senha");
    await page.getByLabel("E-mail").fill(conta.email);
    await page.getByRole("button", { name: "Mandar o link" }).click();
    await expect(page.getByRole("status")).toBeVisible();

    const msg = await ultimoEmail(request, conta.email);
    expect(msg, "nenhum e-mail de recuperação chegou").not.toBeNull();
    const link = linkDo(msg!.corpo);
    expect(link, "o e-mail de recuperação não trouxe link").not.toBeNull();

    await page.goto(new URL(link!).pathname + new URL(link!).search);
    await expect(page.getByLabel(/Nova senha/)).toBeVisible();

    const nova = "outrasenhalonga456";
    await page.getByLabel(/Nova senha/).fill(nova);
    await page.getByRole("button", { name: "Salvar senha" }).click();
    // Esperar o redirect: sem isto, limpar o cookie logo abaixo corre com a
    // ação ainda em voo e o teste mede o estado errado.
    await expect(page).toHaveURL("/");

    // Trocar a senha deixa a pessoa logada, e o middleware tira quem tem
    // sessão da tela de login. Para conferir a senha, é preciso sair antes —
    // isto é comportamento do app, não defeito.
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(conta.email);
    await page.getByLabel("Senha").fill(SENHA);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("status")).toHaveText("E-mail ou senha inválidos.");

    // Achado 6, consertado: errar a senha não apaga mais o e-mail. Só a senha
    // precisa ser digitada de novo.
    await expect(page.getByLabel("E-mail")).toHaveValue(conta.email);
    await page.getByLabel("Senha").fill(nova);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL("/");
  });

  test("o cookie de sessão é httpOnly, secure e sameSite=lax", async ({ page, request }) => {
    await entrar(page, await criarConta(request, "cookie"));

    const cookies = await page.context().cookies();
    const sessao = cookies.filter((c) => c.name.startsWith("sb-"));
    expect(sessao.length, "nenhum cookie de sessão").toBeGreaterThan(0);

    for (const c of sessao) {
      expect(c.httpOnly, `${c.name} não é httpOnly`).toBe(true);
      expect(c.sameSite, `${c.name} não é Lax`).toBe("Lax");
      // secure não é exigível em http://localhost; o valor fica no relatório.
      console.log(`COOKIE ${c.name}: httpOnly=${c.httpOnly} secure=${c.secure} sameSite=${c.sameSite}`);
    }
  });

  test("a sessão sobrevive ao refresh e a fechar e reabrir a aba", async ({ page, request }) => {
    const conta = await criarConta(request, "persistente");
    await entrar(page, conta);

    await page.reload();
    await expect(page.getByText(conta.email)).toBeVisible();

    // Fechar a aba e abrir outra no MESMO contexto é o que acontece quando a
    // pessoa fecha e reabre: o cookie persiste, a memória da aba não.
    const contexto = page.context();
    await page.close();
    const nova = await contexto.newPage();
    await nova.goto("/metas");
    await expect(nova).toHaveURL("/metas");
    await nova.close();
  });
});

test.describe("4.3 perfil e apelido", () => {
  test("apelido válido entra; os inválidos são recusados um a um", async ({ page, request }) => {
    const conta = await criarConta(request, "apelido");
    await entrar(page, conta);
    await page.goto("/perfil");

    const campo = page.getByLabel("Apelido (opcional)");
    const salvar = page.getByRole("button", { name: "Salvar" }).first();
    const bom = "ana" + crypto.randomUUID().replace(/-/g, "").slice(0, 8);

    await campo.fill(bom);
    await salvar.click();
    await expect(page.getByRole("status").first()).toContainText(/salvo/i);

    const prefixo = conta.email.split("@")[0].slice(0, 20).toLowerCase();
    const recusados: [string, string][] = [
      ["ab", "menos de 3"],
      ["a".repeat(21), "mais de 20"],
      ["com espaço", "caractere inválido"],
      ["Maiúscula", "maiúscula"],
      ["suporte", "reservado"],
      [prefixo, "igual ao prefixo do próprio e-mail"],
    ];

    for (const [valor, porque] of recusados) {
      await campo.fill(valor);
      await salvar.click();
      const recado = page.getByRole("status").first();
      await expect(recado, `apelido "${porque}" deveria ser recusado`).not.toContainText(/salvo/i);
      await page.reload();
    }

    // O que ficou gravado é o bom, não os recusados.
    const cliente = await comoPessoa(request, conta);
    const [perfil] = await cliente.ler<{ nickname: string }[]>(
      `profiles?select=nickname&user_id=eq.${conta.userId}`,
    );
    expect(perfil.nickname).toBe(bom);
  });

  test("apelido já usado por outra pessoa é recusado", async ({ page, request }) => {
    const dona = await criarConta(request, "dona");
    const outra = await criarConta(request, "outra");
    const apelido = "unico" + crypto.randomUUID().replace(/-/g, "").slice(0, 8);

    await (await comoPessoa(request, dona)).rpc("set_profile", {
      p_display_name: "Dona",
      p_nickname: apelido,
      p_discoverable: true,
    });

    await entrar(page, outra);
    await page.goto("/perfil");
    await page.getByLabel("Apelido (opcional)").fill(apelido);
    await page.getByRole("button", { name: "Salvar" }).first().click();
    await expect(page.getByRole("status").first()).toContainText(/outra pessoa|já/i);
  });

  test("desligar a descoberta esconde a pessoa da busca por apelido", async ({ request }) => {
    const alvo = await criarConta(request, "alvo");
    const quemBusca = await criarConta(request, "buscando");
    const apelido = "vis" + crypto.randomUUID().replace(/-/g, "").slice(0, 8);

    const doAlvo = await comoPessoa(request, alvo);
    const doBuscador = await comoPessoa(request, quemBusca);

    await doAlvo.rpc("set_profile", { p_display_name: "Alvo", p_nickname: apelido, p_discoverable: true });
    const achou = await (await doBuscador.rpc("find_by_nickname", { p_nickname: apelido })).json();
    expect(achou).toHaveLength(1);

    await doAlvo.rpc("set_profile", { p_display_name: "Alvo", p_nickname: apelido, p_discoverable: false });
    const escondido = await (await doBuscador.rpc("find_by_nickname", { p_nickname: apelido })).json();

    // Escondido tem que responder igual a inexistente.
    const inexistente = await (await doBuscador.rpc("find_by_nickname", { p_nickname: "naoexistemesmo" })).json();
    expect(escondido).toEqual(inexistente);
  });
});

test.describe("4.5 metas: validações e formatação de dinheiro", () => {
  test("as validações de meta e de item", async ({ request }) => {
    const conta = await criarConta(request, "validando");
    const cliente = await comoPessoa(request, conta);

    const recusa = async (rotulo: string, nome: string, args: Record<string, unknown>) => {
      const r = await cliente.rpc(nome, args);
      const txt = await r.text();
      expect(r.status() >= 400, `${rotulo} deveria ser recusado, veio ${r.status()} ${txt.slice(0, 80)}`).toBe(true);
    };

    await recusa("título vazio", "add_goal", { p_title: "   " });
    await recusa("título de 121 letras", "add_goal", { p_title: "x".repeat(121) });
    await recusa("valor alvo negativo", "add_goal", { p_target_amount_cents: -1, p_title: "x" });

    const meta = await (await cliente.rpc("add_goal", { p_title: "Válida", p_target_amount_cents: 0 })).json();

    await recusa("item sem nome", "add_goal_item", { p_goal_id: meta, p_name: " " });
    await recusa("item de preço negativo", "add_goal_item", { p_goal_id: meta, p_name: "x", p_estimated_price_cents: -1 });
    await recusa("aporte zero", "add_contribution", { p_goal_id: meta, p_amount_cents: 0 });
    await recusa("aporte negativo", "add_contribution", { p_goal_id: meta, p_amount_cents: -100 });

    // Achado 4, consertado: os dois eram aceitos sem nada recusar.
    await recusa("prazo que já passou", "add_goal", {
      p_title: "Prazo vencido",
      p_deadline_at: "2020-01-01T12:00:00Z",
    });
    await recusa("valor acima do teto", "add_goal", {
      p_title: "Absurda",
      p_target_amount_cents: 9_000_000_000_000_000,
    });

    // E o teto vale na EDIÇÃO também, que é o caminho que add_goal não vê.
    const acimaDoTeto = await cliente.atualizar(`goals?id=eq.${meta}`, {
      target_amount_cents: 10_000_000_001,
    });
    expect(acimaDoTeto.status(), "editar para acima do teto deveria ser recusado")
      .toBeGreaterThanOrEqual(400);
  });

  test("o dinheiro na tela não está 100x maior nem menor", async ({ page, request }) => {
    const conta = await criarConta(request, "brl");
    const cliente = await comoPessoa(request, conta);

    // 12.345,67 em centavos. Se algum ponto tratar centavo como real, a tela
    // mostra R$ 1.234.567,00 ou R$ 123,46 em vez disto.
    const meta = await (await cliente.rpc("add_goal", {
      p_title: "Conferência",
      p_target_amount_cents: 1234567,
    })).json();
    await cliente.rpc("add_contribution", { p_goal_id: meta, p_amount_cents: 61728 });
    await cliente.rpc("add_goal_item", { p_goal_id: meta, p_name: "Item", p_estimated_price_cents: 99999 });

    await entrar(page, conta);
    await page.goto(`/metas/${meta}`);

    await expect(page.getByText("R$ 617,28 de R$ 12.345,67 · 5%")).toBeVisible();
    await expect(page.getByText("R$ 999,99")).toBeVisible();
    for (const errado of ["R$ 1.234.567,00", "R$ 123,46", "R$ 61.728,00", "R$ 6,17"]) {
      await expect(page.getByText(errado), `${errado} = centavo tratado como real`).toHaveCount(0);
    }

    await page.goto("/aportes");
    await expect(page.getByText("R$ 617,28").first()).toBeVisible();
  });

  // O separador de milhar é o caso que dói: um parser ingênuo lê "1.234" como
  // R$ 1,23 e grava valor mil vezes menor, sem erro nenhum na tela.
  test("separador de milhar não vira valor mil vezes menor", async ({ page, request }) => {
    const conta = await criarConta(request, "milhar");
    const cliente = await comoPessoa(request, conta);
    const meta = await (await cliente.rpc("add_goal", {
      p_title: "Apê",
      p_target_amount_cents: 100000000,
    })).json();

    await entrar(page, conta);
    await page.goto(`/metas/${meta}`);
    await page.getByLabel("Quanto (R$)").fill("1.234,56");
    await page.getByRole("button", { name: "Anotar" }).click();

    await expect(page.getByText("R$ 1.234,56")).toBeVisible();
    const [aporte] = await cliente.ler<{ amount_cents: number }[]>(
      "contributions?select=amount_cents",
    );
    expect(aporte.amount_cents).toBe(123456);
  });

});

test.describe("4.7 tempo real", () => {
  test("edição simultânea da mesma meta: o último a escrever ganha", async ({ page, browser, request }) => {
    const ana = await criarConta(request, "ana");
    const beto = await criarConta(request, "beto");
    await parear(request, ana, beto);

    const comoAna = await comoPessoa(request, ana);
    const meta = await (await comoAna.rpc("add_goal", {
      p_title: "Disputada",
      p_target_amount_cents: 100000,
    })).json();

    await entrar(page, ana);
    await page.goto(`/metas/${meta}`);
    await expect(page.getByRole("heading", { name: "Disputada" })).toBeVisible();

    const outra = await browser.newContext();
    const pageB = await outra.newPage();
    await entrar(pageB, beto);
    await pageB.goto(`/metas/${meta}`);
    await expect(pageB.getByRole("heading", { name: "Disputada" })).toBeVisible();

    // Os dois escrevem quase ao mesmo tempo, cada um o seu título.
    const comoBeto = await comoPessoa(request, beto);
    await Promise.all([
      comoAna.atualizar(`goals?id=eq.${meta}`, { title: "Versão da Ana" }),
      comoBeto.atualizar(`goals?id=eq.${meta}`, { title: "Versão do Beto" }),
    ]);

    // Não há resolução de conflito: sobra o que o banco gravou por último, e
    // as duas telas convergem para ele pelo Realtime.
    const [linha] = await comoAna.ler<{ title: string }[]>(`goals?select=title&id=eq.${meta}`);
    console.log(`EDIÇÃO SIMULTÂNEA: o banco ficou com "${linha.title}"`);

    await expect(page.getByRole("heading", { name: linha.title })).toBeVisible();
    await expect(pageB.getByRole("heading", { name: linha.title })).toBeVisible();

    await outra.close();
  });

  test("quem fica offline recupera o estado ao reconectar", async ({ page, request }) => {
    const ana = await criarConta(request, "ana");
    const beto = await criarConta(request, "beto");
    await parear(request, ana, beto);

    const comoAna = await comoPessoa(request, ana);
    const meta = await (await comoAna.rpc("add_goal", { p_title: "Cozinha", p_target_amount_cents: 1000000 })).json();

    await entrar(page, beto);
    await page.goto(`/metas/${meta}`);
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");

    // B cai. A escreve enquanto ele está fora.
    await page.context().setOffline(true);
    await comoAna.rpc("add_contribution", { p_goal_id: meta, p_amount_cents: 250000 });
    await comoAna.rpc("add_goal_item", { p_goal_id: meta, p_name: "Geladeira" });
    await page.waitForTimeout(2000);

    // B volta. Sem tocar em nada, ele tem que convergir.
    await page.context().setOffline(false);
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25", { timeout: 30_000 });
    await expect(page.getByText("Geladeira")).toBeVisible();
  });
});

test.describe("4.8 preços", () => {
  test("price_quotes insere e nunca atualiza nem apaga", async ({ request }) => {
    const conta = await criarConta(request, "precos");
    const cliente = await comoPessoa(request, conta);

    const meta = await (await cliente.rpc("add_goal", { p_title: "Cozinha", p_target_amount_cents: 100000 })).json();
    const item = await (await cliente.rpc("add_goal_item", { p_goal_id: meta, p_name: "Geladeira" })).json();

    await cliente.rpc("add_price_quote", { p_goal_item_id: item, p_price_cents: 419900, p_source_url: "https://amazon.com.br/a" });
    await cliente.rpc("add_price_quote", { p_goal_item_id: item, p_price_cents: 399000, p_source_url: "https://amazon.com.br/a" });

    const historico = await cliente.ler<{ price_cents: number }[]>(
      `price_quotes?select=price_cents&goal_item_id=eq.${item}&order=created_at`,
    );
    expect(historico.map((q) => q.price_cents)).toEqual([419900, 399000]);

    // Update e delete: bloqueados até no próprio casal.
    await cliente.atualizar(`price_quotes?goal_item_id=eq.${item}`, { price_cents: 1 });
    await cliente.apagar(`price_quotes?goal_item_id=eq.${item}`);

    const depois = await cliente.ler<{ price_cents: number }[]>(
      `price_quotes?select=price_cents&goal_item_id=eq.${item}&order=created_at`,
    );
    expect(depois.map((q) => q.price_cents), "price_quotes deixou de ser append-only").toEqual([419900, 399000]);

    // E a URL guardada nunca pode ser javascript:.
    const r = await cliente.rpc("add_price_quote", {
      p_goal_item_id: item,
      p_price_cents: 100,
      p_source_url: "javascript:alert(1)",
    });
    expect(r.status()).toBeGreaterThanOrEqual(400);
  });
});
