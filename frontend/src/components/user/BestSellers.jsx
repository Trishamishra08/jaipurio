import React from 'react';
import { useShop } from '../../context/ShopContext';
import { useMixedProducts } from '../../utils/useMixedProducts';
import ProductCard from './ProductCard';
import SectionHeading from './SectionHeading';

const BestSellers = () => {
  const { products: popular } = useShop();
  const mixed = useMixedProducts();
  const bestSellers = (mixed.length ? mixed : popular).slice(0, 4);

  return (
    <section className="w-full bg-white pt-1.5 pb-3">
      <div className="site-container">
        <SectionHeading title="Popular Picks" to="/shop" />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {bestSellers.map((product, i) => (
            <ProductCard
              key={product._id}
              product={{
                ...product,
                badge: product.badge || ['bestseller', 'deal', 'eco', 'new'][i % 4],
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
