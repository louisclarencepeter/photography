> Update — 11 September 2026: O-01 (remote YouTube posters before consent) is
> repaired in source by serving all eight existing posters from `/video-posters/`
> and removing remote fallbacks. The click-to-load YouTube embeds are unchanged.
> Release and network-verification evidence is recorded in the current issue receipt.
> The review below remains a dated record; its other findings require reconciliation.

# Code review handoff — August 2026

A review pass over the site covering the build, the bundle, the service worker,
accessibility, and privacy.

**This document describes the `development` branch.** That matters: `development`
is four commits ahead of `main` and already fixes one of the things the review
found, so a handoff written against `main` would be wrong in at least one place.

Everything stated here was checked against a production build driven in a real
browser. Where something could not be verified, it says so.

---

## Contents

- [Where the work lives](#where-the-work-lives)
- [Already fixed on `development`](#already-fixed-on-development)
- [Fixed in PR #5 (not yet merged)](#fixed-in-pr-5-not-yet-merged)
- [Merging PR #5 into `development`](#merging-pr-5-into-development)
- [Still open](#still-open)
- [Read before editing](#read-before-editing)
- [Reproducing the checks](#reproducing-the-checks)

---

## Where the work lives

| Branch | State |
| --- | --- |
| `main` | `e8fdaba` — the deployed line |
| `development` | 4 commits ahead of `main`: Google Analytics, stylesheet cache busting, mobile footer overscroll |
| `claude/project-review-handoff-qakrxs` | The review's fixes, branched from `main`. Open as **draft PR #5**, currently targeting `main` |

PR #5 targets `main`, but `development` is where active work happens. Retargeting
it to `development` (or merging `development` into it) is probably the right move
— see [Merging PR #5](#merging-pr-5-into-development) for the two conflicts you
will hit.

### Measured on PR #5

Figures from a clean `npm run build`, and from Chromium driving `vite preview`.
Load timings are localhost, where round trips are nearly free — the request-count
reduction matters more on a real mobile network than the millisecond figure
suggests.

| | Before | After |
| --- | --- | --- |
| Generated image files | 1,750 | **1,178** |
| Initial JS (gzip) | 97.2 kB | **90.1 kB** |
| Requests before render | 6 chained | **1** |
| `dist/` on disk | 48 MB | **46 MB** |
| Build wall time | ~1m 55s | unchanged (imagetools-bound) |

---

## Already fixed on `development`

Recorded so nobody re-fixes them, and because one of them conflicts with PR #5.

### The stale stylesheet — fixed differently from PR #5

`/styles.css` is not content-hashed, so when the service worker cached it
cache-first, returning visitors kept whichever copy they first downloaded until
`CACHE_NAME` changed. The `must-revalidate` header in `_headers` never applied,
because a service worker does not consult HTTP cache headers. A CSS-only deploy
could reach nobody.

`development` fixes this by:

1. Adding a `?v=9` query string to the stylesheet URL, and
2. Removing `/styles.css` from `isCacheableRuntimeAsset`, and
3. Adding a dedicated **network-first** `fetchStylesheet()` handler.

PR #5 fixes the same bug with **stale-while-revalidate** and no query string.
Both work. `development`'s version is the one in the tree, and it also fixes the
HTTP cache layer, which SWR alone does not. **Keep `development`'s approach** —
see the merge notes below.

### The Impressum now mentions Google Analytics

The *Cookies* section used to claim no analytics cookies were set. With GA added
that would have been flatly untrue, and it was updated in the same series of
commits. Good. It still does not mention YouTube — see [O-02](#o-02--the-impressum-still-does-not-mention-youtube).

### Consent gating works

Verified: with `lp-cookie-consent` set to `necessary`, **zero** `page_view` events
fire and **no** request reaches `googletagmanager.com`. GA loads only on explicit
Accept. That is the correct shape for GDPR opt-in.

---

## Fixed in PR #5 (not yet merged)

All of these are still present on `development`.

### Bugs

**The marquee jumped once every cycle.**
The `scroll` keyframe shifts `.strip-track` by `-50%`, so a seamless loop needs an
even number of copies. It is set to 3, so every 50 seconds the strip snaps back
mid-phrase.

Measuring the DOM turned up a second constraint that makes the obvious fix wrong.
Because `.strip-track`'s `padding-right` equals its `gap`, the track is exactly
`N × (item + gap)` — and at full shift only half the track is left to fill the
screen. Dropping to **2** loops perfectly but leaves blank space on anything wider
than 1491 px, i.e. every 1080p monitor. **6** satisfies both: seamless, and
covering ~4473 px.

> Verified at vw = 1280 / 1920 / 2560 / 3440 → `half = 4473`, `unit = 1491`,
> seamless, and covering the viewport in every case.

**The lightbox dropped keyboard focus onto the document body when it closed.**
A keyboard user who opened the fourth frame in the grid and pressed Escape was
returned to the top of the document.

Two subtleties, because the naive fix fails both. The opener must be captured
*before* the close button is focused — React runs ref callbacks ahead of effects,
so a ref that focused on attach made the capture read the close button itself.
And the capture must sit in an effect with empty deps: `HomePage` and
`GalleryPage` pass fresh arrow functions on every render, so a deps-keyed effect
re-ran and re-stole focus on every arrow key.

> Verified for both keyboard and mouse: focus returns to the exact thumbnail, and
> arrow keys advance 2/10 → 3/10 → 4/10 without disturbing it.

**Offline navigation could fail with a network error.**
The fallback is `fetch(request).catch(() => caches.match("/"))`. When the shell is
not cached, `caches.match` resolves to `undefined`, and `respondWith(undefined)`
surfaces as a network error rather than a page. Still present on `development`.

### Accessibility

The site already had a skip link, visible focus rings, full alt text, and a
`prefers-reduced-motion` block — this is polish on a decent base.

**Reduced motion missed the animations you cannot stop.** The existing media query
covers the scroll reveals and the scribbles — the ones that play once and settle.
It does not cover the three that never stop: the looping marquee,
`scroll-behavior: smooth`, and the 7-second testimonial carousel. Those are
precisely what WCAG 2.2.2 and vestibular-sensitivity guidance are about. Fixed in
CSS, plus a `usePrefersReducedMotion` hook for the JS-driven ones (built on
`useSyncExternalStore`, matching the existing `ThemeToggle` / `CookieConsent`
pattern).

**The testimonial carousel could not be held still.** Now pauses on hover and
focus, and picking a quote pins it for the rest of the visit.
Verified: hovered 9 s (longer than the 7 s interval) → unchanged; pointer away
8 s → advanced.

**The mobile menu leaked focus to the page behind it.** The menu covers the whole
screen but the header and page underneath stayed tabbable.
Verified at 390 × 844: 16 consecutive Tabs, all 12 stops inside the menu, wrapping
to the first, never escaping. Escape returns focus to the toggle.

**Seven controls claimed `role="tab"` with no tab panel anywhere on the site.**
The service pills, gallery filters, and testimonial dots. Screen readers announced
a tab interface that does not exist, and the arrow-key navigation the pattern
promises was never implemented. They are filter toggles, so they now use
`aria-pressed` inside a labelled `role="group"`. The CSS keys off class names, not
ARIA attributes, so nothing changed visually.

**`#words` is a nav target with no heading.** Both navs link to it, but the section
led with an eyebrow `<span>` and a blockquote. A visually hidden `<h2>` fills the
outline gap without touching the design.

### Performance

**The app booted through an extra round trip.** `index.html` starts the app with a
dynamic import inside an inline module script. Vite turns that into a 2 kB stub
whose only job is to *then* inject preload hints and fetch the real bundle — the
built HTML contains no `modulepreload` links at all, so the browser cannot begin
downloading React, the router, or the site data until the stub has been fetched,
parsed, and run. A plain `<script type="module" src="/src/main.jsx">` lets Vite
emit the entry directly; module scripts are deferred, so the static shell still
paints first.

**Thumbnails were generated for all 69 photos; 6 are used.** `imageThumb()` globs
all of `images/` at 48/64/96 px in three formats. That is 567 image files nothing
references — and because the glob is eager, their srcset strings ship in the JS
bundle too: **621 of 1,740 srcset entries, 36 % of a 103 kB chunk**, downloaded by
every visitor on every page.

**Every DOM change triggered a full-document query.** `useRevealOnScroll` puts a
`MutationObserver` on `document.body` with `subtree: true` and runs a
`querySelectorAll` across the whole document synchronously in the callback — many
times per React commit. Coalesced into one sweep per animation frame.

### Privacy and headers

YouTube embeds moved to `youtube-nocookie.com`, and the poster images carry
`referrerPolicy="no-referrer"`. **This does not close the issue** — see
[O-01](#o-01--youtube-posters-contact-google-before-consent).

Baseline security headers added to `public/_headers`: `X-Content-Type-Options`,
`Referrer-Policy`, `X-Frame-Options`, `Cross-Origin-Opener-Policy`,
`Permissions-Policy`, HSTS. Netlify merges the most specific matching block, so
the existing per-path cache rules are unaffected.

> **Not verified end-to-end.** This is the one change that cannot be checked
> locally — `_headers` is inert until Netlify serves it. The deploy preview built
> green, but fetching it was blocked by egress policy from the review environment.
> Worth one `curl -I` against a deploy preview to confirm the headers appear *and*
> that the per-path cache rules still apply.

### Housekeeping

- Dropped `react-icons` — nothing in `src/` imports it, and it was a production dependency.
- `.claude/launch.json` debug port 5173 → 5176, matching `strictPort` in the Vite config, so attaching works.
- `preview.open: false` — `vite preview` inherits `server.open` and threw `spawn xdg-open ENOENT` on any machine without a desktop browser.
- README brought back in line with the code.

---

## Merging PR #5 into `development`

Test-merged. **Exactly two files conflict**; everything else auto-merges cleanly
(`index.html`, `public/styles.css`, `src/components/SiteLayout.jsx`,
`src/data/siteData.js`).

### `public/sw.js`

Both branches fix the stale-stylesheet bug and both bump `CACHE_NAME` from `v8` to
`v9`.

**Resolution: keep `development`'s stylesheet handling** — the `?v=9` URL, the
removal of `/styles.css` from the cacheable-asset test, and the network-first
`fetchStylesheet()`. Drop PR #5's `isRevalidatedAsset()` / stale-while-revalidate
path, which solves the same problem less completely.

**Keep from PR #5:** the `isImmutableAsset()` rename and the offline-navigation
fix (the `respondWith(undefined)` bug), which `development` does not have. Take
`v9` once, from either side.

### `src/components/ScrollManager.jsx`

Both branches add code to the same effect body: `development` adds
`trackPageView(...)`, PR #5 adds reduced-motion handling.

**Resolution: keep both.** They are independent. The merged effect should read the
`prefersReducedMotion` value for the scroll `behavior`, and still call
`trackPageView` — remembering to add `prefersReducedMotion` to the dependency
array alongside `location`.

---

## Still open

Nothing below is fixed on either branch.

### O-01 — YouTube posters contact Google before consent

**Priority: highest. This has legal exposure.**

Scrolling to *Behind the scenes* or *On YouTube* loads eight thumbnails from
`i.ytimg.com`. No click is required, no consent is asked, and **the cookie banner
does not gate it** — this is independent of the GA consent flow, which does work
correctly. Every visitor's IP reaches Google.

Three ways to close it, cheapest first:

1. **Self-host the posters.** Download the eight thumbnails once, drop them in
   `images/`, reference them through `imagePicture()` like every other photo.
   Nothing third-party loads until the visitor presses play. Recommended — it is
   also faster and survives a video being made private.
2. **Gate on the cookie banner.** Read `lp-cookie-consent` and render a
   placeholder until accepted. More code, and it makes the section look broken to
   anyone who chooses *Only necessary*.
3. **Drop the thumbnails** for a styled play card with the video title.

### O-02 — The Impressum still does not mention YouTube

The *Cookies* section was correctly updated for Google Analytics. It says nothing
about the YouTube embeds or the image requests to Google's CDN. Fixing **O-01** by
self-hosting posters shrinks this to "YouTube is embedded and loads on click",
which is a short paragraph. This is the one item worth having a lawyer read.

`src/data/siteData.js` → `legalSections`

### O-03 — Google Analytics double-counts the first page view

**Verified.** For any visitor whose consent is already stored — i.e. every
returning visitor — **two `page_view` events fire for one page load**:

| Consent | `page_view` on load | Per SPA navigation |
| --- | --- | --- |
| `accepted` | **2** | 1 (correct) |
| `necessary` | 0 | 0 |

Both `CookieConsent`'s `[preference]` effect and `ScrollManager`'s `[location]`
effect call `trackPageView()` on mount. SPA navigation is fine — only the initial
load double-fires. The effect is that landing-page views roughly double for
returning visitors, and bounce rate and per-page metrics skew accordingly.

Fix: let `ScrollManager` own `page_view` exclusively, and have `CookieConsent`
fire one only on the *transition* from no-consent to accepted (a ref holding the
previous preference), not on mount with consent already stored. Removing the call
from `CookieConsent` outright is simpler but loses the view when a fresh visitor
accepts, because `ScrollManager`'s effect has already run and `location` has not
changed.

`src/components/CookieConsent.jsx`, `src/components/ScrollManager.jsx`

### O-04 — No tests and no CI

There is no test suite and no `.github/` directory at all, so nothing catches a
regression before Netlify deploys it. Several bugs above are exactly the kind that
reappear silently after a refactor.

A pragmatic first slice, in order of payoff:

1. A GitHub Actions workflow running `npm ci && npm run lint && npm run build` on
   pull requests. Cheapest possible win.
2. Playwright smoke tests over `vite preview`: every route returns 200 with the
   right `<title>` and `lang`, no console errors, no broken images. The checks
   below are a working starting point.
3. Focused regression tests for the fixes most likely to rot: lightbox focus
   restore, mobile-menu focus trap, the marquee invariant, and the GA page-view
   count once O-03 is fixed.
4. Add `eslint-plugin-jsx-a11y`. It would have flagged the `role="tab"` misuse
   without anyone looking.

### O-05 — No Content-Security-Policy

The other headers went in; CSP did not, because a wrong one silently breaks the
site. The policy has to account for the inline theme script in `<head>`, the
inline critical CSS, the inline `onload` on the stylesheet link, YouTube iframes,
Cloudflare Turnstile, Google's image CDN, **and now `googletagmanager.com`**.

Start with `Content-Security-Policy-Report-Only`, watch the console on every route
including a video play, a form submission, and a consent accept, then promote it.
Expect to need a hash or nonce for the theme script — it must stay inline and
blocking to avoid a light-mode flash.

### O-06 — Unknown URLs return HTTP 200

`netlify.toml` rewrites `/*` to `/index.html` with status 200. React renders the
404 page, but crawlers see a success, so every mistyped or stale inbound link
becomes an indexable soft 404.

List the real routes as explicit 200 rewrites, end with a catch-all
`/* → /404.html` at status 404, and emit a `404.html` from
`generate-route-html.mjs` (a fourth entry in its `routes` array). Confirm on a
deploy preview — the local preview server does not model Netlify's redirect rules
exactly.

### O-07 — The contact form's rate limiter does not survive a cold start

`rateLimitBuckets` is a `Map` in module scope. Netlify Functions are ephemeral and
horizontally scaled, so the counter resets on every cold start and each concurrent
instance keeps its own.

Turnstile is the real defence and is already wired up — **confirm
`TURNSTILE_SECRET_KEY` and `VITE_TURNSTILE_SITE_KEY` are actually set in
Netlify**, because `verifyTurnstile()` returns `true` when the secret is missing.
If durable limits are wanted later, Netlify Blobs or Upstash would back the same
logic. The in-memory version is fine as a speed bump; it just should not be
mistaken for protection.

`netlify/functions/send-message.mjs`

### O-08 — Contact form UX gaps

The form sets `noValidate` and adds no client-side checks, so submitting an empty
field makes a network round trip to come back with a generic "Missing required
fields" and no indication of which one. And once a message sends, the success
state replaces the form permanently — no way to send a second without reloading.

### O-09 — `/thanks` is unreachable

The route, the page component, and a generated `dist/thanks/index.html` all exist,
but the contact form shows an inline success message instead. Nothing links to it.
Either route the form there on success, or delete the page, the route, and its
entry in `generate-route-html.mjs`. Leaving it is the worst of the three — a live
URL nobody maintains.

### O-10 — One photo is built but never shown

`images/gallery-036.jpg` is in neither `galleryEntries.json` nor any
`imagePicture()` call, but the eager glob still transforms it into **21 files
totalling 646 kB** of `dist/` on every build. Delete it or add it to
`galleryEntries.json`. Left alone because it is your photograph and the choice is
yours.

### O-11 — The build is almost entirely image transforms

Rolldown itself warns that `imagetools` dominates. Even after PR #5 cuts 572
files it is ~1m 55s, and Netlify re-pays it on every deploy because the variants
are not cached between builds. If deploys start feeling slow, look at persisting
the imagetools output via Netlify's cache directory before optimising anything
else — nothing else is close.

### O-12 — Smaller notes

- **A visible pause control on the testimonials** would complete WCAG 2.2.2. Hover
  and focus pausing covers most real use but is not the letter of the guideline.
- **The hero headline's highlight overshoots.** At ~1440 px, "people you love"
  wraps and the rose `::after` on `.underline` spans the full line box, leaving a
  pink rectangle to the right of "love". Cosmetic but on the first screen. Fix
  with `box-decoration-break: clone` on an inline highlight, or by re-balancing
  the line breaks.
- **`sitemap.xml` has no `<lastmod>`**, and `/thanks` is neither listed nor
  disallowed in `robots.txt`.
- **`socialLinks[].icon` is dead data** once `react-icons` is dropped. Harmless,
  and a fine breadcrumb if you want social icons later — just re-add the
  dependency then.
- **`npm run dev` uses a `BROWSER='google chrome'` prefix.** Vite does honour that
  variable, but the shell syntax fails on Windows `cmd` and PowerShell.
- **`.vscode/settings.json`** only sets a Live Server port, left over from before
  Vite. Safe to delete.
- **`Testimonials` uses `dangerouslySetInnerHTML`** to render the `<em>` inside
  quotes. Safe today because the strings are hard-coded — it becomes an XSS hole
  the moment quotes come from a CMS or a form.

---

## Read before editing

Invariants this codebase depends on that are not visible from the file you would
be editing.

### The stylesheet version lives in three places

`development` cache-busts the stylesheet with `?v=9`. That string appears in
**three** places that must stay in sync:

- `index.html` — the `<link rel="stylesheet">`
- `index.html` — the `<noscript>` fallback
- `public/sw.js` — the `APP_SHELL` precache list

`fetchStylesheet()` matches on `url.pathname`, which excludes the query, so it
catches any version. But if you bump the number in `index.html` and forget
`APP_SHELL`, the service worker precaches a URL nothing requests. Bump all three,
or drop the query string and rely on the network-first handler alone.

### The critical CSS is a hand-maintained duplicate

`index.html` inlines a copy of the above-the-fold styles (tokens prefixed
`--critical-*`) plus a static HTML shell of the header and hero, because
`styles.css` is loaded non-blockingly. Change the header, hero, or button styling
in `styles.css` and you must check whether the inline copy needs the same edit —
otherwise the page visibly reflows when the real stylesheet lands. Nothing
enforces this.

### The marquee repeat count has two constraints, not one

`MARQUEE_REPEATS` must be **even** — the keyframe shifts by `-50%` and the track
is `N × (item + gap)`, so only an even N lands on a repeat boundary. It must
**also** be large enough that `N × (item + gap) / 2` exceeds the widest viewport,
or blank space scrolls past on wide screens. Changing the marquee's font size,
gap, or wording changes the item width and therefore the second constraint.

### Adding a thumbnail means editing the glob (after PR #5)

PR #5 changes `imageThumb()` to read from an explicit filename list rather than
all of `images/`. A new `imageThumb("gallery-0xx.jpg")` call needs that filename
added to the glob pattern. It fails loudly — `resolveAsset()` throws
`Missing asset: images/…` at build time — but the error will not mention the glob.

### Do not "simplify" the jpeg fallback in `ResponsiveImage`

`const jpegSource = sources.jpg ?? sources.jpeg;` looks redundant. It is not:
`vite-imagetools` keys the fallback as `jpeg` in the current build and `jpg` in
others. Collapsing it to one key silently drops the
`<source type="image/jpeg">` for browsers without AVIF or WebP.

### Lightbox callbacks are recreated on every render

`HomePage` and `GalleryPage` pass inline arrow functions for `onClose`, `onPrev`,
and `onNext`. Any effect inside `Lightbox` that depends on them re-runs on every
index change — which is why the scroll lock and focus handling deliberately sit in
a separate effect with empty deps. Adding `useCallback` in the parents would make
this safe; until then, check the deps before moving code between those effects.

### The service worker decides caching, not the headers

`public/_headers` is ignored once the service worker is installed and handling a
request. Any new unhashed file served from the root needs handling in `sw.js`, not
just a cache header — otherwise returning visitors keep the first copy they ever
downloaded. Bump `CACHE_NAME` whenever the caching logic itself changes.

---

## Reproducing the checks

Nothing in this document was taken on trust from reading the source.

```bash
npm ci
npm run build          # also runs both postbuild generators
npm run lint
npx vite preview --port 4173 --strictPort
```

Then drive that preview with Playwright:

- **marquee** — measure `.strip-track` `scrollWidth / 2` against `(item + gap)` at
  1280 / 1920 / 2560 / 3440 px. Must be a whole multiple, and `track - track/2`
  must be at least the viewport width.
- **focus** — focus a `.bento` button, Enter, Escape. `activeElement` must be the
  same button. ArrowRight must not move focus off the close control.
- **menu** — at 390 × 844, open the menu and press Tab 16 times. Every stop must
  match `.closest('#mobile-menu')`.
- **motion** — `newPage({ reducedMotion: 'reduce' })`. `.strip-track`
  `animationName === 'none'`, `html` `scroll-behavior === 'auto'`, and the
  testimonial quote unchanged after 9 s.
- **analytics** — stub `window.gtag` via `addInitScript` before load, set
  `lp-cookie-consent`, count `['event','page_view']` calls on load and after a
  real NavLink click. Use `waitUntil: 'domcontentloaded'`, not `networkidle` —
  `googletagmanager.com` may be blocked and the page never goes idle.
- **privacy** — record every request host while scrolling the whole page.
- **routes** — `/`, `/gallery`, `/impressum`, `/thanks`, `/nope`: status, title,
  lang, console errors, and images with `naturalWidth === 0`.

One caveat worth repeating: **`_headers` cannot be tested locally.** It is inert
until Netlify serves it. Check it with `curl -I` against a deploy preview.

---

## If you only do three things

1. **Self-host the eight YouTube posters (O-01), then finish the Impressum
   (O-02).** The only items with legal exposure, they are coupled, and the first
   makes the second shorter. Half a day including downloading the images.
2. **Add the CI workflow (O-04, step 1).** Under an hour, and it is what stops
   these fixes from quietly regressing.
3. **Verify Turnstile is configured in Netlify (O-07).** Two minutes, real
   consequence: with no `TURNSTILE_SECRET_KEY`, the function accepts every
   submission.

Fixing the GA double-count (O-03) is also cheap and worth doing before the
analytics history gets long enough that the skew matters.
