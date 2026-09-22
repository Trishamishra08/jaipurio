import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiCheck,
  FiImage,
  FiInfo,
  FiLogOut,
  FiPlus,
  FiRefreshCw,
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
  blogCategoriesList,
  blogsCreate,
  blogsGet,
  blogsUpdate,
  blogTagsCreate,
  blogTagsList,
  slugifyBlog,
} from '../../utils/blogsApi';

const LIST_PATH = '/admin/blogs';
const isMongoId = (value) => /^[a-f0-9]{24}$/i.test(String(value || ''));

const formatSeoDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

export const AdminBlogEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'create';

  const [mongoId, setMongoId] = useState(isMongoId(id) ? id : null);
  const [name, setName] = useState('');
  const [permalink, setPermalink] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState('Published');
  const [image, setImage] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [seo, setSeo] = useState(() => normalizeSeoState({}));
  const [seoOpen, setSeoOpen] = useState(false);
  const [createdAt, setCreatedAt] = useState('');
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState('post');
  const [urlOpen, setUrlOpen] = useState(false);

  const origin = getSiteOrigin();
  const previewUrl = `${origin}/blog/${permalink || 'slug'}`;
  const displaySeoTitle = seo.general?.metaTitle || name || 'Blog post';
  const displaySeoDescription =
    seo.general?.metaDescription ||
    description ||
    (name ? `${name} — Jaipurio` : 'Blog post on Jaipurio');
  const pageTitle = isCreate ? 'Create new post' : `Edit "${name || 'Post'}"`;

  const applyRow = (row) => {
    if (!row) return;
    setMongoId(row._id || row.id);
    setName(row.name || row.title || '');
    setPermalink(row.slug || '');
    setDescription(row.description || row.excerpt || '');
    setContent(row.content || '');
    setIsFeatured(Boolean(row.isFeatured));
    setStatus(row.status || 'Published');
    setImage(row.image || '');
    setSelectedCategories(
      Array.isArray(row.categories) && row.categories.length
        ? row.categories
        : row.category
          ? [row.category]
          : []
    );
    setTags(Array.isArray(row.tags) ? row.tags : []);
    setTagInput(Array.isArray(row.tags) ? row.tags.join(', ') : '');
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

  useEffect(() => {
    let cancelled = false;
    const loadMeta = async () => {
      try {
        const [cats, tagRows] = await Promise.all([blogCategoriesList(), blogTagsList()]);
        if (cancelled) return;
        setCategories(Array.isArray(cats) ? cats : []);
        setAllTags(Array.isArray(tagRows) ? tagRows : []);
      } catch {
        if (!cancelled) {
          setCategories([]);
          setAllTags([]);
        }
      }
    };
    loadMeta();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (isCreate) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const row = await blogsGet(id);
        if (!cancelled && row) applyRow(row);
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

  const parsedTags = useMemo(
    () =>
      tagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [tagInput]
  );

  const toggleCategory = (nameValue) => {
    setSelectedCategories((prev) =>
      prev.includes(nameValue) ? prev.filter((c) => c !== nameValue) : [...prev, nameValue]
    );
  };

  const buildSeoFromPost = () => {
    const metaTitle = (seo.general?.metaTitle || (name ? `${name} | Jaipurio` : '')).slice(0, 70);
    const metaDescription = String(seo.general?.metaDescription || description || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 320);
    const slug = permalink || slugifyBlog(name);
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

  const handleSave = async (exit = false) => {
    if (!name.trim()) {
      setSaveError('Name is required');
      return;
    }
    setSaving(true);
    setSaveError('');
    const nextSlug = permalink.trim() || slugifyBlog(name);
    const nextTags = parsedTags.length ? parsedTags : tags;
    const nextSeo = {
      ...seo,
      general: { ...seo.general, slug: nextSlug },
    };
    const payload = {
      name: name.trim(),
      title: name.trim(),
      slug: nextSlug,
      description,
      excerpt: description,
      content,
      isFeatured,
      status,
      image,
      categories: selectedCategories,
      category: selectedCategories[0] || '',
      tags: nextTags,
      faqs: faqs.filter((f) => f.question?.trim() || f.answer?.trim()),
      seo: nextSeo,
      seoTitle: nextSeo.general?.metaTitle || '',
      seoDescription: nextSeo.general?.metaDescription || '',
    };
    try {
      // Persist any new tags
      await Promise.all(
        nextTags
          .filter((t) => !allTags.some((x) => String(x.name).toLowerCase() === t.toLowerCase()))
          .map((t) => blogTagsCreate({ name: t }).catch(() => null))
      );

      let savedId = mongoId;
      let savedRow = null;
      if (mongoId) {
        savedRow = await blogsUpdate(mongoId, payload);
      } else {
        savedRow = await blogsCreate(payload);
        savedId = savedRow?._id || savedRow?.id || null;
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
      if (savedRow) applyRow(savedRow);
      else setPermalink(nextSlug);
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
    <EcommerceLayout
      breadcrumb={[
        { label: 'BLOG', to: '/admin/blogs' },
        { label: 'POSTS', to: '/admin/blogs' },
        pageTitle.toUpperCase(),
      ]}
    >
      {savedToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2">
          <FiCheck size={16} />
          <span>Post saved successfully!</span>
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
            <button
              type="button"
              className="px-4 py-2 text-xs font-semibold border-b-2 -mb-px border-blue-600 text-blue-700"
            >
              Detail
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8 space-y-5">
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
                    <span className="text-slate-500">{origin}/blog/</span>
                    <input
                      type="text"
                      value={permalink}
                      onChange={(e) => setPermalink(e.target.value)}
                      className="flex-1 min-w-[160px] border border-slate-300 rounded-md py-1.5 px-2.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setPermalink(slugifyBlog(name))}
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

                <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                  />
                  Is featured?
                </label>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Content</label>
                  <AdminCkEditor value={content} onChange={setContent} minHeight={220} />
                </div>
              </div>

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
                            prev.map((f, i) => (i === idx ? { ...f, question: e.target.value } : f))
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
                            prev.map((f, i) => (i === idx ? { ...f, answer: e.target.value } : f))
                          )
                        }
                        rows={3}
                        className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs resize-y"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFaqs((prev) => [...prev, { question: '', answer: '' }])}
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold text-xs"
                >
                  <FiPlus size={13} />
                  Add new
                </button>
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
                          onClick={() => setSeo(buildSeoFromPost())}
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
                        onClick={() => setSeoOpen(true)}
                        className="text-xs text-blue-600 hover:underline font-semibold"
                      >
                        Edit SEO meta
                      </button>
                    )}
                  </div>
                </div>
                {!seoOpen ? (
                  <p className="text-[11px] text-slate-500">
                    Setup meta title &amp; description to make your site easy to discovered on search
                    engines such as Google
                  </p>
                ) : (
                  <SeoEditorPanel
                    value={seo}
                    onChange={(next) => {
                      setSeo(next);
                      if (next?.general?.slug != null) setPermalink(next.general.slug);
                    }}
                    previewTitle={displaySeoTitle}
                    previewUrl={previewUrl}
                    showSeoImage
                    onPickSeoImage={() => {
                      setMediaTarget('seo');
                      setMediaOpen(true);
                    }}
                    onGenerateSlug={() => {
                      const s = slugifyBlog(name);
                      setPermalink(s);
                      setSeo((prev) => ({
                        ...prev,
                        general: { ...prev.general, slug: s },
                      }));
                    }}
                  />
                )}
                {createdAt && seoOpen ? (
                  <p className="text-[11px] text-slate-400">Created {formatSeoDate(createdAt)}</p>
                ) : null}
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
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Categories
                </h4>
                <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                  {categories.length === 0 ? (
                    <li className="text-[11px] text-slate-400">No categories yet</li>
                  ) : (
                    categories.map((cat) => (
                      <li key={cat._id || cat.id || cat.name}>
                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(cat.name)}
                            onChange={() => toggleCategory(cat.name)}
                          />
                          {cat.name}
                        </label>
                      </li>
                    ))
                  )}
                </ul>
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
                    onClick={() => {
                      setMediaTarget('post');
                      setMediaOpen(true);
                    }}
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

              <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Tags
                </h4>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Write some tags"
                  className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs"
                />
                <p className="text-[10px] text-slate-400">Separate tags with commas</p>
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
          setMediaTarget('post');
          setMediaOpen(true);
        }}
      />
    </EcommerceLayout>
  );
};

export default AdminBlogEdit;
