import { useEffect, useState } from 'react';
import api from './api';
import { useCategoryTree } from './useCategoryTree';
import { mapApiProductToStorefront } from './storefrontProduct';

const PER_CATEGORY = 12;

// Home-page product pool that takes turns across the top-level categories
// (one Jewellery, one Clothing, one Home & Living, …) instead of the global
// popularity ranking, which is almost entirely murtis. Shared across
// components so the home page fetches it once.
let cache = null;
let inflight = null;

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

const loadMixed = (topLevel) => {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = Promise.all(
      topLevel.map((cat) =>
        api
          .get('/products', { params: { category: cat.name, limit: PER_CATEGORY, sort: 'popular' } })
          .then((res) => (res.data?.data?.products || []).map(mapApiProductToStorefront).filter(Boolean))
          .catch(() => [])
      )
    )
      .then((lists) => {
        cache = interleave(lists);
        return cache;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
};

export const useMixedProducts = () => {
  const { categories } = useCategoryTree();
  const [products, setProducts] = useState(cache || []);
  const topLevel = categories.filter((c) => !c.parent);
  const key = topLevel.map((c) => c.id).join('|');

  useEffect(() => {
    if (!topLevel.length) return undefined;
    let mounted = true;
    loadMixed(topLevel).then((list) => mounted && setProducts(list));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return products;
};
