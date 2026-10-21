import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Navigate, useParams } from 'react-router-dom';
import { useCategoryTree } from '../../utils/useCategoryTree';
import { useShop } from '../../context/ShopContext';

// Old jaipurio.in URLs that now live at a different address on the new site.

/**
 * /product-categories/<slug> (and /category/<slug>) → that category in the shop.
 * A category with no products right now goes to its nearest parent that has some.
 */
export const CategorySlugRedirect = () => {
  const { slug = '' } = useParams();
  const { categories, loading } = useCategoryTree();
  const key = decodeURIComponent(slug).toLowerCase();
  const found =
    categories.find((c) => String(c.slug || '').toLowerCase() === key) ||
    categories.find((c) => c.name.toLowerCase() === key.replace(/-/g, ' '));
  const [resolved, setResolved] = useState(undefined); // undefined = still asking the server

  useEffect(() => {
    if (found || (loading && !categories.length)) return undefined;
    let cancelled = false;
    api
      .get(`/products/categories/resolve/${encodeURIComponent(key)}`)
      .then((res) => !cancelled && setResolved(res.data?.data?.name || null))
      .catch(() => !cancelled && setResolved(null));
    return () => {
      cancelled = true;
    };
  }, [found, loading, categories.length, key]);

  if (found) return <Navigate to={`/shop?category=${encodeURIComponent(found.name)}`} replace />;
  if (resolved === undefined) return null;
  return <Navigate to={resolved ? `/shop?category=${encodeURIComponent(resolved)}` : '/shop'} replace />;
};

/** /brands/<slug> → products of that old brand (LeatherMart, Rangtara, Royalsuits…). */
export const BrandRedirect = () => {
  const { slug = '' } = useParams();
  return <Navigate to={`/shop?brand=${encodeURIComponent(slug.toLowerCase())}`} replace />;
};

/** /cart → home with the bag open. */
export const CartRedirect = () => {
  const { setIsCartDrawerOpen } = useShop();
  useEffect(() => {
    setIsCartDrawerOpen(true);
  }, [setIsCartDrawerOpen]);
  return <Navigate to="/home" replace />;
};
