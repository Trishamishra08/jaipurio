import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CreditCard, Globe, Heart, RotateCcw, Star, Truck } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { journalPosts } from '../../data/journalPosts';
import { getWhatsAppHref } from '../../utils/whatsapp';
import { mapApiProductToStorefront } from '../../utils/storefrontProduct';
import api from '../../utils/api';
import JharokhaBand from './JharokhaBand';

const formatInr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
);

const ShareIcon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d={d} /></svg>
);

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, vendors, reviews, addToCart, toggleWishlist, isInWishlist, setIsCartDrawerOpen } = useShop();
  const [remoteProduct, setRemoteProduct] = useState(null);
  const product = products.find((p) => String(p._id) === String(id)) || remoteProduct;
  const vendor = vendors.find((v) => v._id === product?.vendorId) || vendors.find((v) => v.name === product?.vendor) || vendors[0];
  const related = products.filter((p) => String(p._id) !== String(product?._id) && p.vendor === product?.vendor).slice(0, 6);
  const together = related.slice(0, 4);
  const productReviews = (reviews || []).filter((r) => r.productName === product?.name).slice(0, 3);

  useEffect(() => {
    if (!id || product) return;
    let cancelled = false;
    api.get(`/products/${id}`)
      .then((res) => {
        if (!cancelled && res.data?.success) {
          setRemoteProduct(mapApiProductToStorefront(res.data.data));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [id, product]);

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

  const faqItems = useMemo(() => {
    if (product?.faqs?.length) {
      return product.faqs.map((item) => [item.q, item.a || '']);
    }
    return [
      ['Is this piece heavy?', `Weight is listed as ${product?.weight || 'varies by size'}.`],
      ['Is it handmade?', product?.description || 'Yes — finished by artisan houses in Jaipur.'],
      ['Do you ship outside Jaipur?', product?.shippingNotes || 'Yes. Dispatch is typically 3–5 days.'],
    ];
  }, [product]);

  const [imgIndex, setImgIndex] = useState(0);
  const [sizeIndex, setSizeIndex] = useState(0);
  const [finish, setFinish] = useState('');
  const [pack, setPack] = useState(1);
  const [qty, setQty] = useState(1);
  const [pin, setPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [openAcc, setOpenAcc] = useState('craft');
  const [openFaq, setOpenFaq] = useState(0);
  const [toast, setToast] = useState(false);

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
    return <div className="heritage-page p-12 text-center text-sm">Loading piece…</div>;
  }

  const liked = isInWishlist(product._id);
  const selected = sizes[sizeIndex] || sizes[0];
  const unitPrice = selected.now;
  const packOff = pack === 3 ? 0.08 : pack === 2 ? 0.05 : 0;
  const lineTotal = Math.round(unitPrice * pack * (1 - packOff));
  const shipNeed = Math.max(0, 499 - lineTotal);
  const shipPct = Math.min(100, (lineTotal / 499) * 100);
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

  return (
    <div className="heritage-page pb-16 md:pb-0">
      <JharokhaBand />
      <div className="pdp-wrap">
        <div className="breadcrumb">
          <Link to="/home">Home</Link><span>/</span>
          <Link to="/shop">Shop</Link><span>/</span>
          {product.category}<span>/</span>
          {product.name}
        </div>

        <div className="pdp">
          <div className="gallery">
            <div className="gallery-main">
              <div className="gallery-badges">
                {product.badge === 'bestseller' || product.bestseller ? <span className="g-badge">Hot Sale</span> : null}
                {selected.off > 0 ? <span className="g-badge" style={{ background: 'var(--pink-city)' }}>−{selected.off}%</span> : null}
              </div>
              <button type="button" className="gallery-arrow prev" aria-label="Previous" onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button type="button" className="gallery-arrow next" aria-label="Next" onClick={() => setImgIndex((i) => (i + 1) % images.length)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              </button>
              <img src={images[imgIndex]} alt={product.name} />
            </div>
            <div className="gallery-thumbs">
              {images.map((src, i) => (
                <button key={src + i} type="button" className={`g-thumb ${i === imgIndex ? 'active' : ''}`} onClick={() => setImgIndex(i)}>
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="p-trust-row">
              <span><CheckIcon /> 100% Handmade</span>
              <span><CheckIcon /> Artisan verified</span>
              <span><CheckIcon /> From Jaipur</span>
            </div>
            <div className="p-brand-line">{product.brand || vendor?.name || product.vendor}</div>
            <h1 className="p-title">{product.name}</h1>
            <div className="p-rating">
              <span className="inline-flex text-[#A9782F]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill={i < Math.round(product.rating || 0) ? 'currentColor' : 'none'} />
                ))}
              </span>
              <span>{product.rating}</span>
              <a href="#reviews">{product.reviews} Verified Reviews</a>
            </div>
            <div className="price-block">
              <span className="price now">{formatInr(unitPrice)}</span>
              {selected.was > selected.now ? <span className="price was">{formatInr(selected.was)}</span> : null}
              {selected.off > 0 ? <span className="off">−{selected.off}%</span> : null}
            </div>
            <div className="price-note">Inclusive of all taxes · Ships in 3–5 days, hand-packed to order</div>

            <div className="sel-block">
              <div className="sel-label">Select Size <span className="sel-current">{selected.label}</span></div>
              <div className="size-grid">
                {sizes.map((size, i) => (
                  <button key={size.label} type="button" className={`size-card ${i === sizeIndex ? 'active' : ''}`} onClick={() => setSizeIndex(i)}>
                    {size.popular ? <span className="sc-best">Most Popular</span> : null}
                    <strong>{size.label}</strong>
                    <span className="sc-price">{formatInr(size.now)}</span>
                    {size.was > size.now ? <span className="sc-was">{formatInr(size.was)}</span> : null}
                    {size.off > 0 ? <span className="sc-off">−{size.off}%</span> : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="sel-block">
              <div className="sel-label">Finish</div>
              <div className="finish-grid">
                {finishOptions.map((opt) => (
                  <button key={opt} type="button" className={`finish-card ${finish === opt ? 'active' : ''}`} onClick={() => setFinish(opt)}>
                    <span className="finish-dot" style={{ background: opt.includes('Polish') ? '#E8DFC8' : '#C4A574' }} />
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="save-ladder">
              <div className="save-ladder-head">
                <strong>Buy More, Save More</strong>
                <span>SAVE ON SETS</span>
              </div>
              {[
                { n: 1, title: '1 piece', sub: 'For a single gift or shelf', extra: 0 },
                { n: 2, title: 'Pair of 2', sub: 'Free diya with eligible orders', extra: 5, tag: 'Most Chosen' },
                { n: 3, title: 'Set of 3', sub: 'Best value + free shipping closer', extra: 8, tag: 'Best Value', best: true },
              ].map((row) => (
                <button key={row.n} type="button" className={`ladder-row ${pack === row.n ? 'active' : ''} ${row.best ? 'best' : ''}`} onClick={() => { setPack(row.n); setQty(1); }}>
                  {row.tag ? <span className="ladder-tag">{row.tag}</span> : null}
                  <div className="ladder-left">
                    <span className="ladder-check">{pack === row.n ? '✓' : ''}</span>
                    <div>
                      <div className="ladder-title">{row.title}</div>
                      <div className="ladder-sub">{row.sub}</div>
                    </div>
                  </div>
                  <div className="ladder-right">
                    <div className="ladder-price">{formatInr(Math.round(unitPrice * row.n * (1 - row.extra / 100)))}</div>
                    <div className="ladder-off">−{selected.off + row.extra}% off</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="ship-progress">
              <div className="ship-progress-text">
                {shipNeed === 0
                  ? <>This order already qualifies for <strong>free shipping</strong></>
                  : <>Add <strong>{formatInr(shipNeed)}</strong> more for <strong>free shipping</strong></>}
              </div>
              <div className="ship-track"><div className="ship-fill" style={{ width: `${shipPct}%` }} /></div>
            </div>

            <div className="qty-cart-row">
              <div className="qty-stepper">
                <button type="button" onClick={() => setQty((n) => Math.max(1, n - 1))}>−</button>
                <span>{qty}</span>
                <button type="button" onClick={() => setQty((n) => n + 1)}>+</button>
              </div>
              <button type="button" className="pdp-btn pdp-btn-outline" onClick={() => toggleWishlist(product)}>
                <Heart size={16} className={liked ? 'fill-current text-[#8C2F2B]' : ''} /> Wishlist
              </button>
            </div>
            <div className="buy-now-row">
              <button type="button" className="pdp-btn pdp-btn-outline" onClick={add}>Add to Cart</button>
              <button type="button" className="pdp-btn pdp-btn-primary" onClick={buyNow}>Buy Now</button>
            </div>
            {toast ? <p className="price-note">Added to cart</p> : null}

            <div className="pincode-box">
              <strong>Check Delivery & Estimated Arrival</strong>
              <div className="pincode-row">
                <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter pincode" inputMode="numeric" />
                <button type="button" onClick={() => setPinMsg(pin.length === 6 ? 'Delivery in 5–9 days. Cash on delivery available.' : 'Enter a 6-digit pincode.')}>Check</button>
              </div>
              {pinMsg ? <div className="pincode-result">{pinMsg}</div> : null}
            </div>

            <div className="gift-banner">
              <div>
                <strong>Buy 2, get a complimentary diya pair</strong>
                <span>Added automatically on eligible sets — no code needed</span>
              </div>
            </div>

            <div className="pdp-trust-icons">
              <div><CreditCard size={20} /><span>Secure Payment</span></div>
              <div><RotateCcw size={20} /><span>7-Day Returns</span></div>
              <div><Truck size={20} /><span>Cash on Delivery*</span></div>
              <div><Globe size={20} /><span>Ships Worldwide</span></div>
            </div>

            <div className="share-row">
              <span>Share this piece:</span>
              <div className="share-icons">
                <a href={`https://wa.me/?text=${shareText}`} aria-label="Share on WhatsApp"><ShareIcon d="M21 11.5a8.5 8.5 0 01-12.4 7.6L3 21l1.9-5.6A8.5 8.5 0 1121 11.5z" /></a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} aria-label="Share on Facebook" target="_blank" rel="noreferrer"><ShareIcon d="M15 8h3V4h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V9a1 1 0 011-1z" /></a>
                <a href={`mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(shareUrl)}`} aria-label="Share by Email"><ShareIcon d="M2 7l10 6 10-6" /></a>
              </div>
            </div>

            <div className="pdp-accordion">
              {[
                ['craft', 'Materials & Craftsmanship', (
                  <ul>
                    <li>{product.description || product.content}</li>
                    {product.material ? <li>Material: {product.material}</li> : null}
                    <li>Named artisan house: {vendor?.name || product.vendor}</li>
                  </ul>
                )],
                ['care', 'Care Instructions', product.careInstructions || 'Wipe with a soft dry cloth. Avoid harsh acids.'],
                ['ship', 'Shipping & Delivery', product.shippingNotes || 'Hand-packed and dispatched in 3–5 business days. Domestic delivery typically 5–9 days.'],
                ['returns', 'Returns & Refunds', product.returnNotes || '7-day window from delivery for manufacturing defects or transit damage.'],
              ].map(([key, title, body]) => (
                <div key={key} className={`pdp-acc-item ${openAcc === key ? 'open' : ''}`}>
                  <button type="button" className="pdp-acc-head" onClick={() => setOpenAcc(openAcc === key ? '' : key)}>
                    {title} <PlusIcon />
                  </button>
                  <div className="pdp-acc-panel"><div className="pdp-acc-panel-inner">{body}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="pdp-section" style={{ background: 'var(--marble-deep)' }}>
        <div className="pdp-wrap">
          <div className="pdp-section-head">
            <span className="eyebrow">From workshop to doorstep</span>
            <h2>How this piece is made</h2>
            <p>Every workshop piece follows the same six-step process, kept close to traditional methods.</p>
          </div>
          <div className="made-grid">
            {[
              ['Clay / stone chosen', 'The block or clay is checked for density, colour, and flaws before forming begins.'],
              ['Hand forming', 'The basic form is made by hand — wheel, coil, or chisel — following traditional iconography.'],
              ['Detail carving', 'Surface pattern, jewellery, or brushwork is finished under natural light.'],
              ['Firing or polish', 'Kiln fire or stone polish brings out the material without chemical brighteners.'],
              ['Artisan check', 'Each piece is inspected for cracks, symmetry, and finish before it is packed.'],
              ['Protective packing', 'Foam corners and a rigid outer wrap, sized to the weight of the piece.'],
            ].map(([title, copy], i) => (
              <div key={title} className="made-card">
                <div className="made-num">{i + 1}</div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pdp-section">
        <div className="pdp-wrap spec-seo-grid">
          <div className="seo-content">
            <h2>Why this {product.name}</h2>
            <p>{product.description || product.content}</p>
            <p>Each piece is made with the same care as temple and household crafts from Rajasthan — weight, finish, and small irregularities tell you it was not poured in a factory mould.</p>
            <h2>Where it lives in the home</h2>
            <p>Match size to the shelf or floor first. A common mistake is under-sizing a large room so even a well-made piece looks like an afterthought.</p>
            <h2>A note on care</h2>
            <p>Keep acids away from stone. Dust with a soft cloth. Terracotta cooking ware should be seasoned as the artisan recommends.</p>
          </div>
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>Specifications</h3>
            <table className="spec-table">
              <tbody>
                <tr><td>Material</td><td>{finish || product.material || 'Handmade craft'}</td></tr>
                <tr><td>Brand</td><td>{product.brand || '—'}</td></tr>
                <tr><td>Origin</td><td>{product.location || 'Jaipur, Rajasthan'}</td></tr>
                <tr><td>Artisan house</td><td>{vendor?.name || product.vendor}</td></tr>
                <tr><td>Size</td><td>{selected.label}</td></tr>
                <tr><td>Weight</td><td>{product.weight || (product.weightKg ? `${product.weightKg} kg` : '—')}</td></tr>
                <tr><td>Dimensions (L×W×H cm)</td><td>{[product.length, product.width, product.height].filter(Boolean).join(' × ') || '—'}</td></tr>
                <tr><td>SKU</td><td>{product.sku || product._id}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="pdp-section" style={{ background: 'var(--marble-deep)' }}>
        <div className="pdp-wrap" style={{ maxWidth: 800 }}>
          <div className="pdp-section-head"><span className="eyebrow">Product FAQs</span><h2>Questions about this piece</h2></div>
          {faqItems.map(([q, a], i) => (
            <div key={q} className={`pdp-acc-item ${openFaq === i ? 'open' : ''}`}>
              <button type="button" className="pdp-acc-head" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                {q} <PlusIcon />
              </button>
              <div className="pdp-acc-panel"><div className="pdp-acc-panel-inner">{a}</div></div>
            </div>
          ))}
        </div>
      </section>

      <section className="pdp-section" id="reviews">
        <div className="pdp-wrap" style={{ maxWidth: 900 }}>
          <div className="pdp-section-head"><span className="eyebrow">Verified Reviews</span><h2>What customers say</h2></div>
          <div className="review-summary">
            <div className="review-score">
              <div className="big">{product.rating}</div>
              <span>Based on {product.reviews} reviews</span>
            </div>
            <div className="review-bars">
              {[['5 star', 72], ['4 star', 18], ['3 star', 7], ['2 star', 2], ['1 star', 2]].map(([label, pct]) => (
                <div key={label} className="rb-row"><span className="rb-label">{label}</span><div className="rb-track"><div className="rb-fill" style={{ width: `${pct}%` }} /></div></div>
              ))}
            </div>
          </div>
          {(productReviews.length ? productReviews : [
            { name: 'Priya M.', date: '2 weeks ago', comment: 'Packaging was excellent and the piece looks handmade, not factory. Exactly what I wanted for the home shelf.', rating: 5 },
            { name: 'Arjun S.', date: '1 month ago', comment: 'Heavier than I expected — in a good way. Delivery was within what they promised.', rating: 4 },
          ]).map((review) => (
            <div key={review.id || review.name} className="review-card">
              <div className="rc-top">
                <span className="inline-flex text-[#A9782F]">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} fill={i < (review.rating || 5) ? 'currentColor' : 'none'} />)}</span>
                <span className="rc-date">{review.date}</span>
              </div>
              <p>{review.comment}</p>
              <div className="rc-author">{review.name} <span className="rc-verified">Verified Buyer</span></div>
            </div>
          ))}
        </div>
      </section>

      <section className="pdp-section" style={{ background: 'var(--marble-deep)' }}>
        <div className="pdp-wrap">
          <div className="pdp-section-head"><span className="eyebrow">Complete the set</span><h2 style={{ fontSize: 22 }}>Frequently bought together</h2></div>
          <div className="p-scroll">
            {together.map((item) => (
              <Link key={item._id} to={`/product/${item._id}`} className="mini-card">
                <div className="mini-media"><img src={item.image} alt={item.name} /></div>
                <div className="mini-body"><h5>{item.name}</h5><span className="price">{formatInr(item.price)}</span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="pdp-section">
        <div className="pdp-wrap">
          <div className="pdp-section-head"><span className="eyebrow">More from this house</span><h2 style={{ fontSize: 22 }}>You may also like</h2></div>
          <div className="p-scroll">
            {related.map((item) => (
              <Link key={item._id} to={`/product/${item._id}`} className="mini-card">
                <div className="mini-media"><img src={item.image} alt={item.name} /></div>
                <div className="mini-body"><h5>{item.name}</h5><span className="price">{formatInr(item.price)}</span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="pdp-section" style={{ background: 'var(--marble-deep)' }}>
        <div className="pdp-wrap">
          <div className="pdp-section-head">
            <span className="eyebrow">From the Journal</span>
            <h2 style={{ fontSize: 24 }}>Articles & craft stories related to this piece</h2>
          </div>
          <div className="article-grid">
            {journalPosts.slice(0, 3).map((post) => (
              <Link key={post._id} to={`/blog/${post._id}`} className="article-card">
                <div className="article-media"><img src={post.image} alt={post.title} /></div>
                <div className="article-body">
                  <div className="article-meta">{post.category}</div>
                  <h4>{post.title}</h4>
                  <p>{post.excerpt}</p>
                  <span className="article-read">Read article →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="pdp-sticky-bar">
        <div className="qty-stepper">
          <button type="button" onClick={() => setQty((n) => Math.max(1, n - 1))}>−</button>
          <span>{qty}</span>
          <button type="button" onClick={() => setQty((n) => n + 1)}>+</button>
        </div>
        <button type="button" className="pdp-btn pdp-btn-outline" onClick={add}>Add to Cart</button>
        <button type="button" className="pdp-btn pdp-btn-primary" onClick={buyNow}>Buy Now</button>
        <a className="btn-whatsapp" href={getWhatsAppHref(`Hi, I'm interested in ${product.name}`)} aria-label="WhatsApp">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 11.5a8.5 8.5 0 01-12.4 7.6L3 21l1.9-5.6A8.5 8.5 0 1121 11.5z" /></svg>
        </a>
      </div>
    </div>
  );
};

export default ProductDetail;
