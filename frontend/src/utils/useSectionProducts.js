import { useEffect, useState } from 'react';
import api from './api';
import { mapApiProductToStorefront } from './storefrontProduct';

const toList = (res) => (res.data?.data?.products || []).map(mapApiProductToStorefront).filter(Boolean);

/** Take turns across several lists (one from each category, then the next round…). */
const interleave = (lists) => {
  const out = [];
  const seen = new Set();
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest; i += 1) {
    lists.forEach((list) => {
      const p = list[i];
      if (p && !seen.has(p._id)) {
        seen.add(p._id);
        out.push(p);
      }
    });
  }
  return out;
};

/**
 * Products for an admin-configured home section.
 *   source "products"  → exactly the picked products, in the admin's order
 *   source "category"  → popular products from the chosen categories, mixed
 *   source "auto"      → nothing fetched; `items` is null so the page uses its own default pool
 * Returns { items, loading }.
 */
export const useSectionProducts = (cfg) => {
  const [state, setState] = useState({ items: null, loading: cfg.source !== 'auto' });
  const key = JSON.stringify([cfg.source, cfg.categories, cfg.productIds, cfg.limit]);

  useEffect(() => {
    if (cfg.source === 'auto') {
      setState({ items: null, loading: false });
      return undefined;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    const run = async () => {
      if (cfg.source === 'products') {
        const ids = (cfg.productIds || []).filter(Boolean).slice(0, 200);
        if (!ids.length) return [];
        const res = await api.get('/products', { params: { ids: ids.join(',') } });
        const byId = new Map(toList(res).map((p) => [String(p._id), p]));
        return ids.map((id) => byId.get(String(id))).filter(Boolean);
      }
      const cats = (cfg.categories || []).filter(Boolean);
      if (!cats.length) return [];
      const per = Math.max(4, Math.ceil((cfg.limit || 8) / cats.length) + 2);
      const lists = await Promise.all(
        cats.map((name) =>
          api
            .get('/products', { params: { category: name, limit: Math.min(per, 40), sort: 'popular' } })
            .then(toList)
            .catch(() => [])
        )
      );
      return interleave(lists);
    };

    run()
      .then((items) => !cancelled && setState({ items, loading: false }))
      .catch(() => !cancelled && setState({ items: [], loading: false }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
};
