import React, { useEffect, useState } from 'react';
import { Globe, Image as ImageIcon, RotateCcw, Save, Smartphone } from 'lucide-react';
import api from '../../utils/api';
import MediaGalleryModal from './ecommerce/MediaGalleryModal';
import { POPUP_DEFAULTS, POPUP_FREQUENCIES } from '../../data/popupDefaults';
import { mergePopup } from '../../utils/usePopupSettings';
import { mediaUrl } from '../../data/cloudinaryMedia';

const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#8B2E3A]';

const Field = ({ label, value, onChange, hint, area, placeholder, list }) => (
  <label className="block mb-3">
    <span className="block text-[12px] font-medium text-slate-700 mb-1">{label}</span>
    {area ? (
      <textarea rows={3} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    ) : (
      <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} list={list} className={inputCls} />
    )}
    {hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
  </label>
);

const Toggle = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer mb-3">
    <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-[#8B2E3A]" />
    {label}
  </label>
);

/** Small live preview so the admin sees the offer before saving. */
const Preview = ({ v }) => (
  <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm font-mulish">
    {v.image && <img src={mediaUrl(v.image)} alt="" className="w-full h-28 object-cover" />}
    <div className="p-4">
      {v.eyebrow && <p className="text-[11px] text-slate-500">{v.eyebrow}</p>}
      {v.heading && <p className="text-[18px] font-extrabold text-slate-900 leading-tight">{v.heading}</p>}
      {v.text && <p className="text-[12px] text-slate-600 mt-1 whitespace-pre-line">{v.text}</p>}
      {v.couponCode && (
        <div className="mt-3 rounded-md border-2 border-dashed border-[#F5B82E] bg-[#FFF8E6] px-3 py-1.5 font-mono font-bold tracking-widest text-[13px]">
          {v.couponCode}
        </div>
      )}
      {v.showEmailForm && <div className="mt-3 h-8 rounded border border-slate-300 bg-slate-50 text-[11px] text-slate-400 px-2 flex items-center">Email address</div>}
      {v.showEmailForm && <div className="mt-2 h-8 rounded bg-[#F5B82E] text-[12px] font-bold flex items-center justify-center">{v.submitText || 'Subscribe'}</div>}
      {v.buttonText && v.buttonLink && <div className="mt-2 h-8 rounded bg-[#F5B82E] text-[12px] font-bold flex items-center justify-center">{v.buttonText}</div>}
      {v.showStoreButtons && (v.playStoreUrl || v.appStoreUrl) && (
        <div className="mt-2 flex gap-1.5">
          {v.playStoreUrl && <span className="flex-1 rounded bg-black text-white text-[10px] font-bold py-1.5 text-center">Google Play</span>}
          {v.appStoreUrl && <span className="flex-1 rounded bg-black text-white text-[10px] font-bold py-1.5 text-center">App Store</span>}
        </div>
      )}
    </div>
  </div>
);

const VariantCard = ({ variant, v, onChange, coupons, onPickImage }) => {
  const set = (key, value) => onChange({ ...v, [key]: value });
  const isWeb = variant === 'web';
  const codeUnknown = v.couponCode && coupons.length > 0 && !coupons.some((c) => c.code.toUpperCase() === v.couponCode.trim().toUpperCase());

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 text-[#8B2E3A]">{isWeb ? <Globe size={18} /> : <Smartphone size={18} />}</span>
          <div>
            <h3 className="text-[15px] font-semibold text-slate-800">{isWeb ? 'Website popup' : 'Mobile app popup'}</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              {isWeb
                ? 'Shown to visitors in a normal browser — e.g. newsletter signup or “get our app” offer.'
                : 'Shown only inside the Jaipurio app — app users never see the website version. Good for an app-only welcome offer.'}
            </p>
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-[12px] text-slate-600 cursor-pointer shrink-0">
          <input type="checkbox" checked={!!v.enabled} onChange={(e) => set('enabled', e.target.checked)} className="w-4 h-4 accent-[#8B2E3A]" />
          Show
        </label>
      </div>

      <div className={`grid lg:grid-cols-[1fr_240px] gap-5 ${v.enabled ? '' : 'opacity-50 pointer-events-none'}`}>
        <div>
          <span className="block text-[12px] font-medium text-slate-700 mb-1">Image</span>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-14 h-10 rounded border border-slate-200 bg-slate-50 overflow-hidden shrink-0">
              {v.image && <img src={mediaUrl(v.image)} alt="" className="w-full h-full object-cover" />}
            </span>
            <input value={v.image || ''} onChange={(e) => set('image', e.target.value)} placeholder="Image URL (leave empty for no image)" className={inputCls} />
            <button type="button" onClick={onPickImage} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 text-[12px] text-slate-700 hover:bg-slate-50 shrink-0">
              <ImageIcon size={13} /> Choose
            </button>
          </div>

          <Field label="Small text above heading" value={v.eyebrow} onChange={(x) => set('eyebrow', x)} />
          <Field label="Heading" value={v.heading} onChange={(x) => set('heading', x)} />
          <Field label="Offer text" value={v.text} onChange={(x) => set('text', x)} area />
          <Field
            label="Coupon code (optional)"
            value={v.couponCode}
            onChange={(x) => set('couponCode', x.toUpperCase())}
            list="popup-coupon-codes"
            placeholder="e.g. APP10"
            hint={
              codeUnknown
                ? '⚠ This code is not an active coupon — create it in Ecommerce → Coupons or customers will get an error at checkout.'
                : 'Shown in a box with a Copy button. Pick one of your active coupons so it works at checkout.'
            }
          />

          <Toggle label="Show email signup form (adds the email to Newsletters)" checked={v.showEmailForm} onChange={(x) => set('showEmailForm', x)} />
          {v.showEmailForm && (
            <div className="grid sm:grid-cols-2 gap-x-3">
              <Field label="Signup button text" value={v.submitText} onChange={(x) => set('submitText', x)} />
              <Field label="Message after signup" value={v.successText} onChange={(x) => set('successText', x)} />
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-x-3">
            <Field label="Button text (optional)" value={v.buttonText} onChange={(x) => set('buttonText', x)} placeholder="e.g. Shop now" />
            <Field label="Button link" value={v.buttonLink} onChange={(x) => set('buttonLink', x)} placeholder="/shop or https://…" hint="Button shows only when both text and link are filled." />
          </div>

          {isWeb && (
            <>
              <Toggle label="Show app store buttons (“Download our app”)" checked={v.showStoreButtons} onChange={(x) => set('showStoreButtons', x)} />
              {v.showStoreButtons && (
                <div className="grid sm:grid-cols-2 gap-x-3">
                  <Field label="Google Play link" value={v.playStoreUrl} onChange={(x) => set('playStoreUrl', x)} placeholder="https://play.google.com/store/apps/…" />
                  <Field label="App Store link" value={v.appStoreUrl} onChange={(x) => set('appStoreUrl', x)} placeholder="https://apps.apple.com/…" />
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <span className="block text-[12px] font-medium text-slate-700 mb-1">Preview</span>
          <Preview v={v} />
        </div>
      </div>
    </section>
  );
};

/** Appearance → Popup. The storefront popup, with separate website and in-app versions. */
const AdminPopupSettings = () => {
  const [cfg, setCfg] = useState(POPUP_DEFAULTS);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [mediaFor, setMediaFor] = useState(null);

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => setCfg(mergePopup(res.data?.data?.settings?.popup)))
      .catch(() => setNotice({ type: 'error', text: 'Could not load saved settings — showing defaults.' }))
      .finally(() => setLoading(false));
    api
      .get('/coupons/public')
      .then((res) => setCoupons((res.data?.data?.coupons || []).filter((c) => c.code)))
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const clean = {
        ...cfg,
        delaySeconds: Math.min(60, Math.max(0, Number(cfg.delaySeconds) || 0)),
        web: { ...cfg.web, couponCode: (cfg.web.couponCode || '').trim() },
        app: { ...cfg.app, couponCode: (cfg.app.couponCode || '').trim() },
      };
      await api.put('/settings', { popup: clean });
      setCfg(clean);
      setNotice({ type: 'success', text: 'Popup saved. Changes appear on the storefront within a few minutes.' });
    } catch (err) {
      setNotice({ type: 'error', text: err.parsedMessage || err.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading popup settings…</div>;

  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Popup</h1>
          <p className="text-[13px] text-slate-500">The offer popup customers see a moment after opening the store.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setCfg(POPUP_DEFAULTS)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-[13px] text-slate-700 hover:bg-slate-50">
            <RotateCcw size={14} /> Reset to defaults
          </button>
          <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#8B2E3A] hover:bg-[#6F241D] disabled:opacity-60 text-white text-[13px] font-semibold">
            <Save size={14} /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {notice && (
        <div className={`mb-4 rounded-lg px-4 py-2.5 text-[13px] ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {notice.text}
        </div>
      )}

      <datalist id="popup-coupon-codes">
        {coupons.map((c) => (
          <option key={c._id || c.code} value={c.code} />
        ))}
      </datalist>

      <div className="space-y-4">
        <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-3">When to show</h3>
          <div className="grid sm:grid-cols-2 gap-x-3">
            <label className="block mb-3">
              <span className="block text-[12px] font-medium text-slate-700 mb-1">Delay after page opens (seconds)</span>
              <input type="number" min={0} max={60} step={0.5} value={cfg.delaySeconds} onChange={(e) => setCfg({ ...cfg, delaySeconds: e.target.value })} className={inputCls} />
            </label>
            <label className="block mb-3">
              <span className="block text-[12px] font-medium text-slate-700 mb-1">How often</span>
              <select value={cfg.frequency} onChange={(e) => setCfg({ ...cfg, frequency: e.target.value })} className={inputCls}>
                {POPUP_FREQUENCIES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-[11px] text-slate-400">Changing the heading, offer text or coupon code shows the popup again to customers who closed the old one.</p>
        </section>

        {['web', 'app'].map((variant) => (
          <VariantCard
            key={variant}
            variant={variant}
            v={cfg[variant]}
            coupons={coupons}
            onChange={(v) => setCfg((prev) => ({ ...prev, [variant]: v }))}
            onPickImage={() => setMediaFor(variant)}
          />
        ))}
      </div>

      <MediaGalleryModal
        open={!!mediaFor}
        onClose={() => setMediaFor(null)}
        onInsert={(asset) => {
          if (asset?.url && mediaFor) setCfg((prev) => ({ ...prev, [mediaFor]: { ...prev[mediaFor], image: asset.url } }));
          setMediaFor(null);
        }}
      />
    </div>
  );
};

export default AdminPopupSettings;
