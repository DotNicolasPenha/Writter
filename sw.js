/* Writter service worker — offline shell + Google Fonts runtime cache.
 *
 * Strategy
 *   navigation      network-first, falls back to the cached shell so the app
 *                   opens with no connection and still picks up deploys fast
 *   /css /js assets cache-first (files are unhashed; a new deploy is picked
 *                   up when this file's VERSION changes)
 *   Google Fonts    stale-while-revalidate — without it the Material Symbols
 *                   ligatures degrade to literal text ("arrow_upward")
 *                   while offline
 *
 * Updates apply on the next launch: there is deliberately no skipWaiting(),
 * so a fresh CSS file can never be paired with a stale page already open.
 */
const VERSION = "writter-v1";
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/variables.css",
  "./css/reset.css",
  "./css/sidebar.css",
  "./css/main.css",
  "./css/composer.css",
  "./css/modal.css",
  "./css/settings.css",
  "./css/responsive.css",
  "./css/text-swap.css",
  "./css/exit-animations.css",
  "./js/app.js",
  "./js/store.js",
  "./js/dom.js",
  "./js/feed.js",
  "./js/modal.js",
  "./js/sidebar.js",
  "./js/settings.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/maskable-512.png",
  "./assets/icons/apple-touch-icon-180.png",
  "./assets/icons/favicon-48.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // cache: "reload" bypasses the HTTP cache so the first install is fresh.
    await cache.addAll(SHELL.map((url) => new Request(url, { cache: "reload" })));
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith("writter-") && key !== VERSION)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(VERSION);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) await cache.put(request, fresh.clone());
    return fresh;
  } catch (err) {
    return (
      (await cache.match(request, { ignoreSearch: true })) ||
      (await caches.match("./index.html"))
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;

  const fresh = await fetch(request);
  if (fresh && fresh.ok) {
    const cache = await caches.open(VERSION);
    await cache.put(request, fresh.clone());
  }
  return fresh;
}

function staleWhileRevalidate(event) {
  const { request } = event;
  const revalidate = (async () => {
    const cache = await caches.open(VERSION);
    try {
      const fresh = await fetch(request);
      // Google serves the font CSS as an opaque no-cors response; caching it
      // is what keeps the icon font alive offline.
      if (fresh && (fresh.ok || fresh.type === "opaque")) {
        await cache.put(request, fresh.clone());
      }
    } catch (err) {
      /* offline: the cached copy is all we have */
    }
  })();

  event.waitUntil(revalidate);

  return caches
    .open(VERSION)
    .then((cache) => cache.match(request))
    .then((cached) => cached || revalidate.then(() => caches.match(request)))
    .then((found) => found || Response.error());
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.origin === self.location.origin) {
    const precached =
      url.pathname.startsWith("/css/") ||
      url.pathname.startsWith("/js/") ||
      url.pathname.startsWith("/assets/") ||
      url.pathname === "/manifest.json";
    if (precached) event.respondWith(cacheFirst(request));
    return;
  }

  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(event));
  }
});
