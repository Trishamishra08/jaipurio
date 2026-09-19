import React, { useMemo, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';

const emptySeo = () => ({
  general: {
    slug: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    robots: 'index,follow',
    canonicalUrl: '',
  },
  social: {
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
  },
  advanced: {
    schemaMarkup: '',
    customHead: '',
    noIndex: false,
    noFollow: false,
  },
});

export const normalizeSeoState = (seo, fallback = {}) => {
  const base = emptySeo();
  const incoming = seo && typeof seo === 'object' ? seo : {};
  return {
    general: {
      ...base.general,
      ...(incoming.general || {}),
      slug: incoming.general?.slug || fallback.slug || '',
      metaTitle: incoming.general?.metaTitle || fallback.seoTitle || '',
      metaDescription: incoming.general?.metaDescription || fallback.seoDescription || '',
    },
    social: { ...base.social, ...(incoming.social || {}) },
    advanced: { ...base.advanced, ...(incoming.advanced || {}) },
  };
};

const inputClass =
  'w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs text-slate-800 bg-white focus:outline-hidden focus:border-blue-500';

/**
 * Botble-style SEO editor: General / Social / Advanced.
 * Used on product edit — keeps existing page chrome, only replaces SEO card body.
 */
export default function SeoEditorPanel({
  value,
  onChange,
  previewTitle,
  previewUrl,
  onGenerateSlug,
}) {
  const [tab, setTab] = useState('general');
  const seo = useMemo(() => normalizeSeoState(value), [value]);

  const setGeneral = (patch) => onChange({ ...seo, general: { ...seo.general, ...patch } });
  const setSocial = (patch) => onChange({ ...seo, social: { ...seo.social, ...patch } });
  const setAdvanced = (patch) => onChange({ ...seo, advanced: { ...seo.advanced, ...patch } });

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'social', label: 'Social' },
    { id: 'advanced', label: 'Advanced' },
  ];

  const metaTitleLen = (seo.general.metaTitle || '').length;
  const metaDescLen = (seo.general.metaDescription || '').length;

  return (
    <div className="space-y-3">
      <div className="flex gap-1 p-0.5 bg-slate-100 rounded-md w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition ${
              tab === t.id
                ? 'bg-white text-slate-800 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Slug</label>
            <div className="flex gap-1.5">
              <input
                value={seo.general.slug}
                onChange={(e) => setGeneral({ slug: e.target.value })}
                placeholder="auto-generated-slug"
                className={inputClass}
              />
              <button
                type="button"
                title="Generate from name"
                onClick={() => onGenerateSlug?.()}
                className="shrink-0 px-2 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50"
              >
                <FiRefreshCw size={13} />
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-700">Meta title</label>
              <span className={`text-[10px] ${metaTitleLen > 60 ? 'text-amber-600' : 'text-slate-400'}`}>
                {metaTitleLen} / 60
              </span>
            </div>
            <input
              value={seo.general.metaTitle}
              onChange={(e) => setGeneral({ metaTitle: e.target.value })}
              placeholder="Title shown in search results"
              className={inputClass}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-700">Meta description</label>
              <span className={`text-[10px] ${metaDescLen > 160 ? 'text-amber-600' : 'text-slate-400'}`}>
                {metaDescLen} / 160
              </span>
            </div>
            <textarea
              rows={3}
              value={seo.general.metaDescription}
              onChange={(e) => setGeneral({ metaDescription: e.target.value })}
              placeholder="Summary shown under the title in search results"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Meta keywords</label>
            <input
              value={seo.general.metaKeywords}
              onChange={(e) => setGeneral({ metaKeywords: e.target.value })}
              placeholder="comma, separated, keywords"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Robots</label>
            <select
              value={seo.general.robots}
              onChange={(e) => setGeneral({ robots: e.target.value })}
              className={inputClass}
            >
              <option value="index,follow">index, follow</option>
              <option value="noindex,follow">noindex, follow</option>
              <option value="index,nofollow">index, nofollow</option>
              <option value="noindex,nofollow">noindex, nofollow</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Canonical URL</label>
            <input
              value={seo.general.canonicalUrl}
              onChange={(e) => setGeneral({ canonicalUrl: e.target.value })}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1">
            <div className="text-sm font-semibold text-blue-800">
              {seo.general.metaTitle || previewTitle || 'Meta title preview'}
            </div>
            <div className="text-emerald-700 text-xs font-mono break-all">
              {seo.general.canonicalUrl || previewUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/products/...`}
            </div>
            <div className="text-xs text-slate-600 leading-relaxed">
              {seo.general.metaDescription || 'Meta description preview appears here.'}
            </div>
          </div>
        </div>
      )}

      {tab === 'social' && (
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Open Graph title</label>
            <input
              value={seo.social.ogTitle}
              onChange={(e) => setSocial({ ogTitle: e.target.value })}
              placeholder="Title when shared on Facebook / LinkedIn"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Open Graph description</label>
            <textarea
              rows={2}
              value={seo.social.ogDescription}
              onChange={(e) => setSocial({ ogDescription: e.target.value })}
              placeholder="Description for social shares"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Open Graph image URL</label>
            <input
              value={seo.social.ogImage}
              onChange={(e) => setSocial({ ogImage: e.target.value })}
              placeholder="https://.../image.jpg"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Twitter title</label>
            <input
              value={seo.social.twitterTitle}
              onChange={(e) => setSocial({ twitterTitle: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Twitter description</label>
            <textarea
              rows={2}
              value={seo.social.twitterDescription}
              onChange={(e) => setSocial({ twitterDescription: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Twitter image URL</label>
            <input
              value={seo.social.twitterImage}
              onChange={(e) => setSocial({ twitterImage: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {tab === 'advanced' && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(seo.advanced.noIndex)}
              onChange={(e) => setAdvanced({ noIndex: e.target.checked })}
            />
            Noindex (hide from search engines)
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(seo.advanced.noFollow)}
              onChange={(e) => setAdvanced({ noFollow: e.target.checked })}
            />
            Nofollow (do not follow links)
          </label>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">JSON-LD / Schema markup</label>
            <textarea
              rows={4}
              value={seo.advanced.schemaMarkup}
              onChange={(e) => setAdvanced({ schemaMarkup: e.target.value })}
              placeholder='{"@context":"https://schema.org","@type":"Product",...}'
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Custom head HTML</label>
            <textarea
              rows={3}
              value={seo.advanced.customHead}
              onChange={(e) => setAdvanced({ customHead: e.target.value })}
              placeholder="<meta name=&quot;...&quot; content=&quot;...&quot; />"
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
