import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import { FOOTER_DEFAULTS, FOOTER_ICONS } from '../../data/footerDefaults';
import { mergeFooter } from '../../utils/useFooterSettings';

const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#8B2E3A]';

const move = (list, i, dir) => {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

const Card = ({ title, hint, enabled, onToggle, children }) => (
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

const Field = ({ label, value, onChange, hint, area, placeholder }) => (
  <label className="block mb-3">
    <span className="block text-[12px] font-medium text-slate-700 mb-1">{label}</span>
    {area ? (
      <textarea rows={2} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    ) : (
      <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    )}
    {hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
  </label>
);

const RowButtons = ({ i, count, onChange, items }) => (
  <>
    <button type="button" disabled={i === 0} onClick={() => onChange(move(items, i, -1))} className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30" aria-label="Move up"><ArrowUp size={14} /></button>
    <button type="button" disabled={i === count - 1} onClick={() => onChange(move(items, i, 1))} className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30" aria-label="Move down"><ArrowDown size={14} /></button>
    <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="p-1 text-slate-400 hover:text-red-600" aria-label="Remove"><Trash2 size={14} /></button>
  </>
);

/** Rows of small text fields (+ optional icon select). */
const RowsEditor = ({ items, onChange, fields, icons, blank, max = 12, addLabel = 'Add' }) => {
  const update = (i, patch) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  return (
    <div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2">
            {icons && (
              <select value={item.icon} onChange={(e) => update(i, { icon: e.target.value })} className="border border-slate-300 rounded-lg px-2 py-2 text-[13px] bg-white">
                {icons.map((ic) => (
                  <option key={ic} value={ic}>{ic}</option>
                ))}
              </select>
            )}
            {fields.map(([key, label]) => (
              <input
                key={key}
                value={item[key] || ''}
                onChange={(e) => update(i, { [key]: e.target.value })}
                placeholder={label}
                className="flex-1 min-w-[130px] border border-slate-300 rounded-lg px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-[#8B2E3A]"
              />
            ))}
            <RowButtons i={i} count={items.length} onChange={onChange} items={items} />
          </div>
        ))}
      </div>
      {items.length < max && (
        <button type="button" onClick={() => onChange([...items, blank])} className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8B2E3A]">
          <Plus size={14} /> {addLabel}
        </button>
      )}
    </div>
  );
};

/** A list of short texts shown as removable chips; type a name and press Enter (or Add). Several can be pasted comma-separated. */
const TagListEditor = ({ value, onChange, placeholder }) => {
  const [draft, setDraft] = useState('');
  const add = () => {
    const parts = draft.split(',').map((t) => t.trim()).filter(Boolean);
    if (!parts.length) return;
    onChange([...value, ...parts.filter((p) => !value.includes(p))]);
    setDraft('');
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((place, i) => (
          <span key={`${place}-${i}`} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-slate-100 border border-slate-200 text-[12px] text-slate-700">
            {place}
            <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="p-0.5 text-slate-400 hover:text-red-600" aria-label={`Remove ${place}`}>
              <Trash2 size={11} />
            </button>
          </span>
        ))}
        {value.length === 0 && <span className="text-[12px] text-slate-400">Nothing added yet.</span>}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={inputCls}
        />
        <button type="button" onClick={add} className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 text-[13px] text-slate-700 hover:bg-slate-50">
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
};

const BLANK_OFFICE = { title: '', address: '', phone: '', email: '', hours: '', showMap: true, mapMode: 'address', mapEmbedUrl: '', mapLink: '' };

/**
 * Appearance → Footer. Every text, link and column of the storefront footer.
 * (The "Shop by Category" directory is automatic — it always follows the real
 * categories — so only its heading and visibility are set here.)
 */
const AdminFooterSettings = () => {
  const [cfg, setCfg] = useState(FOOTER_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => setCfg(mergeFooter(res.data?.data?.settings?.footer)))
      .catch(() => setNotice({ type: 'error', text: 'Could not load saved settings — showing defaults.' }))
      .finally(() => setLoading(false));
  }, []);

  const set = (section, key, value) =>
    setCfg((prev) => (key === null ? { ...prev, [section]: value } : { ...prev, [section]: { ...prev[section], [key]: value } }));

  const setColumn = (i, patch) =>
    set('directory', 'columns', cfg.directory.columns.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const clean = {
        ...cfg,
        stats: { ...cfg.stats, items: cfg.stats.items.filter((it) => it.label && it.label.trim()) },
        shipping: { ...cfg.shipping, regions: cfg.shipping.regions.filter((r) => (r.title && r.title.trim()) || (r.places || []).length) },
        offices: { ...cfg.offices, items: cfg.offices.items.filter((o) => (o.title && o.title.trim()) || (o.address && o.address.trim())) },
        actions: { ...cfg.actions, items: cfg.actions.items.filter((it) => it.title && it.title.trim()) },
        directory: {
          ...cfg.directory,
          columns: cfg.directory.columns
            .filter((c) => c.title && c.title.trim())
            .map((c) => ({ ...c, links: (c.links || []).filter((l) => l.label && l.label.trim()) })),
        },
      };
      await api.put('/settings', { footer: clean });
      setCfg(clean);
      setNotice({ type: 'success', text: 'Footer saved. Changes appear on the storefront within a few minutes.' });
    } catch (err) {
      setNotice({ type: 'error', text: err.parsedMessage || err.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading footer settings…</div>;

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Footer</h1>
          <p className="text-[13px] text-slate-500">Text, links and sections of the footer shown on the storefront.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setCfg(FOOTER_DEFAULTS)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-[13px] text-slate-700 hover:bg-slate-50">
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

      <div className="space-y-4">
        <Card title="Back to top bar" enabled={cfg.backToTop.enabled} onToggle={(v) => set('backToTop', 'enabled', v)}>
          <Field label="Text" value={cfg.backToTop.text} onChange={(v) => set('backToTop', 'text', v)} />
        </Card>

        <Card title="Heritage heading" hint="The centred heading at the top of the footer." enabled={cfg.heritage.enabled} onToggle={(v) => set('heritage', 'enabled', v)}>
          <Field label="Small label" value={cfg.heritage.eyebrow} onChange={(v) => set('heritage', 'eyebrow', v)} />
          <Field label="Heading" value={cfg.heritage.title} onChange={(v) => set('heritage', 'title', v)} />
          <Field label="Text" area value={cfg.heritage.text} onChange={(v) => set('heritage', 'text', v)} />
        </Card>

        <Card title="Call to action & social links" enabled={cfg.cta.enabled} onToggle={(v) => set('cta', 'enabled', v)}>
          <Field label="Text" value={cfg.cta.text} onChange={(v) => set('cta', 'text', v)} />
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Field label="Button text" value={cfg.cta.buttonText} onChange={(v) => set('cta', 'buttonText', v)} />
            <Field label="Button link" value={cfg.cta.buttonLink} onChange={(v) => set('cta', 'buttonLink', v)} placeholder="/vendor/register" />
            <Field label="Second link text" value={cfg.cta.linkText} onChange={(v) => set('cta', 'linkText', v)} />
            <Field label="Second link" value={cfg.cta.link} onChange={(v) => set('cta', 'link', v)} placeholder="/contact" />
          </div>
          <p className="text-[12px] font-medium text-slate-700 mt-1 mb-2">Social links (leave empty to hide an icon)</p>
          <div className="grid sm:grid-cols-3 gap-x-4">
            <Field label="Instagram" value={cfg.social.instagram} onChange={(v) => set('social', 'instagram', v)} />
            <Field label="Facebook" value={cfg.social.facebook} onChange={(v) => set('social', 'facebook', v)} />
            <Field label="Pinterest" value={cfg.social.pinterest} onChange={(v) => set('social', 'pinterest', v)} />
          </div>
        </Card>

        <Card title="Get the app" enabled={cfg.app.enabled} onToggle={(v) => set('app', 'enabled', v)}>
          <Field label="Title" value={cfg.app.title} onChange={(v) => set('app', 'title', v)} />
          <Field label="Text" value={cfg.app.text} onChange={(v) => set('app', 'text', v)} />
          <label className="inline-flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
            <input type="checkbox" checked={cfg.app.showBadges} onChange={(e) => set('app', 'showBadges', e.target.checked)} className="w-4 h-4 accent-[#8B2E3A]" />
            Show the App Store / Google Play “coming soon” badges
          </label>
        </Card>

        <Card title="Numbers strip" hint="Use {categories} as the value to show the live number of categories." enabled={cfg.stats.enabled} onToggle={(v) => set('stats', 'enabled', v)}>
          <RowsEditor
            items={cfg.stats.items}
            onChange={(items) => set('stats', 'items', items)}
            fields={[['value', 'Value, e.g. 24/7'], ['label', 'Label']]}
            blank={{ value: '', label: '' }}
            max={6}
          />
        </Card>

        <Card title="Action cards (Discover / Shop & Track / Sell & Earn)" enabled={cfg.actions.enabled} onToggle={(v) => set('actions', 'enabled', v)}>
          <RowsEditor
            items={cfg.actions.items}
            onChange={(items) => set('actions', 'items', items)}
            icons={FOOTER_ICONS}
            fields={[['title', 'Title'], ['text', 'Text'], ['to', 'Link, e.g. /shop'], ['linkText', 'Link text']]}
            blank={{ icon: 'search', title: '', text: '', to: '/shop', linkText: 'Learn more →' }}
            max={4}
          />
        </Card>

        <Card title="Site directory" hint="Heading and link columns. The category directory is automatic: every category with its sub-categories." enabled={cfg.directory.enabled} onToggle={(v) => set('directory', 'enabled', v)}>
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Field label="Directory heading" value={cfg.directory.title} onChange={(v) => set('directory', 'title', v)} />
            <Field label="Sub-heading (desktop)" value={cfg.directory.subtitle} onChange={(v) => set('directory', 'subtitle', v)} />
          </div>
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <label className="inline-flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer mb-2">
              <input type="checkbox" checked={cfg.directory.categoriesEnabled} onChange={(e) => set('directory', 'categoriesEnabled', e.target.checked)} className="w-4 h-4 accent-[#8B2E3A]" />
              Show the automatic category directory
            </label>
            <Field label="Category directory heading" value={cfg.directory.categoriesTitle} onChange={(v) => set('directory', 'categoriesTitle', v)} />
          </div>

          <p className="text-[12px] font-medium text-slate-700 mb-2">Link columns</p>
          <div className="space-y-3">
            {cfg.directory.columns.map((col, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <input value={col.title || ''} onChange={(e) => setColumn(i, { title: e.target.value })} placeholder="Column title" className={`${inputCls} font-semibold`} />
                  <RowButtons i={i} count={cfg.directory.columns.length} onChange={(columns) => set('directory', 'columns', columns)} items={cfg.directory.columns} />
                </div>
                <RowsEditor
                  items={col.links || []}
                  onChange={(links) => setColumn(i, { links })}
                  fields={[['label', 'Link text'], ['to', 'Link, e.g. /about']]}
                  blank={{ label: '', to: '/' }}
                  max={12}
                  addLabel="Add link"
                />
              </div>
            ))}
          </div>
          {cfg.directory.columns.length < 5 && (
            <button type="button" onClick={() => set('directory', 'columns', [...cfg.directory.columns, { title: '', links: [{ label: '', to: '/' }] }])} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8B2E3A]">
              <Plus size={14} /> Add column
            </button>
          )}
        </Card>

        <Card
          title="Shipping regions"
          hint="Each region is a heading with a list of places, shown as small tags in the footer. Add as many regions as you like (e.g. India, International, Gulf)."
          enabled={cfg.shipping.enabled}
          onToggle={(v) => set('shipping', 'enabled', v)}
        >
          <div className="space-y-3">
            {cfg.shipping.regions.map((region, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={region.title || ''}
                    onChange={(e) => set('shipping', 'regions', cfg.shipping.regions.map((r, idx) => (idx === i ? { ...r, title: e.target.value } : r)))}
                    placeholder="Region heading, e.g. Ships across India"
                    className={`${inputCls} font-semibold`}
                  />
                  <RowButtons i={i} count={cfg.shipping.regions.length} onChange={(regions) => set('shipping', 'regions', regions)} items={cfg.shipping.regions} />
                </div>
                <TagListEditor
                  value={region.places || []}
                  onChange={(places) => set('shipping', 'regions', cfg.shipping.regions.map((r, idx) => (idx === i ? { ...r, places } : r)))}
                  placeholder="Add a city or country, press Enter"
                />
              </div>
            ))}
          </div>
          {cfg.shipping.regions.length < 6 && (
            <button type="button" onClick={() => set('shipping', 'regions', [...cfg.shipping.regions, { title: '', places: [] }])} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8B2E3A]">
              <Plus size={14} /> Add region
            </button>
          )}
        </Card>

        <Card
          title="Offices & stores (with map)"
          hint="Each office shows its address, optional phone / email / hours and a map. Add more offices or stores any time."
          enabled={cfg.offices.enabled}
          onToggle={(v) => set('offices', 'enabled', v)}
        >
          <div className="space-y-4">
            {cfg.offices.items.map((office, i) => {
              const upd = (patch) => set('offices', 'items', cfg.offices.items.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
              return (
                <div key={i} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <input value={office.title || ''} onChange={(e) => upd({ title: e.target.value })} placeholder="Name, e.g. Jaipurio Head Office" className={`${inputCls} font-semibold`} />
                    <RowButtons i={i} count={cfg.offices.items.length} onChange={(items) => set('offices', 'items', items)} items={cfg.offices.items} />
                  </div>
                  <Field label="Address" area value={office.address} onChange={(v) => upd({ address: v })} />
                  <div className="grid sm:grid-cols-3 gap-x-4">
                    <Field label="Phone (optional)" value={office.phone} onChange={(v) => upd({ phone: v })} placeholder="+91 98765 43210" />
                    <Field label="Email (optional)" value={office.email} onChange={(v) => upd({ email: v })} placeholder="care@jaipurio.in" />
                    <Field label="Opening hours (optional)" value={office.hours} onChange={(v) => upd({ hours: v })} placeholder="Mon–Sat, 10am–6pm" />
                  </div>

                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2.5">
                    <label className="inline-flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={office.showMap !== false} onChange={(e) => upd({ showMap: e.target.checked })} className="w-4 h-4 accent-[#8B2E3A]" />
                      Show a map
                    </label>
                    {office.showMap !== false && (
                      <>
                        <div className="flex flex-wrap gap-4">
                          <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                            <input type="radio" checked={office.mapMode !== 'embed'} onChange={() => upd({ mapMode: 'address' })} className="accent-[#8B2E3A]" />
                            Build the map from the address
                          </label>
                          <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                            <input type="radio" checked={office.mapMode === 'embed'} onChange={() => upd({ mapMode: 'embed' })} className="accent-[#8B2E3A]" />
                            Use a Google Maps embed link
                          </label>
                        </div>
                        {office.mapMode === 'embed' && (
                          <Field
                            label="Embed link"
                            value={office.mapEmbedUrl}
                            onChange={(v) => upd({ mapEmbedUrl: v })}
                            placeholder="https://www.google.com/maps/embed?pb=…"
                            hint="In Google Maps: Share → Embed a map → copy only the address from src=&quot;…&quot;. Only Google Maps / OpenStreetMap links are accepted; anything else falls back to the address."
                          />
                        )}
                      </>
                    )}
                    <Field
                      label="“Open in Maps” link (optional)"
                      value={office.mapLink}
                      onChange={(v) => upd({ mapLink: v })}
                      placeholder="Leave empty to search the address in Google Maps"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {cfg.offices.items.length < 6 && (
            <button type="button" onClick={() => set('offices', 'items', [...cfg.offices.items, { ...BLANK_OFFICE }])} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8B2E3A]">
              <Plus size={14} /> Add office
            </button>
          )}
        </Card>

        <Card title="Copyright line">
          <Field label="Text" value={cfg.copyright} onChange={(v) => set('copyright', null, v)} />
        </Card>
      </div>
    </div>
  );
};

export default AdminFooterSettings;
