# Louis Peter Photography

Portfolio website for Louis Peter Photography — a Frankfurt-based photographer covering portrait, event, drone, and lifestyle work.

## Tech Stack

- **Vite 7** — build tool and dev server
- **React 18** with **react-router-dom 7** — single-page app with client-side routing
- **Netlify** — hosting, serverless functions, and SPA redirect
- **Resend** — transactional email for the contact form

## Getting Started

Requires Node 24.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to ./dist
npm run preview  # preview the production build
```

## Project Structure

```
.
├── index.html              # Vite entry
├── src/
│   ├── main.jsx            # React root + BrowserRouter
│   ├── App.jsx             # Routes, layout, pages, and components
│   ├── styles.css          # All styles
│   └── data/siteData.js    # Site content (copy, image refs, social links, legal text)
├── images/                 # Gallery and hero photos
├── Products/               # Service category photos
├── public/                 # Static assets served at root (mark.png, fonts, og-image, etc.)
├── netlify/functions/      # Serverless functions (contact form → Resend)
├── netlify.toml            # Netlify build config
└── vite.config.js
```

## Pages

- `/` — Home: hero collage, videography, about, services, contact form
- `/gallery` — Portfolio grid
- `/impressum` — German legal information

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
4. Redeploy (or trigger a new deploy) so the function picks up the env var.

**Local testing:** the React dev server can't run Netlify Functions on its own.
Install Netlify CLI (`npm i -g netlify-cli`) and run `netlify dev` instead of
`npm run dev` to test the form end-to-end locally.

## Deployment

Pushes to `main` are built and deployed by Netlify using `netlify.toml`. The
build runs `npm run build` and publishes `dist/`. The SPA redirect
(`/* → /index.html`) ensures direct links to `/gallery` and `/impressum` resolve
correctly. Functions in `netlify/functions/` are auto-detected.

## Contributing

Fork the repository and submit a pull request.

---

![status](https://img.shields.io/badge/status-live-brightgreen?style=flat-square)
