import { useEffect, useState } from "react";
import { testimonials } from "../data/siteData";

function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % testimonials.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, []);

  const current = testimonials[index];

  return (
    <section className="testify-bg" id="words">
      <div className="testify reveal">
        <span className="eyebrow">
          <span className="bullet" aria-hidden="true" />
          Kind words · 04
        </span>
        <blockquote
          key={`q-${index}`}
          dangerouslySetInnerHTML={{ __html: `&ldquo;${current.quote}&rdquo;` }}
        />
        <div className="who" key={`w-${index}`}>
          <img src={current.avatar.img.src} alt="" loading="lazy" />
          <div>
            <div className="n">{current.name}</div>
            <div className="r">{current.role}</div>
          </div>
        </div>
        <div className="testify-dots" role="tablist" aria-label="Testimonial picker">
          {testimonials.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show testimonial ${i + 1}`}
              className={i === index ? "active" : undefined}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
