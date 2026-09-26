import { useEffect } from 'react';
import api from '../../utils/api';

/** Injects the admin-configured Google AdSense snippet into <head> once, site-wide. Renders nothing. */
const AdsenseInjector = () => {
  useEffect(() => {
    let cancelled = false;
    api
      .get('/ads/settings/public')
      .then((res) => {
        if (cancelled) return;
        const { enableAds, headerScript, adsenseClientId } = res.data?.data || {};
        if (!enableAds) return;

        if (headerScript && !document.getElementById('adsense-header-script')) {
          const container = document.createElement('div');
          container.innerHTML = headerScript;
          const script = container.querySelector('script');
          if (script) {
            const tag = document.createElement('script');
            tag.id = 'adsense-header-script';
            Array.from(script.attributes).forEach((attr) => tag.setAttribute(attr.name, attr.value));
            tag.textContent = script.textContent;
            document.head.appendChild(tag);
          }
        } else if (adsenseClientId && !document.getElementById('adsense-header-script')) {
          const tag = document.createElement('script');
          tag.id = 'adsense-header-script';
          tag.async = true;
          tag.crossOrigin = 'anonymous';
          tag.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`;
          document.head.appendChild(tag);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
};

export default AdsenseInjector;
