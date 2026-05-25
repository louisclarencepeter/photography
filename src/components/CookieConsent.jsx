import { useState } from "react";
import { NavLink } from "react-router-dom";

function CookieConsent() {
  const [preference, setPreference] = useState(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("lp-cookie-consent");
  });

  function handlePreference(choice) {
    window.localStorage.setItem("lp-cookie-consent", choice);
    setPreference(choice);
  }

  if (preference) return null;

  return (
    <aside className="cookie-consent" aria-label="Cookie consent">
      <p>
        This site uses essential browser storage to remember your preferences.{" "}
        <NavLink to="/impressum">More info</NavLink>.
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
