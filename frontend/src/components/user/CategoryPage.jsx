import React from 'react';
import { useParams } from 'react-router-dom';
import { useCategoryTree } from '../../utils/useCategoryTree';
import Shop from './Shop';
import { CategorySlugRedirect } from './LegacyRedirects';

/**
 * /product-categories/<slug>: the shop for one category, at its own clean URL
 * (own title, description and canonical — see Shop). An unknown or empty
 * category falls back to the old redirect, which finds the nearest parent that
 * has products.
 */
const CategoryPage = () => {
  const { slug = '' } = useParams();
  const { categories, loading } = useCategoryTree();
  const key = decodeURIComponent(slug).toLowerCase();
  const found =
    categories.find((c) => String(c.slug || '').toLowerCase() === key) ||
    categories.find((c) => c.name.toLowerCase() === key.replace(/-/g, ' '));

  if (found) return <Shop categoryOverride={found.name} />;
  if (loading && !categories.length) return null;
  return <CategorySlugRedirect />;
};

export default CategoryPage;
