import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import SectionHeading from './SectionHeading';
import { useCategoryTree } from '../../utils/useCategoryTree';
import { useMixedProducts } from '../../utils/useMixedProducts';
import api from '../../utils/api';
import { mapApiProductToStorefront } from '../../utils/storefrontProduct';
import ThumbImg from '../shared/ThumbImg';


/** Groups real products by category into up-to-4 offer tiles — replaces the
 * old hardcoded OFFER_TILES (fake names/prices paired with stock photos). */
const buildOfferTiles = (products) => {
  const byCategory = new Map();
  products.forEach((p) => {
    if (!p.category || !p.image) return;
    if (!byCategory.has(p.category)) byCategory.set(p.category, []);
    byCategory.get(p.category).push(p);
  });

  return Array.from(byCategory.entries())
    .map(([category, list]) => {
      const withDiscount = list
        .map((p) => ({
          ...p,
          discount: p.oldPrice && p.price ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0,
        }))
        .sort((a, b) => b.discount - a.discount);
      const maxDiscount = withDiscount[0]?.discount || 0;
      return {
        title: maxDiscount > 0 ? `Up to ${maxDiscount}% off ${category}` : `Shop ${category}`,
        badge: maxDiscount > 0 ? `${maxDiscount}% OFF` : 'New',
        to: `/shop?category=${encodeURIComponent(category)}`,
        link: `Shop ${category}`,
        maxDiscount,
        items: withDiscount.slice(0, 2),
      };
    })
    .sort((a, b) => b.maxDiscount - a.maxDiscount)
    .slice(0, 4);
};

const EXPLORE_LIMIT = 8;

/** Explore cards from the live category tree: every top-level category first,
 * then the admin-featured sub-categories, skipping near-empty ones. */
const buildExploreCards = (categories) => {
  const usable = categories.filter((c) => c.image && c.count >= 3);
  const picked = [...usable.filter((c) => !c.parent), ...usable.filter((c) => c.parent && c.isFeatured)];
  const seen = new Set();
  return picked.filter((c) => !seen.has(c.id) && seen.add(c.id)).slice(0, EXPLORE_LIMIT);
};

/** "Shop by occasion" tiles — each pictured with a real catalog product whose
 * name best matches the occasion's keywords, instead of a bare color gradient
 * with no image. Falls back to any product with an image if nothing matches. */
const OCCASIONS = [
  { label: 'Wedding & Bridal', to: '#8B2E3A', keywords: ['radha krishna', 'krishna', 'wedding', 'bridal', 'couple'] },
  { label: 'Housewarming', to: '#C45C6A', keywords: ['lakshmi', 'ganesha', 'ganesh', 'home', 'mandir'] },
  { label: 'Festive Gifting', to: '#A94E2C', keywords: ['diya', 'festive', 'lamp', 'tealight'] },
  { label: 'Corporate Gifting', to: '#6F241D', keywords: ['buddha', 'nataraja', 'sculpture'] },
  { label: 'Just for You', to: '#873A24', keywords: [] },
];

const buildOccasionTiles = (products) => {
  const withImage = products.filter((p) => p.image);
  const used = new Set();

  return OCCASIONS.map((o) => {
    const match = withImage.find((p) => {
      if (used.has(p._id)) return false;
      const name = (p.name || '').toLowerCase();
      return o.keywords.some((k) => name.includes(k));
    }) || withImage.find((p) => !used.has(p._id));

    if (match) used.add(match._id);

    return {
      label: o.label,
      link: match?.category ? `/shop?category=${encodeURIComponent(match.category)}` : '/shop',
      img: match?.image || null,
      toColor: o.to,
    };
  });
};

const SectionHead = ({ title, copy, to = '/shop', link = 'View All →', compact = false }) => (
  <SectionHeading title={title} copy={copy} to={to} link={link} compact={compact} />
);

const Tag = ({ label }) => {
  const hot = /hot|flash|sale/i.test(label || '');
  return (
    <span
      className={`absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-md font-dm text-[8px] sm:text-[9px] font-bold uppercase tracking-wide ${
        hot ? 'bg-[#C45C6A] text-white' : 'bg-[#8B2E3A] text-white'
      }`}
    >
      {label}
    </span>
  );
};

const CatalogCard = ({ item, compact }) => {
  const { toggleWishlist, isInWishlist, addToCart } = useShop();
  const id = item._id || item.name;
  const liked = isInWishlist(id);
  const off =
    item.oldPrice && item.price
      ? Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100)
      : 0;

  return (
    <Link
      to={item.to || '/shop'}
      className="group bg-white rounded-xl border border-[#F3D5D0] overflow-hidden shadow-[0_2px_10px_rgba(139,46,58,0.06)] hover:shadow-[0_12px_28px_rgba(139,46,58,0.14)] hover:-translate-y-1 transition-all duration-300 flex flex-col min-w-[150px] font-mulish"
    >
      <div className={`relative overflow-hidden bg-[#F7EFE0] ${compact ? 'aspect-square' : 'aspect-square'} bg-white`}>
        {item.tag && <Tag label={item.tag} />}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(item._id ? item : { _id: id, ...item });
          }}
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm"
          aria-label="Wishlist"
        >
          <Heart size={12} className={liked ? 'fill-[#C45C6A] text-[#C45C6A]' : 'text-[#8B2E3A]'} />
        </button>
        <ThumbImg src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-contain object-center p-2 transition-transform duration-500 group-hover:scale-[1.06]" loading="lazy" />
        {item._id && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              addToCart(item, 1);
            }}
            className="hidden md:flex absolute inset-x-2 bottom-2 z-10 items-center justify-center rounded-lg bg-[#F5B82E] hover:bg-[#E9A915] text-[#2B1E1A] text-[11px] font-bold py-1.5 shadow-md translate-y-[130%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
          >
            Add to cart
          </button>
        )}
      </div>
      <div className="p-2.5 flex-1">
        {item.brand && (
          <p className="font-dm text-[8px] sm:text-[9px] font-semibold tracking-[0.12em] uppercase text-[#C45C6A]">
            {item.brand}
          </p>
        )}
        <h4 className="text-[12px] sm:text-[13px] font-semibold text-[#3F261B] group-hover:text-[#8B2E3A] transition-colors leading-snug line-clamp-2 mt-0.5">
          {item.name}
        </h4>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-[13px] font-bold text-[#3F261B]">₹{(item.price || 0).toLocaleString('en-IN')}</span>
          {item.oldPrice && (
            <span className="text-[10px] text-[#9A8B7A] line-through">₹{item.oldPrice.toLocaleString('en-IN')}</span>
          )}
          {off > 0 && <span className="text-[10px] font-semibold text-[#C45C6A]">−{off}%</span>}
        </div>
        {item.rating && (
          <p className="font-dm text-[10px] text-[#C69A45] mt-0.5">
            ★ {item.rating} {item.reviews ? `(${item.reviews})` : ''}
          </p>
        )}
      </div>
    </Link>
  );
};

const Wrap = ({ children, alt, className = '', compact = false }) => (
  <section className={`w-full ${compact ? 'py-1.5 sm:py-2' : 'py-4'} bg-white ${className}`}>
    <div className="site-container">{children}</div>
  </section>
);

/** Styled edits — each is a set of real categories; the card pictures one
 * product from each and links to the first. Categories missing from the live
 * tree are skipped, and an edit with none left is hidden. */
const STYLED_EDITS = [
  { title: 'The Wedding Trousseau Edit', categories: ['Rajputi Poshak', 'Jodhpuri Bandhgala Suits', 'Necklaces', 'Bangles'] },
  { title: 'The Pooja Room Edit', categories: ['Marble Idols', 'Brass Idols', 'Thali & Thali Sets', 'Torans'] },
  { title: "The Groom's Edit", categories: ['Jodhpuri Achkans', 'Safa / Head Turban', 'Cufflinks', 'Pocket Squares'] },
];

const listNames = (names) =>
  names.length > 1 ? `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}` : names[0] || '';

const FESTIVE_RE = /diya|lamp|lakshmi|ganesh|puja|pooja|thali|toran|kalash/i;

/** Curated collections from live products — each tile pictures the first
 * products that belong on it, never repeating a product across tiles. */
const buildCollections = (products, newest) => {
  const withImage = products.filter((p) => p.image);
  const used = new Set();
  const take = (list) => {
    const picked = [];
    for (const p of list) {
      if (picked.length === 2) break;
      if (used.has(p._id)) continue;
      used.add(p._id);
      picked.push(p);
    }
    return picked;
  };
  return [
    { title: 'Festive Collection', items: take(withImage.filter((p) => FESTIVE_RE.test(`${p.name} ${p.category}`))) },
    { title: 'Best Seller Collection', items: take(withImage) },
    { title: 'New Arrivals Collection', items: take(newest.filter((p) => p.image)) },
    { title: 'Under ₹5,000 Collection', items: take(withImage.filter((p) => p.price && p.price <= 5000)) },
  ].filter((c) => c.items.length > 0);
};

const HomeAfterCategory = () => {
  // Category-mixed pool so the rails below aren't all murtis; falls back to
  // the popular list from ShopContext until it loads.
  const { products: popular } = useShop();
  const mixed = useMixedProducts();
  const products = mixed.length ? mixed : popular;
  const [left, setLeft] = useState({ h: 12, m: 44, s: 46 });
  const mitti = useMemo(() => products.slice(0, 6), [products]);
  // Live catalog slices for every "product card" rail on this page — these
  // used to come from a hardcoded CATALOG array (real-sounding names paired
  // with unrelated stock images and made-up prices/ratings). Every rail below
  // now reads real products from ShopContext; only the section-describing
  // "tag" (e.g. "Best Seller" on the Best Sellers rail) is still assigned
  // per-section, since that labels the shelf, not a false product claim.
  const items = useMemo(
    () => products.slice(0, 8).map((p) => ({ ...p, to: `/product/${p._id}` })),
    [products]
  );
  const offerTiles = useMemo(() => buildOfferTiles(products), [products]);
  const { categories } = useCategoryTree();
  const exploreCards = useMemo(() => buildExploreCards(categories), [categories]);
  const [newest, setNewest] = useState([]);
  const [styledEdits, setStyledEdits] = useState([]);
  const collections = useMemo(() => buildCollections(products, newest), [products, newest]);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/products', { params: { sort: 'new', limit: 8 } })
      .then((res) => {
        if (!cancelled) setNewest((res.data?.data?.products || []).map(mapApiProductToStorefront).filter(Boolean));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryKey = categories.map((c) => c.id).join('|');
  useEffect(() => {
    if (!categories.length) return undefined;
    let cancelled = false;
    Promise.all(
      STYLED_EDITS.map(async (edit) => {
        const cats = edit.categories.map((n) => categories.find((c) => c.name === n)).filter(Boolean);
        const picks = await Promise.all(
          cats.map((c) =>
            api
              .get('/products', { params: { category: c.name, limit: 1, sort: 'popular' } })
              .then((res) => mapApiProductToStorefront((res.data?.data?.products || [])[0]))
              .catch(() => null)
          )
        );
        return {
          title: edit.title,
          to: cats[0] ? `/shop?category=${encodeURIComponent(cats[0].name)}` : '/shop',
          copy: `${listNames(cats.map((c) => c.name))} — styled together.`,
          count: cats.reduce((n, c) => n + c.count, 0),
          images: picks.filter((p) => p && p.image),
        };
      })
    ).then((edits) => {
      if (!cancelled) setStyledEdits(edits.filter((e) => e.images.length > 0));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryKey]);
  const occasionTiles = useMemo(() => buildOccasionTiles(products), [products]);
  const maxDiscount = useMemo(
    () =>
      products.reduce((max, p) => {
        const d = p.oldPrice && p.price ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
        return d > max ? d : max;
      }, 0),
    [products]
  );

  useEffect(() => {
    const id = setInterval(() => {
      setLeft((t) => {
        let { h, m, s } = t;
        if (s > 0) s -= 1;
        else if (m > 0) {
          m -= 1;
          s = 59;
        } else if (h > 0) {
          h -= 1;
          m = 59;
          s = 59;
        }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <>
      {/* 1. Deal tiles */}
      <Wrap compact>
        <SectionHead
          title="Today's Offers"
          copy="Real deals across our catalog, updated live."
          to="/shop"
          link="View All →"
          compact
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2">
          {offerTiles.map((d, i) => (
            <Link
              key={d.title}
              to={d.to}
              className="offer-card offer-card-in group relative bg-white rounded-lg sm:rounded-xl border border-[#E8E2D9] p-2 sm:p-2.5 overflow-hidden shadow-[0_1px_6px_rgba(63,38,27,0.04)] hover:shadow-[0_6px_16px_rgba(111,36,29,0.08)] hover:-translate-y-0.5 transition-all duration-300"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <span className="offer-shine pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100" />
              <div className="flex items-start justify-between gap-1 mb-1">
                <h4 className="font-playfair font-semibold text-[11px] sm:text-[13px] lg:text-[14px] text-[#3F261B] leading-snug line-clamp-2">
                  {d.title}
                </h4>
                <span className="shrink-0 px-1 py-0.5 rounded-full bg-[#6F241D] text-white font-body text-[7px] sm:text-[8px] font-semibold uppercase tracking-wide">
                  {d.badge}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
                {d.items.map((p) => (
                  <div key={p._id || p.name} className="min-w-0 flex flex-col items-center text-center">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 shrink-0 rounded-full overflow-hidden bg-[#F7EFE0]">
                      <ThumbImg
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-contain object-center p-0.5 bg-white transition-transform duration-500 group-hover:scale-[1.08]"
                      />
                    </div>
                    <p className="font-body text-[8px] sm:text-[9px] text-[#3F261B] mt-0.5 line-clamp-2 leading-tight">
                      {p.name}
                    </p>
                    <p className="font-body text-[9px] sm:text-[10px] font-semibold text-[#3F261B] leading-tight">
                      ₹{(p.price || 0).toLocaleString('en-IN')}
                      {p.oldPrice > p.price && (
                        <span className="ml-0.5 font-normal text-[7px] sm:text-[8px] text-[#9A8B7A] line-through">
                          ₹{p.oldPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
              <span className="inline-flex items-center gap-0.5 mt-1 font-body text-[9px] sm:text-[10px] font-semibold text-[#6F241D]">
                {d.link}
                <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
              </span>
            </Link>
          ))}
        </div>
      </Wrap>

      {/* 2. Explore Jaipurio — one card per live category (from the category
          tree), shown whole on a soft backdrop so no photo is cropped. */}
      {exploreCards.length > 0 && (
        <Wrap alt>
          <SectionHead eyebrow="Shop the Look" title="Explore Jaipurio" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {exploreCards.map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${encodeURIComponent(cat.name)}`}
                className="group bg-white rounded-2xl border border-[#EADFCF] overflow-hidden shadow-[0_1px_6px_rgba(63,38,27,0.05)] hover:shadow-[0_10px_24px_rgba(111,36,29,0.12)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative aspect-square bg-gradient-to-b from-[#FBF6EE] to-[#F3E7D3] overflow-hidden">
                  <ThumbImg
                    src={cat.image}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-contain p-4 sm:p-5 transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full font-dm text-[9px] sm:text-[10px] font-semibold text-[#6F241D] shadow-sm">
                    {cat.count} items
                  </span>
                </div>
                <div className="px-3 py-2.5 sm:px-4 sm:py-3 border-t border-[#F1E6D6]">
                  <p className="font-dm text-[8px] sm:text-[9px] uppercase tracking-[0.14em] text-[#B08A5A]">Jaipurio Heritage</p>
                  <h4 className="font-playfair font-semibold text-[14px] sm:text-[17px] text-[#3F261B] leading-tight line-clamp-1 mt-0.5">
                    {cat.name}
                  </h4>
                  <span className="inline-flex items-center gap-1 mt-1 font-dm text-[10px] sm:text-[11px] font-semibold text-[#C45C6A]">
                    Shop now
                    <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Wrap>
      )}

      {/* 3. Original items */}
      <Wrap>
        <SectionHead
          eyebrow="Straight From the Workshop"
          title="Explore original items from local shops"
          copy="Hand-carved marble & brass murtis, listed exactly as our artisan partners photograph and price them."
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {items.slice(0, 4).map((item) => (
            <CatalogCard key={item.name} item={item} />
          ))}
        </div>
      </Wrap>

      {/* 4. Festival sale */}
      <Wrap alt>
        <SectionHead
          eyebrow="Festival Season"
          title="Great Indian Festival Sale products"
          copy="Home mandirs, marble Tulsi pots, and puja essentials — festival pricing while stock lasts."
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {items.slice(4, 8).map((item) => (
            <CatalogCard key={item.name} item={item} />
          ))}
        </div>
      </Wrap>

      {/* 5. Today's Deals */}
      <Wrap>
        <SectionHead eyebrow="Ends Tonight" title="Today's Deals" link="See all deals →" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {items.slice(4, 8).concat(items.slice(0, 2)).map((item) => (
            <CatalogCard key={`deal-${item.name}`} item={{ ...item, tag: `−${Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100)}%` }} compact />
          ))}
        </div>
      </Wrap>

      {/* 6. Flash sale */}
      <Wrap>
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-[#6F241D] text-white px-3 py-3 sm:px-6 sm:py-5">
          <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute right-10 -bottom-10 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
          <p className="font-body text-[8px] sm:text-[10px] tracking-[0.16em] uppercase text-[#E8D4B5]">
            Limited Time
          </p>
          <h3 className="font-playfair font-semibold text-[16px] sm:text-[24px] leading-tight mt-0.5">
            {maxDiscount > 0 ? `Festive Flash Sale — Up to ${maxDiscount}% off` : 'Festive Flash Sale'}
          </h3>
          <p className="font-body text-[10px] sm:text-[12px] text-white/80 mt-0.5 leading-snug">
            Across our handcrafted catalog. Ends soon.
          </p>
          <div className="flex items-center gap-1.5 sm:gap-2.5 mt-2.5">
            {[
              [pad(left.h), 'Hrs'],
              [pad(left.m), 'Min'],
              [pad(left.s), 'Sec'],
            ].map(([v, l], i) => (
              <div
                key={l}
                className={`w-11 h-11 sm:w-14 sm:h-14 rounded-lg bg-[#4A1614] flex flex-col items-center justify-center ${
                  i === 2 ? 'flash-tick' : ''
                }`}
              >
                <strong className="font-body text-[13px] sm:text-[16px] leading-none">{v}</strong>
                <span className="font-body text-[7px] sm:text-[8px] uppercase tracking-wider text-white/65 mt-0.5">
                  {l}
                </span>
              </div>
            ))}
            <Link
              to="/shop"
              className="ml-auto bg-white text-[#6F241D] font-body text-[10px] sm:text-[12px] font-semibold px-3 sm:px-5 py-2 sm:py-2.5 rounded-full shrink-0"
            >
              Shop the Sale
            </Link>
          </div>
        </div>
      </Wrap>

      {/* 8. Trending */}
      <Wrap>
        <SectionHead eyebrow="This Week's Workshop" title="Trending right now" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {items.slice(0, 4).map((item) => {
            const off = item.oldPrice && item.price ? Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100) : 0;
            return (
              <CatalogCard key={`tr-${item.name}`} item={{ ...item, tag: off > 0 ? `${off}% OFF` : undefined }} />
            );
          })}
        </div>
      </Wrap>

      {/* 9. Recently viewed */}
      <Wrap alt>
        <SectionHead eyebrow="Pick Up Where You Left Off" title="Recently viewed" />
        <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
          {(mitti.length ? mitti : items).slice(0, 5).map((p) => (
            <div key={p._id || p.name} className="w-[150px] sm:w-[180px] shrink-0">
              <CatalogCard
                compact
                item={{
                  name: p.name.replace(/ — .*/, ''),
                  price: p.price,
                  image: p.image,
                  to: p._id ? `/product/${p._id}` : '/shop',
                }}
              />
            </div>
          ))}
        </div>
      </Wrap>

      {/* 10. Recommended */}
      <Wrap>
        <SectionHead eyebrow="Because You Browsed Marble Idols" title="Recommended for you" />
        <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
          {items.slice(0, 5).map((item) => (
            <div key={`rec-${item.name}`} className="w-[150px] sm:w-[180px] shrink-0">
              <CatalogCard compact item={item} />
            </div>
          ))}
        </div>
      </Wrap>

      {/* 12. Styled edits — real category sets, pictured with live products */}
      {styledEdits.length > 0 && (
        <Wrap>
          <SectionHead
            eyebrow="Curated, Not Just Categorised"
            title="Styled edits"
            copy="Complete looks and room sets, put together from our live catalogue — shop the whole edit in one tap."
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {styledEdits.map((e) => (
              <Link
                key={e.title}
                to={e.to}
                className="group bg-white rounded-2xl overflow-hidden border border-[#EADFCF] shadow-[0_1px_6px_rgba(63,38,27,0.05)] hover:shadow-[0_12px_28px_rgba(111,36,29,0.14)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative grid grid-cols-2 gap-px bg-[#F1E6D6]">
                  {e.images.slice(0, 4).map((p) => (
                    <div key={p._id} className="aspect-square bg-white overflow-hidden">
                      <ThumbImg
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-[1.06]"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ))}
                  <span className="absolute bottom-2 left-2 bg-black/70 text-white font-mulish text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {e.count} products
                  </span>
                </div>
                <div className="p-3 sm:p-4">
                  <h4 className="font-playfair font-semibold text-[15px] sm:text-[17px] text-[#3F261B] group-hover:text-[#8B2E3A] transition-colors">
                    {e.title}
                  </h4>
                  <p className="font-mulish text-[11px] sm:text-[12px] text-[#8A6A68] mt-1 leading-snug line-clamp-2">{e.copy}</p>
                  <span className="inline-flex items-center gap-1 mt-2 font-mulish text-[11px] font-bold text-[#C45C6A]">
                    Shop the edit
                    <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Wrap>
      )}

      {/* 14. Curated collections — pictured with live catalog products */}
      {collections.length > 0 && (
        <Wrap>
          <SectionHead eyebrow="Product Collections" title="Shop our curated collections" link="All collections →" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {collections.map((d) => (
              <div
                key={d.title}
                className="group bg-white rounded-2xl border border-[#EADFCF] p-2.5 sm:p-3 shadow-[0_1px_6px_rgba(63,38,27,0.05)] hover:shadow-[0_12px_28px_rgba(111,36,29,0.14)] hover:-translate-y-1 transition-all duration-300"
              >
                <h4 className="font-playfair font-semibold text-[13px] sm:text-[15px] text-[#3F261B] leading-snug mb-2">
                  {d.title}
                </h4>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {d.items.map((p) => (
                    <Link
                      key={p._id}
                      to={`/product/${p._id}`}
                      className="aspect-square rounded-lg overflow-hidden bg-white border border-[#F1ECE4]"
                    >
                      <ThumbImg
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-contain p-1.5 transition-transform duration-500 hover:scale-[1.08]"
                        loading="lazy"
                        decoding="async"
                      />
                    </Link>
                  ))}
                </div>
                <Link to="/shop" className="font-mulish text-[11px] font-bold text-[#C45C6A]">
                  View collection →
                </Link>
              </div>
            ))}
          </div>
        </Wrap>
      )}

      {/* 15. Shop by occasion — pictured with real catalog product photos,
          chosen to fit each occasion, instead of a bare gradient. */}
      <Wrap alt>
        <SectionHead eyebrow="Gifting, Sorted" title="Shop by occasion" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {occasionTiles.map((o) => (
            <Link
              key={o.label}
              to={o.link}
              className="relative overflow-hidden rounded-xl aspect-[3/4] sm:aspect-[4/5] flex items-end p-3 text-white font-playfair font-semibold text-[14px] group bg-[#F7EFE0]"
            >
              {o.img && (
                <ThumbImg
                  src={o.img}
                  alt={o.label}
                  className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                />
              )}
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(180deg, transparent 55%, ${o.toColor}F2 100%)` }}
              />
              <span className="relative z-10">{o.label}</span>
            </Link>
          ))}
        </div>
      </Wrap>

      {/* 17. Bestsellers across Jaipurio */}
      <Wrap alt>
        <SectionHead eyebrow="Top Rated This Month" title="Bestsellers across Jaipurio" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {items.slice(0, 4).map((item) => (
            <CatalogCard key={`bs-${item.name}`} item={{ ...item, tag: 'Best Seller' }} />
          ))}
        </div>
      </Wrap>

      {/* 18. More to explore */}
      <Wrap>
        <SectionHead eyebrow="Keep Browsing" title="More to explore" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {items.slice(4, 8).map((item) => (
            <CatalogCard key={`more-${item.name}`} item={item} />
          ))}
        </div>
      </Wrap>
    </>
  );
};

export default HomeAfterCategory;
