import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { usePrefersReducedMotion } from "../hooks";

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
  // A CSS media query can't reach scrollTo/scrollIntoView, so read the
  // preference here too and jump instantly rather than gliding.
  const prefersReducedMotion = usePrefersReducedMotion();

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
