import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, X } from 'lucide-react';
import api from '../../utils/api';
import { usePopupSettings } from '../../utils/usePopupSettings';
import { isInApp } from '../../utils/appContext';
import { isExternalUrl } from '../../utils/menuUrl';
import { mediaUrl } from '../../data/cloudinaryMedia';
import { PLAY_STORE_FALLBACK } from '../../data/popupDefaults';

const DAY_MS = 24 * 60 * 60 * 1000;
// Shown at most once per page load, even when the layout remounts (e.g. after logging in).
let shownThisLoad = false;

const readStore = (store, key) => {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
};
const writeStore = (store, key, value) => {
  try {
    store.setItem(key, value);
  } catch {
    /* storage blocked (private mode) — popup just shows again next time */
  }
};

// Changing the offer (heading, text or code) in the admin shows the popup again
// to visitors who closed or dismissed the old one.
const offerSignature = (v) => [v.heading, v.text, v.couponCode].join('|');

const shouldShow = (variant, v, frequency) => {
  const sig = offerSignature(v);
  if (readStore(localStorage, `jp_popup_hide_${variant}`) === sig) return false;
  if (shownThisLoad) return false;
  if (frequency === 'every') return true;
  if (frequency === 'once') return readStore(localStorage, `jp_popup_seen_${variant}`) !== sig;
  if (frequency === 'day') {
    const last = Number(readStore(localStorage, `jp_popup_last_${variant}`)) || 0;
    return Date.now() - last > DAY_MS;
  }
  return !readStore(sessionStorage, `jp_popup_seen_${variant}`);
};

const markSeen = (variant, v) => {
  writeStore(sessionStorage, `jp_popup_seen_${variant}`, '1');
  writeStore(localStorage, `jp_popup_seen_${variant}`, offerSignature(v));
  writeStore(localStorage, `jp_popup_last_${variant}`, String(Date.now()));
};

const ActionLink = ({ to, className, onClick, children }) =>
  isExternalUrl(to) ? (
    <a href={to} target="_blank" rel="noreferrer" className={className} onClick={onClick}>
      {children}
    </a>
  ) : (
    <Link to={to} className={className} onClick={onClick}>
      {children}
    </Link>
  );

/**
 * Storefront popup, managed in Appearance → Popup. The website shows the "web"
 * version (newsletter / get-the-app offer); inside the mobile app the "app"
 * version is shown instead, so app users never see "download our app".
 */
const NewsletterPopup = () => {
  const config = usePopupSettings();
  const variant = useMemo(() => (isInApp() ? 'app' : 'web'), []);
  const v = config?.[variant];

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [dontShow, setDontShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  useEffect(() => {
    if (!v || !v.enabled || !shouldShow(variant, v, config.frequency)) return undefined;
    const delay = Math.max(0, Number(config.delaySeconds) || 0) * 1000;
    const id = setTimeout(() => {
      if (shownThisLoad) return;
      shownThisLoad = true;
      setOpen(true);
      markSeen(variant, v);
    }, delay);
    return () => clearTimeout(id);
  }, [v, variant, config]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dontShow]);

  const hideForGood = () => writeStore(localStorage, `jp_popup_hide_${variant}`, offerSignature(v));

  const close = () => {
    if (dontShow) hideForGood();
    setOpen(false);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(v.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the code is still visible to type */
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ state: 'loading', message: '' });
    try {
      await api.post('/newsletters/subscribe', { email, source: variant === 'app' ? 'app-popup' : 'popup' });
      hideForGood();
      setStatus({ state: 'success', message: v.successText || 'Thank you! You are subscribed.' });
      setTimeout(() => setOpen(false), 2200);
    } catch (err) {
      setStatus({
        state: 'error',
        message: err?.response?.data?.message || err?.parsedMessage || 'Could not subscribe right now. Please try again.',
      });
    }
  };

  if (!open || !v) return null;

  const storeButtons = variant === 'web' && v.showStoreButtons !== false;
  const playStoreUrl = v.playStoreUrl || PLAY_STORE_FALLBACK;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 font-mulish" role="dialog" aria-modal="true" aria-labelledby="site-popup-title">
      <div className="absolute inset-0 bg-black/55" onClick={close} />

      <div className={`relative w-full max-h-[92vh] overflow-y-auto bg-white rounded-xl shadow-2xl grid ${v.image ? 'max-w-[880px] md:grid-cols-2' : 'max-w-[460px]'}`}>
        <button
          type="button"
          onClick={close}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full text-[#2B1E1A] bg-white/80 hover:bg-white"
          aria-label="Close"
        >
          <X size={22} />
        </button>

        {v.image && (
          <div className="relative overflow-hidden bg-[#F7F2EA] h-[30vh] max-h-56 min-h-[150px] sm:h-60 sm:max-h-none md:h-auto md:min-h-[420px]">
            {/* phones: the whole image fits the card; a soft blurred copy fills the sides */}
            <img src={mediaUrl(v.image)} alt="" aria-hidden="true" className="md:hidden absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-60" />
            <img src={mediaUrl(v.image)} alt="" className="relative w-full h-full object-contain md:absolute md:inset-0 md:object-cover" />
          </div>
        )}

        <div className="p-5 sm:p-10 flex flex-col justify-center">
          {v.eyebrow && <p className="text-[14px] text-[#3F3F3F] tracking-wide">{v.eyebrow}</p>}
          {v.heading && (
            <h3 id="site-popup-title" className="text-[26px] sm:text-[34px] font-extrabold text-[#1F1F1F] leading-tight mt-1">
              {v.heading}
            </h3>
          )}
          {v.text && <p className="text-[15px] text-[#555] leading-relaxed mt-2 whitespace-pre-line">{v.text}</p>}

          {v.couponCode && (
            <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border-2 border-dashed border-[#F5B82E] bg-[#FFF8E6] px-4 py-3">
              <span className="font-mono text-[18px] font-bold tracking-[0.15em] text-[#1F1F1F]">{v.couponCode}</span>
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#8B2E3A] hover:text-[#6F241D]"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}

          {storeButtons && (
            <div className="mt-5 flex flex-wrap gap-2.5">
              <a
                href={playStoreUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Get the Jaipurio app on Google Play"
                className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2.5 rounded-lg bg-black hover:bg-[#222] text-white px-4 py-2 transition-colors"
              >
                <svg viewBox="0 0 512 512" className="w-6 h-6 shrink-0" aria-hidden="true">
                  <path fill="#34A853" d="M48 59.5v393c0 9 4.7 16.9 11.8 21.3L284 256 59.8 38.2C52.7 42.6 48 50.5 48 59.5z" />
                  <path fill="#FBBC04" d="M371.6 168.6 284 256l87.6 87.4 98.6-56.1c19.7-11.2 19.7-39.4 0-50.6l-98.6-68.1z" />
                  <path fill="#EA4335" d="M284 256 59.8 473.8c7.9 4.9 18.2 5.4 27 .4l284.8-130.8L284 256z" />
                  <path fill="#4285F4" d="M371.6 168.6 86.8 37.8c-8.8-5-19.1-4.5-27-.4L284 256l87.6-87.4z" />
                </svg>
                <span className="text-left leading-tight">
                  <span className="block text-[10px] uppercase tracking-wide opacity-80">Get it on</span>
                  <span className="block text-[16px] font-semibold">Google Play</span>
                </span>
              </a>
              {v.appStoreUrl && (
                <a href={v.appStoreUrl} target="_blank" rel="noreferrer" className="flex-1 min-w-[160px] inline-flex items-center justify-center rounded-lg bg-black hover:bg-[#222] text-white text-[13px] font-bold px-4 py-3 transition-colors">
                  Download on the App Store
                </a>
              )}
            </div>
          )}
          {v.showEmailForm &&
            (status.state === 'success' ? (
              <p className="mt-6 rounded-lg bg-[#EAF5EA] text-[#2E7D32] text-[14px] font-semibold px-4 py-3">{status.message}</p>
            ) : (
              <form onSubmit={submit} className="mt-6">
                <label htmlFor="site-popup-email" className="block text-[14px] font-semibold text-[#1F1F1F] mb-2">
                  Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  id="site-popup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Your Email"
                  className="w-full border border-[#DADADA] rounded-md px-4 py-3 text-[14px] focus:outline-none focus:border-[#F5B82E]"
                />
                {status.state === 'error' && <p className="mt-2 text-[12px] text-red-600">{status.message}</p>}
                <button
                  type="submit"
                  disabled={status.state === 'loading'}
                  className="mt-4 w-full rounded-md bg-[#F5B82E] hover:bg-[#E9A915] disabled:opacity-60 text-[#1F1F1F] text-[15px] font-bold py-3 transition-colors"
                >
                  {status.state === 'loading' ? 'Subscribing…' : v.submitText || 'Subscribe'}
                </button>
              </form>
            ))}

          {v.buttonText && v.buttonLink && (
            <ActionLink
              to={v.buttonLink}
              onClick={() => setOpen(false)}
              className="mt-5 block w-full text-center rounded-md bg-[#F5B82E] hover:bg-[#E9A915] text-[#1F1F1F] text-[15px] font-bold py-3 transition-colors"
            >
              {v.buttonText}
            </ActionLink>
          )}


          <label className="mt-5 flex items-center gap-2.5 text-[14px] text-[#3F3F3F] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              className="w-4 h-4 accent-[#F5B82E]"
            />
            Don&apos;t show this popup again
          </label>
        </div>
      </div>
    </div>
  );
};

export default NewsletterPopup;
