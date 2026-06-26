import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../utils/googleAnalytics";

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

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (location.hash) {
        const target = getHashTarget(location.hash);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    trackPageView(`${location.pathname}${location.search}`);

    return () => window.cancelAnimationFrame(frame);
  }, [location]);

  return null;
}

export default ScrollManager;
