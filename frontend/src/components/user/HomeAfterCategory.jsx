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

const CRAFT = {
  matka: PHOTOS.matka,
  ghada: PHOTOS.matkaRow,
  kulhad: PHOTOS.kulhad,
  kulhadPack: PHOTOS.teaCups,
  planter: PHOTOS.planter,
  elephantPlanter: PHOTOS.garden,
  diya: PHOTOS.diya,
  camelDiya: PHOTOS.diwali,
};

const OFFER_TILES = [
  {
    title: 'Up to 33% off Matkas',
    badge: '33% OFF',
    to: '/shop?category=Matkas',
    link: 'Shop Matkas',
    items: [
      { name: 'Design Matka (5L)', price: 399, oldPrice: 599, image: CRAFT.matka },
      { name: 'Clay Ghada (3L)', price: 349, oldPrice: 499, image: CRAFT.ghada },
    ],
  },
  {
    title: 'Min. 28% off Kulhads',
    badge: 'Combo',
    to: '/shop?category=Kulhads',
    link: 'Shop Kulhads',
    items: [
      { name: 'Kulhad Pack of 6', price: 249, oldPrice: 349, image: CRAFT.kulhad },
      { name: 'Kulhad Pack of 12', price: 399, oldPrice: 549, image: CRAFT.kulhadPack },
    ],
  },
  {
    title: 'New: Handmade Planters',
    badge: 'New',
    to: '/shop?category=Planters',
    link: 'Shop Planters',
    items: [
      { name: 'Mitti Planter (8in)', price: 349, oldPrice: 499, image: CRAFT.planter },
      { name: 'Elephant Planter', price: 449, oldPrice: 649, image: CRAFT.elephantPlanter },
    ],
  },
  {
    title: 'Starting ₹299 — Puja Sets',
    badge: 'Festive',
    to: '/shop?category=Puja Essentials',
    link: 'Shop Puja',
    items: [
      { name: 'Diya Set (8 pcs)', price: 299, oldPrice: 450, image: CRAFT.diya },
      { name: 'Camel Diya Stand', price: 349, oldPrice: 499, image: CRAFT.camelDiya },
    ],
  },
];

const CATALOG = [
  { name: 'Hanuman ji Statue — Divine Devotion Marble Murti', brand: 'Vinayak Art & Marble', price: 18500, oldPrice: 30000, rating: 4.3, reviews: 312, image: PHOTOS.ganesh, tag: 'Hot Sale' },
  { name: 'Goddess Durga Marble Statue — Symbol of Power', brand: 'Vinayak Art & Marble', price: 20000, oldPrice: 35000, rating: 4.11, reviews: 98, image: PHOTOS.buddha, tag: 'Hot Sale' },
  { name: 'Gautama Buddha Statue — Zen Meditation Decor', brand: 'Vinayak Art & Marble', price: 20000, oldPrice: 30000, rating: 4.42, reviews: 156, image: PHOTOS.jewelry, tag: 'New' },
  { name: 'Ganesha Statue — Remover of Obstacles', brand: 'Vinayak Art & Marble', price: 26000, oldPrice: 33000, rating: 4.23, reviews: 61, image: PHOTOS.kundan, tag: 'Flash Sale' },
  { name: 'White Marble Tulsi Pot, 33 Inch', brand: 'Vinayak Art & Marble', price: 9500, oldPrice: 14000, rating: 4.21, reviews: 88, image: PHOTOS.planter, tag: 'Hot' },
  { name: 'Marble Tulsi Pot, White Inlay', brand: 'Vinayak Art & Marble', price: 12500, oldPrice: 19000, rating: 4.3, reviews: 54, image: PHOTOS.succulent, tag: 'New' },
  { name: 'Surya Marble Mandir, Hexa', brand: 'Vinayak Art & Marble', price: 13500, oldPrice: 23000, rating: 4.4, reviews: 41, image: PHOTOS.pottery, tag: 'Sale' },
  { name: 'Divya Marble Mandir', brand: 'Vinayak Art & Marble', price: 26500, oldPrice: 43000, rating: 4.5, reviews: 33, image: PHOTOS.diya, tag: 'Hot' },
];

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
        <img src={item.image} alt="" className="absolute inset-0 w-full h-full object-cover object-center" loading="lazy" />
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

const HOUSES = [
  { label: 'Water Pots', name: 'Shyam Pottery', copy: 'Hand-painted matkas from Jaipur kilns', image: PHOTOS.matka, to: '/shop?category=Matkas' },
  { label: 'Chai Cups', name: 'Kulhad House', copy: 'Earthen kulhads with saunda aroma', image: PHOTOS.kulhad, to: '/shop?category=Kulhads' },
  { label: 'Garden Pots', name: 'Meera Terracotta', copy: 'Breathable mitti planters for home', image: PHOTOS.planter, to: '/shop?category=Planters' },
  { label: 'Folk Decor', name: 'Rajputana Crafts', copy: 'Hand-sculpted elephants & figurines', image: PHOTOS.elephantCraft, to: '/shop?category=Home Decor' },
  { label: 'Puja Essentials', name: 'Pushkar Clay Arts', copy: 'Festive diyas, thalis and kalash', image: PHOTOS.diya, to: '/shop?category=Puja Essentials' },
  { label: 'Flagship', name: 'Jaipurio', copy: "Rajasthan's heritage, one roof", image: PHOTOS.jaipur, to: '/shop' },
];

const BOUTIQUES = [
  { key: 'vinayak', tab: 'Vinayak Art & Marble', label: 'Marble & Sandstone', copy: 'Six generations of Makrana marble carvers. Every murti is finished under natural light.', stats: [['420+', 'Pieces in the house'], ['6th gen', 'Family of carvers'], ['4.8★', 'House rating']], image: PHOTOS.ganesh },
  { key: 'gems', tab: 'Jaipurgems', label: 'Fine Jewellery', copy: 'BIS hallmarked silver and certified gemstones, set in kundan and meenakari traditions.', stats: [['860+', 'Pieces in the house'], ['100%', 'Hallmarked silver'], ['4.9★', 'House rating']], image: PHOTOS.jewelry },
  { key: 'leather', tab: 'LeatherMart', label: 'Leather & Jute', copy: 'Vegetable-tanned leather, hand-cut and stitched so it ages the way leather should.', stats: [['310+', 'Pieces in the house'], ['Veg-tanned', 'Leather only'], ['4.6★', 'House rating']], image: PHOTOS.leather },
  { key: 'rangtara', tab: 'Rangtara', label: 'Home Décor', copy: 'Colour-led décor from Jaipur block-print workshops and blue pottery studios.', stats: [['510+', 'Pieces in the house'], ['28', 'Block-print motifs'], ['4.7★', 'House rating']], image: PHOTOS.pichwai },
  { key: 'royal', tab: 'Royalsuits', label: 'Ethnic Wear', copy: 'Bandhgalas and sherwanis cut to order by Jaipur royal darzis.', stats: [['270+', 'Pieces in the house'], ['Made', 'to order'], ['4.8★', 'House rating']], image: PHOTOS.sherwani },
];

const HomeAfterCategory = () => {
  const { products } = useShop();
  const [tab, setTab] = useState(0);
  const [left, setLeft] = useState({ h: 12, m: 44, s: 46 });
  const boutique = BOUTIQUES[tab];
  const mitti = useMemo(() => products.slice(0, 6), [products]);
  const items = useMemo(
    () =>
      CATALOG.map((c, i) => ({
        ...c,
        _id: products[i]?._id,
        to: products[i]?._id ? `/product/${products[i]._id}` : '/shop',
      })),
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
          copy="Handmade mitti deals — matkas, kulhads, planters and puja sets."
          to="/shop"
          link="View All →"
          compact
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2">
          {OFFER_TILES.map((d, i) => (
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
                  <div key={p.name} className="min-w-0 flex flex-col items-center text-center">
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
                      ₹{p.price.toLocaleString('en-IN')}
                      <span className="ml-0.5 font-normal text-[7px] sm:text-[8px] text-[#9A8B7A] line-through">
                        ₹{p.oldPrice.toLocaleString('en-IN')}
                      </span>
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

      {/* 2. Explore Jaipurio */}
      <Wrap alt>
        <SectionHead eyebrow="Shop the Look" title="Explore Jaipurio" />
        <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-2.5 min-h-[280px] md:min-h-[360px]">
          {[
            { className: 'col-span-2 row-span-2 min-h-[180px]', img: IMG.ganesh, kicker: 'Marble & Brass', title: 'Idols & Mandirs' },
            { img: IMG.jewellery, kicker: 'Fine Jewellery', title: 'Kundan & Silver' },
            { img: IMG.pottery, kicker: 'Home Decor', title: 'Jaipur Blue Pottery' },
            { img: IMG.pichwai, kicker: 'Art & Décor', title: 'Pichwai & Paintings' },
            { img: IMG.sherwani, kicker: 'Ethnic Wear', title: 'Bandhgala Suits' },
          ].map((b) => (
            <Link
              key={b.title}
              to="/shop"
              className={`relative overflow-hidden rounded-xl min-h-[110px] ${b.className || ''}`}
            >
              <img src={b.img} alt="" className="absolute inset-0 w-full h-full object-cover" />
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
            Festive Flash Sale — 35% off
          </h3>
          <p className="font-body text-[10px] sm:text-[12px] text-white/80 mt-0.5 leading-snug">
            On matkas, kulhads & puja sets. Ends soon.
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

      {/* 7. Six houses */}
      <Wrap alt>
        <SectionHead
          title="Six houses, six crafts"
          copy="Each workshop runs its own storefront — browse them or shop everything together."
        />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {HOUSES.map((h, i) => (
            <Link
              key={h.name}
              to={h.to}
              className="house-card-in group relative overflow-hidden rounded-xl min-h-[108px] sm:min-h-[148px] flex flex-col justify-end"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <img
                src={h.image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-center scale-[1.16] group-hover:scale-[1.22] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#3F261B]/92 via-[#3F261B]/40 to-transparent" />
              <div className="relative z-10 p-2 sm:p-3 text-white">
                <p className="font-body text-[8px] sm:text-[9px] uppercase tracking-[0.14em] text-white/80">
                  {h.label}
                </p>
                <h3 className="font-playfair font-semibold text-[13px] sm:text-[18px] leading-tight mt-0.5">
                  {h.name}
                </h3>
                <p className="font-body text-[9px] sm:text-[11px] text-white/85 mt-0.5 leading-snug line-clamp-2">
                  {h.copy}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Wrap>

      {/* 8. Trending */}
      <Wrap>
        <SectionHead eyebrow="This Week's Workshop" title="Trending right now" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {items.slice(0, 4).map((item, i) => (
            <CatalogCard key={`tr-${item.name}`} item={{ ...item, tag: ['Hot Sale', 'New', null, 'Flash Sale'][i] }} />
          ))}
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

      {/* 11. Boutique */}
      <Wrap alt>
        <SectionHeading
          title="Step into each boutique"
          copy="Every house on Jaipurio runs its own workshop — switch between them the way you would walk Johari Bazaar."
        />
        <div className="flex gap-4 overflow-x-auto border-b border-[#F3D5D0] mb-4">
          {BOUTIQUES.map((b, i) => (
            <button
              key={b.key}
              type="button"
              onClick={() => setTab(i)}
              className={`font-dm text-[12px] whitespace-nowrap pb-2 ${
                i === tab
                  ? 'text-[#C45C6A] font-semibold border-b-2 border-[#C45C6A]'
                  : 'text-[#5B4638]'
              }`}
            >
              {b.tab}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-[#F7F3EE]">
            <img src={boutique.image} alt="" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-dm text-[10px] uppercase tracking-[0.16em] text-[#C45C6A]">{boutique.label}</p>
            <h3 className="font-playfair font-semibold text-[18px] sm:text-[22px] md:text-[24px] text-[#3F261B] mt-1">{boutique.tab}</h3>
            <p className="font-dm text-[13px] text-[#8A6A68] mt-2 leading-relaxed">{boutique.copy}</p>
            <div className="flex gap-5 mt-4">
              {boutique.stats.map(([v, l]) => (
                <div key={l}>
                  <p className="font-playfair font-semibold text-[18px] text-[#6F241D]">{v}</p>
                  <p className="font-dm text-[10px] text-[#8A6A68]">{l}</p>
                </div>
              ))}
            </div>
            <Link
              to="/shop"
              className="inline-flex mt-4 bg-[#C45C6A] text-white font-dm text-[12px] font-semibold px-5 py-2.5 rounded-full"
            >
              Enter the boutique
            </Link>
          </div>
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

      {/* 13. Maker's Ledger */}
      <Wrap alt>
        <SectionHead
          eyebrow="The Maker's Ledger"
          title="Every piece, traced back"
          copy="Origin, artisan, and material — recorded the way a gallery would catalogue it, not hidden in a spec tab."
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            { name: 'White Marble Nataraja, 18in', origin: 'Makrana, Rajasthan', house: 'Vinayak Art & Marble', material: 'Single-block Makrana marble', time: '~40 hours, hand tools', quote: '"I finish every face by lamplight — daylight hides the small mistakes." — Ramesh, master carver', img: IMG.mandir },
            { name: 'Kundan Meenakari Choker Set', origin: 'Johari Bazaar, Jaipur', house: 'Jaipurgems', material: '92.5 silver, uncut kundan', time: '~65 hours, 3 artisans', quote: '"Meenakari is the part you never see until you turn it over." — Sunita, enamel setter', img: IMG.kundan },
            { name: 'Hand-tooled Saddle Leather Satchel', origin: 'Amer Road, Jaipur', house: 'LeatherMart', material: 'Vegetable-tanned buffalo hide', time: '~12 hours, saddle stitch', quote: '"Good leather should smell like leather, not like a factory." — Iqbal, master stitcher', img: IMG.leather },
          ].map((m) => (
            <div key={m.name} className="bg-white rounded-xl overflow-hidden border border-[#F3D5D0]">
              <div className="aspect-[4/3] overflow-hidden bg-[#F7F3EE]">
                <img src={m.img} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <h4 className="font-playfair font-semibold text-[14px] text-[#3F261B]">{m.name}</h4>
                {[
                  ['Origin', m.origin],
                  ['Artisan House', m.house],
                  ['Material', m.material],
                  ['Carve Time', m.time],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 font-dm text-[10px] mt-1 text-[#8A6A68]">
                    <span>{k}</span>
                    <span className="text-[#3F261B] text-right">{v}</span>
                  </div>
                ))}
                <p className="font-dm text-[10px] italic text-[#8A6A68] mt-2 leading-snug">{m.quote}</p>
              </div>
            </div>
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
                    <img src={src} alt="" className="w-full h-full object-cover" />
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

      {/* 15. Shop by occasion */}
      <Wrap alt>
        <SectionHead eyebrow="Gifting, Sorted" title="Shop by occasion" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            ['Wedding & Bridal', '#E8A0A8', '#8B2E3A'],
            ['Housewarming', '#F4C2C2', '#C45C6A'],
            ['Festive Gifting', '#F8D0C8', '#A94E2C'],
            ['Corporate Gifting', '#E8B4C8', '#6F241D'],
            ['Just for You', '#F5C6CE', '#873A24'],
          ].map(([label, from, to]) => (
            <Link
              key={label}
              to="/shop"
              className="rounded-xl min-h-[88px] flex items-end p-3 text-white font-playfair font-semibold text-[14px]"
              style={{ background: `linear-gradient(160deg, ${from}, ${to})` }}
            >
              {label}
            </Link>
          ))}
        </div>
      </Wrap>

      {/* 16. Editorial */}
      <Wrap>
        <SectionHeading title="The Marble Route" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-white rounded-2xl border border-[#F3D5D0] overflow-hidden">
          <div className="aspect-[4/3] md:aspect-auto md:min-h-[260px] overflow-hidden bg-[#F7F3EE]">
            <img src={PHOTOS.handsClay} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="p-4 sm:p-6">
            <h3 className="font-playfair font-semibold text-[18px] sm:text-[22px] md:text-[24px] text-[#3F261B] leading-tight">
              Makrana to Your Mandir
            </h3>
            <p className="font-dm text-[12px] text-[#8A6A68] mt-2 leading-relaxed">
              We followed a single block of Makrana marble for three weeks — from the quarry, through the Vinayak workshop, to the hands that carved it into a foot-tall Ganesh.
            </p>
            <Link to="/shop" className="inline-flex mt-3 font-dm text-[12px] font-semibold text-[#C45C6A]">
              Read the story →
            </Link>
            <div className="flex gap-2.5 mt-4 overflow-x-auto">
              {items.slice(0, 3).map((item) => (
                <Link key={item.name} to={item.to || '/shop'} className="w-[92px] shrink-0">
                  <div className="aspect-square rounded-lg overflow-hidden bg-[#F7F3EE]">
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <p className="font-playfair text-[11px] font-semibold text-[#3F261B] mt-1 line-clamp-1">{item.name}</p>
                  <p className="font-dm text-[10px] text-[#C45C6A]">₹{(item.price || 0).toLocaleString('en-IN')}</p>
                </Link>
              ))}
            </div>
          </div>
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
