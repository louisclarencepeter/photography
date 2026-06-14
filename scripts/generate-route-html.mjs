import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const SITE_URL = "https://louisclarencepeter.com";
const DIST_DIR = "dist";
const TEMPLATE_PATH = join(DIST_DIR, "index.html");
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

const routes = [
  {
    path: "/gallery",
    lang: "en",
    title: "Gallery — Louis Peter Photography",
    description:
      "Selected portrait, wedding, aerial, wildlife, and architecture photographs from the Louis Peter Photography portfolio."
  },
  {
    path: "/impressum",
    lang: "de",
    title: "Impressum — Louis Peter Photography",
    description:
      "Rechtliche Angaben und Kontaktdaten für Louis Peter Photography in Frankfurt am Main."
  },
  {
    path: "/thanks",
    lang: "en",
    title: "Thank you — Louis Peter Photography",
    description: "Thank you for getting in touch. I will reply as soon as I can."
  }
];

function escapeAttribute(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function replaceOrInsertMeta(html, attribute, name, content) {
  const escaped = escapeAttribute(content);
  const tag = `<meta ${attribute}="${name}" content="${escaped}" />`;
  const pattern = new RegExp(`<meta\\s+${attribute}="${name}"\\s+content="[^"]*"\\s*/>`, "s");

  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }

  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function replaceRouteMeta(template, route) {
  const canonical = `${SITE_URL}${route.path}`;
  const locale = route.lang === "de" ? "de_DE" : "en_US";

  let html = template
    .replace(/<html lang="[^"]*">/, `<html lang="${route.lang}">`)
    .replace(/<title>.*?<\/title>/s, `<title>${escapeAttribute(route.title)}</title>`)
    .replace(
      /<link rel="canonical" href="[^"]*" \/>/,
      `<link rel="canonical" href="${canonical}" />`
    );

  html = replaceOrInsertMeta(html, "name", "description", route.description);
  html = replaceOrInsertMeta(html, "property", "og:url", canonical);
  html = replaceOrInsertMeta(html, "property", "og:title", route.title);
  html = replaceOrInsertMeta(html, "property", "og:description", route.description);
  html = replaceOrInsertMeta(html, "property", "og:image", OG_IMAGE);
  html = replaceOrInsertMeta(html, "property", "og:locale", locale);
  html = replaceOrInsertMeta(html, "name", "twitter:title", route.title);
  html = replaceOrInsertMeta(html, "name", "twitter:description", route.description);
  html = replaceOrInsertMeta(html, "name", "twitter:image", OG_IMAGE);

  return html;
}

const template = await readFile(TEMPLATE_PATH, "utf8");

await Promise.all(
  routes.map(async (route) => {
    const outputPath = join(DIST_DIR, route.path, "index.html");
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, replaceRouteMeta(template, route));
    console.log(`Generated ${outputPath}`);
  })
);
