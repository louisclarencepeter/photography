import { NavLink } from "react-router-dom";
import { usePageMeta } from "../hooks";

function ThanksPage() {
  usePageMeta({
    title: "Thank you — Louis Peter Photography",
    description: "Thank you for getting in touch. I will reply as soon as I can."
  });

  return (
    <div className="page-shell">
      <span className="eyebrow">
        <span className="bullet" aria-hidden="true" />
        Letter received
      </span>
      <h1>
        Thank you <span className="it">— I&apos;ll write back soon.</span>
      </h1>
      <p className="lead">
        Your message is on its way to my inbox. I reply to most notes the same day —
        if you don&apos;t hear from me within 48 hours, please check your spam folder
        or drop me a line directly.
      </p>
      <div className="page-actions">
        <NavLink to="/" className="btn-primary">
          Back home
          <span className="arrow" aria-hidden="true">↗</span>
        </NavLink>
        <NavLink to="/gallery" className="btn-ghost">
          See the gallery
        </NavLink>
      </div>
    </div>
  );
}

export default ThanksPage;
