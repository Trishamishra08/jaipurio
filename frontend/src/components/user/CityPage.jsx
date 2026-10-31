import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ChevronDown, Clock, CreditCard, Package, RotateCcw, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import api from '../../utils/api';
import { mapApiProductToStorefront } from '../../utils/storefrontProduct';
import { useCategoryTree } from '../../utils/useCategoryTree';
import { useHomeSections } from '../../utils/useHomeSections';
import { getSiteOrigin } from '../../utils/siteUrl';
import { mediaUrl } from '../../data/cloudinaryMedia';
import ThumbImg from '../shared/ThumbImg';
import ProductCard from './ProductCard';
import SectionHeading from './SectionHeading';

const QA_ICONS = { Delivery: Truck, 'Estimated transit': Clock, Payment: CreditCard, Returns: RotateCcw, Customization: Sparkles };

const shopLink = (category) => `/shop?category=${encodeURIComponent(category)}`;

const Wrap = ({ children, tint = false, id }) => (
  <section id={id} className={`w-full py-5 sm:py-7 ${tint ? 'bg-[#FBF6EE]' : 'bg-white'}`}>
    <div className="site-container">{children}</div>
  </section>
);

const Eyebrow = ({ children }) => (
  <p className="font-dm text-[10px] sm:text-[11px] font-semibold tracking-[0.18em] uppercase text-[#C45C6A] mb-1">{children}</p>
);

const H2 = ({ children }) => (
  <h2 className="font-playfair text-[20px] sm:text-[26px] font-semibold text-[#3F261B] leading-tight">{children}</h2>
);

// Paragraphs from plain text (blank line = new paragraph); simple HTML is kept as is.
const toHtml = (text = '') => {
  const t = String(text).trim();
  if (/<(p|h[1-6]|ul|ol|div|br)\b/i.test(t)) return t.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+="[^"]*"/gi, '');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return t.split(/\n\s*\n/).map((p) => `<p>${esc(p).replace(/\n/g, '<br/>')}</p>`).join('');
};

const PROSE = [
  'font-dm text-[14px] sm:text-[15px] leading-relaxed text-[#4A3A30] max-w-3xl',
  '[&_p]:my-3 [&_h3]:font-playfair [&_h3]:text-[18px] [&_h3]:font-semibold [&_h3]:text-[#6F241D] [&_h3]:mt-6 [&_h3]:mb-2',
  '[&_h2]:font-playfair [&_h2]:text-[20px] [&_h2]:font-semibold [&_h2]:text-[#3F261B] [&_h2]:mt-6 [&_h2]:mb-2',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_a]:text-[#8B2E3A] [&_a]:underline',
].join(' ');

/** A row of real products from the catalogue. */
const ProductRail = ({ eyebrow, title, params, viewAll, limit = 4 }) => {
  const [items, setItems] = useState(null);
  const key = JSON.stringify(params);
  useEffect(() => {
    let cancelled = false;
    api
      .get('/products', { params: { ...params, limit } })
      .then((res) => !cancelled && setItems((res.data?.data?.products || []).map(mapApiProductToStorefront).filter((p) => p && p.image)))
      .catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, limit]);
  if (items && !items.length) return null;
  return (
    <Wrap>
      {eyebrow && <div className="text-center"><Eyebrow>{eyebrow}</Eyebrow></div>}
      <SectionHeading title={title} to={viewAll} link="View all →" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {items
          ? items.map((p) => <ProductCard key={p._id} product={p} />)
          : Array.from({ length: 4 }, (_, i) => <div key={i} className="aspect-[3/4] rounded-xl bg-[#FBF6EE] animate-pulse" />)}
      </div>
    </Wrap>
  );
};

const Faqs = ({ items }) => {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-2 max-w-3xl">
      {items.map((f, i) => (
        <div key={i} className="border border-[#EADFCF] rounded-xl bg-white">
          <button
            type="button"
            onClick={() => setOpen(open === i ? -1 : i)}
            aria-expanded={open === i}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left font-semibold text-[14px] text-[#3F261B]"
          >
            {f.question}
            <ChevronDown size={16} className={`shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && <p className="px-4 pb-4 text-[14px] text-[#5B4638] leading-relaxed">{f.answer}</p>}
        </div>
      ))}
    </div>
  );
};

/** Relevant reading: the blogs the editor picked, else the latest posts. */
const Reading = ({ slugs, city }) => {
  const [posts, setPosts] = useState([]);
  const key = slugs.join('|');
  useEffect(() => {
    let cancelled = false;
    const load = slugs.length
      ? Promise.all(slugs.map((s) => api.get(`/blogs/slug/${encodeURIComponent(s)}`).then((r) => r.data?.data?.blog || r.data?.data).catch(() => null)))
      : api.get('/blogs', { params: { limit: 3 } }).then((r) => r.data?.data?.blogs || []).catch(() => []);
    load.then((rows) => !cancelled && setPosts((rows || []).filter((b) => b && b.slug && b.title).slice(0, 3)));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (!posts.length) return null;
  return (
    <Wrap>
      <Eyebrow>Guides</Eyebrow>
      <div className="flex items-end justify-between gap-3 mb-3">
        <H2>Relevant reading</H2>
        <Link to="/blog" className="font-dm text-[12px] font-semibold text-[#8B2E3A] shrink-0">All articles →</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {posts.map((b) => (
          <Link key={b.slug} to={`/blog/${b.slug}`} className="group bg-white border border-[#EADFCF] rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            {b.image && <img src={b.image} alt={b.title} loading="lazy" className="w-full aspect-[16/9] object-cover" />}
            <p className="p-3 font-semibold text-[14px] text-[#3F261B] group-hover:text-[#8B2E3A] leading-snug line-clamp-2">{b.title}</p>
          </Link>
        ))}
      </div>
      <span className="sr-only">Articles for {city} buyers</span>
    </Wrap>
  );
};

const useSeo = (page, preview) => {
  useEffect(() => {
    if (!page || preview) return undefined;
    const g = page.generated;
    const url = `${getSiteOrigin()}/shop/${page.slug}`;
    const prevTitle = document.title;
    document.title = g.title;
    const touched = [];
    const setMeta = (selector, attrs) => {
      let el = document.head.querySelector(selector);
      const existed = !!el;
      const before = el ? el.getAttribute('content') || el.getAttribute('href') : null;
      if (!el) {
        el = document.createElement(attrs.tag || 'meta');
        Object.entries(attrs).forEach(([k, v]) => k !== 'tag' && k !== 'value' && el.setAttribute(k, v));
        document.head.appendChild(el);
      }
      el.setAttribute(attrs.tag === 'link' ? 'href' : 'content', attrs.value);
      touched.push({ el, existed, before, attr: attrs.tag === 'link' ? 'href' : 'content' });
    };
    setMeta('meta[name="description"]', { name: 'description', value: g.metaDescription });
    setMeta('link[rel="canonical"]', { tag: 'link', rel: 'canonical', value: url });
    // Demo/preview hosts keep their index.html noindex tag.
    if (!document.head.querySelector('meta[data-host-noindex="true"]')) {
      setMeta('meta[name="robots"]', { name: 'robots', value: page.indexable === false ? 'noindex,follow' : 'index,follow' });
    }
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.text = JSON.stringify([
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${getSiteOrigin()}/home` },
          { '@type': 'ListItem', position: 2, name: 'Ships To', item: `${getSiteOrigin()}/ships-to` },
          { '@type': 'ListItem', position: 3, name: `${page.city}, ${page.country}`, item: url },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: page.faqsResolved.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
      },
    ]);
    document.head.appendChild(ld);
    return () => {
      document.title = prevTitle;
      ld.remove();
      touched.forEach(({ el, existed, before, attr }) => (existed ? before != null && el.setAttribute(attr, before) : el.remove()));
    };
  }, [page, preview]);
};

/**
 * The city / country page itself. `page` is the API shape ({ ...fields, generated, faqsResolved }).
 * `preview` (admin) skips SEO tags and shows editor notes for missing content.
 */
export const CityPageView = ({ page, preview = false }) => {
  const { categories } = useCategoryTree();
  const occasionTiles = useHomeSections().sections.occasion?.items || [];
  useSeo(page, preview);
  const g = page.generated;
  const cats = useMemo(
    () => (page.categories || []).map((name) => categories.find((c) => c.name === name) || { id: name, name }),
    [page.categories, categories]
  );
  const occasions = (page.occasions || []).map((label) => {
    const tile = occasionTiles.find((o) => o.label === label);
    return { label, to: tile?.category ? shopLink(tile.category) : `/shop?search=${encodeURIComponent(label)}` };
  });
  const proof = (page.localProof || []).filter((f) => f.label && f.detail);
  const hasMain = String(page.mainContent || '').trim().length > 0;
  if (!g) return null;

  return (
    <div className="bg-white pb-20 md:pb-10 overflow-x-hidden">
      {/* Breadcrumb */}
      <nav className="site-container pt-3 font-dm text-[11px] text-[#806653]">
        <Link to="/home" className="hover:text-[#6F241D]">Home</Link> <span className="mx-1">/</span>
        <Link to="/ships-to" className="hover:text-[#6F241D]">Ships To</Link> <span className="mx-1">/</span>
        <span className="text-[#8B2E1E] font-medium">{page.city}, {page.country}</span>
      </nav>

      {/* 1. Hero */}
      <section className="bg-gradient-to-b from-[#FBF4EA] to-white">
        <div className="site-container py-6 sm:py-10">
          <Eyebrow>{g.eyebrow}</Eyebrow>
          <h1 className="font-playfair text-[26px] sm:text-[38px] font-semibold text-[#3F261B] leading-tight max-w-3xl">{g.h1}</h1>
          <p className="font-dm text-[14px] sm:text-[16px] text-[#5B4638] mt-3 max-w-2xl leading-relaxed">{g.summary}</p>
          <div className="flex flex-wrap gap-2.5 mt-5">
            <Link to="/shop" className="bg-[#6F241D] hover:bg-[#8B2E3A] text-white px-5 py-2.5 rounded-full text-[13px] font-bold">Shop All Products</Link>
            <a href="#delivery" className="border border-[#6F241D]/30 text-[#6F241D] px-5 py-2.5 rounded-full text-[13px] font-bold hover:bg-white">Check Delivery</a>
          </div>
        </div>
      </section>

      {/* 2. Why this city */}
      {(page.featureNote || preview) && (
        <Wrap>
          <div className={`grid gap-5 items-center ${page.featureImage ? 'md:grid-cols-2' : ''}`}>
            <div>
              <Eyebrow>Why Jaipur crafts, in {page.city}</Eyebrow>
              <H2>{g.whyTitle}</H2>
              {page.featureNote ? (
                <p className="font-dm text-[14px] sm:text-[15px] text-[#4A3A30] mt-3 leading-relaxed">{page.featureNote}</p>
              ) : (
                <p className="mt-3 text-[13px] text-red-600 italic">[Editor: add the city feature note — 2–3 real sentences about {page.city}.]</p>
              )}
              <p className="font-dm text-[13px] text-[#806653] mt-2">Pieces are packed for transit and shipped from Jaipur, Rajasthan with tracked courier service.</p>
            </div>
            {page.featureImage && <img src={mediaUrl(page.featureImage)} alt={page.city} loading="lazy" className="w-full rounded-2xl object-cover aspect-[4/3]" />}
          </div>
        </Wrap>
      )}

      {/* 3. Quick answers */}
      <Wrap tint id="delivery">
        <H2>Quick answers for {page.city} shoppers</H2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mt-4">
          {g.quickAnswers.map((q) => {
            const Icon = QA_ICONS[q.label] || Package;
            return (
              <div key={q.label} className="bg-white border border-[#EADFCF] rounded-xl p-3.5">
                <p className="flex items-center gap-1.5 font-bold text-[13px] text-[#6F241D]"><Icon size={15} /> {q.label}</p>
                <p className="font-dm text-[12.5px] text-[#5B4638] mt-1.5 leading-snug">{q.text}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 flex items-start gap-2 font-dm text-[12.5px] text-[#5B4638] max-w-3xl">
          <ShieldCheck size={15} className="shrink-0 mt-0.5 text-[#A94E2C]" /> {g.customsNote}
        </p>
      </Wrap>

      {/* 4. Ordering */}
      <Wrap>
        <H2>Ordering from {page.city}</H2>
        <p className="font-dm text-[14px] text-[#4A3A30] mt-3 max-w-3xl leading-relaxed">{g.orderingText}</p>
      </Wrap>

      {/* 5. Shop by category */}
      {cats.length > 0 && (
        <Wrap tint>
          <Eyebrow>Shop by category</Eyebrow>
          <H2>What ships to {page.city}</H2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4">
            {cats.map((c) => (
              <Link key={c.id} to={shopLink(c.name)} className="group bg-white border border-[#EADFCF] rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-[#FBF6EE] relative">
                  {c.image && <ThumbImg src={c.image} alt={c.name} className="absolute inset-0 w-full h-full object-contain p-2" />}
                </div>
                <p className="px-2.5 py-2 font-semibold text-[13px] text-[#3F261B] group-hover:text-[#8B2E3A] line-clamp-1">{c.name}</p>
              </Link>
            ))}
          </div>
        </Wrap>
      )}

      {/* 7. Main content */}
      <Wrap>
        <Eyebrow>{page.city} shopping guide</Eyebrow>
        <H2>Buying Rajasthani handicrafts in {page.city}</H2>
        {hasMain ? (
          <div className={`${PROSE} mt-2`} dangerouslySetInnerHTML={{ __html: toHtml(page.mainContent) }} />
        ) : (
          preview && <p className="mt-3 text-[13px] text-red-600 italic">[Editor: this page cannot go live until 700+ words of real, {page.city}-specific content are added.]</p>
        )}
      </Wrap>

      {/* 9–15. Live product rails */}
      <ProductRail eyebrow="Today's deals" title="Priced to ship this week" params={{ onSale: 'true', sort: 'discount' }} viewAll="/shop?offers=1" />
      <ProductRail eyebrow="Trending right now" title={`Popular with ${page.city} buyers`} params={{ sort: 'popular' }} viewAll="/shop?sort=popular" />

      {/* 13. Occasions */}
      {occasions.length > 0 && (
        <Wrap tint>
          <Eyebrow>Shop by occasion</Eyebrow>
          <H2>Gifting from Jaipur, for {page.city} celebrations</H2>
          <div className="flex flex-wrap gap-2 mt-4">
            {occasions.map((o) => (
              <Link key={o.label} to={o.to} className="px-4 py-2 rounded-full bg-[#6F241D] hover:bg-[#8B2E3A] text-white text-[13px] font-semibold">
                {o.label}
              </Link>
            ))}
          </div>
        </Wrap>
      )}

      <ProductRail eyebrow="Best sellers" title="Top rated by customers" params={{ sort: 'rating' }} viewAll="/shop?sort=rating" />
      <ProductRail eyebrow="Explore more" title="New arrivals & gift ideas" params={{ sort: 'new' }} viewAll="/shop?sort=new" />

      {/* 16–21. One grid per chosen category */}
      {cats.map((c) => (
        <ProductRail key={c.id} eyebrow={c.name} title={`${c.name} for ${page.city}`} params={{ category: c.name, sort: 'popular' }} viewAll={shopLink(c.name)} />
      ))}

      {/* 22. Local proof */}
      {(proof.length > 0 || preview) && (
        <Wrap tint>
          <Eyebrow>Shipping record</Eyebrow>
          <H2>What we can honestly tell {page.city} buyers</H2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 max-w-3xl">
            {proof.map((f, i) => (
              <div key={i} className="bg-white border border-[#EADFCF] rounded-xl p-3.5">
                <p className="font-bold text-[13px] text-[#3F261B]">{f.label}</p>
                <p className="font-dm text-[13px] text-[#5B4638] mt-1">{f.detail}</p>
              </div>
            ))}
            {!proof.length && <p className="text-[13px] text-red-600 italic">[Editor: add at least one real, verifiable fact.]</p>}
          </div>
        </Wrap>
      )}

      {/* 23. FAQs */}
      <Wrap>
        <Eyebrow>{page.city} FAQs</Eyebrow>
        <div className="mb-3"><H2>Questions {page.city} buyers ask</H2></div>
        <Faqs items={page.faqsResolved} />
      </Wrap>

      {/* 24. Reading */}
      <Reading slugs={page.relatedBlogs || []} city={page.city} />

      {/* 25. Close */}
      <section className="bg-[#6F241D] text-white">
        <div className="site-container py-8 sm:py-10 text-center">
          <h2 className="font-playfair text-[22px] sm:text-[28px] font-semibold">{g.closeTitle}</h2>
          <p className="font-dm text-[14px] text-white/85 mt-2 max-w-2xl mx-auto">{g.closeText}</p>
          <Link to="/shop" className="inline-block mt-5 bg-white text-[#6F241D] px-6 py-2.5 rounded-full text-[13px] font-bold">Start Shopping</Link>
        </div>
      </section>
    </div>
  );
};

/** /shop/:slug — a published city page. */
const CityPage = () => {
  const { slug = '' } = useParams();
  const [page, setPage] = useState(null);
  const [state, setState] = useState('loading');
  useEffect(() => {
    let cancelled = false;
    setState('loading');
    api
      .get(`/city-pages/public/${encodeURIComponent(slug.toLowerCase())}`)
      .then((res) => {
        if (cancelled) return;
        setPage(res.data?.data || null);
        setState('ready');
      })
      .catch(() => !cancelled && setState('missing'));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state === 'missing') return <Navigate to="/shop" replace />;
  if (state === 'loading' || !page) {
    return (
      <div className="site-container py-10 space-y-3">
        <div className="h-9 w-2/3 bg-[#F3E9DA] rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-[#F7F0E6] rounded animate-pulse" />
      </div>
    );
  }
  return <CityPageView page={page} />;
};

/** /ships-to — every published city page, grouped by country (internal links for shoppers and search engines). */
export const ShipsToIndex = () => {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    api.get('/city-pages/public').then((r) => setRows(r.data?.data || [])).catch(() => setRows([]));
  }, []);
  const byCountry = useMemo(() => {
    const m = new Map();
    (rows || []).forEach((r) => m.set(r.country, [...(m.get(r.country) || []), r]));
    return [...m.entries()];
  }, [rows]);
  return (
    <div className="bg-white pb-20 md:pb-10">
      <div className="site-container py-6 sm:py-10">
        <h1 className="font-playfair text-[26px] sm:text-[34px] font-semibold text-[#3F261B]">Where we ship</h1>
        <p className="font-dm text-sm text-[#806653] mt-2 max-w-2xl">Delivery times, customs and returns for each city we ship to from Jaipur.</p>
        {rows === null ? (
          <div className="h-24 mt-6 rounded-xl bg-[#FBF6EE] animate-pulse" />
        ) : byCountry.length === 0 ? (
          <p className="mt-6 text-sm text-[#806653]">City guides are coming soon. <Link to="/shop" className="text-[#8B2E3A] font-semibold underline">Shop all products</Link></p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {byCountry.map(([country, list]) => (
              <div key={country}>
                <h2 className="font-bold text-[15px] text-[#3F261B] mb-2">{country}</h2>
                <ul className="space-y-1">
                  {list.map((r) => (
                    <li key={r.slug}>
                      <Link to={`/shop/${r.slug}`} className="font-dm text-[14px] text-[#8B2E3A] hover:underline">Shop in {r.city} →</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CityPage;
