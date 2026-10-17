import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useCategoryTree } from '../../utils/useCategoryTree';
import { useHomeSections } from '../../utils/useHomeSections';
import { mapApiProductToStorefront } from '../../utils/storefrontProduct';
import ProductCard from './ProductCard';
import SectionHeading from './SectionHeading';

const MAX_RAILS = 8;
const PER_RAIL = 4;

// One shelf per top-level category, filled with that category's own products
// (sub-categories included) — so the home page shows each category's real
// stock instead of one popularity-ranked list dominated by a single category.
const CategoryProducts = () => {
  const { categories } = useCategoryTree();
  const [rails, setRails] = useState([]);

  // Admin → Appearance → Home Page: on/off, and which categories get a row
  const cfg = useHomeSections().sections.categoryRails;
  const customRows = cfg.source === 'rows' && (cfg.rails || []).length > 0;
  // Each row: heading, optional category to fill from, and add-on products shown first.
  const rows = customRows
    ? cfg.rails.map((r) => {
        const cat = r.category ? categories.find((c) => c.name === r.category) : null;
        return { id: r.id, title: r.title || r.category, cat, category: r.category, productIds: r.productIds || [] };
      })
    : (cfg.source === 'categories' && cfg.categories.length
        ? cfg.categories.map((name) => categories.find((c) => c.name === name)).filter(Boolean)
        : categories.filter((c) => !c.parent).slice(0, MAX_RAILS)
      ).map((cat) => ({ id: cat.id, title: cat.name, cat, category: cat.name, productIds: [] }));
  const perRail = cfg.limit || PER_RAIL;
  const key = JSON.stringify(rows.map((r) => [r.id, r.title, r.category, r.productIds]));

  useEffect(() => {
    if (!rows.length) return undefined;
    let cancelled = false;
    const toCards = (res) => (res.data?.data?.products || []).map(mapApiProductToStorefront).filter(Boolean);
    Promise.all(
      rows.map(async (row) => {
        const [added, fromCategory] = await Promise.all([
          row.productIds.length
            ? api.get('/products', { params: { ids: row.productIds.join(',') } }).then((res) => {
                const byId = new Map(toCards(res).map((p) => [String(p._id), p]));
                return row.productIds.map((id) => byId.get(String(id))).filter(Boolean);
              }).catch(() => [])
            : [],
          row.category
            ? api.get('/products', { params: { category: row.category, limit: perRail, sort: 'popular' } }).then(toCards).catch(() => [])
            : [],
        ]);
        const seen = new Set();
        const products = [...added, ...fromCategory].filter((p) => !seen.has(String(p._id)) && seen.add(String(p._id))).slice(0, Math.max(perRail, added.length));
        return { row, products };
      })
    ).then((results) => {
      if (!cancelled) setRails(results.filter((r) => r.products.length > 0));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, perRail]);

  if (!cfg.enabled || !rails.length) return null;

  return (
    <>
      {rails.map(({ row, products }) => (
        <section key={row.id} className="w-full bg-white pt-1.5 pb-3">
          <div className="site-container">
            <SectionHeading
              title={row.title}
              to={row.category ? `/shop?category=${encodeURIComponent(row.category)}` : undefined}
              link={row.category ? (row.cat?.count ? `View all ${row.cat.count} →` : 'View all →') : undefined}
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
};

export default CategoryProducts;
