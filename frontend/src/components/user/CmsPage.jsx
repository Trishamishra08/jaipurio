import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, Mail, Phone } from 'lucide-react';
import api from '../../utils/api';

// Content pages carried over from the old jaipurio.in site. If one is missing
// or still a draft, its old URL shows a short "being updated" note instead of
// bouncing to the home page, so links from Google and old menus never break.
export const LEGACY_PAGE_SLUGS = [
  'our-story', 'about-us', 'artisan-spotlight', 'crafts-of-india', 'faqs', 'career',
  'cookie-policy', 'terms-of-use', 'refund-policy', 'customer-service', 'terms-conditions', 'privacy-policy',
];

const SUPPORT_PHONE = '+91 9929949258';
const SUPPORT_EMAIL = 'info@jaipurio.com';

// Old pages came from a Bootstrap theme; drop leftover scripts and inline handlers.
const sanitize = (html = '') =>
  String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/href="https?:\/\/(www\.)?jaipurio\.in\/*/gi, 'href="/');

const CONTENT_CLASSES = [
  'font-dm text-[14px] sm:text-[15px] leading-relaxed text-[#4A3A30] break-words',
  '[&_h1]:font-playfair [&_h1]:text-[22px] sm:[&_h1]:text-[28px] [&_h1]:text-[#3F261B] [&_h1]:font-semibold [&_h1]:mt-8 [&_h1]:mb-3',
  '[&_h2]:font-playfair [&_h2]:text-[19px] sm:[&_h2]:text-[24px] [&_h2]:text-[#3F261B] [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3',
  '[&_h3]:font-playfair [&_h3]:text-[17px] sm:[&_h3]:text-[20px] [&_h3]:text-[#6F241D] [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2',
  '[&_h4]:font-semibold [&_h4]:text-[15px] [&_h4]:text-[#3F261B] [&_h4]:mt-5 [&_h4]:mb-1.5',
  '[&_p]:my-3 [&_ul]:my-3 [&_ul]:pl-5 [&_ul]:list-disc [&_ol]:my-3 [&_ol]:pl-5 [&_ol]:list-decimal [&_li]:my-1',
  '[&_a]:text-[#8B2E3A] [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-2',
  '[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-4',
  '[&_table]:w-full [&_table]:my-4 [&_td]:border [&_td]:border-[#EADFCF] [&_td]:p-2 [&_th]:border [&_th]:border-[#EADFCF] [&_th]:p-2',
  '[&_blockquote]:border-l-4 [&_blockquote]:border-[#C45C6A] [&_blockquote]:pl-4 [&_blockquote]:italic',
].join(' ');

const Faqs = ({ items }) => {
  const [open, setOpen] = useState(0);
  return (
    <div className="mt-8 space-y-2">
      {items.map((f, i) => (
        <div key={i} className="border border-[#EADFCF] rounded-xl bg-white">
          <button
            type="button"
            onClick={() => setOpen(open === i ? -1 : i)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left font-semibold text-[14px] text-[#3F261B]"
            aria-expanded={open === i}
          >
            {f.question}
            <ChevronDown size={16} className={`shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && <div className="px-4 pb-4 text-[14px] text-[#5B4638] leading-relaxed whitespace-pre-line">{f.answer}</div>}
        </div>
      ))}
    </div>
  );
};

/**
 * A page managed in Admin → Pages, shown at its own URL (e.g. /our-story).
 * `slug` can be passed in (fixed routes such as /about → about-us); `fallbacks`
 * are tried in order when the first page does not exist.
 */
const CmsPage = ({ slug: fixedSlug, fallbacks = [] }) => {
  const params = useParams();
  const navigate = useNavigate();
  const slug = (fixedSlug || params.slug || '').toLowerCase();
  const [page, setPage] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | missing

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    const tryNext = async (list) => {
      for (const s of list) {
        try {
          const res = await api.get(`/pages/public/slug/${encodeURIComponent(s)}`);
          if (res.data?.data) return res.data.data;
        } catch {
          /* try the next one */
        }
      }
      return null;
    };
    tryNext([slug, ...fallbacks]).then((found) => {
      if (cancelled) return;
      setPage(found);
      setState(found ? 'ready' : 'missing');
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!page) return undefined;
    const prev = document.title;
    document.title = page.seoTitle || `${page.name} | Jaipurio`;
    return () => {
      document.title = prev;
    };
  }, [page]);

  // Links inside the page content stay in the app instead of reloading it.
  const onContentClick = (e) => {
    const a = e.target.closest('a');
    const href = a?.getAttribute('href');
    if (!href || a.target === '_blank' || !href.startsWith('/') || href.startsWith('//')) return;
    e.preventDefault();
    navigate(href);
  };

  if (state === 'loading') {
    return (
      <div className="site-container py-10 max-w-3xl space-y-3">
        <div className="h-8 w-2/3 bg-[#F3E9DA] rounded animate-pulse" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 bg-[#F7F0E6] rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (state === 'missing') {
    // Unknown address → home. Known old page not published yet → keep the URL alive with a short note.
    if (!LEGACY_PAGE_SLUGS.includes(slug)) return <Navigate to="/home" replace />;
    return (
      <div className="site-container py-14 max-w-xl text-center">
        <h1 className="font-playfair text-2xl font-semibold text-[#3F261B]">This page is being updated</h1>
        <p className="font-dm text-sm text-[#806653] mt-2">For any question, our team is happy to help.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm">
          <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E8D4B5] text-[#6F241D] font-semibold">
            <Phone size={14} /> {SUPPORT_PHONE}
          </a>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E8D4B5] text-[#6F241D] font-semibold">
            <Mail size={14} /> {SUPPORT_EMAIL}
          </a>
        </div>
        <Link to="/shop" className="inline-block mt-6 text-xs font-bold text-[#8B2E3A] underline">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="bg-white pb-24 md:pb-12">
      <div className="bg-gradient-to-b from-[#FBF4EA] to-white border-b border-[#F1E6D6]">
        <div className="site-container max-w-3xl py-6 sm:py-10">
          <nav className="font-dm text-[11px] text-[#806653] mb-2">
            <Link to="/home" className="hover:text-[#6F241D]">Home</Link> <span className="mx-1">/</span>
            <span className="text-[#8B2E1E] font-medium">{page.name}</span>
          </nav>
          <h1 className="font-playfair text-[24px] sm:text-[34px] font-semibold text-[#3F261B] leading-tight">{page.name}</h1>
          {page.description && <p className="font-dm text-[13px] sm:text-sm text-[#806653] mt-2 max-w-2xl">{page.description}</p>}
        </div>
      </div>
      <div className="site-container max-w-3xl pt-2">
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
        <div className={CONTENT_CLASSES} onClick={onContentClick} dangerouslySetInnerHTML={{ __html: sanitize(page.content) }} />
        {Array.isArray(page.faqs) && page.faqs.some((f) => f.question && f.answer) && (
          <Faqs items={page.faqs.filter((f) => f.question && f.answer)} />
        )}
      </div>
    </div>
  );
};

export default CmsPage;
