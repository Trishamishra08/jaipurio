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
  const topLevel =
    cfg.source === 'categories' && cfg.categories.length
      ? cfg.categories.map((name) => categories.find((c) => c.name === name)).filter(Boolean)
      : categories.filter((c) => !c.parent).slice(0, MAX_RAILS);
  const perRail = cfg.limit || PER_RAIL;
  const key = topLevel.map((c) => c.name).join('|');

  useEffect(() => {
    if (!topLevel.length) return undefined;
    let cancelled = false;
    Promise.all(
      topLevel.map((cat) =>
        api
          .get('/products', { params: { category: cat.name, limit: perRail, sort: 'popular' } })
          .then((res) => ({
            cat,
            products: (res.data?.data?.products || []).map(mapApiProductToStorefront).filter(Boolean),
          }))
          .catch(() => ({ cat, products: [] }))
      )
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
      {rails.map(({ cat, products }) => (
        <section key={cat.id} className="w-full bg-white pt-1.5 pb-3">
          <div className="site-container">
            <SectionHeading
              title={cat.name}
              to={`/shop?category=${encodeURIComponent(cat.name)}`}
              link={`View all ${cat.count} →`}
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
