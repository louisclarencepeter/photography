import { useEffect, useState } from "react";
import { testimonials } from "../data/siteData";
import { usePrefersReducedMotion } from "../hooks";
import ResponsiveImage from "./ResponsiveImage";

const ROTATE_MS = 7000;

function Testimonials() {
  const [index, setIndex] = useState(0);
  // Picking a quote by hand means the visitor is reading deliberately — stop
  // yanking the text out from under them for the rest of the visit.
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocusWithin, setHasFocusWithin] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const isPaused = isPinned || isHovered || hasFocusWithin || prefersReducedMotion;

  useEffect(() => {
    if (isPaused) return undefined;

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % testimonials.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [isPaused]);

  function selectTestimonial(next) {
    setIndex(next);
    setIsPinned(true);
  }

  const current = testimonials[index];

  return (
    <section className="testify-bg" id="words" aria-labelledby="words-heading">
      <div
        className="testify reveal"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocusCapture={() => setHasFocusWithin(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setHasFocusWithin(false);
          }
        }}
      >
        <span className="eyebrow">
          <span className="bullet" aria-hidden="true" />
          Kind words · 04
        </span>
        {/* The design leads with the quote itself, but #words is a nav target and
            needs a heading in the document outline like every other section. */}
        <h2 id="words-heading" className="sr-only">Kind words from clients</h2>
        <blockquote
          key={`q-${index}`}
          dangerouslySetInnerHTML={{ __html: `&ldquo;${current.quote}&rdquo;` }}
        />
        <div className="who" key={`w-${index}`}>
          <ResponsiveImage
            picture={current.avatar}
            alt=""
            loading="lazy"
            sizes="40px"
          />
          <div>
            <div className="n">{current.name}</div>
            <div className="r">{current.role}</div>
          </div>
        </div>
        <div className="testify-dots" role="group" aria-label="Choose a testimonial">
          {testimonials.map((testimonial, i) => (
            <button
              key={testimonial.name}
              type="button"
              aria-pressed={i === index}
              aria-label={`Show the testimonial from ${testimonial.name}`}
              className={i === index ? "active" : undefined}
              onClick={() => selectTestimonial(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
