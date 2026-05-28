import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { mobileMenuThumbs, socialLinks } from "../data/siteData";
import { useActiveSection } from "../hooks";
import CookieConsent from "./CookieConsent";
import ThemeToggle from "./ThemeToggle";

const NAV_ITEMS = [
  { id: "services", label: "Services" },
  { id: "work", label: "Work" },
  { id: "about", label: "About" },
  { id: "words", label: "Words" },
  { id: "contact", label: "Contact" }
];

const MOBILE_MENU_ITEMS = [
  { id: "work", label: "Selected work", italic: "Selected", rest: "work", thumb: "work" },
  { id: "services", label: "Services", thumb: "services" },
  { id: "about", label: "About me", italic: "About", rest: "me", thumb: "about" },
  { id: "words", label: "Kind words", thumb: "words" },
  { id: "contact", label: "Say hello", italic: "Say", rest: "hello", thumb: "contact" }
];

function hrefFor(id, isHome) {
  return isHome ? `#${id}` : `/#${id}`;
}

function SiteLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const activeSection = useActiveSection(location.pathname);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollLockRef = useRef({ scrollY: 0, url: "" });

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const root = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    scrollLockRef.current = { scrollY, url: window.location.href };

    const previous = {
      rootOverflow: root.style.overflow,
      rootOverscrollBehavior: root.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyOverscrollBehavior: body.style.overscrollBehavior,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width
    };

    root.style.overflow = "hidden";
    root.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    return () => {
      root.style.overflow = previous.rootOverflow;
      root.style.overscrollBehavior = previous.rootOverscrollBehavior;
      body.style.overflow = previous.bodyOverflow;
      body.style.overscrollBehavior = previous.bodyOverscrollBehavior;
      body.style.position = previous.bodyPosition;
      body.style.top = previous.bodyTop;
      body.style.left = previous.bodyLeft;
      body.style.right = previous.bodyRight;
      body.style.width = previous.bodyWidth;

      if (window.location.href === scrollLockRef.current.url) {
        window.scrollTo(0, scrollLockRef.current.scrollY);
      }
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeMenu();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeMenu, isMenuOpen]);

  return (
    <div className="site-shell" id="top">
      <a href="#main" className="skip-link">Skip to content</a>

      <header className={`site-header${isMenuOpen ? " menu-open" : ""}`}>
        <NavLink to="/" className="brand" onClick={closeMenu} aria-label="Louis Peter Photography home">
          <span className="mark" aria-hidden="true" />
          <span className="name">Louis <em>Peter</em></span>
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
            href={hrefFor("contact", isHome)}
            className="nav-cta"
          >
            <span className="label-full">Book a session</span>
            <span className="label-short">Book</span>
            <span className="arrow" aria-hidden="true">↗</span>
          </a>
        </div>

        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span className="bar" />
        </button>
      </header>

      <div className={`mobile-menu-layer${isMenuOpen ? " is-open" : ""}`} aria-hidden={!isMenuOpen}>
        <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile navigation">
          <div className="mobile-menu-curtain" aria-hidden="true" />

          <div className="mobile-menu-head">
            <span className="mobile-menu-eyebrow"><span className="dot" aria-hidden="true" />Menu · open</span>
            <span className="mobile-menu-eyebrow">Frankfurt · CEST</span>
          </div>

          <ul className="mobile-menu-list">
            {MOBILE_MENU_ITEMS.map((item, index) => (
              <li className="mobile-menu-item" key={item.id}>
                <a
                  href={hrefFor(item.id, isHome)}
                  className={`mobile-menu-link${isHome && activeSection === item.id ? " active" : ""}`}
                  aria-current={isHome && activeSection === item.id ? "page" : undefined}
                  aria-label={item.label}
                  onClick={closeMenu}
                  tabIndex={isMenuOpen ? 0 : -1}
                >
                  <span className="mobile-menu-count">{String(index + 1).padStart(2, "0")}</span>
                  <span className="mobile-menu-label">
                    {item.italic ? (
                      <>
                        <span className="it">{item.italic}</span> {item.rest}
                      </>
                    ) : item.label}
                  </span>
                  <span className={`mobile-menu-thumb ${item.thumb}`} aria-hidden="true">
                    {mobileMenuThumbs[item.thumb] && (
                      <img
                        src={mobileMenuThumbs[item.thumb].img.src}
                        alt=""
                        loading="lazy"
                      />
                    )}
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <div className="mobile-menu-foot">
            <a
              href={hrefFor("contact", isHome)}
              className="mobile-menu-cta"
              onClick={closeMenu}
              tabIndex={isMenuOpen ? 0 : -1}
            >
              <span>Book a session</span>
              <span className="arrow" aria-hidden="true">↗</span>
            </a>

            <div className="mobile-menu-scribble" aria-hidden="true">
              booking summer<br />&amp; autumn 2026
              <svg viewBox="0 0 60 36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 18 Q 20 4, 38 18 T 56 22" />
                <path d="M48 14 L 56 22 L 50 28" />
              </svg>
            </div>

            <div className="mobile-menu-contact">
              <div>
                <div className="h">Write to me</div>
                <a href="mailto:louisclarencepeters@gmail.com" onClick={closeMenu} tabIndex={isMenuOpen ? 0 : -1}>
                  louisclarencepeters@gmail.com
                </a>
                <div>+49 176 82 11 37 05</div>
              </div>
              <div>
                <div className="h">Elsewhere</div>
                <div className="mobile-menu-socials" aria-label="Social links">
                  <NavLink to="/gallery" onClick={closeMenu} tabIndex={isMenuOpen ? 0 : -1}>
                    Gallery <span aria-hidden="true">↗</span>
                  </NavLink>
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      onClick={closeMenu}
                      tabIndex={isMenuOpen ? 0 : -1}
                    >
                      {link.label} <span aria-hidden="true">↗</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="mobile-menu-meta">
              <span>© Louis Peter · {new Date().getFullYear()}</span>
              <span>Vol. IV</span>
            </div>
          </div>
        </nav>
      </div>

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
            <h3>Studio</h3>
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
            <h3>Sitemap</h3>
            <ul>
              <li><a href={hrefFor("services", isHome)}>Services</a></li>
              <li><a href={hrefFor("work", isHome)}>Work</a></li>
              <li><a href={hrefFor("about", isHome)}>About</a></li>
              <li><a href={hrefFor("contact", isHome)}>Contact</a></li>
              <li><NavLink to="/gallery">Gallery</NavLink></li>
            </ul>
          </div>
          <div>
            <h3>Elsewhere</h3>
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
