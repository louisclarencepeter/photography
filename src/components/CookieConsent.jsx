import { useEffect, useState, useSyncExternalStore } from "react";
import { NavLink } from "react-router-dom";

const STORAGE_KEY = "lp-cookie-consent";
const COOKIE_CHANGE_EVENT = "lp-cookie-consent-change";

function getCookiePreference() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribeCookiePreference(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener(COOKIE_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(COOKIE_CHANGE_EVENT, callback);
  };
}

function storeCookiePreference(choice) {
  window.localStorage.setItem(STORAGE_KEY, choice);
  window.dispatchEvent(new Event(COOKIE_CHANGE_EVENT));
}

function CookieConsent() {
  const preference = useSyncExternalStore(subscribeCookiePreference, getCookiePreference, () => "");
  // Delay-render the banner so first paint isn't counted as a layout shift.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (preference) return undefined;

    const id = window.setTimeout(() => setVisible(true), 1500);
    return () => window.clearTimeout(id);
  }, [preference]);

  function handlePreference(choice) {
    storeCookiePreference(choice);
  }

  if (preference) return null;

  return (
    <aside
      className={`cookie-consent${visible ? " is-visible" : ""}`}
      aria-label="Cookie consent"
      aria-hidden={!visible}
    >
      <p>
        This site uses essential browser storage to remember your preferences.{" "}
        <NavLink to="/impressum">Read our privacy notice</NavLink>.
      </p>
      <div className="cookie-actions">
        <button type="button" className="decline" onClick={() => handlePreference("necessary")}>
          Only necessary
        </button>
        <button type="button" className="accept" onClick={() => handlePreference("accepted")}>
          Accept
        </button>
      </div>
    </aside>
  );
}

export default CookieConsent;
