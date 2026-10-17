import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Star, Package, CalendarDays, Store, Share2, Check } from 'lucide-react';
import api from '../../utils/api';
import { mapApiProductToStorefront } from '../../utils/storefrontProduct';
import ProductCard from './ProductCard';

const PAGE_SIZE = 24;

const SORTS = [
  ['popular', 'Most Popular'],
  ['new', 'Newest'],
  ['discount', 'Biggest Discount'],
  ['price-low', 'Price: Low to High'],
  ['price-high', 'Price: High to Low'],
];

const initials = (name) =>
  String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

/** A seller's public store: real profile, stats from customer reviews, and their live products. */
const VendorPublicStore = () => {
  const { id } = useParams();
  const [store, setStore] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | missing | error
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('popular');
  const [category, setCategory] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    api
      .get(`/vendors/public/${id}`)
      .then((res) => {
        if (cancelled) return;
        setStore(res.data?.data || null);
        setState('ready');
      })
      .catch((err) => !cancelled && setState(err.response?.status === 404 ? 'missing' : 'error'));
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    setPage(1);
  }, [id, sort, category]);

  useEffect(() => {
    if (state !== 'ready') return undefined;
    let cancelled = false;
    setLoadingProducts(true);
    api
      .get('/products', { params: { vendor: id, sort, category: category || undefined, page, limit: PAGE_SIZE } })
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data || {};
        const rows = (data.products || []).map(mapApiProductToStorefront).filter(Boolean);
        setProducts((prev) => (page === 1 ? rows : [...prev, ...rows]));
        setTotal(data.total || 0);
      })
      .catch(() => !cancelled && page === 1 && setProducts([]))
      .finally(() => !cancelled && setLoadingProducts(false));
    return () => {
      cancelled = true;
    };
  }, [state, id, sort, category, page]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: store?.storeName, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* cancelled */
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-28 sm:h-44 bg-[#F3E9DA] animate-pulse" />
        <div className="site-container -mt-10 space-y-4">
          <div className="h-32 rounded-2xl bg-[#FCF8F2] border border-[#E8D4B5] animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-[#FCF8F2] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (state !== 'ready' || !store) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <Store size={40} className="mx-auto text-[#A94E2C]/50" />
          <h1 className="font-playfair text-xl font-semibold text-[#6F241D] mt-3">
            {state === 'missing' ? 'This store is not available' : 'Could not load this store'}
          </h1>
          <p className="text-xs text-[#70452F] mt-1 mb-5">
            {state === 'missing' ? 'The seller may have closed their store or the link is incorrect.' : 'Please check your connection and try again.'}
          </p>
          <Link to="/shop" className="bg-[#6F241D] text-white px-6 py-2.5 rounded-full text-xs font-bold">
            Browse the shop
          </Link>
        </div>
      </div>
    );
  }

  const joined = store.joinedAt ? new Date(store.joinedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '';
  const hasMore = products.length < total;

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-12 overflow-x-hidden">
      {/* Banner */}
      <div className="relative h-28 sm:h-44 bg-gradient-to-br from-[#6F241D] via-[#8B2E3A] to-[#C45C6A] overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute left-1/3 -bottom-16 w-40 h-40 rounded-full bg-white/5" />
      </div>

      <div className="site-container -mt-12 sm:-mt-16 relative z-10">
        {/* Profile card */}
        <div className="bg-white border border-[#E8D4B5] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md">
          <div className="flex items-start gap-3 sm:gap-5">
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-[#FCF8F2] border-4 border-white shadow-md -mt-10 sm:-mt-14 shrink-0 flex items-center justify-center font-playfair text-xl sm:text-3xl font-bold text-[#6F241D]">
              {initials(store.storeName)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-playfair text-lg sm:text-3xl font-semibold text-[#3F261B] leading-tight break-words">{store.storeName}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] sm:text-xs text-[#70452F]">
                {store.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} className="text-[#A94E2C]" /> {store.location}
                  </span>
                )}
                {joined && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={12} className="text-[#A94E2C]" /> Selling since {joined}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={share}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-[#E8D4B5] text-[11px] font-bold text-[#6F241D] hover:bg-[#FCF8F2]"
              aria-label="Share store"
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
              <span className="hidden sm:inline">{copied ? 'Link copied' : 'Share'}</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4 sm:max-w-md">
            <div className="rounded-xl bg-[#FCF8F2] border border-[#EFE3CF] px-3 py-2">
              <div className="flex items-center gap-1 text-sm font-bold text-[#6F241D]">
                <Star size={14} className={store.reviewCount ? 'fill-[#C69A45] text-[#C69A45]' : 'text-[#C9B79D]'} />
                {store.reviewCount ? store.rating.toFixed(1) : 'New'}
              </div>
              <p className="text-[10px] text-[#8A6A68]">
                {store.reviewCount ? `${store.reviewCount} customer review${store.reviewCount === 1 ? '' : 's'}` : 'No reviews yet'}
              </p>
            </div>
            <div className="rounded-xl bg-[#FCF8F2] border border-[#EFE3CF] px-3 py-2">
              <div className="flex items-center gap-1 text-sm font-bold text-[#6F241D]">
                <Package size={14} className="text-[#A94E2C]" />
                {store.productCount}
              </div>
              <p className="text-[10px] text-[#8A6A68]">Products listed</p>
            </div>
          </div>

          {store.description && (
            <p className="mt-4 text-xs sm:text-sm text-[#5B4638] leading-relaxed whitespace-pre-line">{store.description}</p>
          )}
        </div>

        {/* Products */}
        <div className="mt-6 sm:mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="font-playfair text-lg sm:text-2xl font-semibold text-[#3F261B]">
              Products {total ? <span className="text-[#A8977F] text-sm font-normal">({total})</span> : null}
            </h2>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-white border border-[#E8E2D9] rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[#3F261B] focus:outline-none focus:border-[#6F241D]"
              aria-label="Sort products"
            >
              {SORTS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {store.categories?.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-2 mb-2 -mx-0.5 px-0.5">
              {[{ name: '', label: 'All' }, ...store.categories.map((c) => ({ name: c.name, label: `${c.name} ${c.count}` }))].map((c) => (
                <button
                  key={c.name || 'all'}
                  type="button"
                  onClick={() => setCategory(c.name)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${
                    category === c.name ? 'bg-[#6F241D] text-white' : 'bg-white text-[#3F261B] border border-[#E8E2D9] hover:border-[#6F241D]/40'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {loadingProducts && products.length === 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-[3/4] rounded-xl bg-[#FCF8F2] animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-sm text-[#70452F] py-12 bg-[#FCF8F2] rounded-2xl border border-[#E8D4B5]">
              This seller has no products listed right now.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {products.map((prod) => (
                  <ProductCard key={prod._id} product={prod} />
                ))}
              </div>
              {hasMore && (
                <div className="text-center mt-6">
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={loadingProducts}
                    className="px-6 py-2.5 rounded-full border border-[#6F241D] text-[#6F241D] text-xs font-bold hover:bg-[#FCF8F2] disabled:opacity-60"
                  >
                    {loadingProducts ? 'Loading…' : `Show more (${total - products.length} left)`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorPublicStore;
