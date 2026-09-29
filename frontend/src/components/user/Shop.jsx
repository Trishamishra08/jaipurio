import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard from './ProductCard';
import { SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../utils/api';
import { mapApiProductToStorefront } from '../../utils/storefrontProduct';

const TOP_CATEGORIES = [
  { name: 'All', value: '' },
  { name: 'Matkas', value: 'Matkas' },
  { name: 'Kulhads', value: 'Kulhads' },
  { name: 'Planters', value: 'Planters' },
  { name: 'Home Decor', value: 'Home Decor' },
  { name: 'Puja Essentials', value: 'Puja Essentials' },
];

const SORT_MAP = {
  popular: 'popular',
  rating: 'rating',
  'price-low': 'price-low',
  'price-high': 'price-high',
};

const PAGE_SIZE = 100;

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'popular';
  const pageParam = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);

  const selectedCategory = categoryParam === 'More' ? '' : categoryParam;

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    api
      .get('/products', {
        params: {
          page: pageParam,
          limit: PAGE_SIZE,
          search: searchParam || undefined,
          category: selectedCategory || undefined,
          sort: SORT_MAP[sortParam] || 'popular',
        },
      })
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data || {};
        setProducts((data.products || []).map(mapApiProductToStorefront).filter(Boolean));
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err?.parsedMessage || err?.message || 'Failed to load products');
        setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pageParam, searchParam, selectedCategory, sortParam]);

  const updateParams = (patch, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (resetPage) next.delete('page');
    setSearchParams(next);
  };

  const selectCategory = (value) => updateParams({ category: value === 'More' ? '' : value });
  const setSortBy = (value) => updateParams({ sort: value });
  const goToPage = (page) => {
    updateParams({ page: page > 1 ? String(page) : '' }, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageNumbers = (() => {
    const nums = [];
    const start = Math.max(1, pageParam - 2);
    const end = Math.min(totalPages, start + 4);
    for (let n = start; n <= end; n += 1) nums.push(n);
    return nums;
  })();

  return (
    <div className="min-h-screen bg-white pb-14">
      <div className="site-container pt-3 pb-4">
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
            {loading ? 'Loading…' : `Showing ${products.length} of ${total} handmade products`}
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
            <span className="font-medium">{total} items</span>
          </div>
          <select
            value={sortParam}
            onChange={(e) => setSortBy(e.target.value)}
            className="font-dm bg-white border border-[#E8E2D9] rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#3F261B] focus:outline-none focus:border-[#6F241D]"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {loadError ? (
          <div className="text-center py-12 border border-red-100 rounded-xl bg-red-50">
            <p className="font-playfair text-lg text-red-700">Couldn't load products</p>
            <p className="font-dm text-[11px] text-red-500 mt-1">{loadError}</p>
          </div>
        ) : !loading && products.length === 0 ? (
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
            {(loading ? [] : products).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        {!loading && !loadError && totalPages > 1 ? (
          <div className="flex items-center justify-center gap-1.5 mt-6">
            <button
              type="button"
              onClick={() => goToPage(pageParam - 1)}
              disabled={pageParam <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E8E2D9] text-[#3F261B] disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            {pageNumbers.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => goToPage(n)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg font-dm text-[12px] font-semibold ${
                  n === pageParam
                    ? 'bg-[#6F241D] text-white'
                    : 'border border-[#E8E2D9] text-[#3F261B] hover:border-[#6F241D]/40'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => goToPage(pageParam + 1)}
              disabled={pageParam >= totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E8E2D9] text-[#3F261B] disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Shop;
