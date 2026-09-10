import { describe, expect, it, vi } from "vitest";

import {
  ALLOWLIST_PADRAO,
  assertSafeUrl,
  buscarComGuard,
  ipReservado,
  UrlRecusada,
} from "./ssrf-guard";

/** Resolvedor de mentira: todo nome cai nos IPs que o teste mandar. */
const resolvendoPara = (...ips: string[]) => () => Promise.resolve(ips);

/** O caminho feliz: nome da allowlist que resolve para IP público. */
const ok = { resolver: resolvendoPara("13.35.0.1") };

async function motivoDe(promessa: Promise<unknown>): Promise<string> {
  try {
    await promessa;
    return "passou";
  } catch (erro) {
    return erro instanceof UrlRecusada ? erro.motivo : `erro inesperado: ${String(erro)}`;
  }
}

describe("ipReservado", () => {
  it("recusa os blocos que o pedido nomeia", () => {
    for (const ip of [
      "127.0.0.1",
      "127.255.255.254",
      "10.0.0.1",
      "10.255.255.255",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.0.1",
      "192.168.255.255",
      "169.254.169.254",
      "::1",
      "fc00::1",
      "fdff::1",
    ]) {
      expect(ipReservado(ip), ip).toBe(true);
    }
  });

  it("recusa também o que estava implícito", () => {
    for (const ip of [
      "0.0.0.0",
      "100.64.0.1", // CGNAT
      "224.0.0.1", // multicast
      "255.255.255.255",
      "::", // não especificado
      "fe80::1", // link-local
      "ff02::1", // multicast v6
    ]) {
      expect(ipReservado(ip), ip).toBe(true);
    }
  });

  // Sem isto, o endereço mais perigoso da lista entra vestido de IPv6.
  it("desembrulha ::ffff:a.b.c.d antes de julgar", () => {
    expect(ipReservado("::ffff:127.0.0.1")).toBe(true);
    expect(ipReservado("::ffff:169.254.169.254")).toBe(true);
    expect(ipReservado("::ffff:13.35.0.1")).toBe(false);
  });

  it("deixa passar endereço público, com a máscara na borda certa", () => {
    // 172.16/12 vai até 172.31.255.255. 172.32 é internet.
    expect(ipReservado("172.32.0.1")).toBe(false);
    expect(ipReservado("172.15.255.255")).toBe(false);
    expect(ipReservado("11.0.0.1")).toBe(false);
    expect(ipReservado("100.63.255.255")).toBe(false);
    expect(ipReservado("8.8.8.8")).toBe(false);
    expect(ipReservado("2600::1")).toBe(false);
  });

  // Falha fechada: o que não dá para ler não pode ser tratado como público.
  it("recusa o que não consegue classificar", () => {
    for (const lixo of ["", "abc", "1.2.3", "1.2.3.4.5", "999.1.1.1", "010.0.0.1", "::gggg"]) {
      expect(ipReservado(lixo), lixo).toBe(true);
    }
  });
});

describe("assertSafeUrl: protocolo", () => {
  it("recusa tudo que não é http nem https", async () => {
    for (const url of [
      "file:///etc/passwd",
      "ftp://amazon.com.br/x",
      "gopher://amazon.com.br/x",
      "data:text/html,<b>oi</b>",
    ]) {
      expect(await motivoDe(assertSafeUrl(url, ok)), url).toBe("protocolo");
    }
    expect(await motivoDe(assertSafeUrl("nem url é", ok))).toBe("protocolo");
  });

  it("aceita http e https", async () => {
    await expect(assertSafeUrl("https://amazon.com.br/dp/123", ok)).resolves.toBeInstanceOf(URL);
    await expect(assertSafeUrl("http://amazon.com.br/dp/123", ok)).resolves.toBeInstanceOf(URL);
  });
});

describe("assertSafeUrl: allowlist", () => {
  it("recusa domínio de fora", async () => {
    expect(await motivoDe(assertSafeUrl("https://malvado.com/x", ok))).toBe("dominio");
  });

  it("aceita os quatro do padrão e os subdomínios deles", async () => {
    for (const dominio of ALLOWLIST_PADRAO) {
      await expect(assertSafeUrl(`https://${dominio}/x`, ok)).resolves.toBeInstanceOf(URL);
      await expect(assertSafeUrl(`https://produto.${dominio}/x`, ok)).resolves.toBeInstanceOf(URL);
    }
  });

  // Comparar por sufixo de texto em vez de por rótulo deixaria isto passar.
  it("recusa o domínio permitido usado como prefixo de outro", async () => {
    for (const host of [
      "amazon.com.br.malvado.com",
      "malvado-amazon.com.br", // não é subdomínio: falta o ponto
      "notamazon.com.br",
    ]) {
      expect(await motivoDe(assertSafeUrl(`https://${host}/x`, ok)), host).toBe("dominio");
    }
  });

  it("recusa credencial embutida, que troca o host debaixo do olho", async () => {
    expect(await motivoDe(assertSafeUrl("https://amazon.com.br@malvado.com/x", ok))).toBe(
      "credencial",
    );
  });

  it("aceita allowlist trocada, porque ela é configurável", async () => {
    const opcoes = { allowlist: ["shopee.com.br"], resolver: resolvendoPara("13.35.0.1") };
    await expect(assertSafeUrl("https://shopee.com.br/x", opcoes)).resolves.toBeInstanceOf(URL);
    expect(await motivoDe(assertSafeUrl("https://amazon.com.br/x", opcoes))).toBe("dominio");
  });
});

describe("assertSafeUrl: rede", () => {
  // O ponto do arquivo inteiro: o nome é público, o IP é interno.
  it("recusa nome da allowlist que resolve para rede interna", async () => {
    for (const ip of [
      "127.0.0.1",
      "10.0.0.1",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254",
      "::1",
      "fc00::1",
      "::ffff:127.0.0.1",
    ]) {
      const motivo = await motivoDe(
        assertSafeUrl("https://amazon.com.br/x", { resolver: resolvendoPara(ip) }),
      );
      expect(motivo, ip).toBe("rede_interna");
    }
  });

  it("recusa quando UM dos IPs do nome é interno", async () => {
    expect(
      await motivoDe(
        assertSafeUrl("https://amazon.com.br/x", {
          resolver: resolvendoPara("13.35.0.1", "127.0.0.1"),
        }),
      ),
    ).toBe("rede_interna");
  });

  it("recusa nome que não resolve para nada", async () => {
    expect(await motivoDe(assertSafeUrl("https://amazon.com.br/x", { resolver: resolvendoPara() }))).toBe(
      "dns",
    );
  });

  // O endereço de metadata da nuvem, escrito como o pedido pede. Recusado duas
  // vezes: pela allowlist, e — se alguém um dia afrouxar a allowlist — pelo IP.
  it("recusa http://169.254.169.254/latest/meta-data/", async () => {
    const url = "http://169.254.169.254/latest/meta-data/";
    expect(await motivoDe(assertSafeUrl(url, ok))).toBe("dominio");

    const resolver = vi.fn(resolvendoPara("13.35.0.1"));
    expect(await motivoDe(assertSafeUrl(url, { allowlist: ["169.254.169.254"], resolver }))).toBe(
      "rede_interna",
    );
    // IP literal não passa por DNS: ele já é a resposta, e mentir no
    // resolvedor não muda nada.
    expect(resolver).not.toHaveBeenCalled();
  });
});

describe("buscarComGuard", () => {
  const pagina = (html: string) => new Response(html, { status: 200 });
  const redirect = (para: string) =>
    new Response(null, { status: 302, headers: { location: para } });

  it("busca e devolve o HTML quando tudo passa", async () => {
    const fetchFalso = vi.fn(async () => pagina("<title>ok</title>"));
    const { html, url } = await buscarComGuard("https://amazon.com.br/dp/1", {
      ...ok,
      fetch: fetchFalso,
    });

    expect(html).toBe("<title>ok</title>");
    expect(url.hostname).toBe("amazon.com.br");
  });

  // Nada de identificação nossa vai junto: nem cookie, nem referer, nem quem
  // perguntou, nem para qual meta.
  it("não manda nada do usuário para o destino", async () => {
    const fetchFalso = vi.fn<typeof globalThis.fetch>(async () => pagina("<title>ok</title>"));
    await buscarComGuard("https://amazon.com.br/dp/1", { ...ok, fetch: fetchFalso });

    const opcoes = fetchFalso.mock.calls[0][1] ?? {};
    // "manual" é o que obriga o redirect a voltar pelo guard. Trocar por
    // "follow" faria o fetch seguir sozinho, e a revalidação de cada salto
    // viraria decoração — sem nada quebrando em teste nenhum.
    expect(opcoes.redirect).toBe("manual");
    expect(opcoes.credentials).toBe("omit");
    expect(opcoes.referrerPolicy).toBe("no-referrer");
    const cabecalhos = Object.keys(opcoes.headers as Record<string, string>).map((h) =>
      h.toLowerCase(),
    );
    expect(cabecalhos).toEqual(["accept", "accept-language", "user-agent"]);
  });

  // Conferir só a primeira URL seria conferir no lugar errado.
  it("recusa redirect que aponta para rede interna", async () => {
    const fetchFalso = vi.fn(async () => redirect("http://amazon.com.br/interno"));
    const resolver = vi
      .fn<(host: string) => Promise<string[]>>()
      .mockResolvedValueOnce(["13.35.0.1"])
      .mockResolvedValue(["10.0.0.1"]);

    const motivo = await motivoDe(
      buscarComGuard("https://amazon.com.br/dp/1", { resolver, fetch: fetchFalso }),
    );

    expect(motivo).toBe("rede_interna");
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });

  it("recusa redirect que sai da allowlist", async () => {
    const fetchFalso = vi.fn(async () => redirect("https://malvado.com/x"));
    expect(
      await motivoDe(buscarComGuard("https://amazon.com.br/dp/1", { ...ok, fetch: fetchFalso })),
    ).toBe("dominio");
  });

  it("segue até três redirects e desiste no quarto", async () => {
    const emCirculo = vi.fn(async () => redirect("https://amazon.com.br/de-novo"));
    expect(
      await motivoDe(buscarComGuard("https://amazon.com.br/dp/1", { ...ok, fetch: emCirculo })),
    ).toBe("redirects");
    // Quatro requisições: a original mais três saltos.
    expect(emCirculo).toHaveBeenCalledTimes(4);

    let restantes = 3;
    const fetchFalso = vi.fn(async () =>
      restantes-- > 0 ? redirect("https://amazon.com.br/mais-um") : pagina("<title>chegou</title>"),
    );
    const { html } = await buscarComGuard("https://amazon.com.br/dp/1", {
      ...ok,
      fetch: fetchFalso,
    });
    expect(html).toBe("<title>chegou</title>");
  });

  it("corta a resposta em 2 MB", async () => {
    const gigante = "a".repeat(3 * 1024 * 1024);
    const fetchFalso = vi.fn(async () => pagina(gigante));

    const { html } = await buscarComGuard("https://amazon.com.br/dp/1", {
      ...ok,
      fetch: fetchFalso,
    });

    expect(html.length).toBe(2 * 1024 * 1024);
  });

  it("respeita o limite de bytes que quem chama definir", async () => {
    const fetchFalso = vi.fn(async () => pagina("a".repeat(5000)));
    const { html } = await buscarComGuard("https://amazon.com.br/dp/1", {
      ...ok,
      fetch: fetchFalso,
      maxBytes: 100,
    });
    expect(html.length).toBe(100);
  });

  it("desiste quando o relógio estoura", async () => {
    const lento = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_, rejeita) => {
          init?.signal?.addEventListener("abort", () => rejeita(new Error("abortado")));
        }),
    );

    await expect(
      buscarComGuard("https://amazon.com.br/dp/1", { ...ok, fetch: lento, timeoutMs: 60 }),
    ).rejects.toThrow("abortado");
  });
});
