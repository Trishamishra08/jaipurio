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
import PagedCarousel from '../shared/PagedCarousel';
import { useHomeSections } from '../../utils/useHomeSections';
import { useSectionProducts } from '../../utils/useSectionProducts';


/** Groups real products by category into offer tiles (up to 12 = 3 pages of 4) — replaces the
 * old hardcoded OFFER_TILES (fake names/prices paired with stock photos). */
const OFFER_TILE_LIMIT = 12;
const OFFER_PAGE_SIZE = 4;

/** One "Up to X% off <category>" tile from a category's products. */
const makeOfferTile = (category, list) => {
  const withDiscount = list
    .filter((p) => p.image)
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
};

const buildOfferTiles = (products) => {
  const byCategory = new Map();
  products.forEach((p) => {
    if (!p.category || !p.image) return;
    if (!byCategory.has(p.category)) byCategory.set(p.category, []);
    byCategory.get(p.category).push(p);
  });
  return Array.from(byCategory.entries())
    .map(([category, list]) => makeOfferTile(category, list))
    .sort((a, b) => b.maxDiscount - a.maxDiscount)
    .slice(0, OFFER_TILE_LIMIT);
};

const EXPLORE_LIMIT = 8;

/** Explore cards from the live category tree: every top-level category first,
 * then the admin-featured sub-categories, skipping near-empty ones. */
const buildExploreCards = (categories, limit = EXPLORE_LIMIT) => {
  const usable = categories.filter((c) => c.image && c.count >= 3);
  const picked = [...usable.filter((c) => !c.parent), ...usable.filter((c) => c.parent && c.isFeatured)];
  const seen = new Set();
  return picked.filter((c) => !seen.has(c.id) && seen.add(c.id)).slice(0, limit);
};

/**
 * "Shop by occasion" — every tile's photo is a real product that fits its
 * caption: the most popular product of the chosen category, or one specific
 * product. Managed in Admin → Appearance → Home Page → Shop by occasion.
 */
const OccasionSection = ({ cfg }) => {
  const [tiles, setTiles] = useState([]);
  const key = JSON.stringify(cfg.items);

  useEffect(() => {
    let cancelled = false;
    const items = (cfg.items || []).filter((it) => it && it.label);
    const toProduct = (res) => (res.data?.data?.products || []).map(mapApiProductToStorefront).filter(Boolean);
    (async () => {
      const ids = items.filter((it) => it.mode === 'product' && it.productId).map((it) => it.productId);
      const picked = new Map();
      if (ids.length) {
        try {
          const res = await api.get('/products', { params: { ids: ids.join(',') } });
          toProduct(res).forEach((p) => picked.set(String(p._id), p));
        } catch {
          /* tile just falls back to its category link */
        }
      }
      const built = await Promise.all(
        items.map(async (it) => {
          if (it.mode === 'product') {
            const p = picked.get(String(it.productId));
            return p ? { label: it.label, img: p.image, link: `/product/${p._id}` } : null;
          }
          if (!it.category) return null;
          try {
            const res = await api.get('/products', { params: { category: it.category, limit: 1, sort: 'popular' } });
            const p = toProduct(res)[0];
            return p ? { label: it.label, img: p.image, link: `/shop?category=${encodeURIComponent(it.category)}` } : null;
          } catch {
            return null;
          }
        })
      );
      if (!cancelled) setTiles(built.filter(Boolean));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!cfg.enabled || !tiles.length) return null;

  return (
    <Wrap alt>
      <SectionHead eyebrow={cfg.eyebrow} title={cfg.title} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {tiles.map((t) => (
          <Link
            key={t.label}
            to={t.link}
            className="group font-mulish relative overflow-hidden rounded-xl aspect-[4/5] bg-gradient-to-b from-[#FBF6EE] to-[#F3E7D3] border border-[#EADFCF] hover:shadow-[0_10px_24px_rgba(111,36,29,0.14)] hover:-translate-y-1 transition-all duration-300"
          >
            <ThumbImg
              src={t.img}
              alt={t.label}
              className="absolute inset-x-0 top-0 w-full h-[78%] object-contain p-3 transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-x-0 bottom-0 px-3 py-2.5 bg-gradient-to-t from-[#6F241D] via-[#6F241D]/85 to-[#6F241D]/0 pt-7">
              <span className="block text-white font-bold text-[13px] sm:text-[15px] leading-tight">{t.label}</span>
              <span className="block text-white/80 text-[10px] sm:text-[11px] font-semibold mt-0.5">
                Shop now <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">→</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Wrap>
  );
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

const chunk = (list, size) => {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
};

/**
 * A product section whose heading, visibility and products are managed from
 * Admin → Appearance → Home Page. "auto" uses the page's category-mixed pool
 * (`fallback`); "category" / "products" use what the admin picked.
 *   rail   – pages of 4 that slide on their own and can be swiped
 *   deals  – compact cards, pages of 6
 *   scroll – compact cards in a swipeable row
 */
const HomeProductSection = ({ cfg, variant = 'rail', alt = false, fallback = [], tagFor }) => {
  const { items: custom, loading } = useSectionProducts(cfg);
  if (!cfg.enabled || loading) return null;
  const limit = cfg.limit || 8;
  const list = (custom ?? fallback)
    .filter(Boolean)
    .slice(0, limit)
    .map((p) => ({ ...p, to: `/product/${p._id}` }));
  if (!list.length) return null;
  const withTag = (p) => ({ ...p, tag: tagFor ? tagFor(p) : undefined });

  let body;
  if (variant === 'scroll') {
    body = (
      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {list.map((p) => (
          <div key={p._id} className="w-[150px] sm:w-[180px] shrink-0">
            <CatalogCard compact item={withTag(p)} />
          </div>
        ))}
      </div>
    );
  } else {
    const size = variant === 'deals' ? 6 : 4;
    const gridClass =
      variant === 'deals'
        ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5'
        : 'grid grid-cols-2 lg:grid-cols-4 gap-2.5';
    body = (
      <PagedCarousel
        pages={chunk(list, size).map((pg, i) => (
          <div key={i} className={gridClass}>
            {pg.map((p) => (
              <CatalogCard key={p._id} item={withTag(p)} compact={variant === 'deals'} />
            ))}
          </div>
        ))}
      />
    );
  }

  return (
    <Wrap alt={alt}>
      <SectionHead eyebrow={cfg.eyebrow} title={cfg.title} copy={cfg.copy} link={cfg.linkText || 'View All →'} />
      {body}
    </Wrap>
  );
};

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
  const home = useHomeSections();
  const sec = home.sections;
  const offerTiles = useMemo(() => buildOfferTiles(products), [products]);
  // Admin-chosen categories for the offer tiles (Home Page → Today's Offers)
  const [customOfferTiles, setCustomOfferTiles] = useState(null);
  const offersKey = JSON.stringify([sec.offers.source, sec.offers.categories]);
  useEffect(() => {
    if (sec.offers.source !== 'category' || !sec.offers.categories.length) {
      setCustomOfferTiles(null);
      return undefined;
    }
    let cancelled = false;
    Promise.all(
      sec.offers.categories.map((name) =>
        api
          .get('/products', { params: { category: name, limit: 24, sort: 'popular' } })
          .then((res) => ({ name, list: (res.data?.data?.products || []).map(mapApiProductToStorefront).filter(Boolean) }))
          .catch(() => ({ name, list: [] }))
      )
    ).then((rows) => {
      if (!cancelled) setCustomOfferTiles(rows.filter((r) => r.list.length).map((r) => makeOfferTile(r.name, r.list)));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offersKey]);
  // Offer tiles come in pages of 4 that slide on their own and can be swiped.
  const offerPages = useMemo(() => {
    // Automatic: keep every page full. Admin-chosen: show exactly what they picked.
    const source = customOfferTiles ?? offerTiles;
    const full = source.length - (source.length % OFFER_PAGE_SIZE || 0);
    const usable = customOfferTiles || full < OFFER_PAGE_SIZE ? source : source.slice(0, full);
    return chunk(usable.slice(0, sec.offers.limit || OFFER_TILE_LIMIT), OFFER_PAGE_SIZE);
  }, [customOfferTiles, offerTiles, sec.offers.limit]);
  const { categories } = useCategoryTree();
  const exploreCards = useMemo(() => {
    if (sec.explore.source === 'categories' && sec.explore.categories.length) {
      return sec.explore.categories.map((name) => categories.find((c) => c.name === name)).filter(Boolean);
    }
    return buildExploreCards(categories, sec.explore.limit || EXPLORE_LIMIT);
  }, [categories, sec.explore.source, sec.explore.categories, sec.explore.limit]);

  // Category-mixed pool; each automatic section reads its own slice so the
  // same products are not repeated down the page.
  const pool = useMemo(() => products.filter((p) => p.image), [products]);
  const pick = (offset, n = 8) => {
    if (!pool.length) return [];
    return Array.from({ length: Math.min(n, pool.length) }, (_, i) => pool[(offset + i) % pool.length]);
  };
  const discountOf = (p) => (p.oldPrice && p.price && p.oldPrice > p.price ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0);
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

  const renderers = {
    offers: () => (
      <>
        {sec.offers.enabled && offerPages.length > 0 && (
        <Wrap compact>
          <SectionHead
            title={sec.offers.title}
            copy={sec.offers.copy}
            to="/shop"
            link="View All →"
            compact
          />
          <PagedCarousel
            pages={offerPages.map((page, pageIdx) => (
              <div key={pageIdx} className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {page.map((d, i) => (
              <div
                key={d.title}
                className="offer-card offer-card-in group relative bg-white rounded-lg sm:rounded-xl border border-[#E8E2D9] p-2 sm:p-3 overflow-hidden shadow-[0_1px_6px_rgba(63,38,27,0.04)] hover:shadow-[0_6px_16px_rgba(111,36,29,0.08)] transition-shadow duration-300 font-mulish flex flex-col"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                {/* Heading → the category's shop page */}
                <Link to={d.to} className="flex items-start justify-between gap-1.5 mb-2">
                  <h4 className="font-bold text-[13px] sm:text-[15px] lg:text-[16px] text-[#222222] leading-snug line-clamp-2 hover:text-[#8B2E3A] transition-colors">
                    {d.title}
                  </h4>
                  <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-[#6F241D] text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-wide">
                    {d.badge}
                  </span>
                </Link>
  
                {/* Each product → its own product page */}
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 flex-1">
                  {d.items.map((p) => {
                    const off = p.oldPrice > p.price ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
                    return (
                      <Link
                        key={p._id || p.name}
                        to={`/product/${p._id}`}
                        className="group/item min-w-0 flex flex-col"
                        aria-label={p.name}
                      >
                        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-white border border-[#F1ECE4]">
                          <ThumbImg
                            src={p.image}
                            alt={p.name}
                            className="absolute inset-0 w-full h-full object-contain p-1 transition-transform duration-500 group-hover/item:scale-[1.07]"
                          />
                          {off > 0 && (
                            <span className="absolute top-1 left-1 px-1 py-0.5 rounded bg-[#C45C6A] text-white text-[8px] sm:text-[9px] font-bold leading-none">
                              −{off}%
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-[11px] font-semibold text-[#222222] mt-1 line-clamp-2 leading-tight group-hover/item:text-[#8B2E3A] transition-colors">
                          {p.name}
                        </p>
                        <p className="text-[11px] sm:text-[12px] font-extrabold text-[#8B2E1E] leading-tight mt-0.5">
                          ₹{(p.price || 0).toLocaleString('en-IN')}
                          {p.oldPrice > p.price && (
                            <span className="ml-1 font-normal text-[9px] sm:text-[10px] text-[#9A8B7A] line-through">
                              ₹{p.oldPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </p>
                      </Link>
                    );
                  })}
                </div>
  
                <Link
                  to={d.to}
                  className="inline-flex items-center gap-0.5 mt-2 text-[11px] sm:text-[12px] font-bold text-[#6F241D] hover:text-[#8B2E3A]"
                >
                  {d.link}
                  <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
                </Link>
              </div>
            ))}
              </div>
            ))}
          />
        </Wrap>
        )}
      </>
    ),
    explore: () => (
      <>
        {sec.explore.enabled && exploreCards.length > 0 && (
          <Wrap alt>
            <SectionHead eyebrow={sec.explore.eyebrow} title={sec.explore.title} />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
              {exploreCards.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/shop?category=${encodeURIComponent(cat.name)}`}
                  className="group font-mulish bg-white rounded-2xl border border-[#EADFCF] overflow-hidden shadow-[0_1px_6px_rgba(63,38,27,0.05)] hover:shadow-[0_10px_24px_rgba(111,36,29,0.12)] hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] bg-gradient-to-b from-[#FBF6EE] to-[#F3E7D3] overflow-hidden">
                    <ThumbImg
                      src={cat.image}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-contain p-2.5 sm:p-3 transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold text-[#6F241D] shadow-sm">
                      {cat.count} items
                    </span>
                  </div>
                  <div className="px-2.5 py-2 sm:px-3 sm:py-2.5 border-t border-[#F1E6D6]">
                    <p className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.1em] text-[#B08A5A]">Jaipurio Heritage</p>
                    <h4 className="font-bold text-[13px] sm:text-[15px] text-[#222222] group-hover:text-[#8B2E3A] transition-colors leading-tight line-clamp-1 mt-0.5">
                      {cat.name}
                    </h4>
                    <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] sm:text-[11px] font-bold text-[#C45C6A]">
                      Shop now
                      <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Wrap>
        )}
      </>
    ),
    flash: () => (
      <>
        {sec.flash.enabled && (
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
        )}
      </>
    ),
    styled: () => (
      <>
        {sec.styled.enabled && styledEdits.length > 0 && (
          <Wrap>
            <SectionHead
              eyebrow={sec.styled.eyebrow}
              title={sec.styled.title}
              copy={sec.styled.copy}
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
      </>
    ),
    collections: () => (
      <>
        {sec.collections.enabled && collections.length > 0 && (
          <Wrap>
            <SectionHead eyebrow={sec.collections.eyebrow} title={sec.collections.title} link="All collections →" />
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
      </>
    ),
    occasion: () => <OccasionSection cfg={sec.occasion} />,
      original: () => <HomeProductSection cfg={sec.original} fallback={pick(0, sec.original.limit)} />,
      festival: () => <HomeProductSection cfg={sec.festival} alt fallback={pick(8, sec.festival.limit)} />,
      deals: () => (
        <HomeProductSection
          cfg={sec.deals}
          variant="deals"
          fallback={pick(16, sec.deals.limit)}
          tagFor={(p) => (discountOf(p) > 0 ? `−${discountOf(p)}%` : undefined)}
        />
      ),
      trending: () => (
        <HomeProductSection
          cfg={sec.trending}
          fallback={pick(28, sec.trending.limit)}
          tagFor={(p) => (discountOf(p) > 0 ? `${discountOf(p)}% OFF` : undefined)}
        />
      ),
      recent: () => <HomeProductSection cfg={sec.recent} variant="scroll" alt fallback={pick(36, sec.recent.limit)} />,
      recommended: () => <HomeProductSection cfg={sec.recommended} variant="scroll" fallback={pick(42, sec.recommended.limit)} />,
      bestsellers: () => <HomeProductSection cfg={sec.bestsellers} alt fallback={pick(48, sec.bestsellers.limit)} tagFor={() => 'Best Seller'} />,
      more: () => <HomeProductSection cfg={sec.more} fallback={pick(56, sec.more.limit)} />,
  };

  return (
    <>
      {home.order.map((key) => (
        <React.Fragment key={key}>{renderers[key] ? renderers[key]() : null}</React.Fragment>
      ))}
    </>
  );
};

export default HomeAfterCategory;
