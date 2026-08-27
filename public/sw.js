const CACHE_NAME = "louis-peter-photography-v9";
const RUNTIME_CACHE_NAME = `${CACHE_NAME}-runtime`;
const MAX_RUNTIME_ENTRIES = 120;
const APP_SHELL = [
  "/",
  "/styles.css",
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

// Hashed or genuinely immutable: the URL changes when the bytes change, so
// serving from cache forever is always correct.
function isImmutableAsset(url) {
  return (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/icons/")
  );
}

// Same URL, new bytes on every deploy. Cache-first would pin visitors to
// whatever stylesheet they first downloaded until CACHE_NAME changed, so these
// are served from cache and refreshed in the background instead.
function isRevalidatedAsset(url) {
  return url.pathname === "/styles.css" || url.pathname === "/site.webmanifest";
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

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const shell = await caches.match("/");
        // respondWith(undefined) surfaces as a network error, so never hand back
        // an empty match when the shell isn't cached either.
        return (
          shell ??
          new Response("<h1>Offline</h1><p>This page isn't available offline yet.</p>", {
            status: 503,
            headers: { "content-type": "text/html; charset=utf-8" }
          })
        );
      })
    );
    return;
  }

  async function cacheAndTrim(response) {
    if (!response.ok) return response;

    const clone = response.clone();
    try {
      const cache = await caches.open(RUNTIME_CACHE_NAME);
      await cache.put(request, clone);
      await trimRuntimeCache();
    } catch {
      // A full or unavailable cache must never break the response itself.
    }
    return response;
  }

  if (isRevalidatedAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request).then(cacheAndTrim);
        if (!cached) return network;

        // Stale-while-revalidate: instant paint from cache, fresh bytes next load.
        event.waitUntil(network.catch(() => {}));
        return cached;
      })
    );
    return;
  }

  if (!isImmutableAsset(url)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request).then(cacheAndTrim))
  );
});
