import { useEffect, useState } from 'react';
import api from './api';

// Delivery charge and free-delivery threshold, exactly as the server charges them
// (Admin → Logistics; used by backend/utils/pricing.js). Keeps storefront text
// like "Free shipping above ₹X" in line with what checkout actually bills.
const DEFAULTS = { deliveryCharge: 50, freeDeliveryThreshold: 1000 };

let cache = null;
let inflight = null;

export const useShippingSettings = () => {
  const [cfg, setCfg] = useState(cache || DEFAULTS);

  useEffect(() => {
    if (cache) return undefined;
    let mounted = true;
    if (!inflight) {
      inflight = api
        .get('/settings')
        .then((res) => {
          const s = res.data?.data?.settings || {};
          cache = {
            deliveryCharge: Number(s.deliveryCharge ?? DEFAULTS.deliveryCharge) || 0,
            freeDeliveryThreshold: Number(s.freeDeliveryThreshold ?? DEFAULTS.freeDeliveryThreshold) || 0,
          };
          return cache;
        })
        .catch(() => DEFAULTS)
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

/** Promo text that matches the real rule, e.g. "Free Shipping on Orders of ₹1,000+". */
export const freeShippingText = ({ deliveryCharge, freeDeliveryThreshold }) => {
  if (!deliveryCharge) return 'Free Shipping on All Orders';
  if (freeDeliveryThreshold > 0) return `Free Shipping on Orders of ₹${freeDeliveryThreshold.toLocaleString('en-IN')}+`;
  return '';
};
