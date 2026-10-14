import { useEffect, useState } from 'react';
import api from './api';

// One shared request for every component that needs the category tree (home
// chips, category rails, shop filters, product page). Each row is a category
// that has at least one live product, in depth-first order:
// { id, name, slug, parent, level, count, isFeatured, image }
let cache = null;
let inflight = null;

const loadCategories = () => {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = api
      .get('/products/categories')
      .then((res) => {
        cache = res.data?.data || [];
        return cache;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
};

export const useCategoryTree = () => {
  const [categories, setCategories] = useState(cache || []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let mounted = true;
    loadCategories()
      .then((rows) => mounted && setCategories(rows))
      .catch((err) => console.warn('Failed to load categories:', err.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return { categories, loading };
};
