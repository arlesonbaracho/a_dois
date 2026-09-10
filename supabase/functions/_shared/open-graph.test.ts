import { describe, expect, it } from "vitest";

import {
  extrairOpenGraph,
  LIMITE_TITULO,
  precoParaCentavos,
  sanitizarTexto,
} from "./open-graph.ts";

const base = new URL("https://amazon.com.br/dp/1");

const pagina = (metas: string) => `<!doctype html><html><head>${metas}</head><body>x</body></html>`;

describe("precoParaCentavos", () => {
  it("lê o jeito brasileiro de escrever dinheiro", () => {
    expect(precoParaCentavos("1.234,56")).toBe(123456);
    expect(precoParaCentavos("R$ 4.200,00")).toBe(420000);
    expect(precoParaCentavos("0,01")).toBe(1);
    expect(precoParaCentavos("R$ 99,90")).toBe(9990);
  });

  it("lê o jeito de fora também, porque muita loja publica assim", () => {
    expect(precoParaCentavos("1234.56")).toBe(123456);
    expect(precoParaCentavos("1,234.56")).toBe(123456);
    expect(precoParaCentavos("99.90")).toBe(9990);
  });

  // O caso que separa milhar de decimal: três casas depois do ponto não é
  // fração de real, é separador de milhar.
  it("não confunde separador de milhar com centavos", () => {
    expect(precoParaCentavos("1.234")).toBe(123400);
    expect(precoParaCentavos("1234")).toBe(123400);
    expect(precoParaCentavos("12.345.678")).toBe(1234567800);
  });

  it("devolve null quando não há número nenhum", () => {
    expect(precoParaCentavos("")).toBeNull();
    expect(precoParaCentavos("sob consulta")).toBeNull();
    expect(precoParaCentavos("R$")).toBeNull();
  });

  it("nunca devolve fração de centavo", () => {
    for (const texto of ["1.234,56", "0,01", "1234", "9.999.999,99", "1,5"]) {
      const centavos = precoParaCentavos(texto);
      expect(Number.isInteger(centavos), texto).toBe(true);
    }
  });
});

describe("sanitizarTexto", () => {
  it("tira qualquer marcação", () => {
    expect(sanitizarTexto('<script>alert("oi")</script>Geladeira', 200)).toBe('alert("oi") Geladeira');
    expect(sanitizarTexto("<b>Geladeira</b>", 200)).toBe("Geladeira");
  });

  // A ordem importa: decodificar depois de tirar a marcação deixaria isto
  // sair como <script> inteiro.
  it("decodifica entidades antes de tirar a marcação, não depois", () => {
    expect(sanitizarTexto("&lt;script&gt;mal&lt;/script&gt;", 200)).toBe("mal");
    expect(sanitizarTexto("&#60;img onerror=x&#62;", 200)).toBe("");
    expect(sanitizarTexto("&#x3c;b&#x3e;oi&#x3c;/b&#x3e;", 200)).toBe("oi");
  });

  it("mantém acento e o & de verdade", () => {
    expect(sanitizarTexto("Ar-condicionado 12.000 BTUs &amp; suporte", 200)).toBe(
      "Ar-condicionado 12.000 BTUs & suporte",
    );
  });

  it("colapsa espaço, tira caractere de controle e corta no limite", () => {
    expect(sanitizarTexto("  muito \n\t espaço  ", 200)).toBe("muito espaço");
    expect(sanitizarTexto("a\u0007b\u0000c", 200)).toBe("a b c");
    expect(sanitizarTexto("a".repeat(500), 200)).toHaveLength(200);
  });
});

describe("extrairOpenGraph", () => {
  it("lê título, imagem e preço", () => {
    const produto = extrairOpenGraph(
      pagina(`
        <meta property="og:title" content="Geladeira Frost Free 400L" />
        <meta property="og:image" content="https://m.media-amazon.com/i/1.jpg" />
        <meta property="og:price:amount" content="4.199,00" />
      `),
      base,
    );

    expect(produto).toEqual({
      titulo: "Geladeira Frost Free 400L",
      imagem: "https://m.media-amazon.com/i/1.jpg",
      precoCents: 419900,
    });
  });

  it("aceita aspas simples, sem aspas, e ordem trocada dos atributos", () => {
    const produto = extrairOpenGraph(
      pagina(`
        <meta content='Fogão 5 bocas' property='og:title'>
        <meta content=https://cdn.loja.test/f.jpg property=og:image>
        <meta property="product:price:amount" content="1899.90">
      `),
      base,
    );

    expect(produto.titulo).toBe("Fogão 5 bocas");
    expect(produto.imagem).toBe("https://cdn.loja.test/f.jpg");
    expect(produto.precoCents).toBe(189990);
  });

  it("o que falta vira null, e nunca erro", () => {
    expect(extrairOpenGraph(pagina(""), base)).toEqual({
      titulo: null,
      imagem: null,
      precoCents: null,
    });
    expect(extrairOpenGraph("isto não é html", base).titulo).toBeNull();
    expect(extrairOpenGraph("<meta property=og:title>", base).titulo).toBeNull();
  });

  it("sanitiza o que veio de fora", () => {
    const produto = extrairOpenGraph(
      pagina(`<meta property="og:title" content="&lt;img src=x onerror=roubar()&gt;Geladeira">`),
      base,
    );
    expect(produto.titulo).toBe("Geladeira");
  });

  it("corta título gigante no limite", () => {
    const produto = extrairOpenGraph(
      pagina(`<meta property="og:title" content="${"x".repeat(1000)}">`),
      base,
    );
    expect(produto.titulo).toHaveLength(LIMITE_TITULO);
  });

  // A imagem vai virar src numa tela nossa. Quem escolhe o endereço é o site
  // de terceiro, então ela passa por peneira própria.
  it("recusa imagem que não seja https em nome de verdade", () => {
    const recusadas = [
      "http://cdn.loja.test/f.jpg", // sem TLS
      "https://127.0.0.1/f.jpg", // IP cru
      "https://[::1]/f.jpg",
      "https://169.254.169.254/f.jpg",
      "javascript:alert(1)",
      "https://user:senha@cdn.loja.test/f.jpg",
    ];

    for (const src of recusadas) {
      const produto = extrairOpenGraph(
        pagina(`<meta property="og:image" content="${src}">`),
        base,
      );
      expect(produto.imagem, src).toBeNull();
    }
  });

  it("resolve imagem relativa contra a página que foi lida", () => {
    const produto = extrairOpenGraph(pagina(`<meta property="og:image" content="/i/2.jpg">`), base);
    expect(produto.imagem).toBe("https://amazon.com.br/i/2.jpg");
  });

  it("a primeira ocorrência ganha, quando a página repete a tag", () => {
    const produto = extrairOpenGraph(
      pagina(`
        <meta property="og:title" content="O verdadeiro">
        <meta property="og:title" content="O impostor">
      `),
      base,
    );
    expect(produto.titulo).toBe("O verdadeiro");
  });
});
