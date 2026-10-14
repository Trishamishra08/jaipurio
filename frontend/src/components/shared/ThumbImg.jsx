import React, { useEffect, useState } from 'react';

const MEDIA_BASE = (import.meta.env.VITE_MEDIA_BASE_URL || 'https://minio-jaipurio.sakha.cloud/jaipurio/').replace(/\/?$/, '/');
const LEGACY_BASE = 'https://jaipurio.in/storage/';
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const WIDTHS = [200, 400, 800];
const THUMBABLE = /\.(jpe?g|png|webp|gif|avif)$/i;

const keyOf = (src) => {
  if (typeof src !== 'string') return null;
  const clean = src.split('?')[0];
  const base = clean.startsWith(MEDIA_BASE) ? MEDIA_BASE : clean.startsWith(LEGACY_BASE) ? LEGACY_BASE : null;
  if (!base) return null;
  try {
    return decodeURIComponent(clean.slice(base.length));
  } catch {
    return null;
  }
};

const encodeKey = (key) => key.split('/').map(encodeURIComponent).join('/');

/**
 * The sources to try, in order: the WebP thumbnail straight from MinIO, the
 * API (which creates that thumbnail on first request), then the original.
 * Anything that is not a catalog image in our bucket is used as-is.
 * Mirrors thumbKeyFor() in backend/utils/minioStorage.js.
 */
export const thumbSources = (src, width = 400) => {
  const key = keyOf(src);
  if (!key || !THUMBABLE.test(key) || key.startsWith('customers/') || key.startsWith('thumbs/')) return [src];
  const w = WIDTHS.find((x) => x >= width) || WIDTHS[WIDTHS.length - 1];
  const original = MEDIA_BASE + encodeKey(key);
  return [
    `${MEDIA_BASE}thumbs/${w}/${encodeKey(key.replace(/\.[^./]+$/, ''))}.webp`,
    `${API_URL}/media/thumb?w=${w}&src=${encodeURIComponent(original)}`,
    original,
  ];
};

/** <img> that loads a small WebP thumbnail of a catalog image, falling back step by step. */
const ThumbImg = ({ src, width = 400, alt = '', loading = 'lazy', ...rest }) => {
  const sources = thumbSources(src, width);
  const [index, setIndex] = useState(0);

  useEffect(() => setIndex(0), [src]);

  if (!src) return null;
  return (
    <img
      src={sources[Math.min(index, sources.length - 1)]}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setIndex((i) => (i < sources.length - 1 ? i + 1 : i))}
      {...rest}
    />
  );
};

export default ThumbImg;
