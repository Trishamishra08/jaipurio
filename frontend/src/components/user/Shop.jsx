import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import ProductCard from './ProductCard';
import { SlidersHorizontal } from 'lucide-react';

const TOP_CATEGORIES = [
  { name: 'All', value: '' },
  { name: 'Matkas', value: 'Matkas' },
  { name: 'Kulhads', value: 'Kulhads' },
  { name: 'Planters', value: 'Planters' },
  { name: 'Home Decor', value: 'Home Decor' },
  { name: 'Puja Essentials', value: 'Puja Essentials' },
];

const Shop = () => {
  const { products } = useShop();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    setSelectedCategory(categoryParam === 'More' ? '' : categoryParam);
  }, [categoryParam]);

  const selectCategory = (value) => {
    setSelectedCategory(value);
    const next = new URLSearchParams(searchParams);
    if (value) next.set('category', value);
    else next.delete('category');
    setSearchParams(next);
  };

  const filteredProducts = products.filter((product) => {
    if (
      searchParam &&
      !product.name.toLowerCase().includes(searchParam.toLowerCase()) &&
      !product.tags?.some((t) => t.toLowerCase().includes(searchParam.toLowerCase()))
    ) {
      return false;
    }
    if (selectedCategory) {
      if (product.category !== selectedCategory && product.subcategory !== selectedCategory) {
        return false;
      }
    }
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return b.reviews - a.reviews;
  });

  return (
    <div className="min-h-screen bg-white pb-14">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 pt-3 pb-4">
        <div className="mb-3">
          <div className="flex items-center gap-1.5 font-dm text-[10px] text-[#806653] mb-1">
            <Link to="/home" className="hover:text-[#6F241D]">
              Home
            </Link>
            <span>/</span>
            <span className="text-[#8B2E1E] font-medium">Mitti Bazaar</span>
          </div>
          <h1 className="font-playfair font-semibold text-[18px] sm:text-2xl text-[#3F261B] leading-tight">
            {selectedCategory
              ? `${selectedCategory} Collection`
              : 'Authentic Rajasthani Pottery & Crafts'}
          </h1>
          <p className="font-dm text-[11px] text-[#806653] mt-0.5">
            Showing {sortedProducts.length} handmade products
          </p>
        </div>

        {/* Mobile-first top categories */}
        <div
          className="flex gap-1.5 overflow-x-auto scrollbar-none pb-2 -mx-0.5 px-0.5 mb-2"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {TOP_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.value;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => selectCategory(cat.value)}
                className={`shrink-0 px-3 py-1.5 rounded-full font-dm text-[11px] font-semibold transition-colors ${
                  active
                    ? 'bg-[#6F241D] text-white'
                    : 'bg-white text-[#3F261B] border border-[#E8E2D9] hover:border-[#6F241D]/40'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2 mb-3 py-2 border-y border-[#EFEAE3]">
          <div className="flex items-center gap-1.5 font-dm text-[11px] text-[#5B4638]">
            <SlidersHorizontal size={13} />
            <span className="font-medium">{sortedProducts.length} items</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="font-dm bg-white border border-[#E8E2D9] rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#3F261B] focus:outline-none focus:border-[#6F241D]"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {sortedProducts.length === 0 ? (
          <div className="text-center py-12 border border-[#E8E2D9] rounded-xl bg-white">
            <p className="font-playfair text-lg text-[#3F261B]">No products found</p>
            <p className="font-dm text-[11px] text-[#806653] mt-1 mb-3">
              Try another category or clear filters.
            </p>
            <button
              type="button"
              onClick={() => selectCategory('')}
              className="font-dm text-[11px] font-semibold bg-[#6F241D] text-white px-4 py-2 rounded-lg"
            >
              View All
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {sortedProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
