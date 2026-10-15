import { useEffect, useState } from 'react';
import api from './api';

// How an affiliate's referral link is put together. Admins change it in
// Admin → Affiliate Program → Referral link (saved as settings.affiliate).
//   {baseUrl}{landingPath}?{paramName}={code}
// baseUrl empty = use the site's own address.
export const AFFILIATE_LINK_DEFAULTS = { baseUrl: '', landingPath: '/home', paramName: 'ref' };

/** Clean up whatever was saved so a bad value can never produce a broken link. */
export const mergeAffiliateLink = (saved) => {
  const s = saved && typeof saved === 'object' ? saved : {};
  let baseUrl = typeof s.baseUrl === 'string' ? s.baseUrl.trim().replace(/\/+$/, '') : '';
  if (baseUrl && !/^https?:\/\//i.test(baseUrl)) baseUrl = '';
  let landingPath = typeof s.landingPath === 'string' ? s.landingPath.trim() : '';
  if (!landingPath) landingPath = AFFILIATE_LINK_DEFAULTS.landingPath;
  if (!landingPath.startsWith('/')) landingPath = `/${landingPath}`;
  const paramName = typeof s.paramName === 'string' && /^[A-Za-z0-9_]{1,20}$/.test(s.paramName.trim())
    ? s.paramName.trim()
    : AFFILIATE_LINK_DEFAULTS.paramName;
  return { baseUrl, landingPath, paramName };
};

/** The referral link for a code, e.g. https://jaipurio.in/home?ref=MY-BRAND */
export const buildReferralLink = (code, cfg, fallbackBase = '') => {
  if (!code) return '';
  const base = (cfg.baseUrl || fallbackBase || '').replace(/\/+$/, '');
  const joiner = cfg.landingPath.includes('?') ? '&' : '?';
  return `${base}${cfg.landingPath}${joiner}${cfg.paramName}=${encodeURIComponent(code)}`;
};

let cache = null;
let inflight = null;

export const useAffiliateSettings = () => {
  const [cfg, setCfg] = useState(cache || AFFILIATE_LINK_DEFAULTS);

  useEffect(() => {
    if (cache) return undefined;
    let mounted = true;
    if (!inflight) {
      inflight = api
        .get('/settings')
        .then((res) => {
          cache = mergeAffiliateLink(res.data?.data?.settings?.affiliate);
          return cache;
        })
        .catch(() => AFFILIATE_LINK_DEFAULTS)
        .finally(() => {
          inflight = null;
        });
    }
    inflight.then((c) => mounted && setCfg(c));
    return () => {
      mounted = false;
    };
  }, []);

  return cfg;
};
