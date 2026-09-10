// Service worker do PWA.
//
// REGRA DE SEGURANÇA, NÃO DE PERFORMANCE: o cache guarda só o shell estático
// listado em SHELL, e só no install. Nada entra no cache em tempo de execução.
// Nenhuma resposta autenticada, nenhum dado de casal e nada vindo do Supabase
// pode ser cacheado — por isso a lista abaixo é um allowlist fechado, e não
// uma estratégia de caching com exceções.

const CACHE = "shell-v1";
const OFFLINE = "/offline";
const SHELL = [
  OFFLINE,
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomes) =>
        Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Navegação: sempre rede. Só se ela falhar é que servimos a tela offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(async () => (await caches.match(OFFLINE)) ?? Response.error()),
    );
    return;
  }

  // Fora navegação, só respondemos o que está no allowlist. Todo o resto
  // (chunks do Next, RSC, Supabase) passa direto, sem tocar no cache.
  const url = new URL(req.url);
  if (url.origin === self.location.origin && SHELL.includes(url.pathname)) {
    event.respondWith(caches.match(req).then((hit) => hit ?? fetch(req)));
  }
});
