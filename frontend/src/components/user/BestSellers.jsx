import React from 'react';
import { useShop } from '../../context/ShopContext';
import { useMixedProducts } from '../../utils/useMixedProducts';
import { useHomeSections } from '../../utils/useHomeSections';
import { useSectionProducts } from '../../utils/useSectionProducts';
import PagedCarousel from '../shared/PagedCarousel';
import ProductCard from './ProductCard';
import SectionHeading from './SectionHeading';

const BADGES = ['bestseller', 'deal', 'eco', 'new'];

// "Popular Picks" — heading, visibility and products are managed from
// Admin → Appearance → Home Page; pages of 4 slide on their own and can be swiped.
const BestSellers = () => {
  const { products: popular } = useShop();
  const mixed = useMixedProducts();
  const cfg = useHomeSections().sections.popular;
  const { items: custom, loading } = useSectionProducts(cfg);

  if (!cfg.enabled || loading) return null;
  const list = (custom ?? (mixed.length ? mixed : popular)).filter(Boolean).slice(0, cfg.limit || 8);
  if (!list.length) return null;

  const pages = [];
  for (let i = 0; i < list.length; i += 4) pages.push(list.slice(i, i + 4));

  return (
    <section className="w-full bg-white pt-1.5 pb-3">
      <div className="site-container">
        <SectionHeading title={cfg.title} to="/shop" />

        <PagedCarousel
          pages={pages.map((page, pi) => (
            <div key={pi} className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {page.map((product, i) => (
                <ProductCard
                  key={product._id}
                  product={{ ...product, badge: product.badge || BADGES[i % BADGES.length] }}
                />
              ))}
            </div>
          ))}
        />
      </div>
    </section>
  );
};

export default BestSellers;
