import { useEffect, useState } from 'react';
import api from './api';
import { mergeProductPage } from '../data/productPageDefaults';
import { FOOTER_DEFAULTS } from '../data/footerDefaults';

let cache = null;
let inflight = null;

const splitList = (text) => String(text || '').split(',').map((t) => t.trim()).filter(Boolean);

/** Footer settings saved in the earlier shape (india/international text, single office) → current shape. */
const upgradeSaved = (saved) => {
  if (!saved || typeof saved !== 'object') return saved;
  const s = { ...saved };
  if (s.shipping && !s.shipping.regions && (s.shipping.india || s.shipping.international)) {
    s.shipping = {
      enabled: s.shipping.enabled,
      regions: [
        { title: s.shipping.indiaTitle || 'Ships across India', places: splitList(s.shipping.india) },
        { title: s.shipping.intlTitle || 'International', places: splitList(s.shipping.international) },
      ],
    };
  }
  if (s.office && !s.offices) s.offices = { enabled: s.office.enabled, items: [{ ...FOOTER_DEFAULTS.offices.items[0], ...s.office }] };
  delete s.office;
  return s;
};

/** Merge saved footer settings over the defaults (nested objects merge, arrays are replaced). */
export const mergeFooter = (saved) => mergeProductPage(upgradeSaved(saved), FOOTER_DEFAULTS);

/** Admin-editable footer content (settings.footer merged over defaults). */
export const useFooterSettings = () => {
  const [config, setConfig] = useState(cache || FOOTER_DEFAULTS);

  useEffect(() => {
    if (cache) return undefined;
    let mounted = true;
    if (!inflight) {
      inflight = api
        .get('/settings')
        .then((res) => {
          cache = mergeFooter(res.data?.data?.settings?.footer);
          return cache;
        })
        .catch(() => FOOTER_DEFAULTS)
        .finally(() => {
          inflight = null;
        });
    }
    inflight.then((cfg) => mounted && setConfig(cfg));
    return () => {
      mounted = false;
    };
  }, []);

  return config;
};
