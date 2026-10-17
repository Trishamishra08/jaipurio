import { useEffect, useState } from 'react';
import api from './api';
import { mergeProductPage } from '../data/productPageDefaults';
import { POPUP_DEFAULTS } from '../data/popupDefaults';

let cache = null;
let inflight = null;

/** Merge saved popup settings over the defaults. */
export const mergePopup = (saved) => mergeProductPage(saved, POPUP_DEFAULTS);

/** Admin-editable popup content (settings.popup merged over defaults). `null` until loaded. */
export const usePopupSettings = () => {
  const [config, setConfig] = useState(cache);

  useEffect(() => {
    if (cache) return undefined;
    let mounted = true;
    if (!inflight) {
      inflight = api
        .get('/settings')
        .then((res) => {
          cache = mergePopup(res.data?.data?.settings?.popup);
          return cache;
        })
        .catch(() => POPUP_DEFAULTS)
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
