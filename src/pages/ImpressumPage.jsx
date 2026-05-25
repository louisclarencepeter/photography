import { legalSections } from "../data/siteData";
import { usePageMeta } from "../hooks";

function ImpressumPage() {
  usePageMeta({
    title: "Impressum — Louis Peter Photography",
    description:
      "Rechtliche Angaben und Kontaktdaten für Louis Peter Photography in Frankfurt am Main.",
    lang: "de"
  });

  return (
    <div className="page-shell">
      <span className="eyebrow">
        <span className="bullet" aria-hidden="true" />
        Legal
      </span>
      <h1>
        Impressum<span className="it"> &amp; legal.</span>
      </h1>
      <p className="lead">
        Legal information and contact details for Louis Peter Photography.
      </p>

      <article className="legal-card">
        {legalSections.map((section) => (
          <section key={section.heading} className="legal-section">
            <h3>{section.heading}</h3>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </article>
    </div>
  );
}

export default ImpressumPage;
