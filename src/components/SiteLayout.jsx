import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { socialLinks } from "../data/siteData";
import { useActiveSection } from "../hooks";
import CookieConsent from "./CookieConsent";
import ThemeToggle from "./ThemeToggle";

const NAV_ITEMS = [
  { id: "work", label: "Work" },
  { id: "services", label: "Services" },
  { id: "about", label: "About" },
  { id: "words", label: "Words" },
  { id: "contact", label: "Contact" }
];

function hrefFor(id, isHome) {
  return isHome ? `#${id}` : `/#${id}`;
}

function SiteLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const activeSection = useActiveSection(location.pathname);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    closeMenu();
  }, [location.pathname, closeMenu]);

  const elsewhere = socialLinks.find((link) => link.icon === "instagram");

  return (
    <div className="site-shell" id="top">
      <a href="#main" className="skip-link">Skip to content</a>

      <header className={`site-header${isMenuOpen ? " menu-open" : ""}`}>
        <NavLink to="/" className="brand" onClick={closeMenu} aria-label="Louis Peter Photography home">
          <span className="mark" aria-hidden="true" />
        </NavLink>

        <nav className="nav-links" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={hrefFor(item.id, isHome)}
              className={isHome && activeSection === item.id ? "active" : undefined}
              onClick={closeMenu}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <ThemeToggle />
          <a
            href={elsewhere?.href ?? "#contact"}
            className="nav-cta"
            target={elsewhere ? "_blank" : undefined}
            rel={elsewhere ? "noreferrer" : undefined}
          >
            <span className="label-full">Book a session</span>
            <span className="label-short">Book</span>
            <span className="arrow" aria-hidden="true">↗</span>
          </a>
        </div>

        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span className="bar" />
        </button>
      </header>

      <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile navigation">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.id}
            href={hrefFor(item.id, isHome)}
            className={isHome && activeSection === item.id ? "active" : undefined}
            onClick={closeMenu}
          >
            {item.label}
          </a>
        ))}
        <NavLink to="/gallery" onClick={closeMenu}>Gallery</NavLink>
      </nav>

      <main id="main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="foot-grid">
          <div>
            <div className="foot-brand">Louis Peter<em>.</em></div>
            <p className="foot-tagline">
              Frankfurt-based photographer &amp; filmmaker. Available worldwide for stories worth keeping.
            </p>
          </div>
          <div>
            <h4>Studio</h4>
            <ul>
              <li>Ludwig-Landmann-Str. 190</li>
              <li>60488 Frankfurt</li>
              <li>+49 176 82 11 37 05</li>
              <li>
                <a href="mailto:louisclarencepeters@gmail.com">louisclarencepeters@gmail.com</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Sitemap</h4>
            <ul>
              <li><a href={hrefFor("work", isHome)}>Work</a></li>
              <li><a href={hrefFor("services", isHome)}>Services</a></li>
              <li><a href={hrefFor("about", isHome)}>About</a></li>
              <li><a href={hrefFor("contact", isHome)}>Contact</a></li>
              <li><NavLink to="/gallery">Gallery</NavLink></li>
            </ul>
          </div>
          <div>
            <h4>Elsewhere</h4>
            <ul>
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} target="_blank" rel="noreferrer">
                    {link.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <div>
            © {new Date().getFullYear()} Louis Peter Photography. All photographs are mine —
            please don&apos;t borrow without asking.
          </div>
          <div>
            <NavLink to="/impressum">Impressum</NavLink>
          </div>
        </div>
      </footer>

      <CookieConsent />
    </div>
  );
}

export default SiteLayout;
