import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Image as ImageIcon, Lock, Plus, RotateCcw, Save, Trash2, Upload } from 'lucide-react';
import api from '../../utils/api';
import MediaGalleryModal from './ecommerce/MediaGalleryModal';
import { useCategoryTree } from '../../utils/useCategoryTree';
import { useHomeSections } from '../../utils/useHomeSections';
import { CityPageView } from '../user/CityPage';
import { getSiteOrigin } from '../../utils/siteUrl';

const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#8B2E3A]';
const MIN_WORDS = 700;

const countWords = (html = '') => String(html).replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
const slugify = (s = '') =>
  String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const EMPTY = {
  city: '', country: '', slug: '', zoneKey: '', categories: [], occasions: [], featureNote: '', featureImage: '',
  mainContent: '', localProof: [{ label: '', detail: '' }], faqs: [], customsNote: '', relatedBlogs: [], indexable: true,
};

const Card = ({ n, title, hint, children }) => (
  <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
    <h3 className="text-[14px] font-semibold text-slate-800">
      {n}. {title}
    </h3>
    {hint && <p className="text-[11.5px] text-slate-500 mt-0.5 mb-3">{hint}</p>}
    {children}
  </section>
);

const Chip = ({ on, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full border text-[12px] transition-colors ${on ? 'bg-[#8B2E3A] border-[#8B2E3A] text-white' : 'bg-white border-slate-300 text-slate-700 hover:border-[#8B2E3A]/50'}`}
  >
    {children}
  </button>
);

const StatusPill = ({ status }) => (
  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${status === 'Published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
    {status}
  </span>
);

/** Appearance → City Pages: list. */
export const AdminCityPagesList = () => {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/city-pages').then((r) => setRows(r.data?.data || [])).catch((e) => {
      setRows([]);
      setError(e.parsedMessage || e.message || 'Could not load city pages');
    });
  }, []);
  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">City Pages</h1>
          <p className="text-[13px] text-slate-500">Landing pages like “Shop Rajasthani handicrafts in London” at /shop/&lt;city&gt;.</p>
        </div>
        <Link to="/admin/city-pages/new" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#8B2E3A] hover:bg-[#6F241D] text-white text-[13px] font-semibold">
          <Plus size={14} /> New city page
        </Link>
      </div>
      {error && <p className="mb-3 text-[13px] text-red-600">{error}</p>}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {rows === null ? (
          <p className="p-4 text-sm text-slate-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500 text-center">No city pages yet. Create the first one — e.g. London or Dubai.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-2.5 font-medium">City</th>
                <th className="px-4 py-2.5 font-medium hidden sm:table-cell">Address</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">Ready to publish</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <Link to={`/admin/city-pages/${r._id}`} className="font-semibold text-[#8B2E3A] hover:underline">{r.city}</Link>
                    <span className="block text-[11px] text-slate-500">{r.country}</span>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell text-slate-600">/shop/{r.slug}</td>
                  <td className="px-4 py-2.5"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-2.5 hidden md:table-cell text-[12px] text-slate-600">
                    {r.publishBar?.ok ? <span className="text-emerald-700">Yes</span> : `Needs ${r.publishBar?.missing?.join(' and ')}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

/** Appearance → City Pages → editor (cards on the left, live customer-side preview on the right). */
export const AdminCityPageEdit = () => {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { categories } = useCategoryTree();
  const occasionTiles = useHomeSections().sections.occasion?.items || [];

  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState('Draft');
  const [zones, setZones] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState('edit');
  const slugTouched = useRef(!isNew);

  useEffect(() => {
    api.get('/city-pages/zones').then((r) => setZones(r.data?.data || [])).catch(() => {});
    api.get('/blogs', { params: { limit: 50 } }).then((r) => setBlogs(r.data?.data?.blogs || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) return;
    api
      .get(`/city-pages/${id}`)
      .then((r) => {
        const d = r.data?.data || {};
        setForm({ ...EMPTY, ...d, localProof: d.localProof?.length ? d.localProof : EMPTY.localProof });
        setStatus(d.status || 'Draft');
      })
      .catch(() => setNotice({ type: 'error', text: 'Could not load this page.' }))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const toggle = (key, value) => set({ [key]: form[key].includes(value) ? form[key].filter((v) => v !== value) : [...form[key], value] });

  // Country → suggested shipping zone (only while no zone is chosen yet)
  const onCountry = (country) => {
    set({ country });
    if (form.zoneKey || !country.trim()) return;
    api.get('/city-pages/zone-for-country', { params: { country } }).then((r) => {
      const z = r.data?.data?.zoneKey;
      if (z) setForm((prev) => (prev.zoneKey ? prev : { ...prev, zoneKey: z }));
    }).catch(() => {});
  };

  // Live preview: generated content for the current (unsaved) form, debounced
  const previewKey = JSON.stringify(form);
  useEffect(() => {
    if (!form.zoneKey || !form.city.trim()) {
      setPreview(null);
      return undefined;
    }
    const t = setTimeout(() => {
      api.post('/city-pages/preview', form).then((r) => setPreview(r.data?.data || null)).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey]);

  const words = countWords(form.mainContent);
  const proofCount = form.localProof.filter((f) => f.label.trim() && f.detail.trim()).length;
  const missing = [];
  if (words < MIN_WORDS) missing.push(`${MIN_WORDS - words} more words of main content`);
  if (proofCount < 1) missing.push('at least 1 local proof fact');
  const canPublish = missing.length === 0;
  const zone = zones.find((z) => z.key === form.zoneKey);

  const categoryChoices = useMemo(() => categories.filter((c) => c.level <= 2 && c.count > 0), [categories]);
  const occasionChoices = occasionTiles.map((o) => o.label).filter(Boolean);
  const generatedFaqs = preview?.generated?.faqs || [];

  const save = async (nextStatus) => {
    setSaving(true);
    setNotice(null);
    try {
      let saved;
      if (isNew) {
        saved = (await api.post('/city-pages', form)).data?.data;
      } else {
        saved = (await api.put(`/city-pages/${id}`, form)).data?.data;
      }
      if (nextStatus === 'Published') saved = (await api.post(`/city-pages/${saved._id}/publish`)).data?.data;
      if (nextStatus === 'Draft' && status === 'Published') saved = (await api.post(`/city-pages/${saved._id}/unpublish`)).data?.data;
      setStatus(saved.status);
      setNotice({
        type: 'success',
        text: saved.status === 'Published' ? `Published — live at /shop/${saved.slug}` : 'Saved as draft.',
      });
      if (isNew) navigate(`/admin/city-pages/${saved._id}`, { replace: true });
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.message || err.parsedMessage || err.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete the ${form.city} page? Its address /shop/${form.slug} will stop working.`)) return;
    try {
      await api.delete(`/city-pages/${id}`);
      navigate('/admin/city-pages');
    } catch (err) {
      setNotice({ type: 'error', text: err.parsedMessage || err.message || 'Delete failed.' });
    }
  };

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading…</div>;

  const editor = (
    <div className="space-y-4">
      <Card n={1} title="Basic details" hint="Transit time, customs, currency and return window all come from the shipping zone — never typed per city.">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-[12px] font-medium text-slate-700 mb-1">City</span>
            <input
              value={form.city}
              onChange={(e) => {
                const city = e.target.value;
                set(slugTouched.current ? { city } : { city, slug: slugify(city) });
              }}
              placeholder="e.g. London"
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="block text-[12px] font-medium text-slate-700 mb-1">Country</span>
            <input value={form.country} onChange={(e) => onCountry(e.target.value)} placeholder="e.g. United Kingdom" className={inputCls} />
          </label>
          <label className="block">
            <span className="block text-[12px] font-medium text-slate-700 mb-1">Shipping zone</span>
            <select value={form.zoneKey} onChange={(e) => set({ zoneKey: e.target.value })} className={inputCls}>
              <option value="">Choose a zone…</option>
              {zones.map((z) => (
                <option key={z.key} value={z.key}>{z.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-[12px] font-medium text-slate-700 mb-1">Page address</span>
            <div className="flex items-center">
              <span className="text-[12px] text-slate-500 pr-1">/shop/</span>
              <input
                value={form.slug}
                onChange={(e) => {
                  slugTouched.current = true;
                  set({ slug: slugify(e.target.value) });
                }}
                className={inputCls}
              />
            </div>
          </label>
        </div>
        {zone && (
          <p className="mt-3 text-[11.5px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            {zone.transitDaysMin}–{zone.transitDaysMax} working days · {zone.currency} · {zone.returnWindowDays}-day returns · {zone.customsNote}
          </p>
        )}
      </Card>

      <Card n={2} title="Categories to feature" hint="Each selected category gets its own product grid. Pick only categories you can genuinely ship to this city.">
        <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto">
          {categoryChoices.map((c) => (
            <Chip key={c.id} on={form.categories.includes(c.name)} onClick={() => toggle('categories', c.name)}>
              {c.name} <span className="opacity-60">{c.count}</span>
            </Chip>
          ))}
        </div>
      </Card>

      <Card n={3} title="Occasions to feature" hint="From Home Page → Shop by occasion. Each links to that tile's category.">
        <div className="flex flex-wrap gap-1.5">
          {occasionChoices.length ? (
            occasionChoices.map((o) => (
              <Chip key={o} on={form.occasions.includes(o)} onClick={() => toggle('occasions', o)}>{o}</Chip>
            ))
          ) : (
            <p className="text-[12px] text-slate-500">No occasion tiles set up yet (Appearance → Home Page → Shop by occasion).</p>
          )}
        </div>
      </Card>

      <Card n={4} title="City feature note (real, 2–3 sentences)" hint="About THIS city specifically — not a line that would fit any city.">
        <textarea
          rows={3}
          value={form.featureNote}
          onChange={(e) => set({ featureNote: e.target.value })}
          placeholder="e.g. London's Indian-heritage households and interior stylists have long sourced marble idols and brass décor for home temples and festive gifting."
          className={inputCls}
        />
        <div className="flex items-center gap-2 mt-2">
          <span className="w-14 h-10 rounded border border-slate-200 bg-slate-50 overflow-hidden shrink-0">
            {form.featureImage && <img src={form.featureImage} alt="" className="w-full h-full object-cover" />}
          </span>
          <input value={form.featureImage} onChange={(e) => set({ featureImage: e.target.value })} placeholder="Image (optional)" className={inputCls} />
          <button type="button" onClick={() => setMediaOpen(true)} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 text-[12px] shrink-0">
            <ImageIcon size={13} /> Choose
          </button>
        </div>
      </Card>

      <Card n={5} title={`Main content (${MIN_WORDS}+ words required to publish)`} hint="Real, city-specific buying information: benefits, materials, ordering, delivery. Blank line = new paragraph; simple HTML (<h3>, <p>, <ul>) also works.">
        <textarea rows={12} value={form.mainContent} onChange={(e) => set({ mainContent: e.target.value })} className={`${inputCls} font-mono text-[12.5px]`} />
        <p className={`text-[11.5px] mt-1 font-medium ${words >= MIN_WORDS ? 'text-emerald-700' : 'text-red-600'}`}>
          {words} words — {words >= MIN_WORDS ? 'meets the minimum' : `need ${MIN_WORDS - words} more`}
        </p>
      </Card>

      <Card n={6} title="Local proof facts (at least 1 — real only)" hint="Genuine, verifiable claims. Never an invented office, review or customer.">
        <div className="space-y-2">
          {form.localProof.map((f, i) => (
            <div key={i} className="flex flex-wrap sm:flex-nowrap gap-2">
              <input
                value={f.label}
                onChange={(e) => set({ localProof: form.localProof.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
                placeholder="Label (e.g. United Kingdom)"
                className={`${inputCls} sm:w-44`}
              />
              <input
                value={f.detail}
                onChange={(e) => set({ localProof: form.localProof.map((x, j) => (j === i ? { ...x, detail: e.target.value } : x)) })}
                placeholder="Real, verifiable detail"
                className={inputCls}
              />
              <button type="button" onClick={() => set({ localProof: form.localProof.filter((_, j) => j !== i) })} className="p-2 text-slate-400 hover:text-red-600" aria-label="Remove">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => set({ localProof: [...form.localProof, { label: '', detail: '' }] })} className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8B2E3A]">
          <Plus size={14} /> Add fact
        </button>
      </Card>

      <Card n={7} title="FAQs" hint="Drafted automatically from the shipping zone. Edit them only if you need different wording.">
        {form.faqs.length === 0 ? (
          <>
            <ul className="space-y-1.5 text-[12px] text-slate-600">
              {generatedFaqs.map((f) => (
                <li key={f.question}><span className="font-semibold text-slate-800">{f.question}</span> — {f.answer}</li>
              ))}
            </ul>
            {generatedFaqs.length > 0 && (
              <button type="button" onClick={() => set({ faqs: generatedFaqs })} className="mt-2 text-[13px] font-semibold text-[#8B2E3A]">Edit these FAQs</button>
            )}
          </>
        ) : (
          <>
            <div className="space-y-2">
              {form.faqs.map((f, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-2 space-y-1.5">
                  <div className="flex gap-2">
                    <input value={f.question} onChange={(e) => set({ faqs: form.faqs.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)) })} className={inputCls} />
                    <button type="button" onClick={() => set({ faqs: form.faqs.filter((_, j) => j !== i) })} className="p-2 text-slate-400 hover:text-red-600" aria-label="Remove"><Trash2 size={14} /></button>
                  </div>
                  <textarea rows={2} value={f.answer} onChange={(e) => set({ faqs: form.faqs.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)) })} className={inputCls} />
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-2">
              <button type="button" onClick={() => set({ faqs: [...form.faqs, { question: '', answer: '' }] })} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#8B2E3A]"><Plus size={14} /> Add FAQ</button>
              <button type="button" onClick={() => set({ faqs: [] })} className="inline-flex items-center gap-1 text-[13px] text-slate-600"><RotateCcw size={13} /> Back to automatic</button>
            </div>
          </>
        )}
        <label className="block mt-3">
          <span className="block text-[12px] font-medium text-slate-700 mb-1">Customs note for this city (optional)</span>
          <textarea rows={2} value={form.customsNote} onChange={(e) => set({ customsNote: e.target.value })} placeholder={zone?.customsNote || ''} className={inputCls} />
        </label>
      </Card>

      <Card n={8} title="Relevant reading" hint="Pick up to 3 journal posts. Leave empty to show the latest posts.">
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
          {blogs.map((b) => (
            <Chip
              key={b.slug}
              on={form.relatedBlogs.includes(b.slug)}
              onClick={() => (form.relatedBlogs.includes(b.slug) || form.relatedBlogs.length < 3) && toggle('relatedBlogs', b.slug)}
            >
              {b.title}
            </Chip>
          ))}
        </div>
        <label className="flex items-center gap-2 mt-3 text-[13px] text-slate-700">
          <input type="checkbox" checked={form.indexable} onChange={(e) => set({ indexable: e.target.checked })} className="w-4 h-4 accent-[#8B2E3A]" />
          Let search engines index this page (and list it in the sitemap)
        </label>
      </Card>
    </div>
  );

  return (
    <div className="p-3 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Link to="/admin/city-pages" className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Back"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{isNew ? 'New city page' : `${form.city || 'City'} page`}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusPill status={status} />
              {status === 'Published' && (
                <a href={`${getSiteOrigin()}/shop/${form.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] text-[#8B2E3A] font-semibold">
                  <Eye size={13} /> View live
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isNew && (
            <button type="button" onClick={remove} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-[13px] text-red-600 hover:bg-red-50">
              <Trash2 size={14} /> Delete
            </button>
          )}
          <button type="button" onClick={() => save('Draft')} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-[13px] text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            <Save size={14} /> {status === 'Published' ? 'Unpublish & save draft' : 'Save draft'}
          </button>
          <button
            type="button"
            onClick={() => save('Published')}
            disabled={saving || !canPublish}
            title={canPublish ? '' : `Still needed: ${missing.join(' and ')}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-[13px] font-semibold"
          >
            {canPublish ? <Upload size={14} /> : <Lock size={14} />} {status === 'Published' ? 'Save & keep published' : 'Publish'}
          </button>
        </div>
      </div>

      <div className={`mb-4 rounded-lg px-4 py-2.5 text-[13px] border ${canPublish ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
        {canPublish
          ? 'Ready to publish: main content and local proof both meet the minimum bar.'
          : `Publishing is locked until there is real content — still needed: ${missing.join(' and ')}. Pages that only swap the city name look like doorway pages to Google.`}
      </div>
      {notice && (
        <div className={`mb-4 rounded-lg px-4 py-2.5 text-[13px] border ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{notice.text}</div>
      )}

      <div className="flex lg:hidden mb-3 rounded-lg border border-slate-200 overflow-hidden text-[13px] font-semibold">
        {['edit', 'preview'].map((t) => (
          <button key={t} type="button" onClick={() => setMobileTab(t)} className={`flex-1 py-2 ${mobileTab === t ? 'bg-[#8B2E3A] text-white' : 'bg-white text-slate-700'}`}>
            {t === 'edit' ? 'Edit' : 'Preview'}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[minmax(380px,460px)_1fr] gap-5 items-start">
        <div className={mobileTab === 'edit' ? '' : 'hidden lg:block'}>{editor}</div>
        <div className={`${mobileTab === 'preview' ? '' : 'hidden lg:block'} lg:sticky lg:top-4`}>
          <p className="text-[12px] font-semibold text-slate-600 mb-2">Live customer-side preview</p>
          <div className="border border-slate-200 rounded-xl overflow-y-auto bg-white lg:max-h-[calc(100vh-120px)]">
            {preview ? (
              <CityPageView page={preview} preview />
            ) : (
              <p className="p-6 text-[13px] text-slate-500">Fill in the city and shipping zone to see the page.</p>
            )}
          </div>
        </div>
      </div>

      <MediaGalleryModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onInsert={(asset) => {
          if (asset?.url) set({ featureImage: asset.url });
          setMediaOpen(false);
        }}
      />
    </div>
  );
};

export default AdminCityPagesList;
