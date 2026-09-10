const GOOGLE_ANALYTICS_ID = "G-RPWD9SEH46";
const COOKIE_CONSENT_KEY = "lp-cookie-consent";
const COOKIE_CHANGE_EVENT = "lp-cookie-consent-change";

let isInitialized = false;
let currentPagePath = null;
let hasTrackedCurrentPage = false;

const canUseAnalytics = () =>
  Boolean(GOOGLE_ANALYTICS_ID) &&
  import.meta.env.PROD &&
  typeof window !== "undefined" &&
  typeof document !== "undefined";

export function getCookiePreference() {
  try {
    return window.localStorage.getItem(COOKIE_CONSENT_KEY) ?? "";
  } catch {
    return "";
  }
}

export function subscribeCookiePreference(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener(COOKIE_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(COOKIE_CHANGE_EVENT, callback);
  };
}

export function storeCookiePreference(choice) {
  window.localStorage.setItem(COOKIE_CONSENT_KEY, choice);
  window.dispatchEvent(new Event(COOKIE_CHANGE_EVENT));
}

export function hasAnalyticsConsent() {
  return getCookiePreference() === "accepted";
}

export function initGoogleAnalytics() {
  if (!hasAnalyticsConsent() || !canUseAnalytics()) {
    return false;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}"]`)) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
    document.head.appendChild(script);
  }

  if (!isInitialized) {
    window.gtag("js", new Date());
    window.gtag("config", GOOGLE_ANALYTICS_ID, { send_page_view: false });
    isInitialized = true;
  }

  return true;
}

export function trackPageView(pagePath = `${window.location.pathname}${window.location.search}`) {
  const path = pagePath.split("#", 1)[0];
  if (path !== currentPagePath) {
    currentPagePath = path;
    hasTrackedCurrentPage = false;
  }

  // Remember navigation even without consent, but never queue past pages for
  // later transmission. A -> B -> A is a new visit; a repeated effect, hash
  // jump, or consent toggle while staying on A is not.
  if (hasTrackedCurrentPage || !hasAnalyticsConsent() || !initGoogleAnalytics()) {
    return false;
  }

  window.gtag("event", "page_view", {
    page_path: path,
    page_location: `${window.location.origin}${path}`,
    page_title: document.title,
  });
  hasTrackedCurrentPage = true;
  return true;
}
