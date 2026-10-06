import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import SectionHeading from './SectionHeading';
import { PHOTOS } from '../../data/photos';

const IMG = {
  jewellery: PHOTOS.jewelry,
  pottery: PHOTOS.bluePottery,
  ganesh: PHOTOS.ganesh,
  pichwai: PHOTOS.pichwai,
  matka: PHOTOS.matka,
  kulhad: PHOTOS.kulhad,
  planter: PHOTOS.planter,
  elephant: PHOTOS.elephantCraft,
  diya: PHOTOS.diya,
  camel: PHOTOS.camel,
  logo: PHOTOS.jaipur,
  kundan: PHOTOS.kundan,
  leather: PHOTOS.leather,
  textile: PHOTOS.textile,
  sherwani: PHOTOS.sherwani,
  buddha: PHOTOS.buddha,
  mandir: PHOTOS.mandir,
  hanging: PHOTOS.hanging,
  vases: PHOTOS.vases,
  terracotta: PHOTOS.terracotta,
  succulent: PHOTOS.succulent,
};

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

/** One tile per real category, pictured with an actual product photo from
 * that category — replaces the old hardcoded 5-tile stock-photo grid. */
const buildCategoryTiles = (products) => {
  const byCategory = new Map();
  products.forEach((p) => {
    if (!p.category || !p.image) return;
    if (!byCategory.has(p.category)) byCategory.set(p.category, p);
  });

  return Array.from(byCategory.entries())
    .slice(0, 5)
    .map(([category, product], i) => ({
      title: category,
      kicker: product.brand || 'Shop the collection',
      img: product.image,
      className: i === 0 ? 'col-span-2 row-span-2 min-h-[180px]' : '',
    }));
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
  const { toggleWishlist, isInWishlist } = useShop();
  const id = item._id || item.name;
  const liked = isInWishlist(id);
  const off =
    item.oldPrice && item.price
      ? Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100)
      : 0;

  return (
    <Link
      to={item.to || '/shop'}
      className="bg-white rounded-xl border border-[#F3D5D0] overflow-hidden shadow-[0_2px_10px_rgba(139,46,58,0.06)] hover:shadow-[0_6px_16px_rgba(139,46,58,0.1)] transition-shadow flex flex-col min-w-[150px]"
    >
      <div className={`relative overflow-hidden bg-[#F7EFE0] ${compact ? 'aspect-square' : 'aspect-[4/3.3]'}`}>
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
        <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover object-center contrast-[1.06] saturate-[1.08]" loading="lazy" />
      </div>
      <div className="p-2.5 flex-1">
        {item.brand && (
          <p className="font-dm text-[8px] sm:text-[9px] font-semibold tracking-[0.12em] uppercase text-[#C45C6A]">
            {item.brand}
          </p>
        )}
        <h4 className="font-playfair text-[12px] sm:text-[13px] font-semibold text-[#3F261B] leading-snug line-clamp-2 mt-0.5">
          {item.name}
        </h4>
        <div className="flex items-baseline gap-1.5 mt-1 font-dm">
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

const HomeAfterCategory = () => {
  const { products } = useShop();
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
  const categoryTiles = useMemo(() => buildCategoryTiles(products), [products]);
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
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover object-center scale-[1.12] transition-transform duration-500 group-hover:scale-[1.18]"
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

      {/* 2. Explore Jaipurio — real catalog categories, each tile using an
          actual product photo from that category instead of stock art. */}
      <Wrap alt>
        <SectionHead eyebrow="Shop the Look" title="Explore Jaipurio" />
        <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-2.5 min-h-[280px] md:min-h-[360px]">
          {categoryTiles.map((b) => (
            <Link
              key={b.title}
              to={`/shop?category=${encodeURIComponent(b.title)}`}
              className={`relative overflow-hidden rounded-xl min-h-[110px] ${b.className || ''}`}
            >
              <img src={b.img} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#8B2E3A]/80 via-[#C45C6A]/20 to-transparent" />
              <div className="absolute bottom-2.5 left-2.5 right-2 text-white">
                <p className="font-dm text-[8px] sm:text-[9px] uppercase tracking-[0.14em] text-[#F8D0C8]">{b.kicker}</p>
                <h4 className="font-playfair font-semibold text-[14px] sm:text-[18px] leading-tight">{b.title}</h4>
                <p className="font-dm text-[10px] mt-0.5 text-white/90">Shop now →</p>
              </div>
            </Link>
          ))}
        </div>
      </Wrap>

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

      {/* 12. Styled edits */}
      <Wrap>
        <SectionHead
          eyebrow="Curated, Not Just Categorised"
          title="Styled edits"
          copy="Complete looks and room sets, put together by our stylists — shop the whole edit in one tap."
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            { title: 'The Wedding Trousseau Edit', copy: 'Bridal kundan, bangles & a bandhgala for the groom — styled together.', count: '7 pieces', from: '#E8A0A8', to: '#8B2E3A' },
            { title: 'The Pooja Room Edit', copy: 'Marble mandir, brass diyas, thali set & bells — a complete corner.', count: '5 pieces', from: '#F4C2C2', to: '#C45C6A' },
            { title: 'The Housewarming Edit', copy: 'Blue pottery, block-print cushions & a brass lamp for the new home.', count: '6 pieces', from: '#D4A5A5', to: '#6F241D' },
          ].map((e) => (
            <Link key={e.title} to="/shop" className="bg-white rounded-xl overflow-hidden border border-[#F3D5D0]">
              <div
                className="h-28 sm:h-36 relative"
                style={{ background: `linear-gradient(160deg, ${e.from}, ${e.to})` }}
              >
                <span className="absolute bottom-2 left-2 bg-black/70 text-white font-dm text-[9px] px-2 py-0.5 rounded-full">
                  {e.count}
                </span>
              </div>
              <div className="p-3">
                <h4 className="font-playfair font-semibold text-[15px] text-[#3F261B]">{e.title}</h4>
                <p className="font-dm text-[11px] text-[#8A6A68] mt-1 leading-snug">{e.copy}</p>
              </div>
            </Link>
          ))}
        </div>
      </Wrap>

      {/* 14. Curated collections */}
      <Wrap>
        <SectionHead eyebrow="Product Collections" title="Shop our curated collections" link="All collections →" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            { title: 'Festive Collection 2026', imgs: [IMG.diya, IMG.ganesh] },
            { title: 'Best Seller Collection', imgs: [IMG.jewellery, IMG.kundan] },
            { title: 'New Arrivals Collection', imgs: [IMG.planter, IMG.kulhad] },
            { title: 'Under ₹5,000 Collection', imgs: [IMG.matka, IMG.succulent] },
          ].map((d) => (
            <div key={d.title} className="bg-white rounded-xl border border-[#F3D5D0] p-2.5 shadow-sm">
              <h4 className="font-playfair font-semibold text-[13px] sm:text-[15px] text-[#3F261B] leading-snug mb-2">
                {d.title}
              </h4>
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                {d.imgs.map((src, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-[#F7F3EE]">
                    <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  </div>
                ))}
              </div>
              <Link to="/shop" className="font-dm text-[11px] font-semibold text-[#C45C6A]">
                View collection →
              </Link>
            </div>
          ))}
        </div>
      </Wrap>

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
                <img
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
