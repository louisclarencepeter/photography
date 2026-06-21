function ResponsiveImage({ picture, alt, className, sizes, loading, decoding = "async", ...rest }) {
  const sources = picture.sources ?? {};
  const fallback = picture.img ?? {};
  const jpegSource = sources.jpg ?? sources.jpeg;

  return (
    <picture>
      {sources.avif && <source type="image/avif" srcSet={sources.avif} sizes={sizes} />}
      {sources.webp && <source type="image/webp" srcSet={sources.webp} sizes={sizes} />}
      {jpegSource && <source type="image/jpeg" srcSet={jpegSource} sizes={sizes} />}
      <img
        src={fallback.src}
        width={fallback.w}
        height={fallback.h}
        alt={alt}
        loading={loading}
        decoding={decoding}
        sizes={sizes}
        className={className}
        {...rest}
      />
    </picture>
  );
}

export default ResponsiveImage;
