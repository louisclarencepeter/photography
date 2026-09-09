import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { test } from "node:test";

const source = readFileSync(new URL("../src/utils/googleAnalytics.js", import.meta.url), "utf8");

function createBrowser(preference = "", production = true) {
  const storage = new Map(preference ? [["lp-cookie-consent", preference]] : []);
  const scripts = [];
  const window = new EventTarget();
  window.location = new URL("https://photography.invalid/");
  window.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  };
  const document = {
    title: "Photography test",
    querySelector: () => scripts[0] ?? null,
    createElement: () => ({}),
    head: { appendChild: (script) => scripts.push(script) },
  };
  // Run the actual utility, adapting only module/Vite syntax. Script injection
  // is recorded in memory, never attached to a browser or fetched from Google.
  const context = vm.createContext({ window, document, Event });
  vm.runInContext(
    source.replaceAll("import.meta.env.PROD", String(production))
      .replace(/^export\s+(?=(?:function|const|let|class)\b)/gm, "") +
      "\nglobalThis.analytics = { getCookiePreference, subscribeCookiePreference, storeCookiePreference, trackPageView };",
    context,
  );
  const events = () => JSON.parse(JSON.stringify(Array.from(window.dataLayer ?? [], (entry) => Array.from(entry))))
    .filter((entry) => entry[0] === "event" && entry[1] === "page_view");
  const visit = (path) => {
    window.location = new URL(path, "https://photography.invalid");
    return context.analytics.trackPageView();
  };
  return { analytics: context.analytics, window, document, storage, scripts, events, visit };
}

test("saved accepted consent produces exactly one initial page view", () => {
  const browser = createBrowser("accepted");
  assert.equal(browser.visit("/"), true);
  assert.equal(browser.analytics.trackPageView(), false);
  assert.equal(browser.analytics.trackPageView(), false);
  assert.equal(browser.events().length, 1);
  assert.equal(browser.scripts.length, 1);
  const config = Array.from(browser.window.dataLayer).find((entry) => entry[0] === "config");
  assert.equal(config[2].send_page_view, false, "GA automatic page views must remain disabled");
  assert.deepEqual(browser.events()[0][2], {
    page_path: "/", page_location: "https://photography.invalid/", page_title: "Photography test",
  });
});

test("accepting during a visit sends the current page once through the consent subscription", () => {
  const browser = createBrowser();
  browser.visit("/");
  browser.visit("/gallery/portraits?view=grid");
  let notifications = 0;
  const unsubscribe = browser.analytics.subscribeCookiePreference(() => {
    notifications += 1;
    browser.analytics.trackPageView();
  });
  browser.analytics.storeCookiePreference("accepted");
  browser.window.dispatchEvent(new Event("storage"));
  browser.analytics.trackPageView();
  assert.equal(browser.analytics.getCookiePreference(), "accepted");
  assert.equal(notifications, 2);
  assert.deepEqual(browser.events().map((entry) => entry[2].page_path), ["/gallery/portraits?view=grid"]);
  unsubscribe();
  browser.window.dispatchEvent(new Event("storage"));
  assert.equal(notifications, 2, "unsubscribed components must stop receiving consent updates");
});

test("unknown or necessary-only consent causes no GA event or script load", () => {
  for (const preference of ["", "necessary"]) {
    const browser = createBrowser(preference);
    assert.equal(browser.visit("/"), false);
    assert.equal(browser.visit("/gallery/portraits"), false);
    browser.analytics.storeCookiePreference("necessary");
    assert.equal(browser.analytics.trackPageView(), false);
    assert.equal(browser.events().length, 0);
    assert.equal(browser.scripts.length, 0);
  }
});

test("route and query changes count visits, including returning to an earlier route", () => {
  const browser = createBrowser("accepted");
  for (const path of ["/", "/gallery/portraits", "/gallery/portraits?view=grid", "/"]) {
    assert.equal(browser.visit(path), true);
  }
  assert.deepEqual(browser.events().map((entry) => entry[2].page_path), [
    "/", "/gallery/portraits", "/gallery/portraits?view=grid", "/",
  ]);
  assert.equal(browser.scripts.length, 1);
});

test("hash navigation and replayed effects do not count a second page view", () => {
  const browser = createBrowser("accepted");
  browser.visit("/gallery/portraits?view=grid");
  assert.equal(browser.visit("/gallery/portraits?view=grid#photo-2"), false);
  // Motion-preference changes can replay scroll effects, but requesting the
  // same page view again must remain harmless regardless of the caller.
  browser.window.matchMedia = () => ({ matches: true });
  assert.equal(browser.analytics.trackPageView(), false);
  browser.window.matchMedia = () => ({ matches: false });
  assert.equal(browser.analytics.trackPageView(), false);
  assert.equal(browser.events().length, 1);
});

test("withdrawal and reacceptance do not duplicate a page, but a later visit can count", () => {
  const browser = createBrowser("accepted");
  browser.visit("/");
  browser.analytics.storeCookiePreference("necessary");
  browser.analytics.trackPageView();
  browser.analytics.storeCookiePreference("accepted");
  assert.equal(browser.analytics.trackPageView(), false);
  browser.analytics.storeCookiePreference("necessary");
  browser.visit("/gallery/portraits");
  browser.visit("/");
  browser.analytics.storeCookiePreference("accepted");
  assert.equal(browser.analytics.trackPageView(), true);
  assert.deepEqual(browser.events().map((entry) => entry[2].page_path), ["/", "/"]);
});

test("unavailable consent storage and development mode keep analytics disabled", () => {
  const browser = createBrowser("accepted");
  browser.window.localStorage.getItem = () => { throw new Error("Storage blocked"); };
  assert.equal(browser.visit("/"), false);
  assert.equal(browser.events().length, 0);
  assert.equal(browser.scripts.length, 0);
  const development = createBrowser("accepted", false);
  assert.equal(development.visit("/"), false);
  assert.equal(development.events().length, 0);
  assert.equal(development.scripts.length, 0);
});
