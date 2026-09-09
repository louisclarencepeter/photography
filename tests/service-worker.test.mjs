import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { test } from "node:test";

const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const origin = "https://photography.invalid";

function createWorker() {
  const listeners = new Map();
  const stores = new Map();
  const fetches = [];
  const installed = [];
  const state = { failWrites: false, network: async () => new Response("network bytes") };
  const key = (request) => new URL(typeof request === "string" ? request : request.url, origin).href;
  const fetch = async (request) => {
    fetches.push(key(request));
    return state.network(request);
  };
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async match(request) { return store.get(key(request))?.clone(); },
        async put(request, response) {
          if (state.failWrites) throw new Error("Storage quota exhausted");
          store.set(key(request), response.clone());
        },
        async keys() { return Array.from(store.keys()); },
        async delete(request) { return store.delete(key(request)); },
        async addAll(paths) {
          for (const path of paths) {
            installed.push(path);
            store.set(key(path), (await fetch(path)).clone());
          }
        },
      };
    },
    async match(request) {
      for (const store of stores.values()) {
        if (store.has(key(request))) return store.get(key(request)).clone();
      }
    },
    async keys() { return Array.from(stores.keys()); },
    async delete(name) { return stores.delete(name); },
  };
  vm.runInNewContext(source, {
    self: { location: { origin }, addEventListener: (type, callback) => listeners.set(type, callback),
      skipWaiting: async () => {}, clients: { claim: async () => {} } },
    caches, fetch, URL, Response,
  });
  const dispatch = async (type, request) => {
    let response;
    const pending = [];
    listeners.get(type)({ request,
      respondWith: (value) => { response = Promise.resolve(value); },
      waitUntil: (value) => pending.push(Promise.resolve(value)),
    });
    const result = await response;
    await Promise.all(pending);
    return result;
  };
  const request = (path, options = {}) => dispatch("fetch", {
    url: new URL(path, origin).href, method: "GET", mode: "cors", ...options,
  });
  return { state, caches, stores, fetches, installed, dispatch, request };
}

test("installed shell caches the exact versioned stylesheet referenced by HTML", async () => {
  const worker = createWorker();
  await worker.dispatch("install");
  const stylesheet = html.match(/href=["']([^"']*\/styles\.css\?[^"']+)["']/)?.[1];
  assert.ok(stylesheet, "HTML must use a versioned stylesheet URL");
  assert.ok(worker.installed.includes(stylesheet));
});

test("stylesheets use fresh network bytes even when a stale response is cached", async () => {
  const worker = createWorker();
  await worker.dispatch("install");
  const stylesheet = worker.installed.find((path) => path.startsWith("/styles.css"));
  worker.fetches.length = 0;
  worker.state.network = async () => new Response("fresh CSS");
  assert.equal(await (await worker.request(stylesheet)).text(), "fresh CSS");
  assert.equal(worker.fetches.length, 1);
  assert.equal(await (await worker.caches.match(stylesheet)).text(), "fresh CSS");
  worker.state.network = async () => { throw new TypeError("Offline"); };
  assert.equal(await (await worker.request(stylesheet)).text(), "fresh CSS");
});

test("an uncached offline stylesheet returns an explicit network error response", async () => {
  const worker = createWorker();
  worker.state.network = async () => { throw new TypeError("Offline"); };
  const response = await worker.request("/styles.css?v=uncached");
  assert.ok(response instanceof Response);
  assert.equal(response.type, "error");
});

test("cache quota errors never replace a successful stylesheet or immutable asset response", async () => {
  const worker = createWorker();
  worker.state.failWrites = true;
  worker.state.network = async () => new Response("successful network bytes");
  for (const path of ["/styles.css?v=test", "/assets/app-test.js"]) {
    const response = await worker.request(path);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "successful network bytes");
  }
});

test("offline navigation serves the shell or an explicit HTML 503 when uncached", async () => {
  const worker = createWorker();
  worker.state.network = async () => { throw new TypeError("Offline"); };
  const uncached = await worker.request("/gallery/portraits", { mode: "navigate" });
  assert.equal(uncached.status, 503);
  assert.match(uncached.headers.get("content-type"), /text\/html/);
  assert.match(await uncached.text(), /Offline/);
  worker.state.network = async () => new Response("cached application shell");
  await worker.dispatch("install");
  worker.state.network = async () => { throw new TypeError("Offline"); };
  const cached = await worker.request("/gallery/portraits", { mode: "navigate" });
  assert.equal(cached.status, 200);
  assert.equal(await cached.text(), "cached application shell");
});

test("immutable assets are cache-first and the manifest refreshes in the background", async () => {
  const worker = createWorker();
  worker.state.network = async () => new Response("first bytes");
  await worker.dispatch("install");
  worker.fetches.length = 0;
  assert.equal(await (await worker.request("/assets/app-hash.js")).text(), "first bytes");
  worker.state.network = async () => new Response("second bytes");
  assert.equal(await (await worker.request("/assets/app-hash.js")).text(), "first bytes");
  assert.equal(worker.fetches.length, 1);
  assert.equal(await (await worker.request("/site.webmanifest")).text(), "first bytes");
  worker.state.network = async () => new Response("updated manifest");
  assert.equal(await (await worker.request("/site.webmanifest")).text(), "second bytes");
  assert.equal(await (await worker.caches.match("/site.webmanifest")).text(), "updated manifest");
});

test("non-GET, cross-origin and unversioned dynamic resources are not intercepted", async () => {
  const worker = createWorker();
  assert.equal(await worker.request("/api/contact", { method: "POST" }), undefined);
  assert.equal(await worker.request("https://third-party.invalid/script.js"), undefined);
  assert.equal(await worker.request("/gallery-content.json"), undefined);
  assert.equal(worker.fetches.length, 0);
});
