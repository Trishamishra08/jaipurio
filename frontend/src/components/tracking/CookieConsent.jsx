import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSiteSettings } from '../../utils/siteSettings';
import { getConsent, setConsent } from '../../utils/consent';
import { isInApp } from '../../utils/appContext';

const PRIVATE_PATH = /^\/(admin|vendor|seller)(\/|$)/;

const POSITION = {
  Bottom: 'left-3 right-3 bottom-3',
  'Bottom Left': 'left-3 bottom-3 max-w-sm',
  'Bottom Right': 'right-3 bottom-3 max-w-sm',
  Top: 'left-3 right-3 top-3',
};

/** Cookie banner. All text and the on/off switch come from Admin → Theme Options → Cookie Consent. */
const CookieConsent = () => {
  const [cfg, setCfg] = useState(null);

  useEffect(() => {
    if (getConsent() || isInApp() || PRIVATE_PATH.test(window.location.pathname)) return undefined;
    let cancelled = false;
    getSiteSettings().then((s) => {
      const t = s.theme || {};
      if (cancelled || String(t.enableCookieConsent ?? 'Yes') === 'No' || !t.cookieMessage) return;
      setCfg(t);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!cfg) return null;
  const choose = (v) => {
    setConsent(v);
    setCfg(null);
  };
  const privacy = cfg.cookiePrivacyUrl || '';

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className={`fixed z-[9999] ${POSITION[cfg.cookiePosition] || POSITION.Bottom} rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-lg`}
    >
      <p className="mb-3 leading-relaxed">
        {cfg.cookieMessage}{' '}
        {privacy.startsWith('/') && (
          <Link to={privacy} className="underline">
            Privacy policy
          </Link>
        )}
      </p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => choose('denied')} className="rounded-lg border border-gray-300 px-4 py-2 font-medium">
          {cfg.cookieDeclineBtn || 'Decline'}
        </button>
        <button type="button" onClick={() => choose('granted')} className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white">
          {cfg.cookieAcceptBtn || 'Accept'}
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
