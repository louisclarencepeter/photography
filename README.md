# Louis Peter Photography

Portfolio website for Louis Peter Photography — a Frankfurt-based photographer covering portrait, event, drone, and lifestyle work.

## Tech Stack

- **Vite 8** — build tool and dev server
- **React 18** with **react-router-dom 7** — single-page app with client-side routing
- **Netlify** — hosting, serverless functions, and SPA redirect
- **Resend** — transactional email for the contact form

## Getting Started

Requires Node 22.12 or newer. Node 24 is also supported.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to ./dist
npm run preview  # preview the production build
```

## Project Structure

```
.
├── index.html              # Vite entry + critical CSS + static pre-render shell
├── src/
│   ├── main.jsx            # React root + BrowserRouter
│   ├── App.jsx             # Route table (home eager, other pages lazy)
│   ├── hooks.js            # usePageMeta, useRevealOnScroll, useActiveSection,
│   │                       #   usePrefersReducedMotion
│   ├── components/         # SiteLayout, Lightbox, Testimonials, ThemeToggle,
│   │                       #   CookieConsent, PwaInstallButton, ResponsiveImage,
│   │                       #   ScrollManager
│   ├── pages/              # HomePage, GalleryPage, ImpressumPage, ThanksPage,
│   │                       #   NotFoundPage
│   └── data/
│       ├── siteData.js     # Site content + vite-imagetools picture imports
│       └── galleryEntries.json  # Gallery filenames, alt text, categories
├── images/                 # Gallery, hero, and behind-the-scenes photos
├── Products/               # Service category photos
├── public/                 # Served at root: styles.css, fonts, sw.js, _headers,
│                           #   icons, manifest, robots.txt, sitemap.xml
├── scripts/                # postbuild: per-route HTML + image sitemap
├── netlify/functions/      # Serverless functions (contact form → Resend)
├── netlify.toml            # Netlify build config
└── vite.config.js
```

### How styling works

There is no CSS-in-JS and no CSS module pipeline. `public/styles.css` is a single
hand-written stylesheet served as a static file, loaded non-blockingly via
`media="print" onload="this.media='all'"`. The above-the-fold subset is duplicated
as inline critical CSS in `index.html` (prefixed `--critical-*`), together with a
static HTML shell of the header and hero so the first paint isn't blank.

**Both copies are maintained by hand.** If you change the header, hero, or button
styles in `styles.css`, check whether the inline block in `index.html` needs the
same edit — otherwise the page visibly reflows when the real stylesheet lands.

### How images work

`src/data/siteData.js` imports photos through `vite-imagetools` using
`import.meta.glob`, which generates AVIF/WebP/JPEG variants at several widths and
hands `<ResponsiveImage>` a ready-made `<picture>` descriptor.

- `imagePicture(file)` — full-size photos, widths 160–1600. Globs all of `images/`.
- `productPicture(file)` — service photos, same widths. Globs all of `Products/`.
- `imageThumb(file)` — 48/64/96px avatars and menu thumbs. **Globs an explicit
  filename list**, because generating thumbnails for all 69 photos produced ~570
  variants nothing rendered. Adding a new `imageThumb()` call means adding the
  filename to that glob in `siteData.js`; `resolveAsset()` throws at build time
  if you forget.

Because the globs are eager, every file in `images/` is transformed at build
time whether or not anything references it, and its srcset strings ship in the
JS bundle. Deleting an unused photo is a real build-time and bundle saving.

## Pages

- `/` — Home: hero collage, services, selected work, behind the scenes, YouTube,
  about, testimonials, contact form
- `/gallery` — Portfolio grid with category filters and a lightbox
- `/impressum` — German legal information
- `/thanks` — Standalone confirmation page (currently unreachable from the UI;
  the contact form shows an inline success message instead)
- Anything else — in-app 404 page

`scripts/generate-route-html.mjs` writes a static `index.html` per route into
`dist/` after the build, so `/gallery`, `/impressum`, and `/thanks` ship the right
`<title>`, description, canonical URL, `og:*` tags, and `<html lang>` to crawlers
and link unfurlers without waiting for React.

## Contact Form

The form on the home page POSTs JSON to a Netlify Function at `/api/send-message`
([netlify/functions/send-message.mjs](netlify/functions/send-message.mjs)), which
calls the Resend REST API to deliver the message to `louisclarencepeters@gmail.com`.
Replies go to the visitor via the `Reply-To` header.

**Setup (one-time):**

1. Sign up at [resend.com](https://resend.com) and add `louisclarencepeter.com`
   as a domain. Resend will list a few DNS records (SPF, DKIM, etc.) — add
   those at your domain registrar. Verification usually takes a few minutes.
2. In Resend → API Keys, create a key with "Sending access" scope.
3. In Netlify → Site settings → Environment variables, add:
   - `RESEND_API_KEY` = the key from step 2
4. Optional spam protection: create a Cloudflare Turnstile widget and add:
   - `TURNSTILE_SECRET_KEY` = the secret key in Netlify
   - `VITE_TURNSTILE_SITE_KEY` = the public site key at build time
5. Redeploy (or trigger a new deploy) so the function picks up the env vars.

**Local testing:** the React dev server can't run Netlify Functions on its own.
Install Netlify CLI (`npm i -g netlify-cli`) and run `netlify dev` instead of
`npm run dev` to test the form end-to-end locally.

## Quality checks

```bash
npm run lint     # ESLint (flat config, react + hooks + refresh plugins)
npm test         # consent/page-view and service-worker regressions
npm audit        # full dependency audit
npm run build    # must succeed; also runs the postbuild generators
```

GitHub Actions runs these checks on pushes and pull requests to `development`
and `main`, using Node 22.12.0. Tests run without contacting analytics or email
providers. Browser checks are still needed for gallery, keyboard, mobile, and
reduced-motion behavior.

## Deployment

Pushes to `main` are built and deployed by Netlify using `netlify.toml`. The
build runs `npm run build` and publishes `dist/`. The SPA redirect
(`/* → /index.html`) ensures direct links to `/gallery` and `/impressum` resolve
correctly. Functions in `netlify/functions/` are auto-detected.

## Contributing

Fork the repository and submit a pull request.

---

![status](https://img.shields.io/badge/status-live-brightgreen?style=flat-square)

### Video poster privacy

The eight video posters in `public/video-posters/` are local copies of the existing
Louis Peter Photography YouTube thumbnails (11 September 2026). Each filename
matches its video ID in `src/data/siteData.js`. Keep new or replacement posters
local too; do not add remote thumbnail fallbacks or preconnects. Video cards contact
YouTube only when a visitor presses their Play button, which loads the
existing `youtube-nocookie.com` embed. Playback remains a third-party service. The service-worker cache version is bumped
so existing installations replace their old cached shell on update.

To refresh a poster, replace its matching JPEG with the channel’s current image
and check that it decodes correctly. Check a fresh browser visit, scroll through
all video cards without playing, and verify that no `ytimg.com`, `youtube.com`,
`youtube-nocookie.com`, or `googlevideo.com` request occurs before Play.
