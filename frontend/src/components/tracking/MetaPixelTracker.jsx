import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getSiteSettings } from '../../utils/siteSettings';
import { getConsent, onConsent } from '../../utils/consent';
import { loadMetaPixel, pixelAllowedHere, trackMetaPageView } from '../../utils/metaPixel';

const consentRequired = (theme) => String(theme?.enableCookieConsent ?? 'Yes') !== 'No';

/**
 * Loads Meta Pixel from Theme Options once the visitor accepts cookies (or right away
 * when the cookie banner is switched off), then sends PageView on route changes.
 */
const MetaPixelTracker = () => {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const firstHit = useRef(true);

  useEffect(() => {
    if (!pixelAllowedHere()) return undefined;
    let pixelId = null;
    let needsConsent = true;
    const tryLoad = () => {
      if (pixelId && (!needsConsent || getConsent() === 'granted') && loadMetaPixel(pixelId)) setReady(true);
    };
    getSiteSettings().then((s) => {
      pixelId = s.theme?.facebookPixelId;
      needsConsent = consentRequired(s.theme);
      tryLoad();
    });
    return onConsent(tryLoad);
  }, []);

  useEffect(() => {
    if (!ready) return;
    // loadMetaPixel already sent the first PageView.
    if (firstHit.current) {
      firstHit.current = false;
      return;
    }
    trackMetaPageView(location.pathname);
  }, [ready, location.pathname, location.search]);

  return null;
};

export default MetaPixelTracker;
