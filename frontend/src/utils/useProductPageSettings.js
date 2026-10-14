import { useEffect, useState } from 'react';
import api from './api';
import { mergeProductPage, PRODUCT_PAGE_DEFAULTS } from '../data/productPageDefaults';

let cache = null;
let inflight = null;

/** Admin-editable product page content (settings.productPage merged over defaults). */
export const useProductPageSettings = () => {
  const [config, setConfig] = useState(cache || PRODUCT_PAGE_DEFAULTS);

  useEffect(() => {
    if (cache) return undefined;
    let mounted = true;
    if (!inflight) {
      inflight = api
        .get('/settings')
        .then((res) => {
          cache = mergeProductPage(res.data?.data?.settings?.productPage);
          return cache;
        })
        .catch(() => PRODUCT_PAGE_DEFAULTS)
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
