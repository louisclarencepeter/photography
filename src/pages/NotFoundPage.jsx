import { NavLink } from "react-router-dom";
import { usePageMeta } from "../hooks";

function NotFoundPage() {
  usePageMeta({
    title: "Not found — Louis Peter Photography",
    description: "The page you are looking for could not be found."
  });

  return (
    <div className="page-shell">
      <span className="eyebrow">
        <span className="bullet" aria-hidden="true" />
        404
      </span>
      <h1>
        This frame <span className="it">wasn&apos;t taken.</span>
      </h1>
      <p className="lead">
        The page you&apos;re after has moved or never existed. Try the home page or the
        gallery instead.
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

export default NotFoundPage;
