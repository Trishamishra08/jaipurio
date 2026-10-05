import React, { useState, useRef, useEffect } from 'react';

/**
 * OptimizedImage — drop-in <img> replacement with:
 *  1. Native lazy-loading (loading="lazy" + decoding="async")
 *  2. Smooth fade-in on load (no layout shift flicker)
 *  3. Cloudinary/MinIO on-the-fly resize via URL transform
 *  4. WebP format auto-negotiation for Cloudinary sources
 *  5. Optional blur-up placeholder
 */

const MINIO_HOST = 'minio-jaipurio.sakha.cloud';
const CLOUDINARY_HOST = 'res.cloudinary.com';

/**
 * For Cloudinary URLs, inject width / format transforms.
 * For MinIO URLs, there's no CDN resize — just pass through.
 * For everything else, pass through.
 */
function buildSrcSet(src, widths = [320, 480, 640, 800, 1200]) {
  if (!src) return { src, srcSet: undefined, sizes: undefined };

  // Cloudinary — inject w_ and f_webp transforms
  if (src.includes(CLOUDINARY_HOST) && src.includes('/upload/')) {
    const entries = widths.map((w) => {
      const optimized = src.replace(
        /\/upload\/(.*?)\//,
        `/upload/f_auto,q_auto:good,c_limit,w_${w}/`
      );
      return `${optimized} ${w}w`;
    });
    return {
      src: src.replace(/\/upload\/(.*?)\//, '/upload/f_auto,q_auto:good,c_limit,w_800/'),
      srcSet: entries.join(', '),
      sizes: '(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 400px',
    };
  }

  // No transform available — return as-is
  return { src, srcSet: undefined, sizes: undefined };
}

/**
 * @param {object} props
 * @param {string}  props.src
 * @param {string}  [props.alt]
 * @param {string}  [props.className]
 * @param {number}  [props.width]   — intrinsic / desired width for srcSet generation
 * @param {number}  [props.height]
 * @param {boolean} [props.eager]   — set true for above-the-fold hero images
 * @param {boolean} [props.fadeIn]  — default true, smooth opacity transition on load
 * @param {number[]} [props.widths] — custom srcSet breakpoints
 * @param {string}  [props.objectFit] — CSS object-fit value
 */
const OptimizedImage = ({
  src: rawSrc,
  alt = '',
  className = '',
  width,
  height,
  eager = false,
  fadeIn = true,
  widths,
  objectFit,
  style,
  ...rest
}) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  // If image was cached, it may load before useEffect — handle that
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [rawSrc]);

  const { src, srcSet, sizes } = buildSrcSet(rawSrc, widths);

  const mergedStyle = {
    ...(objectFit ? { objectFit } : {}),
    ...(fadeIn ? { opacity: loaded ? 1 : 0, transition: 'opacity 0.35s ease-in' } : {}),
    ...style,
  };

  return (
    <img
      ref={imgRef}
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : undefined}
      className={className}
      style={mergedStyle}
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)} // show broken-image icon rather than nothing
      {...rest}
    />
  );
};

export default OptimizedImage;
