import { useEffect, useRef } from "react";
import ResponsiveImage from "./ResponsiveImage";

const SWIPE_THRESHOLD = 50;
const VERTICAL_TOLERANCE = 80;

function Lightbox({ images, index, onClose, onPrev, onNext }) {
  const touchStartRef = useRef(null);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft") {
        onPrev();
      } else if (event.key === "ArrowRight") {
        onNext();
      } else if (event.key === "Tab") {
        // Focus trap: cycle between interactive elements inside the lightbox
        const focusable = dialogRef.current?.querySelectorAll(
          'button, [href], [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onPrev, onNext]);

  // One effect owns the whole focus lifecycle. It has to read the opener *before*
  // moving focus to the close button — a ref callback that focused on attach
  // would run first and make this capture the close button instead. Deps stay
  // empty on purpose: the parents pass fresh arrow functions every render, so
  // anything keyed on those would re-run (and re-steal focus) on each arrow key.
  useEffect(() => {
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;

      // Send keyboard users back to the exact thumbnail they opened, rather
      // than dropping focus on <body> and losing their place in the grid.
      if (opener instanceof HTMLElement && document.contains(opener)) {
        opener.focus({ preventScroll: true });
      }
    };
  }, []);

  function handleTouchStart(event) {
    if (event.touches.length !== 1) {
      touchStartRef.current = null;
      return;
    }
    touchStartRef.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    };
  }

  function handleTouchEnd(event) {
    const start = touchStartRef.current;
    touchStartRef.current = null;

    if (!start || event.changedTouches.length === 0) {
      return;
    }

    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;

    if (Math.abs(dy) > VERTICAL_TOLERANCE) {
      return;
    }

    if (dx <= -SWIPE_THRESHOLD) {
      onNext();
    } else if (dx >= SWIPE_THRESHOLD) {
      onPrev();
    }
  }

  const current = images[index];

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Photograph viewer"
      ref={dialogRef}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="lightbox-stage" onClick={(event) => event.stopPropagation()}>
        <ResponsiveImage
          picture={current.picture}
          alt={current.alt}
          sizes="100vw"
          className="lightbox-image"
        />
      </div>

      <button
        type="button"
        className="lightbox-control lightbox-prev"
        onClick={(event) => {
          event.stopPropagation();
          onPrev();
        }}
        aria-label="Previous photograph"
      >
        ‹
      </button>
      <button
        type="button"
        className="lightbox-control lightbox-next"
        onClick={(event) => {
          event.stopPropagation();
          onNext();
        }}
        aria-label="Next photograph"
      >
        ›
      </button>
      <button
        type="button"
        className="lightbox-control lightbox-close"
        ref={closeRef}
        onClick={onClose}
        aria-label="Close viewer"
      >
        ×
      </button>

      <p className="lightbox-counter" aria-live="polite">
        {index + 1} / {images.length}
      </p>
    </div>
  );
}

export default Lightbox;
