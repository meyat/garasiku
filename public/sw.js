const CACHE_NAME = "garasiku-v1";
const APP_SHELL = [
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/offline",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {
      // Don't fail install if one asset isn't reachable yet (e.g. first deploy)
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Strategy:
// - Navigation requests (HTML pages): network-first, fall back to cached "/offline" page.
//   GarasiKu is data-driven (Supabase), so pages need fresh data whenever possible —
//   we don't want to show stale vehicle/service data from cache while online.
// - Static assets (icons, manifest): cache-first, since they rarely change.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept API routes or Supabase calls — those must always hit the network.
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline").then((res) => res ?? caches.match("/"))
      )
    );
    return;
  }

  if (url.pathname.startsWith("/icons/") || url.pathname === "/manifest.json") {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request))
    );
  }
});
