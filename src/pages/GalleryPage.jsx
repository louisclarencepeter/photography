import { useMemo, useState } from "react";
import { galleryCategories, galleryImages } from "../data/siteData";
import { usePageMeta } from "../hooks";
import ResponsiveImage from "../components/ResponsiveImage";
import Lightbox from "../components/Lightbox";

function GalleryPage() {
  usePageMeta({
    title: "Gallery — Louis Peter Photography",
    description:
      "Selected portrait, wedding, aerial, wildlife, and architecture photographs from the Louis Peter Photography portfolio."
  });

  const [activeCategory, setActiveCategory] = useState("all");
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const filteredImages = useMemo(() => {
    if (activeCategory === "all") return galleryImages;
    return galleryImages.filter((image) => image.category === activeCategory);
  }, [activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts = { all: galleryImages.length };
    for (const image of galleryImages) {
      counts[image.category] = (counts[image.category] ?? 0) + 1;
    }
    return counts;
  }, []);

  function handleCategoryChange(categoryId) {
    setActiveCategory(categoryId);
    setLightboxIndex(null);
  }

  const closeLightbox = () => setLightboxIndex(null);
  const showNext = () => setLightboxIndex((i) => (i + 1) % filteredImages.length);
  const showPrev = () =>
    setLightboxIndex((i) => (i - 1 + filteredImages.length) % filteredImages.length);

  return (
    <div className="gallery-page">
      <span className="eyebrow">
        <span className="bullet" aria-hidden="true" />
        Archive
      </span>
      <h1 style={{
        fontFamily: "var(--serif)",
        fontWeight: 400,
        fontSize: "clamp(48px, 6vw, 96px)",
        lineHeight: 0.95,
        letterSpacing: "-0.025em",
        margin: "18px 0 16px",
        maxWidth: "16ch"
      }}>
        Frames I&apos;ve <span className="it" style={{ color: "var(--terra)", fontStyle: "italic" }}>kept.</span>
      </h1>
      <p className="lead" style={{
        maxWidth: "48ch",
        color: "var(--forest-soft)",
        fontSize: 17,
        lineHeight: 1.55,
        margin: 0
      }}>
        Portrait, wedding, aerial, wildlife, and architecture work from the last few
        seasons. Tap a frame to see it larger.
      </p>

      <div className="gallery-filters" role="tablist" aria-label="Filter gallery by category">
        {galleryCategories.map((category) => {
          const count = categoryCounts[category.id] ?? 0;
          const isActive = activeCategory === category.id;
          const isDisabled = count === 0;

          return (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="gallery-grid"
              className={`gallery-filter${isActive ? " is-active" : ""}`}
              onClick={() => handleCategoryChange(category.id)}
              disabled={isDisabled}
            >
              {category.label}
              <span className="gallery-filter-count" aria-hidden="true">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="gallery-columns" id="gallery-grid">
        {filteredImages.map((galleryImage, index) => (
          <figure key={index} className="gallery-tile">
            <button
              type="button"
              className="gallery-tile-button"
              onClick={() => setLightboxIndex(index)}
              aria-label={`View ${galleryImage.alt} larger`}
            >
              <ResponsiveImage
                picture={galleryImage.picture}
                alt={galleryImage.alt}
                sizes="(max-width: 680px) 100vw, (max-width: 960px) 50vw, 33vw"
                loading="lazy"
              />
            </button>
          </figure>
        ))}
      </div>

      {filteredImages.length === 0 && (
        <p className="gallery-empty">No photographs in this category yet.</p>
      )}

      <div className="gallery-foot">
        <a href="#top" className="back-to-top">Back to top ↑</a>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={filteredImages}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={showPrev}
          onNext={showNext}
        />
      )}
    </div>
  );
}

export default GalleryPage;
