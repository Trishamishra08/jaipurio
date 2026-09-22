import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FiCheck,
  FiExternalLink,
  FiImage,
  FiInfo,
  FiLogOut,
  FiPlus,
  FiRefreshCw,
  FiRotateCcw,
  FiSave,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import EcommerceLayout from './ecommerce/EcommerceLayout';
import AdminCkEditor from './ecommerce/AdminCkEditor';
import SeoEditorPanel, { normalizeSeoState } from './ecommerce/SeoEditorPanel';
import MediaGalleryModal from './ecommerce/MediaGalleryModal';
import MediaUrlInsertModal from './ecommerce/MediaUrlInsertModal';
import { getSiteOrigin } from '../../utils/siteUrl';
import {
  pagesCreate,
  pagesGet,
  pagesRevisions,
  pagesRestoreRevision,
  pagesDeleteRevision,
  pagesUpdate,
  slugifyPage,
} from '../../utils/pagesApi';

const LIST_PATH = '/admin/pages';
const isMongoId = (value) => /^[a-f0-9]{24}$/i.test(String(value || ''));
const TEMPLATES = ['Default', 'Homepage', 'Full Width', 'Coming Soon'];
const LANGUAGES = [
  { code: 'fr_FR', label: 'Français', flag: '🇫🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh_CN', label: '中文 (中国)', flag: '🇨🇳' },
  { code: 'de_CH_informal', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it_IT', label: 'Italiano', flag: '🇮🇹' },
];

const formatSeoDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const formatHistoryDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).replace('T', ' ').slice(0, 19);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const previewText = (value, max = 180) => {
  const text = String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '—';
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

export const AdminPageEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'create';

  const [tab, setTab] = useState('detail');
  const [mongoId, setMongoId] = useState(isMongoId(id) ? id : null);
  const [name, setName] = useState('');
  const [permalink, setPermalink] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('Published');
  const [template, setTemplate] = useState('Default');
  const [image, setImage] = useState('');
  const [faqs, setFaqs] = useState([]);
  const [seo, setSeo] = useState(() => normalizeSeoState({}));
  const [seoOpen, setSeoOpen] = useState(false);
  const [createdAt, setCreatedAt] = useState('');
  const [selectedLangs, setSelectedLangs] = useState({});
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState('page'); // 'page' | 'seo'
  const [urlOpen, setUrlOpen] = useState(false);
  const [revisions, setRevisions] = useState([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const [revisionError, setRevisionError] = useState('');

  const openMediaPicker = (target = 'page') => {
    setMediaTarget(target);
    setMediaOpen(true);
  };

  const buildSeoFromPage = () => {
    const metaTitle = (seo.general?.metaTitle || (name ? `${name} | Jaipurio` : '')).slice(0, 70);
    const metaDescription = String(seo.general?.metaDescription || description || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 320);
    const slug = permalink || slugifyPage(name);
    return normalizeSeoState({
      general: {
        slug,
        metaTitle,
        metaDescription,
        metaKeywords: seo.general?.metaKeywords || '',
        robots: seo.general?.robots || 'index,follow',
        canonicalUrl: seo.general?.canonicalUrl || '',
      },
      social: {
        ogTitle: seo.social?.ogTitle || metaTitle,
        ogDescription: seo.social?.ogDescription || metaDescription,
        ogImage: seo.social?.ogImage || image || '',
        twitterTitle: seo.social?.twitterTitle || metaTitle,
        twitterDescription: seo.social?.twitterDescription || metaDescription,
        twitterImage: seo.social?.twitterImage || seo.social?.ogImage || image || '',
      },
      advanced: {
        schemaMarkup: seo.advanced?.schemaMarkup || '',
        customHead: seo.advanced?.customHead || '',
        noIndex: Boolean(seo.advanced?.noIndex),
        noFollow: Boolean(seo.advanced?.noFollow),
      },
    });
  };

  const applyPageRow = (row) => {
    if (!row) return;
    setMongoId(row._id || row.id);
    setName(row.name || '');
    setPermalink(row.slug || '');
    setDescription(row.description || '');
    setContent(row.content || '');
    setStatus(row.status || 'Published');
    setTemplate(row.template || 'Default');
    setImage(row.image || '');
    setFaqs(Array.isArray(row.faqs) ? row.faqs : []);
    setCreatedAt(row.createdAt || '');
    setSeo(
      normalizeSeoState(row.seo, {
        slug: row.slug,
        seoTitle: row.seoTitle,
        seoDescription: row.seoDescription,
      })
    );
  };

  const loadRevisions = async (pageId) => {
    if (!pageId || !isMongoId(pageId)) {
      setRevisions([]);
      return;
    }
    setRevisionsLoading(true);
    setRevisionError('');
    try {
      const list = await pagesRevisions(pageId);
      setRevisions(Array.isArray(list) ? list : []);
    } catch (err) {
      setRevisions([]);
      setRevisionError(err?.parsedMessage || err?.message || 'Failed to load revisions');
    } finally {
      setRevisionsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (isCreate) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const row = await pagesGet(id);
        if (cancelled || !row) return;
        applyPageRow(row);
        await loadRevisions(row._id || row.id);
      } catch (err) {
        if (!cancelled) setSaveError(err?.parsedMessage || err?.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  useEffect(() => {
    if (tab === 'revisions' && mongoId) {
      loadRevisions(mongoId);
    }
  }, [tab, mongoId]);

  const origin = getSiteOrigin();
  const previewUrl = `${origin}/${permalink || 'slug'}`;
  const displaySeoTitle = seo.general?.metaTitle || name || 'Page';
  const displaySeoDescription =
    seo.general?.metaDescription ||
    description ||
    (name ? `${name} — Jaipurio` : 'Page on Jaipurio');
  const pageTitle = isCreate ? 'Create' : `Edit "${name || 'Page'}"`;

  const handleSave = async (exit = false) => {
    if (!name.trim()) {
      setSaveError('Name is required');
      return;
    }
    setSaving(true);
    setSaveError('');
    const nextSlug = permalink.trim() || slugifyPage(name);
    const nextSeo = {
      ...seo,
      general: { ...seo.general, slug: nextSlug },
    };
    const payload = {
      name: name.trim(),
      slug: nextSlug,
      description,
      content,
      status,
      template,
      image,
      faqs: faqs.filter((f) => f.question?.trim() || f.answer?.trim()),
      seo: nextSeo,
      seoTitle: nextSeo.general?.metaTitle || '',
      seoDescription: nextSeo.general?.metaDescription || '',
    };
    try {
      let savedId = mongoId;
      let savedRow = null;
      if (mongoId) {
        savedRow = await pagesUpdate(mongoId, payload);
      } else {
        const created = await pagesCreate(payload);
        savedRow = created;
        savedId = created?._id || created?.id || null;
        if (savedId) setMongoId(savedId);
        if (exit) {
          navigate(LIST_PATH);
          return;
        }
        if (savedId) {
          navigate(`${LIST_PATH}/edit/${savedId}`);
          return;
        }
      }
      if (savedRow) applyPageRow(savedRow);
      else setPermalink(nextSlug);
      if (savedId) await loadRevisions(savedId);
      setSavedToast(true);
      window.setTimeout(() => setSavedToast(false), 1800);
      if (exit) navigate(LIST_PATH);
    } catch (err) {
      setSaveError(err?.parsedMessage || err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <EcommerceLayout breadcrumb={['PAGES', pageTitle.toUpperCase()]}>
      {savedToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2">
          <FiCheck size={16} />
          <span>Page saved successfully!</span>
        </div>
      )}
      {saveError ? <div className="mb-3 text-xs text-rose-600 font-medium">{saveError}</div> : null}

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading…</div>
      ) : (
        <>
          <div className="bg-[#EBF5FB] border border-[#D4E6F1] text-[#2471A3] rounded-md p-3 mb-5 flex items-center gap-2.5 text-xs">
            <FiInfo size={16} className="text-[#2980B9] shrink-0" />
            <span>
              You are editing <strong className="font-bold">&quot;English&quot;</strong> version
            </span>
          </div>

          <div className="flex items-center gap-1 mb-4 border-b border-slate-200">
            {[
              { id: 'detail', label: 'Detail' },
              { id: 'revisions', label: 'Revision History' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition ${
                  tab === t.id
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8 space-y-5">
              {tab === 'revisions' ? (
                <div className="bg-white border border-slate-200 rounded-md shadow-2xs overflow-hidden">
                  {isCreate || !mongoId ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                      Save the page first to start tracking revision history.
                    </div>
                  ) : revisionsLoading ? (
                    <div className="p-8 text-center text-sm text-slate-500">Loading revisions…</div>
                  ) : revisionError ? (
                    <div className="p-4 text-xs text-rose-600">{revisionError}</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Author</th>
                            <th className="px-4 py-3 font-semibold">Column</th>
                            <th className="px-4 py-3 font-semibold">Origin</th>
                            <th className="px-4 py-3 font-semibold">After Changes</th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">Created At</th>
                            <th className="px-4 py-3 font-semibold text-right">Operations</th>
                          </tr>
                        </thead>
                        <tbody>
                          {revisions.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                                No record
                              </td>
                            </tr>
                          ) : (
                            revisions.map((rev, idx) => {
                              const showOps =
                                Boolean(rev.revisionId) &&
                                revisions.findIndex((r) => r.revisionId === rev.revisionId) === idx;
                              return (
                                <tr
                                  key={rev.id || `${rev.revisionId}-${rev.column}-${idx}`}
                                  className="border-b border-slate-100 hover:bg-slate-50/80 align-top"
                                >
                                  <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                                    {rev.author || 'Admin'}
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                                    {rev.column || '—'}
                                  </td>
                                  <td className="px-4 py-3 text-slate-600 max-w-[220px]">
                                    <div
                                      className="whitespace-pre-wrap break-words"
                                      title={rev.origin || ''}
                                    >
                                      {previewText(rev.origin)}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-slate-800 max-w-[220px]">
                                    <div
                                      className="whitespace-pre-wrap break-words"
                                      title={rev.after || ''}
                                    >
                                      {previewText(rev.after)}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                    {formatHistoryDate(rev.createdAt)}
                                  </td>
                                  <td className="px-4 py-3">
                                    {showOps ? (
                                      <div className="flex items-center justify-end gap-3">
                                        <button
                                          type="button"
                                          className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                                          onClick={async () => {
                                            if (
                                              !window.confirm(
                                                'Restore this revision? Current content will be saved as a new revision first.'
                                              )
                                            ) {
                                              return;
                                            }
                                            try {
                                              const restored = await pagesRestoreRevision(
                                                mongoId,
                                                rev.revisionId
                                              );
                                              applyPageRow(restored);
                                              await loadRevisions(mongoId);
                                              setTab('detail');
                                              setSavedToast(true);
                                              window.setTimeout(() => setSavedToast(false), 1800);
                                            } catch (err) {
                                              window.alert(
                                                err?.parsedMessage ||
                                                  err?.message ||
                                                  'Restore failed'
                                              );
                                            }
                                          }}
                                        >
                                          <FiRotateCcw size={12} />
                                          Restore
                                        </button>
                                        <button
                                          type="button"
                                          className="inline-flex items-center gap-1 text-red-500 hover:underline font-medium"
                                          onClick={async () => {
                                            if (!window.confirm('Delete this revision?')) return;
                                            try {
                                              await pagesDeleteRevision(mongoId, rev.revisionId);
                                              await loadRevisions(mongoId);
                                            } catch (err) {
                                              window.alert(
                                                err?.parsedMessage ||
                                                  err?.message ||
                                                  'Delete failed'
                                              );
                                            }
                                          }}
                                        >
                                          <FiTrash2 size={12} />
                                          Delete
                                        </button>
                                      </div>
                                    ) : null}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Permalink <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-slate-500">{origin}/</span>
                      <input
                        type="text"
                        value={permalink}
                        onChange={(e) => setPermalink(e.target.value)}
                        className="flex-1 min-w-[160px] border border-slate-300 rounded-md py-1.5 px-2.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setPermalink(slugifyPage(name))}
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                      >
                        <FiRefreshCw size={12} />
                        Generate URL
                      </button>
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      Preview:{' '}
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {previewUrl}
                      </a>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs resize-y"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Content</label>
                    <AdminCkEditor value={content} onChange={setContent} />
                  </div>
                </div>
              )}

              <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-slate-800">
                  FAQ schema configuration (
                  <a
                    href="https://developers.google.com/search/docs/data-types/faqpage"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Learn more
                  </a>
                  )
                </h4>
                {faqs.map((faq, idx) => (
                  <div
                    key={`faq-${idx}`}
                    className="border border-slate-200 rounded-md p-3 space-y-2 relative"
                  >
                    <button
                      type="button"
                      onClick={() => setFaqs((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                      title="Remove"
                    >
                      <FiTrash2 size={14} />
                    </button>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Question
                      </label>
                      <input
                        type="text"
                        value={faq.question || ''}
                        onChange={(e) =>
                          setFaqs((prev) =>
                            prev.map((f, i) =>
                              i === idx ? { ...f, question: e.target.value } : f
                            )
                          )
                        }
                        className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Answer
                      </label>
                      <textarea
                        value={faq.answer || ''}
                        onChange={(e) =>
                          setFaqs((prev) =>
                            prev.map((f, i) =>
                              i === idx ? { ...f, answer: e.target.value } : f
                            )
                          )
                        }
                        rows={3}
                        className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs resize-y"
                      />
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setFaqs((prev) => [...prev, { question: '', answer: '' }])}
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                  >
                    <FiPlus size={13} />
                    Add new
                  </button>
                  <span className="text-slate-400">or</span>
                  <span className="text-slate-400">Select from existing FAQs</span>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 gap-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Search Engine Optimize
                  </h4>
                  <div className="flex items-center gap-2 shrink-0">
                    {seoOpen ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setSeo(buildSeoFromPage())}
                          className="text-xs text-white bg-blue-600 hover:bg-blue-700 font-semibold px-2.5 py-1 rounded-sm"
                        >
                          Create
                        </button>
                        <button
                          type="button"
                          onClick={() => setSeoOpen(false)}
                          className="text-xs text-blue-600 hover:underline font-semibold"
                        >
                          Hide SEO meta
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          if (mongoId && isMongoId(mongoId)) {
                            try {
                              const row = await pagesGet(mongoId);
                              if (row?.seo) {
                                setSeo(
                                  normalizeSeoState(row.seo, {
                                    slug: row.slug || permalink,
                                    seoTitle: row.seoTitle,
                                    seoDescription: row.seoDescription,
                                  })
                                );
                              }
                            } catch {
                              /* keep in-memory seo */
                            }
                          }
                          setSeoOpen(true);
                        }}
                        className="text-xs text-blue-600 hover:underline font-semibold"
                      >
                        Edit SEO meta
                      </button>
                    )}
                  </div>
                </div>

                {!seoOpen ? (
                  <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                    <h5 className="text-sm font-semibold text-blue-700 leading-snug">
                      {displaySeoTitle}
                    </h5>
                    <p className="text-[11px] text-emerald-700 mt-0.5 break-all">{previewUrl}</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      {createdAt ? `${formatSeoDate(createdAt)} - ` : ''}
                      {displaySeoDescription}
                    </p>
                  </div>
                ) : (
                  <SeoEditorPanel
                    value={seo}
                    onChange={(next) => {
                      setSeo(next);
                      if (next?.general?.slug != null && next.general.slug !== permalink) {
                        setPermalink(next.general.slug);
                      }
                    }}
                    previewTitle={displaySeoTitle}
                    previewUrl={previewUrl}
                    showSeoImage
                    onPickSeoImage={() => openMediaPicker('seo')}
                    onGenerateSlug={() => {
                      const s = slugifyPage(name);
                      setPermalink(s);
                      setSeo((prev) => ({
                        ...prev,
                        general: { ...prev.general, slug: s },
                      }));
                    }}
                  />
                )}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Publish
                </h4>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave(false)}
                  className="w-full flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-slate-900 text-white font-semibold py-2 px-3 rounded-md text-xs shadow-xs transition disabled:opacity-60"
                >
                  <FiSave size={14} />
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave(true)}
                  className="w-full flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold py-2 px-3 rounded-md text-xs transition disabled:opacity-60"
                >
                  <FiLogOut size={14} />
                  Save &amp; Exit
                </button>
              </div>

              <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Languages</h4>
                <div className="space-y-1.5">
                  {LANGUAGES.map((lang) => (
                    <div
                      key={lang.code}
                      className="flex items-center justify-between gap-2 text-xs text-slate-700"
                    >
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedLangs[lang.code])}
                          onChange={() =>
                            setSelectedLangs((prev) => ({
                              ...prev,
                              [lang.code]: !prev[lang.code],
                            }))
                          }
                        />
                        <span>
                          {lang.flag} {lang.label}
                        </span>
                      </label>
                      <Link
                        to={
                          mongoId
                            ? `${LIST_PATH}/edit/${mongoId}?ref_lang=${lang.code}`
                            : `${LIST_PATH}/create?ref_lang=${lang.code}`
                        }
                        className="text-slate-400 hover:text-blue-600"
                        title={`Edit ${lang.label}`}
                      >
                        <FiExternalLink size={13} />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Status<span className="text-red-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs bg-white"
                >
                  <option>Published</option>
                  <option>Draft</option>
                  <option>Pending</option>
                </select>
              </div>

              <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Template<span className="text-red-500">*</span>
                </label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs bg-white"
                >
                  {TEMPLATES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Image
                </h4>
                <div className="relative w-full aspect-video rounded-md border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                  {image ? (
                    <>
                      <img src={image} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="absolute top-2 right-2 bg-white/90 text-slate-600 hover:text-red-600 rounded-full p-1 shadow-sm"
                        title="Remove image"
                      >
                        <FiX size={14} />
                      </button>
                    </>
                  ) : (
                    <FiImage size={28} className="text-slate-300" />
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => openMediaPicker('page')}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Choose image
                  </button>
                  <span className="text-slate-400">or</span>
                  <button
                    type="button"
                    onClick={() => setUrlOpen(true)}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Add from URL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <MediaGalleryModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onInsert={(asset) => {
          if (asset?.url) {
            if (mediaTarget === 'seo') {
              setSeo((prev) => ({
                ...prev,
                social: {
                  ...prev.social,
                  ogImage: asset.url,
                  twitterImage: prev.social?.twitterImage || asset.url,
                },
              }));
              setSeoOpen(true);
            } else {
              setImage(asset.url);
            }
          }
          setMediaOpen(false);
        }}
      />
      <MediaUrlInsertModal
        open={urlOpen}
        onClose={() => setUrlOpen(false)}
        onInsertUrl={(url) => {
          if (url) setImage(url);
          setUrlOpen(false);
        }}
        onOpenGallery={() => {
          setUrlOpen(false);
          openMediaPicker('page');
        }}
      />
    </EcommerceLayout>
  );
};

export default AdminPageEdit;
