import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Percent } from 'lucide-react';
import api from '../../utils/api';
import { mediaUrl } from '../../data/cloudinaryMedia';
import { useHomeSections } from '../../utils/useHomeSections';

const inr = (n) => Number(n).toLocaleString('en-IN');

/** A coupon created in the admin → a card: "Flat 20% Off" / "Use code SAVE20 · valid till 31 Dec". */
const cardFromCoupon = (c) => {
  const value = Number(c.discountValue) || 0;
  const expiry = c.expiryDate ? new Date(c.expiryDate) : null;
  const till = expiry && !Number.isNaN(expiry.getTime())
    ? expiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  return {
    key: c._id || c.code,
    code: c.code,
    title: c.discountType === 'percentage' ? `Flat ${value}% Off` : `Flat ₹${inr(value)} Off`,
    text: `Use code ${c.code}${till ? ` · valid till ${till}` : ''}`,
  };
};

/**
 * Coupon strip. Automatic: the live coupons set up in the admin (Coupons) —
 * tap a card to copy its code. Manual: the cards typed in
 * Admin → Appearance → Home Page → Coupon strip.
 */
const CouponOffers = () => {
  const cfg = useHomeSections().sections.coupons;
  const auto = cfg.source !== 'manual';
  const [live, setLive] = useState([]);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (!auto) return undefined;
    let cancelled = false;
    api
      .get('/coupons/public')
      .then((res) => {
        if (!cancelled) setLive(res.data?.data?.coupons || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [auto]);

  const cards = auto
    ? live.slice(0, cfg.limit || 4).map(cardFromCoupon)
    : (cfg.items || []).filter((it) => it && it.title).map((it, i) => ({ key: `${it.title}-${i}`, title: it.title, text: it.text, link: it.link || '/shop' }));

  if (!cfg.enabled || !cards.length) return null;

  const copy = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <section className="w-full bg-white py-3">
      <div className="site-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 overflow-hidden rounded-2xl border border-[#E8E2D9] bg-white">
          {cards.map((card, i) => {
            const cls = `relative flex items-center gap-3 px-4 py-4 sm:py-5 text-left hover:bg-[#FAF4EA] transition-colors overflow-hidden ${
              i > 0 ? 'border-t border-dashed border-[#E8E2D9]' : ''
            } ${i % 2 === 1 ? 'sm:border-t-0' : ''} ${i % 2 === 0 && i < cards.length - 1 ? 'sm:border-r sm:border-dashed sm:border-[#E8E2D9]' : ''} ${
              i % 2 === 0 && i === cards.length - 1 ? 'sm:col-span-2' : ''
            } ${i >= 2 ? 'sm:border-t' : ''}`;
            const inner = (
              <>
                {i % 2 === 1 && (
                  <div
                    className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 opacity-20"
                    style={{
                      backgroundImage: `url(${mediaUrl('/jaipurio_banner_art.png')})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'right center',
                    }}
                    aria-hidden="true"
                  />
                )}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F7F3EE] flex items-center justify-center shrink-0 relative z-[1]">
                  <Percent size={18} className="text-[#6F241D]" strokeWidth={2.2} />
                </div>
                <div className="min-w-0 relative z-[1] flex-1">
                  <p className="font-playfair font-semibold text-[14px] sm:text-[16px] text-[#6F241D] leading-tight">{card.title}</p>
                  {card.text && <p className="font-dm text-[10px] sm:text-[11px] text-[#806653] mt-0.5">{card.text}</p>}
                </div>
                {card.code && (
                  <span className="relative z-[1] shrink-0 inline-flex items-center gap-1 rounded-full border border-dashed border-[#C45C6A] px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-[#C45C6A]">
                    {copied === card.code ? (
                      <>
                        <Check size={12} /> Copied
                      </>
                    ) : (
                      'Tap to copy'
                    )}
                  </span>
                )}
              </>
            );
            return card.code ? (
              <button key={card.key} type="button" onClick={() => copy(card.code)} className={cls} aria-label={`Copy coupon code ${card.code}`}>
                {inner}
              </button>
            ) : (
              <Link key={card.key} to={card.link} className={cls}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CouponOffers;
