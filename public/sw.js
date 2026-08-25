const CACHE_NAME = "louis-peter-photography-v9";
const RUNTIME_CACHE_NAME = `${CACHE_NAME}-runtime`;
const MAX_RUNTIME_ENTRIES = 120;
const APP_SHELL = [
  "/",
  "/styles.css?v=9",
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

function isCacheableRuntimeAsset(url) {
  return (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/icons/")
  );
}

async function fetchStylesheet(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);

    if (response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    return (await cache.match(request)) || Response.error();
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

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/")));
    return;
  }

  if (url.pathname === "/styles.css") {
    event.respondWith(fetchStylesheet(request));
    return;
  }

  if (!isCacheableRuntimeAsset(url)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (!networkResponse.ok) {
          return networkResponse;
        }

        const responseClone = networkResponse.clone();
        return caches
          .open(RUNTIME_CACHE_NAME)
          .then((cache) => cache.put(request, responseClone))
          .then(() => trimRuntimeCache())
          .then(() => networkResponse)
          .catch(() => networkResponse);
      });
    })
  );
});
