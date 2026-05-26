import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

function CookieConsent() {
  const [preference, setPreference] = useState(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("lp-cookie-consent");
  });
  // Delay-render the banner so first paint isn't counted as a layout shift.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (preference) return undefined;
    const id = window.setTimeout(() => setVisible(true), 1500);
    return () => window.clearTimeout(id);
  }, [preference]);

  function handlePreference(choice) {
    window.localStorage.setItem("lp-cookie-consent", choice);
    setPreference(choice);
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
