import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { mediaUrl } from '../../data/cloudinaryMedia';
import {
  Search,
  ShoppingCart,
  ShoppingBag,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { PHOTOS } from '../../data/photos';
import { useCategoryTree } from '../../utils/useCategoryTree';
import { useFooterSettings } from '../../utils/useFooterSettings';

const HAWA = PHOTOS.buddha;

const IconInstagram = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IconFacebook = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
    <path d="M15 8h3V4h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V9a1 1 0 011-1z" />
  </svg>
);

const IconPinterest = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden>
    <path d="M12 2C6.5 2 2 6.5 2 12c0 4.1 2.5 7.6 6 9.1-.1-.8-.2-2 0-2.9.2-.8 1.3-5.5 1.3-5.5s-.3-.7-.3-1.6c0-1.5.9-2.6 2-2.6.9 0 1.4.7 1.4 1.5 0 .9-.6 2.3-.9 3.5-.3 1.1.5 1.9 1.6 1.9 1.9 0 3.2-2.4 3.2-5.3 0-2.2-1.5-3.8-4.2-3.8-3.1 0-5 2.3-5 4.8 0 .9.3 1.8.7 2.4.1.1.1.2.1.3l-.3 1.1c0 .2-.1.3-.3.2-1.3-.5-1.9-1.9-1.9-3.5 0-2.6 2.2-5.7 6.5-5.7 3.5 0 5.8 2.5 5.8 5.2 0 3.6-2 6.2-4.9 6.2-1 0-1.9-.5-2.2-1.1l-.6 2.3c-.2.8-.8 1.8-1.2 2.4.9.3 1.9.4 2.9.4 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
  </svg>
);

const ACTION_ICONS = { search: Search, cart: ShoppingCart, bag: ShoppingBag };

const shopLink = (name) => `/shop?category=${encodeURIComponent(name)}`;

const Social = ({ links }) => {
  const items = [
    [links.instagram, 'Instagram', <IconInstagram key="ig" />],
    [links.facebook, 'Facebook', <IconFacebook key="fb" />],
    [links.pinterest, 'Pinterest', <IconPinterest key="pin" />],
  ].filter(([href]) => href);
  if (!items.length) return null;
  return (
    <div className="flex items-center gap-1.5">
      {items.map(([href, label, icon]) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className="w-7 h-7 rounded-full border border-white/25 flex items-center justify-center text-white/85 hover:bg-white/10"
        >
          {icon}
        </a>
      ))}
    </div>
  );
};

const StoreBadge = ({ store, sub }) => (
  <div className="relative">
    <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-[1] px-1.5 py-[1px] rounded-full bg-[#C45C6A] text-white font-body text-[7px] font-bold tracking-wide whitespace-nowrap">
      COMING SOON
    </span>
    <span className="inline-flex flex-col justify-center bg-black text-white rounded-md px-2 py-1.5 min-w-[96px] sm:min-w-[108px] border border-white/20">
      <span className="font-body text-[8px] text-white/70 leading-none">{sub}</span>
      <span className="font-body text-[11px] font-semibold leading-tight mt-0.5">{store}</span>
    </span>
  </div>
);

/** One heading link per top-level category, followed by its sub-categories — plain crawlable links. */
const CategoryGroups = ({ groups }) => (
  <div className="space-y-2.5 lg:columns-2 lg:gap-x-8 lg:space-y-0">
    {groups.map(({ top, subs }) => (
      <p key={top.id} className="font-body text-[11px] sm:text-[12px] leading-relaxed text-white/75 lg:break-inside-avoid lg:mb-3">
        <Link to={shopLink(top.name)} className="font-bold text-white hover:text-[#E8C4A0] mr-1.5">
          {top.name}:
        </Link>
        {subs.map((c, i) => (
          <React.Fragment key={c.id}>
            <Link to={shopLink(c.name)} className="hover:text-white hover:underline">
              {c.name}
            </Link>
            {i < subs.length - 1 && (
              <span className="mx-1.5 text-white/30" aria-hidden="true">
                |
              </span>
            )}
          </React.Fragment>
        ))}
      </p>
    ))}
  </div>
);

const Pills = ({ items }) => (
  <div className="flex flex-wrap gap-1.5 sm:gap-2">
    {items.map((c) => (
      <span
        key={c}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-white/20 font-body text-[10px] sm:text-[11px] text-white/85"
      >
        <MapPin size={10} />
        {c}
      </span>
    ))}
  </div>
);

/** Only Google Maps / OpenStreetMap embeds over https are used — never an arbitrary page in an iframe. */
const safeEmbedUrl = (url) => {
  try {
    const u = new URL(String(url || '').trim());
    const google = /^(www\.|maps\.)?google\.(com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})$/i.test(u.hostname) && u.pathname.startsWith('/maps');
    const osm = u.hostname === 'www.openstreetmap.org';
    return u.protocol === 'https:' && (google || osm) ? u.toString() : '';
  } catch {
    return '';
  }
};

const OfficeCard = ({ office }) => {
  const query = encodeURIComponent(office.address || office.title || '');
  const open = office.mapLink || `https://www.google.com/maps/search/?api=1&query=${query}`;
  const embed =
    office.mapMode === 'embed' && safeEmbedUrl(office.mapEmbedUrl)
      ? safeEmbedUrl(office.mapEmbedUrl)
      : `https://maps.google.com/maps?q=${query}&z=15&output=embed`;
  const showMap = office.showMap && (office.address || office.mapMode === 'embed');
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
      <div className="min-w-0">
        <h4 className="font-playfair font-semibold text-[14px] sm:text-[16px]">{office.title}</h4>
        {office.address && <p className="font-body text-[10px] sm:text-[12px] text-white/70 mt-1 leading-snug">{office.address}</p>}
        {office.hours && <p className="font-body text-[10px] sm:text-[12px] text-white/70 mt-1 leading-snug">{office.hours}</p>}
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
          {office.phone && (
            <a href={`tel:${office.phone.replace(/[^+\d]/g, '')}`} className="font-body text-[11px] text-white/85 hover:text-white">
              {office.phone}
            </a>
          )}
          {office.email && (
            <a href={`mailto:${office.email}`} className="font-body text-[11px] text-white/85 hover:text-white break-all">
              {office.email}
            </a>
          )}
        </div>
        <a href={open} target="_blank" rel="noreferrer" className="inline-block mt-1.5 font-body text-[11px] font-semibold text-[#E8C4A0]">
          Open in Maps →
        </a>
      </div>
      {showMap && (
        <div className="relative rounded-lg overflow-hidden border border-white/15 h-[110px] sm:h-[140px] bg-black/30">
          <iframe
            title={`${office.title} map`}
            src={embed}
            className="w-full h-full pointer-events-none grayscale contrast-125 opacity-90"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <a href={open} target="_blank" rel="noreferrer" className="absolute inset-0" aria-label={`Open ${office.title} in Google Maps`} />
        </div>
      )}
    </div>
  );
};

// Everything in here — texts, links, columns, address — is edited in
// Admin → Appearance → Footer. The category directory is built live.
const Footer = () => {
  const cfg = useFooterSettings();
  const { categories } = useCategoryTree();
  const [open, setOpen] = useState(null);

  // The live tree is depth-first: each top-level category is followed by its whole subtree.
  const groups = [];
  categories.forEach((c) => {
    if (!c.parent) groups.push({ top: c, subs: [] });
    else if (groups.length) groups[groups.length - 1].subs.push(c);
  });

  const dir = cfg.directory;
  const columns = [
    ...(dir.categoriesEnabled && groups.length ? [{ key: 'categories', title: dir.categoriesTitle, groups }] : []),
    ...dir.columns.filter((c) => c && c.title).map((c, i) => ({ key: `col-${i}`, title: c.title, links: (c.links || []).filter((l) => l && l.label) })),
  ];
  const linkedPages = columns.reduce((n, col) => n + (col.groups ? categories.length : col.links.length), 0);
  const stats = cfg.stats.items.map((it) => ({ ...it, value: String(it.value).replace('{categories}', categories.length || '') }));
  const shippingRegions = (cfg.shipping.regions || [])
    .map((r) => ({ ...r, places: (r.places || []).filter(Boolean) }))
    .filter((r) => r.places.length > 0);
  const offices = (cfg.offices.items || []).filter((o) => o && (o.title || o.address));
  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="w-full text-white pb-[68px] md:pb-0">
      {cfg.backToTop.enabled && (
        <button
          type="button"
          onClick={toTop}
          className="w-full bg-[#4A1614] py-2 font-body text-[11px] sm:text-[12px] tracking-wide text-white/90 hover:bg-[#3F1311]"
        >
          {cfg.backToTop.text}
        </button>
      )}

      <div className="relative overflow-hidden bg-[#2A100E]">
        <img
          src={HAWA}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center opacity-35 pointer-events-none select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2A100E]/70 via-[#3F1612]/80 to-[#2A100E]" />

        <div className="relative z-[1]">
          <div className="footer-pichwai" aria-hidden />

          {/* Heritage line */}
          {cfg.heritage.enabled && (
            <div className="site-container pt-4 pb-3 sm:pt-8 sm:pb-6 text-center">
              <p className="font-body text-[8px] sm:text-[10px] font-semibold tracking-[0.22em] uppercase text-[#E8C4A0]">
                {cfg.heritage.eyebrow}
              </p>
              <h2 className="font-playfair font-semibold text-[16px] sm:text-[26px] md:text-[32px] leading-snug mt-1 px-2">
                {cfg.heritage.title}
              </h2>
              <p className="font-body text-[10px] sm:text-[13px] text-white/75 mt-1.5 max-w-xl mx-auto leading-snug">
                {cfg.heritage.text}
              </p>
            </div>
          )}

          {/* Call to action + app */}
          <div className="site-container pb-3 sm:pb-5">
            {cfg.cta.enabled && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <img src={mediaUrl('/jaipurio_logo.png')} alt="Jaipurio" className="h-8 w-8 sm:h-10 sm:w-10 object-contain shrink-0" />
                  <p className="font-playfair text-[13px] sm:text-[18px] leading-snug">{cfg.cta.text}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {cfg.cta.buttonText && (
                    <Link
                      to={cfg.cta.buttonLink || '/'}
                      className="bg-[#6F241D] hover:bg-[#5A1C17] text-white font-body text-[11px] sm:text-[13px] font-semibold px-3.5 sm:px-5 py-2 rounded-full"
                    >
                      {cfg.cta.buttonText}
                    </Link>
                  )}
                  {cfg.cta.linkText && (
                    <Link to={cfg.cta.link || '/'} className="font-body text-[11px] sm:text-[13px] text-white/80 hover:text-white">
                      {cfg.cta.linkText}
                    </Link>
                  )}
                  <Social links={cfg.social} />
                </div>
              </div>
            )}

            {cfg.app.enabled && (
              <div className={`flex flex-wrap items-center justify-between gap-2 ${cfg.cta.enabled ? 'mt-3 pt-3 border-t border-white/10' : ''}`}>
                <div className="min-w-0">
                  <p className="font-body text-[11px] sm:text-[13px] font-semibold">{cfg.app.title}</p>
                  <p className="font-body text-[9px] sm:text-[11px] text-white/65 leading-snug">{cfg.app.text}</p>
                </div>
                {cfg.app.showBadges && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StoreBadge store="App Store" sub="Download on the" />
                    <StoreBadge store="Google Play" sub="Get it on" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          {cfg.stats.enabled && stats.length > 0 && (
            <div className="bg-[#F6EFE4] text-[#2B1E1A]">
              <div className="site-container py-2.5 sm:py-3">
                <div
                  className="flex md:grid gap-3 overflow-x-auto scrollbar-none snap-x md:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
                  style={{ '--n': stats.length }}
                >
                  {stats.map((st, i) => (
                    <div key={`${st.label}-${i}`} className="snap-start shrink-0 min-w-[118px] md:min-w-0 text-center">
                      <p className="font-playfair font-semibold text-[15px] sm:text-[18px] leading-none">{st.value}</p>
                      <p className="font-body text-[9px] sm:text-[11px] text-[#6B5748] mt-0.5 leading-tight">{st.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="site-container py-3 sm:py-5">
            {/* Action cards */}
            {cfg.actions.enabled && cfg.actions.items.length > 0 && (
              <div
                className="flex lg:grid gap-2 overflow-x-auto scrollbar-none snap-x lg:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
                style={{ '--n': cfg.actions.items.length }}
              >
                {cfg.actions.items.map((a, i) => {
                  const Icon = ACTION_ICONS[a.icon] || Search;
                  return (
                    <Link
                      key={`${a.title}-${i}`}
                      to={a.to || '/'}
                      className="snap-start shrink-0 w-[232px] lg:w-auto rounded-xl border border-white/15 bg-black/25 p-3 hover:bg-black/35"
                    >
                      <Icon size={16} className="text-[#E8C4A0]" strokeWidth={1.8} />
                      <h3 className="font-playfair font-semibold text-[14px] sm:text-[16px] mt-1.5">{a.title}</h3>
                      <p className="font-body text-[10px] sm:text-[11px] text-white/70 mt-1 leading-snug line-clamp-2">{a.text}</p>
                      <span className="font-body text-[10px] sm:text-[12px] font-semibold text-[#E8C4A0] mt-1.5 inline-block">{a.linkText}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Site directory: ONE category directory + the admin's link columns */}
            {dir.enabled && columns.length > 0 && (
              <div className="mt-4 sm:mt-6">
                <div className="flex items-end justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-playfair font-semibold text-[15px] sm:text-[20px]">{dir.title}</h3>
                    {dir.subtitle && <p className="font-body text-[9px] sm:text-[11px] text-white/60 hidden sm:block">{dir.subtitle}</p>}
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-full border border-white/20 font-body text-[9px] text-white/70">
                    {linkedPages} linked pages
                  </span>
                </div>

                <div
                  className="md:grid md:gap-x-6 md:gap-y-4 md:grid-cols-3 lg:[grid-template-columns:minmax(0,2.4fr)_repeat(var(--n),minmax(0,1fr))] border-t border-white/10 md:border-0"
                  style={{ '--n': Math.max(1, columns.filter((c) => !c.groups).length) }}
                >
                  {columns.map((col, i) => {
                    const isOpen = open === i;
                    return (
                      <div key={col.key} className={`border-b border-white/10 md:border-0 ${col.groups ? 'md:col-span-3 lg:col-span-1' : ''}`}>
                        <button
                          type="button"
                          className="w-full flex items-center justify-between py-2.5 md:py-0 md:mb-2 md:pointer-events-none"
                          onClick={() => setOpen(isOpen ? null : i)}
                          aria-expanded={isOpen}
                        >
                          <span className="font-body text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E8C4A0]">
                            {col.title}
                          </span>
                          <ChevronDown size={14} className={`md:hidden text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`${isOpen ? 'block pb-3' : 'hidden'} md:block`}>
                          {col.groups ? (
                            <nav aria-label={col.title}>
                              <CategoryGroups groups={col.groups} />
                            </nav>
                          ) : (
                            <ul className="space-y-1">
                              {col.links.map((l, li) => (
                                <li key={`${l.label}-${li}`}>
                                  <Link to={l.to || '/'} className="font-body text-[11px] sm:text-[12px] text-white/80 hover:text-white">
                                    {l.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {columns.some((c) => c.groups) && (
                  <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                      __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'ItemList',
                        name: 'Jaipurio product categories',
                        itemListElement: groups.map((g, i) => ({
                          '@type': 'ListItem',
                          position: i + 1,
                          name: g.top.name,
                          url: `${siteOrigin}${shopLink(g.top.name)}`,
                        })),
                      }),
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Shipping + office + copyright */}
          <div className="border-t border-white/10">
            <div className="site-container py-3 sm:py-5">
              {cfg.shipping.enabled && shippingRegions.length > 0 && (
                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                  {shippingRegions.map((region, i) => (
                    <div key={`${region.title}-${i}`}>
                      {region.title && (
                        <p className="font-body text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.16em] text-[#E8C4A0] mb-1.5">
                          {region.title}
                        </p>
                      )}
                      <Pills items={region.places} />
                    </div>
                  ))}
                </div>
              )}

              {cfg.offices.enabled && offices.length > 0 && (
                <div className="mt-3 sm:mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                  {offices.map((office, i) => (
                    <OfficeCard key={`${office.title}-${i}`} office={office} />
                  ))}
                </div>
              )}

              {cfg.copyright && (
                <p className="mt-3 pt-2 border-t border-white/10 font-body text-[9px] sm:text-[10px] text-white/45 text-center sm:text-left">
                  {cfg.copyright}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
