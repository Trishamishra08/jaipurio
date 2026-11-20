import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getSiteSettings } from '../../utils/siteSettings';
import { gaAllowedHere, loadGa4, trackGaPageView } from '../../utils/ga4';

/** Loads GA4 from the admin setting and sends a page_view on every route change. Renders nothing. */
const Ga4Tracker = () => {
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!gaAllowedHere()) return undefined;
    let cancelled = false;
    getSiteSettings().then((s) => {
      if (!cancelled && loadGa4(s.googleAnalyticsId)) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Wait a tick so the new page's <title> is set before the hit is sent.
    if (!ready) return undefined;
    const t = setTimeout(() => trackGaPageView(), 300);
    return () => clearTimeout(t);
  }, [ready, location.pathname, location.search]);

  return null;
};

export default Ga4Tracker;
