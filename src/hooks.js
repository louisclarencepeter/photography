import { useEffect, useState } from "react";

const SITE_URL = "https://louisclarencepeter.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

function setMeta(attribute, value, content) {
  if (!content) return;

  let meta = document.querySelector(`meta[${attribute}="${value}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, value);
    document.head.append(meta);
  }

  meta.setAttribute("content", content);
}

function setCanonical(href) {
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.append(canonical);
  }

  canonical.setAttribute("href", href);
}

export function usePageMeta({ title, description, lang = "en", image = DEFAULT_IMAGE }) {
  useEffect(() => {
    const canonicalUrl = new URL(window.location.pathname, SITE_URL).toString();

    if (title) {
      document.title = title;
      setMeta("property", "og:title", title);
      setMeta("name", "twitter:title", title);
    }

    document.documentElement.lang = lang;

    if (description) {
      setMeta("name", "description", description);
      setMeta("property", "og:description", description);
      setMeta("name", "twitter:description", description);
    }

    setCanonical(canonicalUrl);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:image", image);
    setMeta("property", "og:locale", lang === "de" ? "de_DE" : "en_US");
    setMeta("name", "twitter:image", image);
  }, [title, description, lang, image]);
}

export function useRevealOnScroll() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    const observeAll = () => {
      document
        .querySelectorAll(".reveal:not(.active), .handwrite:not(.active)")
        .forEach((el) => {
          observer.observe(el);
        });
    };

    observeAll();

    const mutation = new MutationObserver(observeAll);
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, []);
}

export function useActiveSection(pathname) {
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    if (pathname !== "/") {
      return undefined;
    }

    const sectionIds = ["home", "services", "work", "about", "words", "contact"];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (sections.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-150px 0px -75% 0px" }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [pathname]);

  return pathname === "/" ? activeSection : null;
}
