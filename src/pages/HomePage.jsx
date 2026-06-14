import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  aboutDetails,
  bentoImages,
  btsImages,
  btsVideo,
  heroAvatars,
  heroCards,
  heroStats,
  marqueeItems,
  offerings,
  serviceCategories,
  watchFeatures,
  watchShorts
} from "../data/siteData";
import { usePageMeta, useRevealOnScroll } from "../hooks";
import ResponsiveImage from "../components/ResponsiveImage";
import Lightbox from "../components/Lightbox";
import Testimonials from "../components/Testimonials";

const MARQUEE_REPEATS = 3;
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function HomePage() {
  useRevealOnScroll();
  usePageMeta({
    title: "Louis Peter Photography",
    description:
      "Frankfurt-based photographer & filmmaker. Weddings, portraits, families, and the moments that matter most."
  });

  const [activeCategory, setActiveCategory] = useState("all");
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [contactState, setContactState] = useState("idle"); // idle | sending | sent | error
  const [contactError, setContactError] = useState(null);
  const [turnstileReady, setTurnstileReady] = useState(!TURNSTILE_SITE_KEY);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const shortsRef = useRef(null);
  const turnstileRef = useRef(null);
  const turnstileWidgetRef = useRef(null);
  const [shortsScroll, setShortsScroll] = useState({ canPrev: false, canNext: true });

  useEffect(() => {
    const el = shortsRef.current;
    if (!el) return undefined;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setShortsScroll({
        canPrev: el.scrollLeft > 4,
        canNext: el.scrollLeft < max - 4
      });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return undefined;
    if (window.turnstile) {
      const id = window.setTimeout(() => setTurnstileReady(true), 0);
      return () => window.clearTimeout(id);
    }

    let cancelled = false;
    let script = document.querySelector(`script[src="${TURNSTILE_SCRIPT_SRC}"]`);

    const handleLoad = () => {
      if (!cancelled) setTurnstileReady(true);
    };
    const handleError = () => {
      if (!cancelled) {
        setTurnstileError("Verification could not load. Please refresh and try again.");
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.append(script);
    }

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    return () => {
      cancelled = true;
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };
  }, []);

  useEffect(() => {
    if (
      !TURNSTILE_SITE_KEY ||
      !turnstileReady ||
      !turnstileRef.current ||
      turnstileWidgetRef.current !== null ||
      !window.turnstile
    ) {
      return undefined;
    }

    const widgetId = window.turnstile.render(turnstileRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token) => {
        setTurnstileToken(token);
        setTurnstileError(null);
      },
      "error-callback": () => {
        setTurnstileToken("");
        setTurnstileError("Verification failed. Please retry it.");
      },
      "expired-callback": () => {
        setTurnstileToken("");
      }
    });

    turnstileWidgetRef.current = widgetId;

    return () => {
      if (window.turnstile && widgetId !== undefined) {
        window.turnstile.remove(widgetId);
      }
      turnstileWidgetRef.current = null;
    };
  }, [turnstileReady]);

  const scrollShorts = (dir) => {
    const el = shortsRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  function resetTurnstile() {
    if (!TURNSTILE_SITE_KEY || !window.turnstile || turnstileWidgetRef.current === null) {
      return;
    }

    window.turnstile.reset(turnstileWidgetRef.current);
    setTurnstileToken("");
  }

  async function handleContactSubmit(event) {
    event.preventDefault();
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setContactState("error");
      setContactError("Please complete the verification before sending.");
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: data.get("name")?.toString().trim() ?? "",
      email: data.get("email")?.toString().trim() ?? "",
      message: data.get("message")?.toString().trim() ?? "",
      botField: data.get("botField")?.toString() ?? "",
      turnstileToken
    };

    setContactState("sending");
    setContactError(null);

    try {
      const res = await fetch("/api/send-message", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        throw new Error(body.error ?? "Something went wrong.");
      }
      setContactState("sent");
      form.reset();
      resetTurnstile();
    } catch (err) {
      setContactState("error");
      setContactError(err.message ?? "Something went wrong.");
      resetTurnstile();
    }
  }

  const visibleOfferings = useMemo(() => {
    if (activeCategory === "all") return offerings;
    return offerings.filter((o) => o.category === activeCategory);
  }, [activeCategory]);

  const closeLightbox = () => setLightboxIndex(null);
  const showNext = () => setLightboxIndex((i) => (i + 1) % bentoImages.length);
  const showPrev = () =>
    setLightboxIndex((i) => (i - 1 + bentoImages.length) % bentoImages.length);

  const cardByRole = (role) => heroCards.find((c) => c.role === role);
  const heroMain = cardByRole("main");
  const heroSide = cardByRole("side");
  const heroFoot = cardByRole("foot");

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="hero" id="home">
        <div className="hero-left">
          <div className="hero-badge reveal-hero">
            <div className="avatars" aria-hidden="true">
              {heroAvatars.map((picture, i) => (
                <span key={i}>
                  <img src={picture.img.src} alt="" loading="eager" />
                </span>
              ))}
            </div>
            <span>Not booking shoots · practicing to stay sharp</span>
          </div>

          <h1 className="reveal-hero">
            Photographs<br />
            <span className="it">for the</span><br />
            <span className="underline">people you love</span>{" "}
            <span className="it">most.</span>
          </h1>

          <p className="sub reveal-hero">
            Weddings, portraits, and quiet little moments — captured in Frankfurt and
            wherever the light is good. Warm, honest, and made to be held onto.
          </p>

          <div className="hero-ctas reveal-hero">
            <a href="#contact" className="btn-primary">
              Let&apos;s make something
              <span className="arrow" aria-hidden="true">↗</span>
            </a>
            <a href="#work" className="btn-ghost">
              <span className="play" aria-hidden="true">▶</span>
              See the work
            </a>
          </div>

          <div className="hero-stats">
            {heroStats.map((stat) => (
              <div className="stat reveal-hero" key={stat.label}>
                <div className="n">
                  {stat.n}<span className="it">{stat.suffix}</span>
                </div>
                <div className="l">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-right" aria-hidden="true">
          {heroSide && (
            <div className="ph-card ph-side reveal-hero">
              <ResponsiveImage
                picture={heroSide.picture}
                alt=""
                sizes="(max-width: 880px) 40vw, 200px"
                loading="eager"
              />
              <div className="tag">{heroSide.tag}</div>
            </div>
          )}
          {heroMain && (
            <div className="ph-card ph-main reveal-hero">
              <ResponsiveImage
                picture={heroMain.picture}
                alt=""
                sizes="(max-width: 880px) 60vw, 360px"
                loading="eager"
              />
              <div className="tag">{heroMain.tag}</div>
            </div>
          )}
          {heroFoot && (
            <div className="ph-card ph-foot reveal-hero">
              <ResponsiveImage
                picture={heroFoot.picture}
                alt=""
                sizes="(max-width: 880px) 45vw, 220px"
                loading="eager"
              />
              <div className="tag">{heroFoot.tag}</div>
            </div>
          )}
          <div className="scribble handwrite">
            <span className="scribble-ink">made with care</span>
            <svg viewBox="0 0 70 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path pathLength="1" d="M5 20 Q 25 5, 45 20 T 65 24" />
              <path pathLength="1" d="M55 18 L 65 24 L 58 30" />
            </svg>
          </div>
        </div>
      </section>

      {/* ============ MARQUEE ============ */}
      <div className="strip" aria-hidden="true">
        <div className="strip-track">
          {Array.from({ length: MARQUEE_REPEATS }).map((_, repeat) => (
            <span className="strip-item" key={repeat}>
              {marqueeItems.map((item, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 60 }}>
                  {item.italic ? <em>{item.text}</em> : item.text}
                  <span className="star">✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ============ SERVICES ============ */}
      <section className="section" id="services">
        <div className="sec-head reveal">
          <div className="sec-head-row">
            <div>
              <span className="eyebrow">
                <span className="bullet" aria-hidden="true" />
                What I do · 01
              </span>
              <h2>
                Sessions, <span className="it">tailored to you.</span>
              </h2>
            </div>
            <p className="right">
              Each session is shaped around your story — your light, your pace, your people.
              Below are the most common starting points; everything can bend.
            </p>
          </div>
        </div>

        <div className="services">
          <div className="svc-pills" role="tablist" aria-label="Filter services">
            {serviceCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat.id}
                className={`svc-pill${activeCategory === cat.id ? " active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="svc-grid">
            {visibleOfferings.map((offering) => (
              <a key={offering.num} href="#contact" className="svc reveal">
                <ResponsiveImage
                  picture={offering.image}
                  alt={offering.title}
                  sizes="(max-width: 680px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  loading="lazy"
                />
                <div className="svc-overlay">
                  <div className="num">{offering.num}</div>
                  <div className="price">{offering.price}</div>
                  <h3>
                    {offering.title} <span className="it">{offering.flourish}</span>
                  </h3>
                  <p>{offering.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BENTO ============ */}
      <section className="section section--tight" id="work">
        <div className="sec-head reveal">
          <div className="sec-head-row">
            <div>
              <span className="eyebrow">
                <span className="bullet" aria-hidden="true" />
                Selected work · 02
              </span>
              <h2>
                Frames I keep <span className="it">coming back to.</span>
              </h2>
            </div>
            <p className="right">
              A small rotating collection from the last few seasons. Click any frame to
              see it full size — full archive available on the gallery page.
            </p>
          </div>
        </div>

        <div className="bento">
          {bentoImages.map((image, i) => (
            <figure key={i} className={`b ${image.cls} reveal`}>
              <button
                type="button"
                onClick={() => setLightboxIndex(i)}
                aria-label={`View ${image.caption} larger`}
              >
                <ResponsiveImage
                  picture={image.picture}
                  alt={image.caption}
                  sizes="(max-width: 880px) 50vw, 33vw"
                  loading="lazy"
                />
              </button>
              <span className="cap">{image.caption}</span>
            </figure>
          ))}
        </div>

        <div className="view-all">
          <NavLink to="/gallery" className="btn-primary">
            View the full archive
            <span className="arrow" aria-hidden="true">↗</span>
          </NavLink>
        </div>
      </section>

      {/* ============ BEHIND THE SCENES ============ */}
      <section className="section section--tight bts-section" id="bts">
        <div className="sec-head reveal">
          <div className="sec-head-row">
            <div>
              <span className="eyebrow">
                <span className="bullet" aria-hidden="true" />
                Behind the scenes · 02b
              </span>
              <h2>
                The bits <span className="it">between the shots.</span>
              </h2>
            </div>
            <p className="right">
              Right now I&apos;m not booking — just practicing to stay sharp.
              A few candid frames from recent test shoots and collaborations
              with friends.
            </p>
          </div>
        </div>

        <div className="bts-strip">
          {btsImages.map((image, i) => (
            <figure key={i} className={`bts-card ${image.cls} reveal`}>
              <ResponsiveImage
                picture={image.picture}
                alt={image.caption}
                sizes="(max-width: 880px) 80vw, 24vw"
                loading="lazy"
              />
              <figcaption className="bts-cap">{image.caption}</figcaption>
            </figure>
          ))}
        </div>

        <div className="bts-video reveal">
          {playingVideo === btsVideo.id ? (
            <iframe
              src={`https://www.youtube.com/embed/${btsVideo.id}?autoplay=1&playsinline=1&rel=0`}
              title={btsVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              className="watch-thumb"
              onClick={() => setPlayingVideo(btsVideo.id)}
              aria-label={`Play ${btsVideo.title}`}
            >
              <img
                src={`https://i.ytimg.com/vi/${btsVideo.id}/maxresdefault.jpg`}
                alt=""
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = `https://i.ytimg.com/vi/${btsVideo.id}/hqdefault.jpg`;
                }}
              />
              <span className="watch-play" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="watch-cap">{btsVideo.title}</span>
            </button>
          )}
        </div>
      </section>

      {/* ============ WATCH ============ */}
      <section className="section section--tight watch-section" id="watch">
        <div className="sec-head reveal">
          <div className="sec-head-row">
            <div>
              <span className="eyebrow">
                <span className="bullet" aria-hidden="true" />
                On YouTube · 02c
              </span>
              <h2>
                A few moving <span className="it">frames.</span>
              </h2>
            </div>
            <p className="right">
              Shorts from recent test shoots and side projects. Tap to play —
              or{" "}
              <a
                href="https://www.youtube.com/@louispeterphotography"
                target="_blank"
                rel="noreferrer"
              >
                see the channel ↗
              </a>
              .
            </p>
          </div>
        </div>

        <div className="watch-shorts-wrap">
          <button
            type="button"
            className={`watch-arrow watch-arrow--prev${shortsScroll.canPrev ? "" : " is-disabled"}`}
            onClick={() => scrollShorts(-1)}
            aria-label="Previous shorts"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            className={`watch-arrow watch-arrow--next${shortsScroll.canNext ? "" : " is-disabled"}`}
            onClick={() => scrollShorts(1)}
            aria-label="Next shorts"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        <div className="watch-strip watch-strip--shorts" ref={shortsRef}>
          {watchShorts.map((video) => (
            <div key={video.id} className="watch-card reveal">
              {playingVideo === video.id ? (
                <iframe
                  src={`https://www.youtube.com/embed/${video.id}?autoplay=1&playsinline=1&rel=0`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  className="watch-thumb"
                  onClick={() => setPlayingVideo(video.id)}
                  aria-label={`Play ${video.title}`}
                >
                  <img
                    src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                    alt=""
                    loading="lazy"
                  />
                  <span className="watch-play" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                  <span className="watch-cap">{video.title}</span>
                </button>
              )}
            </div>
          ))}
        </div>
        </div>

        <div className="watch-strip watch-strip--features">
          {watchFeatures.map((video) => (
            <div key={video.id} className="watch-card watch-card--wide reveal">
              {playingVideo === video.id ? (
                <iframe
                  src={`https://www.youtube.com/embed/${video.id}?autoplay=1&playsinline=1&rel=0`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  className="watch-thumb"
                  onClick={() => setPlayingVideo(video.id)}
                  aria-label={`Play ${video.title}`}
                >
                  <img
                    src={`https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
                    }}
                  />
                  <span className="watch-play" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                  <span className="watch-cap">{video.title}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ============ ABOUT ============ */}
      <section className="section about-section" id="about">
        <div className="about-wrap">
          <div className="about-img reveal">
            <span className="tape">hi, I&apos;m Louis</span>
            <ResponsiveImage
              picture={aboutDetails.portrait}
              alt="Louis Peter"
              sizes="(max-width: 880px) 100vw, 480px"
              loading="lazy"
            />
          </div>
          <div className="about-body reveal">
            <span className="eyebrow">
              <span className="bullet" aria-hidden="true" />
              About · 03
            </span>
            <h2>
              A patient eye <span className="it">for warm, honest pictures.</span>
            </h2>
            {aboutDetails.bio.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            <div className="about-meta">
              <div>
                <div className="k">9<span className="it">yrs</span></div>
                <div className="v">Photography</div>
              </div>
              <div>
                <div className="k">4<span className="it">yrs</span></div>
                <div className="v">Videography</div>
              </div>
              <div>
                <div className="k">Daily</div>
                <div className="v">Reply within 24h</div>
              </div>
            </div>

            <div className="signature">
              <div className="sig">— Louis</div>
              <div className="role">Photographer<br />&amp; Filmmaker</div>
            </div>
          </div>
        </div>
      </section>

      <Testimonials />

      {/* ============ CONTACT CTA + FORM ============ */}
      <section className="section" id="contact">
        <div className="cta-wrap reveal">
          <span className="eyebrow">
            <span className="bullet" aria-hidden="true" />
            Get in touch · 05
          </span>
          <h2>
            Let&apos;s make<br />
            something <span className="it">beautiful</span>
            <span className="arrow-inline" aria-hidden="true">
              <svg width="80" height="40" viewBox="0 0 80 40" fill="none" stroke="#c45a2e" strokeWidth="3" strokeLinecap="round">
                <path d="M5 30 Q 30 5, 60 20 T 75 22" />
                <path d="M65 15 L 75 22 L 67 30" />
              </svg>
            </span>{" "}
            together.
          </h2>
          <p>
            For weddings, portraits, films, and commissions — I&apos;d love to hear what
            you&apos;re dreaming up. Tell me a little about it and we&apos;ll go from there.
          </p>

          {contactState === "sent" ? (
            <div className="contact-success" role="status">
              <p className="contact-success-title">Thank you — your letter is on its way.</p>
              <p className="contact-success-body">
                I&apos;ll write back shortly, usually the same day.
              </p>
            </div>
          ) : (
            <form
              className="contact-form"
              onSubmit={handleContactSubmit}
              noValidate
            >
              <p className="hidden-field" aria-hidden="true">
                <label>
                  Don&apos;t fill this out if you&apos;re human:
                  <input name="botField" tabIndex={-1} autoComplete="off" />
                </label>
              </p>

              <div className="row">
                <div>
                  <label htmlFor="name">Your name</label>
                  <input id="name" name="name" type="text" required placeholder="As you'd like to be called" disabled={contactState === "sending"} />
                </div>
                <div>
                  <label htmlFor="email">Reply to</label>
                  <input id="email" name="email" type="email" required placeholder="you@elsewhere.com" disabled={contactState === "sending"} />
                </div>
              </div>

              <div>
                <label htmlFor="message">Tell me about it</label>
                <textarea id="message" name="message" rows="5" required placeholder="Date, place, feeling — and any links if you have them." disabled={contactState === "sending"} />
              </div>

              {TURNSTILE_SITE_KEY && (
                <div className="turnstile-box">
                  <div ref={turnstileRef} />
                  {turnstileError && (
                    <p className="contact-error" role="alert">{turnstileError}</p>
                  )}
                </div>
              )}

              {contactState === "error" && (
                <p className="contact-error" role="alert">{contactError}</p>
              )}

              <div className="submit-row">
                <button type="submit" className="btn-primary" disabled={contactState === "sending"}>
                  {contactState === "sending" ? "Sending…" : "Send the message"}
                  <span className="arrow" aria-hidden="true">↗</span>
                </button>
              </div>
            </form>
          )}

          <div className="scribble2 handwrite">
            <span className="scribble-ink">usually replies same day :)</span>
          </div>
        </div>
      </section>

      {lightboxIndex !== null && (
        <Lightbox
          images={bentoImages.map((b) => ({ picture: b.picture, alt: b.caption }))}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={showPrev}
          onNext={showNext}
        />
      )}
    </>
  );
}

export default HomePage;
