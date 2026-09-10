import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Os pacotes do workspace publicam TypeScript cru, sem build step.
  transpilePackages: ["@repo/api", "@repo/core"],

  async headers() {
    return [
      {
        // O token do convite viaja na query string. Sem isto, ele sairia no
        // cabeçalho Referer de qualquer recurso externo que a página buscasse,
        // e de qualquer link que alguém clicasse a partir dela.
        source: "/convite",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
};

export default nextConfig;
