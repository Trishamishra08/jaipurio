import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

/** Renders one `[ads key="XXX"][/ads]` shortcode as a clickable ad banner, tracking impressions/clicks. */
const AdSlot = ({ code }) => {
  const [ad, setAd] = useState(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/ads/shortcode/${code}`)
      .then((res) => {
        if (!cancelled) setAd(res.data?.data || null);
      })
      .catch(() => {
        if (!cancelled) setHidden(true);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (hidden || !ad) return null;

  const handleClick = () => {
    api.post(`/ads/shortcode/${code}/click`).catch(() => {});
  };

  const img = <img src={ad.image} alt={ad.title || 'Advertisement'} className="w-full h-auto rounded-md" loading="lazy" />;

  return (
    <span className="block my-4">
      {ad.link ? (
        <a href={ad.link} onClick={handleClick} target="_blank" rel="noopener noreferrer sponsored">
          {img}
        </a>
      ) : (
        img
      )}
    </span>
  );
};

export default AdSlot;
