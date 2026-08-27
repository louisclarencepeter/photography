import { useEffect, useState, useSyncExternalStore } from "react";

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

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(callback) {
  const query = window.matchMedia?.(REDUCED_MOTION_QUERY);
  if (!query) return () => {};

  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false;
}

/**
 * Mirrors the CSS `prefers-reduced-motion` media query so JS-driven motion
 * (smooth scrolling, the testimonial carousel) can honour it too — a CSS-only
 * opt-out leaves exactly the animations users can't stop still running.
 *
 * Same useSyncExternalStore shape as ThemeToggle/CookieConsent: it reads the
 * live value during render and re-subscribes if the OS setting flips mid-visit.
 */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, () => false);
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

    // The MutationObserver fires for every DOM change React makes — filtering a
    // grid, opening the menu, swapping a testimonial. Re-querying the whole
    // document synchronously on each one is what made scrolling stutter, so
    // coalesce bursts into a single sweep on the next frame.
    let scheduled = 0;
    const scheduleObserveAll = () => {
      if (scheduled) return;
      scheduled = window.requestAnimationFrame(() => {
        scheduled = 0;
        observeAll();
      });
    };

    const mutation = new MutationObserver(scheduleObserveAll);
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (scheduled) window.cancelAnimationFrame(scheduled);
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
