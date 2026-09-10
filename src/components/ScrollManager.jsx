import { useEffect, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import { usePrefersReducedMotion } from "../hooks";
import { getCookiePreference, subscribeCookiePreference, trackPageView } from "../utils/googleAnalytics";

function getHashTarget(hash) {
  if (!hash || hash === "#") return null;

  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null;
  }
}

function ScrollManager() {
  const location = useLocation();
  const { pathname, search } = location;
  const preference = useSyncExternalStore(subscribeCookiePreference, getCookiePreference, () => "");
  // A CSS media query cannot control scrollTo/scrollIntoView.
  const prefersReducedMotion = usePrefersReducedMotion();

  // Consent can arrive after navigation. Observe both here so there is only one
  // owner of page views; hash jumps and motion preferences are not new pages.
  useEffect(() => {
    trackPageView(`${pathname}${search}`);
  }, [pathname, search, preference]);

  useEffect(() => {
    const behavior = prefersReducedMotion ? "auto" : "smooth";
    const frame = window.requestAnimationFrame(() => {
      if (location.hash) {
        const target = getHashTarget(location.hash);
        if (target) {
          target.scrollIntoView({ behavior, block: "start" });
          return;
        }
      }

      window.scrollTo({ top: 0, behavior });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location, prefersReducedMotion]);

  return null;
}

export default ScrollManager;
