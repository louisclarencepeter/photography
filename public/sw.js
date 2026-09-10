const CACHE_NAME = "louis-peter-photography-v11";
const RUNTIME_CACHE_NAME = `${CACHE_NAME}-runtime`;
const MAX_RUNTIME_ENTRIES = 120;
const APP_SHELL = [
  "/",
  "/styles.css?v=10",
  "/site.webmanifest",
  "/mark-mask.webp",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-icon-512.png",
  "/icons/apple-touch-icon.png"
];

async function trimRuntimeCache() {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const keys = await cache.keys();
  const overflow = keys.length - MAX_RUNTIME_ENTRIES;
  if (overflow <= 0) return;
  await Promise.all(keys.slice(0, overflow).map((key) => cache.delete(key)));
}

// Hashed build assets and versioned app-shell resources can use cache-first.
function isImmutableAsset(url) {
  return (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/icons/")
  );
}

async function matchCached(request) {
  try {
    return await caches.match(request);
  } catch {
    return undefined;
  }
}

// Keep development's network-first stylesheet strategy and versioned URL.
// Unavailable storage must not discard a successful network response.
async function fetchStylesheet(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      } catch {
        // A full or unavailable cache does not prevent an online CSS update.
      }
    }
    return response;
  } catch {
    return (await matchCached(request)) || Response.error();
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== RUNTIME_CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const shell = await matchCached("/");
        return shell ?? new Response("<h1>Offline</h1><p>This page isn't available offline yet.</p>", {
          status: 503,
          headers: { "content-type": "text/html; charset=utf-8" }
        });
      })
    );
    return;
  }

  if (url.pathname === "/styles.css") {
    event.respondWith(fetchStylesheet(request));
    return;
  }

  async function cacheAndTrim(response) {
    if (!response.ok) return response;
    const clone = response.clone();
    try {
      const cacheName = url.pathname === "/site.webmanifest" ? CACHE_NAME : RUNTIME_CACHE_NAME;
      const cache = await caches.open(cacheName);
      await cache.put(request, clone);
      if (cacheName === RUNTIME_CACHE_NAME) await trimRuntimeCache();
    } catch {
      // A full or unavailable cache must never break the response itself.
    }
    return response;
  }

  // The manifest can reuse its cached value while fetching the next version.
  if (url.pathname === "/site.webmanifest") {
    event.respondWith(
      matchCached(request).then((cached) => {
        const network = fetch(request).then(cacheAndTrim);
        if (!cached) return network;
        event.waitUntil(network.catch(() => {}));
        return cached;
      })
    );
    return;
  }

  if (!isImmutableAsset(url)) return;

  event.respondWith(
    matchCached(request).then((cached) => cached ?? fetch(request).then(cacheAndTrim))
  );
});
