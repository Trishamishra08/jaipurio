import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2, RotateCcw } from 'lucide-react';
import api from '../../utils/api';
import { mergeProductPage, PRODUCT_PAGE_DEFAULTS, TRUST_ICONS } from '../../data/productPageDefaults';

const Card = ({ title, enabled, onToggle, children, hint }) => (
  <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h3 className="text-[15px] font-semibold text-slate-800">{title}</h3>
        {hint && <p className="text-[12px] text-slate-500 mt-0.5">{hint}</p>}
      </div>
      {onToggle && (
        <label className="inline-flex items-center gap-2 text-[12px] text-slate-600 cursor-pointer shrink-0">
          <input type="checkbox" checked={!!enabled} onChange={(e) => onToggle(e.target.checked)} className="w-4 h-4 accent-[#8B2E3A]" />
          Show
        </label>
      )}
    </div>
    <div className={onToggle && !enabled ? 'opacity-50 pointer-events-none' : ''}>{children}</div>
  </section>
);

const Field = ({ label, value, onChange, placeholder, hint }) => (
  <label className="block mb-3">
    <span className="block text-[12px] font-medium text-slate-700 mb-1">{label}</span>
    <input
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#8B2E3A]"
    />
    {hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
  </label>
);

const Check = ({ label, checked, onChange }) => (
  <label className="inline-flex items-center gap-2 text-[13px] text-slate-700 mr-5 mb-2 cursor-pointer">
    <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-[#8B2E3A]" />
    {label}
  </label>
);

/**
 * Appearance → Product Page. Edits the copy and section toggles of the
 * storefront product page (saved as settings.productPage).
 */
const AdminProductPageSettings = () => {
  const [cfg, setCfg] = useState(PRODUCT_PAGE_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => setCfg(mergeProductPage(res.data?.data?.settings?.productPage)))
      .catch(() => setNotice({ type: 'error', text: 'Could not load saved settings — showing defaults.' }))
      .finally(() => setLoading(false));
  }, []);

  const set = (section, key, value) =>
    setCfg((prev) => (key === null ? { ...prev, [section]: value } : { ...prev, [section]: { ...prev[section], [key]: value } }));

  const setTrustItem = (i, key, value) =>
    setCfg((prev) => {
      const items = prev.trust.items.map((it, idx) => (idx === i ? { ...it, [key]: value } : it));
      return { ...prev, trust: { ...prev.trust, items } };
    });

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const clean = {
        ...cfg,
        highlights: { ...cfg.highlights, points: cfg.highlights.points.map((p) => p.trim()).filter(Boolean) },
        trust: { ...cfg.trust, items: cfg.trust.items.filter((it) => it.title && it.title.trim()) },
      };
      await api.put('/settings', { productPage: clean });
      setCfg(clean);
      setNotice({ type: 'success', text: 'Product page saved. Changes appear on the storefront within a few minutes.' });
    } catch (err) {
      setNotice({ type: 'error', text: err.parsedMessage || err.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading product page settings…</div>;

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Product Page</h1>
          <p className="text-[13px] text-slate-500">Text and sections shown on every product page.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCfg(PRODUCT_PAGE_DEFAULTS)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-[13px] text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw size={14} /> Reset to defaults
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#8B2E3A] hover:bg-[#6F241D] disabled:opacity-60 text-white text-[13px] font-semibold"
          >
            <Save size={14} /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`mb-4 rounded-lg px-4 py-2.5 text-[13px] ${
            notice.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="space-y-4">
        <Card title="Images & rating" hint="Photo zoom overlay and the star rating under the title.">
          <Check label="Allow image zoom (tap / Zoom button)" checked={cfg.zoomEnabled} onChange={(v) => set('zoomEnabled', null, v)} />
          <Check label="Show star rating & review count" checked={cfg.showRating} onChange={(v) => set('showRating', null, v)} />
        </Card>

        <Card
          title="Highlights box"
          hint="The cream box under the price."
          enabled={cfg.highlights.enabled}
          onToggle={(v) => set('highlights', 'enabled', v)}
        >
          <Field label="Heading" value={cfg.highlights.title} onChange={(v) => set('highlights', 'title', v)} />
          <label className="block">
            <span className="block text-[12px] font-medium text-slate-700 mb-1">Bullet points (one per line)</span>
            <textarea
              rows={4}
              value={cfg.highlights.points.join('\n')}
              onChange={(e) => set('highlights', 'points', e.target.value.split('\n'))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#8B2E3A]"
            />
          </label>
        </Card>

        <Card title="Availability pill" enabled={cfg.stock.enabled} onToggle={(v) => set('stock', 'enabled', v)}>
          <Field
            label="Text"
            value={cfg.stock.label}
            onChange={(v) => set('stock', 'label', v)}
            hint="{count} is replaced with the product's stock, e.g. “Availability: {count} products available”."
          />
        </Card>

        <Card title="Action links" hint="Row under the Add to cart / Buy Now buttons.">
          <div className="mb-3">
            <Check label="Wishlist" checked={cfg.actions.wishlist} onChange={(v) => set('actions', 'wishlist', v)} />
            <Check label="Share" checked={cfg.actions.share} onChange={(v) => set('actions', 'share', v)} />
            <Check label="Ask on WhatsApp" checked={cfg.actions.whatsapp} onChange={(v) => set('actions', 'whatsapp', v)} />
            <Check label="Call Us" checked={cfg.actions.call} onChange={(v) => set('actions', 'call', v)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Field label="WhatsApp number" value={cfg.actions.whatsappNumber} onChange={(v) => set('actions', 'whatsappNumber', v)} hint="With country code, e.g. 919772777736" />
            <Field label="Call Us number" value={cfg.actions.callNumber} onChange={(v) => set('actions', 'callNumber', v)} hint="With country code" />
          </div>
          <Field
            label="WhatsApp message"
            value={cfg.actions.whatsappMessage}
            onChange={(v) => set('actions', 'whatsappMessage', v)}
            hint="{product} is replaced with the product name."
          />
        </Card>

        <Card title="Delivery checker" enabled={cfg.delivery.enabled} onToggle={(v) => set('delivery', 'enabled', v)}>
          <Field label="Heading" value={cfg.delivery.title} onChange={(v) => set('delivery', 'title', v)} />
          <Field label="Input placeholder" value={cfg.delivery.placeholder} onChange={(v) => set('delivery', 'placeholder', v)} />
          <Field label="Message for a valid pincode" value={cfg.delivery.successMessage} onChange={(v) => set('delivery', 'successMessage', v)} />
        </Card>

        <Card title="Become a vendor card" enabled={cfg.vendorCard.enabled} onToggle={(v) => set('vendorCard', 'enabled', v)}>
          <div className="grid sm:grid-cols-3 gap-x-4">
            <Field label="Text" value={cfg.vendorCard.text} onChange={(v) => set('vendorCard', 'text', v)} />
            <Field label="Link text" value={cfg.vendorCard.linkText} onChange={(v) => set('vendorCard', 'linkText', v)} />
            <Field label="Link" value={cfg.vendorCard.link} onChange={(v) => set('vendorCard', 'link', v)} />
          </div>
        </Card>

        <Card title="Trust features" hint="Icon list in the right column (desktop) / below the buttons (mobile)." enabled={cfg.trust.enabled} onToggle={(v) => set('trust', 'enabled', v)}>
          <div className="space-y-2">
            {cfg.trust.items.map((item, i) => (
              <div key={i} className="grid grid-cols-[110px_1fr_1fr_auto] gap-2 items-center">
                <select
                  value={item.icon}
                  onChange={(e) => setTrustItem(i, 'icon', e.target.value)}
                  className="border border-slate-300 rounded-lg px-2 py-2 text-[13px]"
                >
                  {TRUST_ICONS.map((ic) => (
                    <option key={ic} value={ic}>
                      {ic}
                    </option>
                  ))}
                </select>
                <input
                  value={item.title}
                  onChange={(e) => setTrustItem(i, 'title', e.target.value)}
                  placeholder="Title"
                  className="border border-slate-300 rounded-lg px-3 py-2 text-[13px]"
                />
                <input
                  value={item.text}
                  onChange={(e) => setTrustItem(i, 'text', e.target.value)}
                  placeholder="Subtitle"
                  className="border border-slate-300 rounded-lg px-3 py-2 text-[13px]"
                />
                <button
                  type="button"
                  onClick={() => set('trust', 'items', cfg.trust.items.filter((_, idx) => idx !== i))}
                  className="p-2 text-slate-400 hover:text-red-600"
                  aria-label="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => set('trust', 'items', [...cfg.trust.items, { icon: 'store', title: '', text: '' }])}
            className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8B2E3A]"
          >
            <Plus size={14} /> Add feature
          </button>
        </Card>
      </div>
    </div>
  );
};

export default AdminProductPageSettings;
