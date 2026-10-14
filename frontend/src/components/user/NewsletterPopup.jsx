import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api from '../../utils/api';

// Same artwork the old jaipurio.in popup used (now served from MinIO).
const POPUP_IMAGE = 'https://minio-jaipurio.sakha.cloud/jaipurio/5-8.jpg';
const HIDE_FOREVER_KEY = 'jp_newsletter_hide';
const SEEN_SESSION_KEY = 'jp_newsletter_seen';
const OPEN_DELAY_MS = 2500;

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

/**
 * Newsletter popup shown once per visit, a moment after the storefront opens
 * (website and app). "Don't show this popup again" or a successful signup
 * hides it for good on this device.
 */
const NewsletterPopup = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [dontShow, setDontShow] = useState(false);
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  useEffect(() => {
    if (readStore(localStorage, HIDE_FOREVER_KEY) || readStore(sessionStorage, SEEN_SESSION_KEY)) return undefined;
    const id = setTimeout(() => {
      setOpen(true);
      writeStore(sessionStorage, SEEN_SESSION_KEY, '1');
    }, OPEN_DELAY_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dontShow]);

  const close = () => {
    if (dontShow) writeStore(localStorage, HIDE_FOREVER_KEY, '1');
    setOpen(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ state: 'loading', message: '' });
    try {
      await api.post('/newsletters/subscribe', { email, source: 'popup' });
      writeStore(localStorage, HIDE_FOREVER_KEY, '1');
      setStatus({ state: 'success', message: 'Thank you! You are subscribed — watch your inbox for your 10% off.' });
      setTimeout(() => setOpen(false), 2200);
    } catch (err) {
      setStatus({
        state: 'error',
        message: err?.response?.data?.message || err?.parsedMessage || 'Could not subscribe right now. Please try again.',
      });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 font-mulish" role="dialog" aria-modal="true" aria-labelledby="newsletter-title">
      <div className="absolute inset-0 bg-black/55" onClick={close} />

      <div className="relative w-full max-w-[880px] bg-white rounded-xl overflow-hidden shadow-2xl grid md:grid-cols-2">
        <button
          type="button"
          onClick={close}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full text-[#2B1E1A] hover:bg-black/5"
          aria-label="Close"
        >
          <X size={22} />
        </button>

        <div className="hidden md:block bg-white">
          <img src={POPUP_IMAGE} alt="" className="w-full h-full object-cover" />
        </div>

        <div className="p-6 sm:p-10 flex flex-col justify-center">
          <p className="text-[14px] text-[#3F3F3F] tracking-wide">Newsletter</p>
          <h3 id="newsletter-title" className="text-[28px] sm:text-[34px] font-extrabold text-[#1F1F1F] leading-tight mt-1">
            Subscribe Now
          </h3>
          <p className="text-[15px] text-[#555] leading-relaxed mt-2">
            Subscribe to our newsletter and get 10% off your first purchase
          </p>

          {status.state === 'success' ? (
            <p className="mt-6 rounded-lg bg-[#EAF5EA] text-[#2E7D32] text-[14px] font-semibold px-4 py-3">{status.message}</p>
          ) : (
            <form onSubmit={submit} className="mt-6">
              <label htmlFor="newsletter-email" className="block text-[14px] font-semibold text-[#1F1F1F] mb-2">
                Email Address <span className="text-red-600">*</span>
              </label>
              <input
                id="newsletter-email"
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
                {status.state === 'loading' ? 'Subscribing…' : 'Subscribe'}
              </button>
            </form>
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
