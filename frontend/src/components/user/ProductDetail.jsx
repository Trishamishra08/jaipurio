import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  Eye,
  GitCompare,
  Globe,
  Heart,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  Phone,
  Plus,
  RotateCcw,
  Share2,
  Shield,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Truck,
  Zap,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { journalPosts } from '../../data/journalPosts';
import { getWhatsAppHref, WHATSAPP_PHONE } from '../../utils/whatsapp';
import { mapApiProductToStorefront, formatInr } from '../../utils/storefrontProduct';
import api from '../../utils/api';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    products,
    vendors,
    reviews,
    addToCart,
    toggleWishlist,
    isInWishlist,
    setIsCartDrawerOpen,
  } = useShop();

  const [remoteProduct, setRemoteProduct] = useState(null);
  const [loadState, setLoadState] = useState('idle'); // idle | loading | error | ready
  const [loadError, setLoadError] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('description'); // 'description' | 'specifications' | 'care' | 'reviews'

  const contextProduct =
    products.find((p) => String(p._id) === String(id)) ||
    products.find((p) => p.slug && String(p.slug) === String(id)) ||
    products.find((p) => p.seo?.general?.slug && String(p.seo.general.slug) === String(id)) ||
    null;

  // Prefer full API product over minimal context list
  const product = remoteProduct || contextProduct;

  const vendor =
    vendors.find((v) => v._id === product?.vendorId) ||
    vendors.find((v) => v.name === product?.vendor) ||
    vendors[0];

  const related = relatedProducts;
  const together = related.slice(0, 4);
  const productReviews = (reviews || []).filter((r) => r.productName === product?.name);

  useEffect(() => {
    setLoadError('');
    setLoadState('loading');
  }, [id]);

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    setLoadState('loading');
    api
      .get(`/products/${encodeURIComponent(id)}`)
      .then((res) => {
        if (cancelled) return;
        if (res.data?.success && res.data?.data) {
          setRemoteProduct(mapApiProductToStorefront(res.data.data));
          setLoadState('ready');
        } else if (!contextProduct) {
          setLoadError(res.data?.message || 'Product not found');
          setLoadState('error');
        } else {
          setLoadState('ready');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (contextProduct) {
          setLoadState('ready');
          return;
        }
        setLoadError(
          err?.parsedMessage ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load product'
        );
        setLoadState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const vendorId = product?.vendorId;
    if (!vendorId) {
      setRelatedProducts([]);
      return undefined;
    }
    let cancelled = false;
    api
      .get('/products', { params: { vendor: vendorId, limit: 7 } })
      .then((res) => {
        if (cancelled) return;
        const rows = (res.data?.data?.products || [])
          .map(mapApiProductToStorefront)
          .filter((p) => p && String(p._id) !== String(product?._id))
          .slice(0, 6);
        setRelatedProducts(rows);
      })
      .catch(() => {
        if (!cancelled) setRelatedProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [product?.vendorId, product?._id]);

  // SEO metadata synchronization
  useEffect(() => {
    if (!product) return undefined;
    const seo = product.seo?.general || {};
    const title =
      seo.metaTitle ||
      product.seo?.social?.ogTitle ||
      `${product.name || product.title || 'Product'} | Jaipurio`;
    const description =
      seo.metaDescription ||
      product.seo?.social?.ogDescription ||
      String(product.description || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 160);
    const prevTitle = document.title;
    document.title = title;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    const prevDesc = metaDesc.getAttribute('content') || '';
    if (description) metaDesc.setAttribute('content', description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const prevCanonical = canonical.getAttribute('href') || '';
    const slug = product.slug || seo.slug || id;
    const href = `${window.location.origin}/products/${slug}`;
    canonical.setAttribute('href', seo.canonicalUrl || href);

    // Product JSON-LD schema (Rule 8) — admin-authored schema wins if set,
    // otherwise a Product schema is generated from live product data.
    const customSchema = product.seo?.advanced?.schemaMarkup;
    let schemaJson = customSchema && customSchema.trim();
    if (!schemaJson) {
      const inStock = String(product.stockStatus || '').toLowerCase().includes('out')
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock';
      schemaJson = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name || product.title,
        image: images.length ? images : undefined,
        description,
        sku: product.sku || undefined,
        brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
        offers: {
          '@type': 'Offer',
          url: href,
          priceCurrency: 'INR',
          price: String(unitPrice ?? product.price ?? ''),
          availability: inStock,
          itemCondition: 'https://schema.org/NewCondition',
        },
        ...(product.reviews
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: String(product.rating || 4.8),
                reviewCount: String(product.reviews),
              },
            }
          : {}),
      });
    }
    let schemaScript = document.querySelector('script[data-pdp-schema="true"]');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.setAttribute('type', 'application/ld+json');
      schemaScript.setAttribute('data-pdp-schema', 'true');
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = schemaJson;

    return () => {
      document.title = prevTitle;
      metaDesc.setAttribute('content', prevDesc);
      canonical.setAttribute('href', prevCanonical);
      schemaScript.remove();
    };
  }, [product, id]);

  const images = useMemo(() => {
    if (!product) return [];
    const list = [product.image, ...(product.images || [])].filter(Boolean);
    return [...new Set(list)].slice(0, 10);
  }, [product]);

  const sizes = useMemo(() => {
    if (!product) return [];
    const base = Number(product.price);
    const was = Number(product.oldPrice || 0);
    const off = was > base ? Math.round(((was - base) / was) * 100) : 0;
    const label = product.packSize || product.size || 'Standard';
    return [{ label, now: base, was: was || base, off, popular: true }];
  }, [product]);

  const finishOptions = useMemo(() => {
    if (!product) return ['Natural finish'];
    const primary = product.material || 'Natural finish';
    const extras = ['Polished clay', 'Natural finish'].filter((opt) => opt !== primary);
    return [primary, ...extras].slice(0, 3);
  }, [product]);

  const [imgIndex, setImgIndex] = useState(0);
  const [sizeIndex, setSizeIndex] = useState(0);
  const [finish, setFinish] = useState('');
  const [pack, setPack] = useState(1);
  const [qty, setQty] = useState(1);
  const [pin, setPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [toast, setToast] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setImgIndex(0);
    setSizeIndex(0);
    setPack(1);
    setQty(1);
    setFinish(product?.material || 'Natural finish');
    setPinMsg('');
  }, [product?._id, product?.material]);

  if (!product) {
    if (loadState === 'error') {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center space-y-4 font-sans">
          <p className="text-lg text-gray-800 font-semibold">Product not found</p>
          <p className="text-sm text-gray-500 max-w-md">{loadError}</p>
          <Link
            to="/shop"
            className="px-5 py-2.5 bg-[#8B2E3A] text-white text-sm font-medium rounded-full hover:bg-[#6F241D] transition-colors"
          >
            Back to shop
          </Link>
        </div>
      );
    }
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-12 text-sm text-gray-500 font-sans">
        Loading piece…
      </div>
    );
  }

  const liked = isInWishlist(product._id);
  const selected = sizes[sizeIndex] || sizes[0];
  const unitPrice = selected.now;
  const originalPrice = selected.was > selected.now ? selected.was : (product.oldPrice || 0);
  const discountPercent = originalPrice > unitPrice ? Math.round(((originalPrice - unitPrice) / originalPrice) * 100) : 0;
  const stockCount = product.stockCount || product.quantity || 9;

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = encodeURIComponent(`${product.name} ${shareUrl}`);

  const add = () => {
    addToCart(product, qty * pack);
    setToast(true);
    setIsCartDrawerOpen?.(true);
    setTimeout(() => setToast(false), 2200);
  };

  const buyNow = () => {
    addToCart(product, qty * pack);
    navigate('/checkout');
  };

  const copyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full bg-white text-[#2B1E1A] font-sans pb-16">
      {/* Dynamic Style for clean rich HTML content & full-width tables */}
      <style>{`
        .pdp-full-html {
          font-family: 'Poppins', 'DM Sans', system-ui, sans-serif;
          font-size: 14.5px;
          line-height: 1.75;
          color: #374151;
        }
        .pdp-full-html p {
          margin: 0 0 1em;
        }
        .pdp-full-html h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.45rem;
          font-weight: 700;
          color: #1F2937;
          margin: 1.5em 0 0.6em;
          border-bottom: 2px solid #F3F4F6;
          padding-bottom: 0.35em;
        }
        .pdp-full-html h3 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.2rem;
          font-weight: 700;
          color: #1F2937;
          margin: 1.3em 0 0.5em;
        }
        .pdp-full-html h4 {
          font-size: 1.05rem;
          font-weight: 600;
          color: #1F2937;
          margin: 1.1em 0 0.4em;
        }
        .pdp-full-html ul {
          margin: 0 0 1.1em;
          padding-left: 1.4em;
          list-style: disc;
        }
        .pdp-full-html li {
          margin-bottom: 0.45em;
        }
        .pdp-full-html table {
          width: 100% !important;
          border-collapse: separate;
          border-spacing: 0;
          margin: 1.5em 0;
          font-size: 13.5px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .pdp-full-html th, .pdp-full-html td {
          border-bottom: 1px solid #E5E7EB;
          border-right: 1px solid #E5E7EB;
          padding: 10px 16px;
          text-align: left;
        }
        .pdp-full-html th:last-child, .pdp-full-html td:last-child {
          border-right: none;
        }
        .pdp-full-html tbody tr:last-child td {
          border-bottom: none;
        }
        .pdp-full-html th {
          background-color: #F9FAFB;
          font-weight: 600;
          color: #111827;
        }
        .pdp-full-html tbody tr:nth-child(even) td {
          background-color: #FAFAFA;
        }
        .pdp-full-html strong, .pdp-full-html b {
          color: #1F2937;
          font-weight: 600;
        }
        .pdp-full-html a {
          color: #B45309;
          text-decoration: underline;
        }
        .pdp-full-html ol {
          margin: 0 0 1.1em;
          padding-left: 1.4em;
          list-style: decimal;
        }
        .pdp-full-html blockquote {
          margin: 1.2em 0;
          padding: 0.75em 1.1em;
          border-left: 3px solid #E5E7EB;
          color: #4B5563;
          background: #F9FAFB;
        }
        .pdp-full-html hr {
          border: none;
          border-top: 1px solid #E5E7EB;
          margin: 1.5em 0;
        }
        .pdp-full-html img {
          max-width: 100%;
          height: auto;
          border-radius: 10px;
          margin: 1.25em 0;
        }
      `}</style>

      {/* Top Floating Action Header Bar (matches Image 4 & 5 top bar) */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={images[0]}
              alt={product.name}
              className="w-9 h-9 rounded-md object-cover border border-gray-200 shrink-0"
            />
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-md">
                {product.name}
              </h2>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400">Category: {product.category || 'Handicrafts'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold text-[#E5A835] sm:text-[#C45C6A]">
                  ₹{Number(unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
                {originalPrice > unitPrice && (
                  <span className="text-xs text-gray-400 line-through">
                    ₹{Number(originalPrice).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={add}
              className="px-4 py-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-bold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <ShoppingCart size={13} />
              Add to cart
            </button>
            <button
              type="button"
              onClick={buyNow}
              className="px-4 py-1.5 bg-[#111827] hover:bg-black text-white text-xs font-bold rounded-md shadow-xs transition-colors"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-4 overflow-x-auto py-1 whitespace-nowrap">
          <Link to="/" className="hover:text-[#8B2E3A]">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-[#8B2E3A]">Shop</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-[#8B2E3A]">
                {product.category}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-800 font-medium truncate max-w-[280px]">{product.name}</span>
        </nav>

        {/* Top Product Section: 3-Column Responsive Grid (Gallery + Center Buy Box + Right Trust Column) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          {/* Column 1: Image Gallery (5 cols on Desktop) */}
          <div className="lg:col-span-5 flex flex-col-reverse md:flex-row gap-3">
            {/* Thumbnails strip */}
            {images.length > 1 && (
              <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto max-h-[460px] scrollbar-none shrink-0 py-1">
                {images.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => setImgIndex(i)}
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 bg-gray-50 ${
                      i === imgIndex ? 'border-[#8B2E3A] ring-1 ring-[#8B2E3A]/40' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={src}
                      alt={`${product.name} — view ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image Frame */}
            <div className="relative w-full aspect-square md:aspect-[4/4.2] rounded-2xl overflow-hidden bg-[#FAF6EE] border border-gray-200 shadow-xs group flex-1">
              {/* Badges */}
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                {(product.badge === 'bestseller' || product.bestseller) && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8B2E3A] text-white uppercase tracking-wider shadow-xs">
                    Hot Sale
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C45C6A] text-white shadow-xs">
                    −{discountPercent}%
                  </span>
                )}
              </div>

              {/* Prev / Next Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={() => setImgIndex((i) => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              <img
                src={images[imgIndex]}
                alt={product.name}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-zoom-in"
              />
            </div>
          </div>

          {/* Column 2: Product Info & Actions (4 cols on Desktop / Main Center) */}
          <div className="lg:col-span-4 flex flex-col space-y-4">
            <div>
              <div className="text-xs font-semibold text-[#8B2E3A] uppercase tracking-wider mb-1">
                {product.brand || vendor?.name || 'Jaipurio Heritage'}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="flex items-center text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < Math.round(product.rating || 4.8) ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <span className="font-semibold text-gray-800">{product.rating || '4.9'}</span>
              <span className="text-gray-400">•</span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('reviews');
                  document.getElementById('pdp-tabs-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[#8B2E3A] hover:underline"
              >
                ({product.reviews || productReviews.length || 18} Verified Reviews)
              </button>
            </div>

            {/* Price Section */}
            <div className="flex items-baseline gap-3 pt-1 border-t border-gray-100">
              <span className="text-2xl sm:text-3xl font-bold text-[#E5A835] sm:text-[#C45C6A]">
                ₹{Number(unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
              {originalPrice > unitPrice && (
                <span className="text-base text-gray-400 line-through">
                  ₹{Number(originalPrice).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-md">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Short Highlights / Key bullet points if available */}
            <div className="text-xs text-gray-600 leading-relaxed bg-[#FAF6EE] p-3 rounded-xl border border-[#E8D4B5]/60 space-y-1">
              <p className="font-semibold text-gray-800">
                🌿 Pure handcrafted craftsmanship from Jaipur, Rajasthan.
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-gray-600">
                <li>100% Genuine Makrana Marble / Terracotta Clay</li>
                <li>Carefully packaged in heavy-duty break-proof carton</li>
                <li>Ships within 24–48 hours direct from master artisans</li>
              </ul>
            </div>

            {/* Stock Availability Pill (matching Image 5) */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Availability: <strong>{stockCount} products available</strong></span>
            </div>

            {/* Size & Finish Options if present */}
            {sizes.length > 1 && (
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-gray-700">Size: {selected.label}</label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size, idx) => (
                    <button
                      key={size.label}
                      type="button"
                      onClick={() => setSizeIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        idx === sizeIndex
                          ? 'border-[#8B2E3A] bg-[#8B2E3A]/5 text-[#8B2E3A]'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {size.label} - {formatInr(size.now)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart + Buy Now Buttons (matching Image 5) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-700">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white shadow-xs">
                  <button
                    type="button"
                    onClick={() => setQty((n) => Math.max(1, n - 1))}
                    className="w-8 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-xs font-bold text-gray-800">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((n) => n + 1)}
                    className="w-8 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={add}
                  className="w-full py-2.5 px-4 bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <ShoppingCart size={16} />
                  Add to cart
                </button>
                <button
                  type="button"
                  onClick={buyNow}
                  className="w-full py-2.5 px-4 bg-[#111827] hover:bg-black text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  Buy Now
                </button>
              </div>
              {toast && (
                <div className="text-center text-xs font-semibold text-emerald-600 animate-fade-in">
                  ✓ Added to cart successfully!
                </div>
              )}
            </div>

            {/* Wishlist & Compare & Share Links */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-600">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className="inline-flex items-center gap-1.5 hover:text-[#8B2E3A] font-medium transition-colors"
                >
                  <Heart
                    size={15}
                    className={liked ? 'fill-rose-500 text-rose-500' : 'text-gray-500'}
                  />
                  <span>{liked ? 'Saved' : 'Wishlist'}</span>
                </button>
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-1.5 hover:text-[#8B2E3A] font-medium transition-colors"
                >
                  {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                  <span>{copied ? 'Link Copied' : 'Share'}</span>
                </button>
              </div>

              <div className="flex items-center gap-4">
                <a
                  href={getWhatsAppHref(`Hi, I'm interested in ${product.name}`)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  <MessageCircle size={15} />
                  Ask on WhatsApp
                </a>
                <a
                  href={`tel:+${WHATSAPP_PHONE}`}
                  className="inline-flex items-center gap-1 text-[#8B2E3A] hover:text-[#6F241D] font-semibold"
                >
                  <Phone size={15} />
                  Call Us
                </a>
              </div>
            </div>

            {/* Pincode checker */}
            <div className="pt-2">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">
                  Check Delivery & Estimated Arrival
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit pincode"
                    className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-[#8B2E3A]"
                    inputMode="numeric"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPinMsg(
                        pin.length === 6
                          ? '✓ Available: Estimated delivery in 4–7 business days. Cash on Delivery supported.'
                          : 'Please enter a valid 6-digit pincode.'
                      )
                    }
                    className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Check
                  </button>
                </div>
                {pinMsg && (
                  <p className="mt-1.5 text-[11px] font-medium text-emerald-700 leading-tight">
                    {pinMsg}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Trust & Vendor Box (3 cols on Desktop / Right Sidebar matching Image 5) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Vendor card */}
            <div className="bg-[#FAF6EE] p-4 rounded-2xl border border-[#E8D4B5] text-center space-y-2">
              <span className="text-xs text-gray-500">Become a Vendor?</span>
              <Link
                to="/vendor/register"
                className="block text-sm font-bold text-[#A94E2C] hover:text-[#6F241D] hover:underline"
              >
                Register now →
              </Link>
            </div>

            {/* Trust Features Box (Image 5 style) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Truck size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Free Shipping</h4>
                  <p className="text-[11px] text-gray-500">For all orders over ₹499</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-rose-50 text-[#C45C6A] flex items-center justify-center shrink-0">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">7-Day Returns</h4>
                  <p className="text-[11px] text-gray-500">Transit damage guarantee</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Secure Payment</h4>
                  <p className="text-[11px] text-gray-500">100% encrypted checkout</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Store size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Artisan Certified</h4>
                  <p className="text-[11px] text-gray-500">Direct from Jaipur workshops</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Full-Width Section: Tab Navigation & Detailed Specifications (matching Image 4) */}
        <div id="pdp-tabs-section" className="mt-8 pt-8 border-t border-gray-200">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200 gap-8 overflow-x-auto scrollbar-none mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('description')}
              className={`pb-3 text-sm sm:text-base font-bold transition-all relative whitespace-nowrap ${
                activeTab === 'description'
                  ? 'text-[#8B2E3A] border-b-2 border-[#8B2E3A]'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Description
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('specifications')}
              className={`pb-3 text-sm sm:text-base font-bold transition-all relative whitespace-nowrap ${
                activeTab === 'specifications'
                  ? 'text-[#8B2E3A] border-b-2 border-[#8B2E3A]'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Detailed Specifications
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('care')}
              className={`pb-3 text-sm sm:text-base font-bold transition-all relative whitespace-nowrap ${
                activeTab === 'care'
                  ? 'text-[#8B2E3A] border-b-2 border-[#8B2E3A]'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Care & Delivery
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 text-sm sm:text-base font-bold transition-all relative whitespace-nowrap ${
                activeTab === 'reviews'
                  ? 'text-[#8B2E3A] border-b-2 border-[#8B2E3A]'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Reviews ({product.reviews || productReviews.length || 0})
            </button>
          </div>

          {/* Tab 1: Description (Full Width HTML Content matching Image 4) */}
          {activeTab === 'description' && (
            <div className="w-full space-y-6">
              <div
                className="pdp-full-html w-full overflow-x-auto"
                dangerouslySetInnerHTML={{
                  __html:
                    product.content ||
                    product.description ||
                    `<p>Handcrafted ${product.name} from authentic Rajasthan artisans.</p>`,
                }}
              />
            </div>
          )}

          {/* Tab 2: Specifications Table */}
          {activeTab === 'specifications' && (
            <div className="w-full max-w-4xl space-y-4">
              <h3 className="text-lg font-bold text-gray-900 font-serif">Product Specifications</h3>
              <div className="overflow-hidden border border-gray-200 rounded-xl bg-white shadow-xs">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-semibold text-gray-700 bg-gray-50 w-1/3">Material</td>
                      <td className="py-3 px-4 text-gray-800">{finish || product.material || 'Handmade Craft'}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-semibold text-gray-700 bg-gray-50">Brand</td>
                      <td className="py-3 px-4 text-gray-800">{product.brand || 'Jaipurio Heritage'}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-semibold text-gray-700 bg-gray-50">Origin</td>
                      <td className="py-3 px-4 text-gray-800">{product.location || 'Jaipur, Rajasthan'}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-semibold text-gray-700 bg-gray-50">Artisan House</td>
                      <td className="py-3 px-4 text-gray-800">{vendor?.name || product.vendor || 'Master Potters Guild'}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-semibold text-gray-700 bg-gray-50">Weight</td>
                      <td className="py-3 px-4 text-gray-800">{product.weight || (product.weightKg ? `${product.weightKg} kg` : '—')}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-semibold text-gray-700 bg-gray-50">Dimensions (L×W×H)</td>
                      <td className="py-3 px-4 text-gray-800">{[product.length, product.width, product.height].filter(Boolean).join(' × ') || 'Standard proportion'}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-gray-700 bg-gray-50">SKU Code</td>
                      <td className="py-3 px-4 text-gray-800 font-mono text-xs">{product.sku || product._id}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Care & Delivery */}
          {activeTab === 'care' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#FAF6EE] p-6 rounded-2xl border border-[#E8D4B5]">
                <h4 className="text-base font-bold text-[#6F241D] mb-3 flex items-center gap-2">
                  <Shield size={18} /> Care Instructions
                </h4>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  {product.careInstructions ||
                    'Clean gently with a soft microfiber cloth. Avoid harsh chemical cleaners or acidic detergents. For marble and terracotta, natural aging and subtle patina enhance its authentic character.'}
                </p>
              </div>

              <div className="bg-[#FAF6EE] p-6 rounded-2xl border border-[#E8D4B5]">
                <h4 className="text-base font-bold text-[#6F241D] mb-3 flex items-center gap-2">
                  <Truck size={18} /> Shipping & Transit
                </h4>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  {product.shippingNotes ||
                    'Custom multi-layered foam and corner guards ensure your delicate pottery or stone piece reaches your doorstep in pristine condition. Dispatched within 24–48 hours.'}
                </p>
              </div>
            </div>
          )}

          {/* Tab 4: Reviews */}
          {activeTab === 'reviews' && (
            <div className="w-full space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="text-center sm:text-left">
                  <div className="text-4xl font-bold text-gray-900">{product.rating || '4.9'}</div>
                  <div className="flex items-center justify-center sm:justify-start text-amber-500 my-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Based on {product.reviews || productReviews.length || 18} verified buyer ratings</p>
                </div>
              </div>

              <div className="space-y-3">
                {(productReviews.length ? productReviews : [
                  {
                    id: '1',
                    name: 'Priya Sharma',
                    date: '2 weeks ago',
                    comment: 'Stunning piece! The carving detail on the marble is immaculate. Packaging was extremely secure with heavy foam.',
                    rating: 5,
                  },
                  {
                    id: '2',
                    name: 'Rajesh Meena',
                    date: '1 month ago',
                    comment: 'Authentic quality, exactly as shown in photos. Brings a sacred aura to our home courtyard.',
                    rating: 5,
                  },
                ]).map((rev) => (
                  <div key={rev.id || rev.name} className="p-4 bg-white border border-gray-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-900">{rev.name}</span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Verified Buyer
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{rev.date}</span>
                    </div>
                    <div className="flex text-amber-500">
                      {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                        <Star key={i} size={13} fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700">{rev.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Related Products Section */}
        {related.length > 0 && (
          <div className="mt-14 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold font-serif text-[#6F241D]">
                You May Also Like
              </h3>
              <Link to="/shop" className="text-xs font-semibold text-[#8B2E3A] hover:underline">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {related.map((item) => (
                <Link
                  key={item._id}
                  to={`/product/${item._id}`}
                  className="group bg-white rounded-xl overflow-hidden border border-gray-200 p-2.5 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 mb-2">
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#8B2E3A]">
                      {item.name}
                    </h4>
                    <p className="text-xs font-bold text-[#8B2E3A] mt-1">
                      {formatInr(item.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-3 shadow-lg flex items-center gap-3">
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white shrink-0">
          <button
            type="button"
            onClick={() => setQty((n) => Math.max(1, n - 1))}
            className="w-8 h-8 flex items-center justify-center text-gray-600"
          >
            <Minus size={13} />
          </button>
          <span className="w-8 text-center text-xs font-bold">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((n) => n + 1)}
            className="w-8 h-8 flex items-center justify-center text-gray-600"
          >
            <Plus size={13} />
          </button>
        </div>
        <button
          type="button"
          onClick={add}
          className="flex-1 py-2.5 bg-[#F59E0B] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
        >
          <ShoppingCart size={15} /> Add to Cart
        </button>
        <button
          type="button"
          onClick={buyNow}
          className="flex-1 py-2.5 bg-[#111827] text-white text-xs font-bold rounded-lg shadow-sm"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
