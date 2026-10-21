import React, { useState } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import api from '../../utils/api';
import { useFooterSettings } from '../../utils/useFooterSettings';

const PHONE = '+91 9929949258';
const EMAIL = 'info@jaipurio.com';

const inputCls =
  'w-full bg-white border border-[#E8D4B5] rounded-xl px-3.5 py-2.5 text-[13px] text-[#2B1E1A] focus:outline-none focus:border-[#A94E2C]';

/** Contact page — same details as the old jaipurio.in contact page; messages go to Admin → Contacts. */
const ContactPage = () => {
  const footer = useFooterSettings();
  const office = footer.offices?.items?.[0];
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [status, setStatus] = useState({ state: 'idle', text: '' });

  const set = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      setStatus({ state: 'error', text: 'Please enter your name and a valid email.' });
      return;
    }
    setStatus({ state: 'loading', text: '' });
    try {
      await api.post('/contacts', { ...form, formType: 'contact' });
      setStatus({ state: 'success', text: 'Thank you! Your message has been sent — we will reply soon.' });
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setStatus({ state: 'error', text: err?.response?.data?.message || 'Could not send your message. Please try again.' });
    }
  };

  return (
    <div className="bg-white pb-24 md:pb-12">
      <div className="bg-gradient-to-b from-[#FBF4EA] to-white border-b border-[#F1E6D6]">
        <div className="site-container py-6 sm:py-10">
          <h1 className="font-playfair text-[24px] sm:text-[34px] font-semibold text-[#3F261B]">Contact Us</h1>
          <p className="font-dm text-[13px] sm:text-sm text-[#806653] mt-1">Questions about an order, a custom piece or selling on Jaipurio — write to us.</p>
        </div>
      </div>

      <div className="site-container grid lg:grid-cols-[1fr_1.4fr] gap-6 sm:gap-10 pt-6">
        <div className="space-y-3">
          <h2 className="font-playfair text-lg font-semibold text-[#3F261B]">Contact info</h2>
          <div className="flex gap-3 p-4 rounded-2xl bg-[#FCF8F2] border border-[#EFE3CF]">
            <MapPin size={18} className="text-[#A94E2C] shrink-0 mt-0.5" />
            <div className="text-[13px] text-[#5B4638]">
              <p className="font-semibold text-[#3F261B]">Store</p>
              <p>{office?.address || '133-134, Jandu 4 Apartment, Jaipur, Rajasthan 302012'}</p>
            </div>
          </div>
          <a href={`tel:${PHONE.replace(/\s/g, '')}`} className="flex gap-3 p-4 rounded-2xl bg-[#FCF8F2] border border-[#EFE3CF] text-[13px] text-[#3F261B] font-semibold">
            <Phone size={18} className="text-[#A94E2C] shrink-0" /> {PHONE}
          </a>
          <a href={`mailto:${EMAIL}`} className="flex gap-3 p-4 rounded-2xl bg-[#FCF8F2] border border-[#EFE3CF] text-[13px] text-[#3F261B] font-semibold break-all">
            <Mail size={18} className="text-[#A94E2C] shrink-0" /> {EMAIL}
          </a>
        </div>

        <form onSubmit={submit} className="p-4 sm:p-6 rounded-2xl border border-[#E8D4B5] bg-white space-y-3">
          <h2 className="font-playfair text-lg font-semibold text-[#3F261B]">Drop us a line</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={form.name} onChange={set('name')} placeholder="Name *" className={inputCls} autoComplete="name" />
            <input value={form.email} onChange={set('email')} placeholder="Email *" type="email" className={inputCls} autoComplete="email" />
            <input value={form.phone} onChange={set('phone')} placeholder="Phone" inputMode="tel" className={inputCls} autoComplete="tel" />
            <input value={form.subject} onChange={set('subject')} placeholder="Subject" className={inputCls} />
          </div>
          <textarea value={form.message} onChange={set('message')} rows={5} placeholder="Your message" className={inputCls} />
          {status.text && (
            <p className={`text-[12px] font-semibold ${status.state === 'success' ? 'text-[#2E7D32]' : 'text-red-600'}`}>{status.text}</p>
          )}
          <button
            type="submit"
            disabled={status.state === 'loading'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#6F241D] hover:bg-[#873A24] disabled:opacity-60 text-white px-6 py-3 rounded-full text-xs font-bold"
          >
            <Send size={14} /> {status.state === 'loading' ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactPage;
