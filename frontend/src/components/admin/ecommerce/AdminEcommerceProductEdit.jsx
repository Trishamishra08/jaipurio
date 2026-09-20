import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import SeoEditorPanel, { normalizeSeoState } from './SeoEditorPanel';
import AdminCkEditor from './AdminCkEditor';
import MediaGalleryModal from './MediaGalleryModal';
import MediaUrlInsertModal from './MediaUrlInsertModal';
import { fetchAdminProducts, fetchProductById, isMongoId, saveProduct, duplicateProduct } from '../../../utils/marketplaceApi';
import { productPublicBase, productPublicUrl } from '../../../utils/siteUrl';
import {
  FiSave,
  FiCheck,
  FiCopy,
  FiPlus,
  FiTrash2,
  FiSearch,
  FiChevronRight,
  FiRotateCcw,
  FiInfo
} from 'react-icons/fi';

const SEED_DESCRIPTION_HTML = `<p>🌿 <strong>Ready to create a sacred sanctuary in your home?</strong> Our premium White Marble Tulsi Pot is your answer!</p>
<p><strong>What You'll Receive:</strong></p>
<ul>
<li>🏛️ Authentic 33-inch (83.8 cm) marble kyara</li>
<li>✨ Hand-carved traditional motifs</li>
<li>💎 Pure Makrana marble construction</li>
<li>🌱 Perfect drainage system included</li>
<li>📦 Secure packaging &amp; installation guide</li>
<li>🙏 Blessed option available for Tulsi Vivah</li>
</ul>`;

const SEED_CONTENT_HTML = `<p>Elevate your spiritual practice with our exquisite 33-inch White Marble Tulsi Pot. Handcrafted from pure Makrana marble, this traditional kyara features intricate carvings and superior drainage design. Perfect centerpiece for courtyards and temples, bringing sacred energy while showcasing timeless Indian craftsmanship. Trusted by 15,000+ families for authentic quality.</p>
<h3>🌿 Is Your Plastic Tulsi Pot Ruining Your Home's Sacred Energy? Discover the Divine Difference Pure Marble Makes!</h3>
<p><strong>Are you embarrassed when guests notice your cheap plastic Tulsi pot that's fading and cracking after just months?</strong> We get it – you've probably bought those lightweight pots thinking they'd last, only to watch them deteriorate while your sacred Tulsi struggles to thrive. That's precisely why 15,000+ traditional families trust Jaipurio's authentic White Marble Tulsi Pot to honor their holy basil properly.</p>
<figure class="table">
<table>
<thead><tr><th>Specification</th><th>Details</th><th>Why It Matters</th></tr></thead>
<tbody>
<tr><td>Material</td><td>Pure Makrana Marble</td><td>Same as Taj Mahal - eternal beauty</td></tr>
<tr><td>Height</td><td>33 inches (83.8 cm)</td><td>Perfect proportion for courtyards</td></tr>
<tr><td>Top Diameter</td><td>18 inches (45.7 cm)</td><td>Ample space for Tulsi growth</td></tr>
<tr><td>Weight</td><td>45 kg</td><td>Substantial, permanent placement</td></tr>
</tbody>
</table>
</figure>
<h3>💰 Investment Analysis: Why Premium Marble Saves Money</h3>
<p><strong>Result:</strong> Our marble pot costs 85% LESS over 10 years compared to regular ceramic or plastic replacements!</p>`;

const SEED_FAQS = [
  {
    id: 1,
    question: 'How do I know this White Marble Tulsi Pot is genuine Makrana marble?',
    answer:
      'We understand your concern about authenticity. Each kyara comes with a Makrana Marble Certificate showing the quarry source, extraction date, and quality grade. You can verify genuineness through the unique QR code that traces your specific piece. Additionally, our 45kg weight and translucency test confirm premium quality – cheaper alternatives weigh 30-40% less.',
  },
  {
    id: 2,
    question: 'Will the white marble turn yellow or grey over time?',
    answer:
      'Absolutely not! Pure Makrana marble maintains its pristine white appearance for centuries – just look at the Taj Mahal after 350+ years. Our mirror-polish finish and non-porous surface prevent staining. Simple weekly cleaning with plain water keeps it sparkling white. We guarantee color consistency for your lifetime.',
  },
  {
    id: 3,
    question: 'Is 33 inches too tall for my courtyard?',
    answer:
      'The 33-inch (83.8 cm) height is scientifically designed for optimal Tulsi growth and traditional proportions. It allows comfortable circumambulation (parikrama) while keeping the sacred plant at respectful eye level. For reference, it reaches roughly hip-height on average adults. We also offer 24-inch and 42-inch variants for different spaces.',
  },
  {
    id: 4,
    question: 'Can I keep this marble Tulsi pot indoors?',
    answer:
      "While traditionally placed in courtyards, our White Marble Tulsi Pot works beautifully in spacious indoor areas with adequate sunlight. Many apartment dwellers successfully place it near large windows or in glass-enclosed balconies. The marble's temperature-regulating properties actually help Tulsi adapt better to indoor conditions than plastic pots.",
  },
  {
    id: 5,
    question: 'How do I clean marble without damaging the carvings?',
    answer:
      'Maintenance is surprisingly simple! Use a soft cloth with plain water for weekly cleaning. For deeper cleaning, mix a teaspoon of mild dish soap in a bucket of water. Avoid acidic cleaners (no vinegar or lemon on marble). The carved areas can be cleaned with a soft brush. Our detailed care video guide shows exact techniques.',
  },
];

const parseFaqsFromProduct = (raw) => {
  if (!raw) return null;
  let rows = raw;
  if (typeof raw === 'string') {
    try {
      rows = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(rows) || !rows.length) return null;
  return rows.map((f, i) => ({
    id: f.id || i + 1,
    question: f.question || f.q || '',
    answer: f.answer || f.a || '',
  }));
};

const slugify = (text = '') =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

const parseMoney = (v) => Number(String(v ?? '').replace(/,/g, '').replace(/[^\d.]/g, '')) || 0;

export const AdminEcommerceProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const productId = id || 'create';
  const isCreate = !id || id === 'create';

  // State management for product details
  const [mongoId, setMongoId] = useState(null);
  const [name, setName] = useState(
    'White Marble Tulsi Pot 33 Inch - Buy Premium Handcrafted Sacred Kyara | Jaipurio'
  );
  const [permalink, setPermalink] = useState(
    'white-marble-tulsi-pot-33-inch-handcrafted-sacred-plant-container-traditional-kyara'
  );
  const [status, setStatus] = useState('Published');
  const [store, setStore] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [brand, setBrand] = useState('Jaipurio');

  // Pricing & Inventory
  const [sku, setSku] = useState('JAI-HD-MTP-001');
  const [price, setPrice] = useState('14,000');
  const [salePrice, setSalePrice] = useState('9,500');
  const [costPerItem, setCostPerItem] = useState('4,100');
  const [barcode, setBarcode] = useState('');
  const [storehouseManagement, setStorehouseManagement] = useState(true);
  const [quantity, setQuantity] = useState('9');
  const [allowBackorder, setAllowBackorder] = useState(true);

  // Shipping
  const [weight, setWeight] = useState('1,700');
  const [length, setLength] = useState('60.96');
  const [width, setWidth] = useState('0');
  const [height, setHeight] = useState('76.2');

  // Quantity Limits
  const [minOrderQty, setMinOrderQty] = useState('0');
  const [maxOrderQty, setMaxOrderQty] = useState('0');

  // Specification Table
  const [specTable, setSpecTable] = useState('None');

  // Tags
  const [tags, setTags] = useState([
    'Religious Garden Decor',
    'White Marble Tulsi Pot',
    'Pure Marble Stand',
    'Handcrafted Planter'
  ]);
  const [newTagInput, setNewTagInput] = useState('');

  // Collections, Labels, Taxes
  const [collections, setCollections] = useState({
    newArrival: true,
    bestSellers: false,
    specialOffer: false
  });

  const [labels, setLabels] = useState({
    hot: true,
    new: false,
    sale: false
  });

  const [tax, setTax] = useState('none');

  const [seo, setSeo] = useState(() =>
    normalizeSeoState({
      general: {
        slug: 'white-marble-tulsi-pot-33-inch-handcrafted-sacred-plant-container-traditional-kyara',
        metaTitle: 'White Marble Tulsi Pot | 33" Handcrafted Planter | Holy Basil Stand | Jaipurio',
        metaDescription:
          'Looking for authentic White Marble Tulsi Pot? Get 33-inch handcrafted kyara with intricate carvings. Transform your courtyard into sacred space. Order now!',
        metaKeywords: 'tulsi pot, marble planter, kyara, jaipurio',
        robots: 'index,follow',
      },
    })
  );
  const [seoOpen, setSeoOpen] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [urlPromptOpen, setUrlPromptOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [descriptionHtml, setDescriptionHtml] = useState(isCreate ? SEED_DESCRIPTION_HTML : '');
  const [contentHtml, setContentHtml] = useState(isCreate ? SEED_CONTENT_HTML : '');
  const [editorsReady, setEditorsReady] = useState(Boolean(isCreate));
  // Product Images Gallery
  const [images, setImages] = useState([
    '/planter.png',
    '/matka.png',
    '/kulhad.png'
  ]);
  const [featuredImage, setFeaturedImage] = useState('/planter.png');

  // Categories Tree expansion & selection
  const [expandedCategories, setExpandedCategories] = useState({
    'home-living': true,
    'spirituality': true,
    'religious-statuary': true,
    'jewellery': false,
    'clothing': false,
    'accessories': false
  });

  const [selectedCategories, setSelectedCategories] = useState({
    'marble-idols': true,
    'home-decor': true,
    'handicrafts': true
  });

  // FAQs
  const [faqs, setFaqs] = useState(isCreate ? SEED_FAQS : []);

  // Toast / Save State
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (isCreate) {
        setEditorsReady(true);
        return;
      }
      setEditorsReady(false);
      try {
        let product = null;
        if (isMongoId(productId)) {
          product = await fetchProductById(productId);
        } else {
          const list = await fetchAdminProducts();
          product =
            list.find((p) => String(p._id) === String(productId) || String(p.sku) === String(sku)) ||
            list.find((p) => String(p.sku) === 'JAI-HD-MTP-001') ||
            list[0];
        }
        if (!product || cancelled) return;
        setMongoId(product._id || product.id);
        setName(product.title || product.name || '');
        setPermalink(product.slug || product.seo?.general?.slug || slugify(product.name || ''));
        setStatus(product.lifecycle || (product.published ? 'Published' : 'Draft'));
        setStore(product.store || product.storeName || '');
        setIsFeatured(Boolean(product.isFeatured || product.bestseller));
        setBrand(product.brand || 'Jaipurio');
        setSku(product.sku || '');
        setPrice(String(product.oldPrice || product.price || '').replace(/\B(?=(\d{3})+(?!\d))/g, ','));
        setSalePrice(String(product.salePrice || product.price || '').replace(/\B(?=(\d{3})+(?!\d))/g, ','));
        setCostPerItem(String(product.costPerItem || ''));
        setBarcode(product.barcode || '');
        setQuantity(String(product.stock ?? product.quantity ?? ''));
        setWeight(String(product.weight ?? ''));
        setLength(String(product.length ?? ''));
        setWidth(String(product.width ?? ''));
        setHeight(String(product.height ?? ''));
        setMinOrderQty(String(product.minQty ?? 0));
        setMaxOrderQty(String(product.maxQty ?? 0));
        if (Array.isArray(product.tagList) && product.tagList.length) setTags(product.tagList);
        else if (typeof product.tags === 'string' && product.tags) setTags(product.tags.split(',').map((t) => t.trim()).filter(Boolean));
        if (product.collections) setCollections((prev) => ({ ...prev, ...product.collections }));
        if (product.labels) setLabels((prev) => ({ ...prev, ...product.labels }));
        if (product.images?.length) {
          setImages(product.images);
          setFeaturedImage(product.image || product.images[0]);
        } else if (product.image) {
          setImages([product.image]);
          setFeaturedImage(product.image);
        }
        setSeo(
          normalizeSeoState(product.seo, {
            slug: product.slug,
            seoTitle: product.seoTitle,
            seoDescription: product.seoDescription,
          })
        );
        // Keep description and content separate — never swap fields into each other
        const descRaw = product.description ?? '';
        const contentRaw = product.content ?? '';
        const plain = (html) =>
          String(html || '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        const descText = plain(descRaw);
        const contentText = plain(contentRaw);
        // Only seed when the product truly has no saved copy
        setDescriptionHtml(descText ? descRaw : SEED_DESCRIPTION_HTML);
        setContentHtml(contentText ? contentRaw : descText ? descRaw : SEED_CONTENT_HTML);
        const loadedFaqs = parseFaqsFromProduct(product.faqs);
        setFaqs(loadedFaqs?.length ? loadedFaqs : SEED_FAQS);
        setEditorsReady(true);
      } catch {
        if (!cancelled) {
          setDescriptionHtml(SEED_DESCRIPTION_HTML);
          setContentHtml(SEED_CONTENT_HTML);
          setFaqs(SEED_FAQS);
          setEditorsReady(true);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [productId, isCreate]);

  const handleSave = async (andExit = false) => {
    setSaving(true);
    setSaveError('');
    try {
      const nextSlug = seo.general?.slug || permalink || slugify(name);
      const payload = {
        _id: mongoId,
        title: name,
        name,
        slug: nextSlug,
        sku,
        brand,
        store,
        storeName: store,
        category:
          Object.keys(selectedCategories).find((k) => selectedCategories[k]) || 'Planters',
        price: parseMoney(salePrice) || parseMoney(price),
        oldPrice: parseMoney(price),
        salePrice: parseMoney(salePrice) || parseMoney(price),
        costPerItem: parseMoney(costPerItem),
        barcode,
        stock: Number(quantity) || 0,
        trackQuantity: storehouseManagement,
        weight: parseMoney(weight),
        length: Number(length) || 0,
        width: Number(width) || 0,
        height: Number(height) || 0,
        minQty: Number(minOrderQty) || 0,
        maxQty: Number(maxOrderQty) || 0,
        isFeatured,
        lifecycle: status,
        images,
        image: featuredImage || images[0] || '',
        tagList: tags,
        tags: tags.join(', '),
        collections,
        labels,
        description: descriptionHtml,
        content: contentHtml,
        faqs: JSON.stringify(faqs),
        seo: {
          ...seo,
          general: { ...seo.general, slug: nextSlug },
        },
        seoTitle: seo.general?.metaTitle || '',
        seoDescription: seo.general?.metaDescription || '',
      };
      const saved = await saveProduct(payload, 'admin');
      if (saved?._id) setMongoId(saved._id);
      setPermalink(nextSlug);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (andExit) navigate('/admin/ecommerce/products');
      }, 900);
    } catch (err) {
      setSaveError(err?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    setSaveError('');
    try {
      const copied = await duplicateProduct(mongoId);
      setDuplicateOpen(false);
      const newId = copied?._id || copied?.id;
      if (newId) {
        navigate(`/admin/ecommerce/products/edit/${newId}`);
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 1200);
      }
    } catch (err) {
      setSaveError(err?.message || 'Duplicate failed');
      setDuplicateOpen(false);
    } finally {
      setDuplicating(false);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(newTagInput.trim())) {
        setTags([...tags, newTagInput.trim()]);
      }
      setNewTagInput('');
    }
  };

  const toggleCategoryExpand = (key) => {
    setExpandedCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCategorySelect = (key) => {
    setSelectedCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRemoveFaq = (faqId) => {
    setFaqs(faqs.filter((f) => f.id !== faqId));
  };

  const handleAddFaq = () => {
    setFaqs([
      ...faqs,
      {
        id: Date.now(),
        question: 'New Question',
        answer: 'Enter answer details here...'
      }
    ]);
  };

  return (
    <EcommerceLayout
      breadcrumb={[
        <Link key="1" to="/admin/ecommerce/products" className="hover:underline">
          PRODUCTS
        </Link>,
        `EDIT PRODUCT - ${name.slice(0, 50)}...`
      ]}
    >
      {/* Toast Notification */}
      {saveSuccess && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2 animate-bounce">
          <FiCheck size={16} />
          <span>Product saved successfully!</span>
        </div>
      )}

      <MediaUrlInsertModal
        open={urlPromptOpen}
        onClose={() => setUrlPromptOpen(false)}
        onInsertUrl={(url) => {
          setImages((prev) => (prev.includes(url) ? prev : [...prev, url]));
          if (!featuredImage) setFeaturedImage(url);
        }}
        onOpenGallery={() => setGalleryOpen(true)}
      />

      <MediaGalleryModal
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onInsert={(asset) => {
          if (!asset?.url) return;
          setImages((prev) => (prev.includes(asset.url) ? prev : [...prev, asset.url]));
          if (!featuredImage) setFeaturedImage(asset.url);
        }}
      />

      {duplicateOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/45 p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-sm p-6 text-center relative">
            <button
              type="button"
              onClick={() => setDuplicateOpen(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-700"
            >
              ×
            </button>
            <div className="mx-auto w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <FiInfo size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Duplicate product</h3>
            <p className="text-xs text-slate-500 mb-5">Are you sure you want to duplicate this product?</p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={duplicating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md disabled:opacity-60"
              >
                {duplicating ? 'Duplicating…' : 'Duplicate'}
              </button>
              <button
                type="button"
                onClick={() => setDuplicateOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-md hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Language Version Alert Banner */}
      <div className="bg-[#EBF5FB] border border-[#D4E6F1] text-[#2471A3] rounded-md p-3 mb-5 flex items-center gap-2.5 text-xs">
        <FiInfo size={16} className="text-[#2980B9] shrink-0" />
        <span>
          You are editing <strong className="font-bold">"English"</strong> version
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================================= */}
        {/* LEFT MAIN COLUMN (8 cols)                                                */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-5">
          {/* Card: Name & Permalink */}
          <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                placeholder="Enter product title..."
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between text-xs mb-1 text-slate-600">
                <span className="font-semibold text-slate-700">
                  Permalink <span className="text-red-500">*</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPermalink(
                      name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)+/g, '')
                    )
                  }
                  className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                >
                  <FiRotateCcw size={11} />
                  <span>Generate URL</span>
                </button>
              </div>

              <div className="flex items-center rounded-md border border-slate-300 bg-slate-50 overflow-hidden text-xs">
                <span className="px-2.5 py-1.5 text-slate-500 bg-slate-100 border-r border-slate-300 select-none text-[11px]">
                  {productPublicBase()}
                </span>
                <input
                  type="text"
                  value={permalink}
                  onChange={(e) => setPermalink(e.target.value)}
                  className="flex-1 bg-white py-1.5 px-2.5 text-xs text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1">
                <span>Preview:</span>
                <a
                  href={productPublicUrl(permalink || mongoId || productId)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {productPublicUrl(permalink || mongoId || productId)}
                </a>
              </div>
            </div>

            {/* Description Editor */}
            {!editorsReady ? (
              <div className="text-xs text-slate-500 py-6 border border-dashed border-slate-200 rounded-md text-center">
                Loading description &amp; content…
              </div>
            ) : (
              <>
                <AdminCkEditor
                  label="Description"
                  value={descriptionHtml}
                  onChange={setDescriptionHtml}
                  minHeight={120}
                  placeholder="Short product description…"
                  editorKey={`desc-${productId}`}
                  defaultVisible
                />

                <AdminCkEditor
                  label="Content"
                  value={contentHtml}
                  onChange={setContentHtml}
                  minHeight={280}
                  showUiBlocksHint
                  placeholder="Full product content…"
                  editorKey={`content-${productId}`}
                  defaultVisible
                />
              </>
            )}
          </div>

          {/* Card: Images Gallery */}
          <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs">
            <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">Images</h4>
            <div className="flex flex-wrap gap-3 items-center">
              {images.map((imgSrc, idx) => (
                <div
                  key={idx}
                  className="relative group w-24 h-24 rounded-md border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center"
                >
                  <img src={imgSrc} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-90 group-hover:opacity-100 transition shadow-xs hover:scale-110"
                    title="Remove image"
                  >
                    <FiTrash2 size={11} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setUrlPromptOpen(true)}
                className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-md flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 transition bg-slate-50/50"
              >
                <FiPlus size={20} />
                <span className="text-[11px] font-medium mt-1">Add Images</span>
              </button>
            </div>

            <div className="mt-3 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setImages(['/planter.png'])}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Card: Video */}
          <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Video</h4>
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold border border-blue-200 hover:bg-blue-50 px-2.5 py-1 rounded-md transition"
              >
                <FiPlus size={13} />
                <span>Add new</span>
              </button>
            </div>
          </div>

          {/* Card: Specification Tables */}
          <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs">
            <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">Specification Tables</h4>
            <select
              value={specTable}
              onChange={(e) => setSpecTable(e.target.value)}
              className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs text-slate-700 bg-white focus:outline-hidden focus:border-blue-500"
            >
              <option value="None">None</option>
              <option value="Home Decor Specs">Home Decor Specifications</option>
              <option value="Marble Pots Specs">Marble Pots Specifications</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Select the specification table to display in this product
            </p>
          </div>

          {/* Card: Overview (Price, Inventory, Shipping) */}
          <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
              Overview
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SKU</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Price ₹</label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Price sale ₹</label>
                  <a href="#discount-period" className="text-[11px] text-blue-600 hover:underline">
                    Choose Discount Period
                  </a>
                </div>
                <input
                  type="text"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs font-medium"
                />
                <div className="mt-1 text-[11px] text-slate-500">
                  Discount <strong className="text-emerald-600 font-bold">32%</strong> from original price.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cost per item ₹</label>
                <input
                  type="text"
                  value={costPerItem}
                  onChange={(e) => setCostPerItem(e.target.value)}
                  className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1">Customers won't see this price.</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Barcode (ISBN, UPC, GTIN, etc.)
                </label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="e.g. 890123456789"
                  className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs"
                />
              </div>
            </div>

            {/* Storehouse Management */}
            <div className="pt-3 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={storehouseManagement}
                  onChange={(e) => setStorehouseManagement(e.target.checked)}
                  className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-700">With storehouse management</span>
              </label>

              {storehouseManagement && (
                <div className="mt-3 pl-6 space-y-3">
                  <div className="max-w-xs">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={allowBackorder}
                      onChange={(e) => setAllowBackorder(e.target.checked)}
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span>Allow customer checkout when this product out of stock</span>
                  </label>
                </div>
              )}
            </div>

            {/* Shipping Box */}
            <div className="pt-3 border-t border-slate-100">
              <h5 className="text-xs font-bold text-slate-700 mb-2.5">Shipping</h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Weight (g)</label>
                  <input
                    type="text"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full border border-slate-300 rounded-md py-1 px-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Length (cm)</label>
                  <input
                    type="text"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full border border-slate-300 rounded-md py-1 px-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Wide (cm)</label>
                  <input
                    type="text"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    className="w-full border border-slate-300 rounded-md py-1 px-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Height (cm)</label>
                  <input
                    type="text"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full border border-slate-300 rounded-md py-1 px-2.5 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Attributes */}
          <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Attributes</h4>
              <button
                type="button"
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold border border-blue-200 hover:bg-blue-50 px-2.5 py-1 rounded-md transition"
              >
                Add new attributes
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Adding new attributes helps the product to have many options, such as size or color.
            </p>
          </div>

          {/* Card: Product Options */}
          <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Product options</h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold border border-blue-200 hover:bg-blue-50 px-2.5 py-1 rounded-md transition"
                >
                  Add new option
                </button>
                <select className="border border-slate-300 text-xs rounded-md py-1 px-2 text-slate-700">
                  <option>Select Global Option</option>
                  <option>Metal</option>
                  <option>RAM</option>
                  <option>CPU</option>
                  <option>HDD</option>
                </select>
                <button
                  type="button"
                  className="text-xs bg-slate-700 text-white font-medium px-2.5 py-1 rounded-md hover:bg-slate-800 transition"
                >
                  Add Global Option
                </button>
              </div>
            </div>
          </div>

          {/* Card: Related & Cross-selling Products */}
          <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Related products</h4>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full border border-slate-300 rounded-md py-1.5 pl-8 pr-3 text-xs"
                />
                <FiSearch className="absolute left-2.5 top-2 text-slate-400" size={14} />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Cross-selling products
              </h4>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full border border-slate-300 rounded-md py-1.5 pl-8 pr-3 text-xs"
                />
                <FiSearch className="absolute left-2.5 top-2 text-slate-400" size={14} />
              </div>
              <div className="text-[11px] text-slate-500 mt-2 space-y-1">
                <p>
                  <strong>* Price field:</strong> Enter the amount you want to reduce from the original price.
                </p>
                <p>
                  <strong>* Type field:</strong> Choose discount type: Fixed (reduce a specific amount) or Percent.
                </p>
              </div>
            </div>
          </div>

          {/* Card: Product FAQs */}
          <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Product FAQs</h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold border border-blue-200 hover:bg-blue-50 px-2.5 py-1 rounded-md transition flex items-center gap-1"
                >
                  <FiPlus size={13} />
                  <span>Add new</span>
                </button>
                <span className="text-xs text-slate-400">or</span>
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Select from existing FAQs
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {faqs.map((faq, index) => (
                <div
                  key={faq.id}
                  className="border border-slate-200 rounded-md p-3 bg-slate-50/50 space-y-2 relative"
                >
                  <button
                    type="button"
                    onClick={() => handleRemoveFaq(faq.id)}
                    className="absolute top-2.5 right-2.5 text-slate-400 hover:text-red-600 p-1 transition"
                    title="Remove question"
                  >
                    <FiTrash2 size={13} />
                  </button>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Question #{index + 1}
                    </label>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => {
                        const updated = [...faqs];
                        updated[index].question = e.target.value;
                        setFaqs(updated);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-2.5 text-xs text-slate-800 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Answer</label>
                    <textarea
                      rows={3}
                      value={faq.answer}
                      onChange={(e) => {
                        const updated = [...faqs];
                        updated[index].answer = e.target.value;
                        setFaqs(updated);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-2.5 text-xs text-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Search Engine Optimize (SEO) */}
          <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 gap-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Search Engine Optimize</h4>
              <div className="flex items-center gap-2 shrink-0">
                {seoOpen ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const metaTitle = name ? `${name} | Jaipurio`.slice(0, 60) : '';
                        const metaDescription = String(descriptionHtml || '')
                          .replace(/<[^>]+>/g, ' ')
                          .replace(/\s+/g, ' ')
                          .trim()
                          .slice(0, 160);
                        const slug = permalink || slugify(name);
                        setSeo(
                          normalizeSeoState({
                            general: {
                              slug,
                              metaTitle,
                              metaDescription,
                              metaKeywords: '',
                              robots: 'index,follow',
                              canonicalUrl: '',
                            },
                            social: {
                              ogTitle: metaTitle,
                              ogDescription: metaDescription,
                              ogImage: featuredImage || images[0] || '',
                              twitterTitle: metaTitle,
                              twitterDescription: metaDescription,
                              twitterImage: featuredImage || images[0] || '',
                            },
                            advanced: {
                              schemaMarkup: '',
                              customHead: '',
                              noIndex: false,
                              noFollow: false,
                            },
                          })
                        );
                      }}
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
                      // Prefer latest saved SEO from API when editing existing product
                      if (mongoId && isMongoId(mongoId)) {
                        try {
                          const product = await fetchProductById(mongoId);
                          if (product?.seo) {
                            setSeo(
                              normalizeSeoState(product.seo, {
                                slug: product.slug || permalink,
                                seoTitle: product.seoTitle,
                                seoDescription: product.seoDescription,
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
                    Edit
                  </button>
                )}
              </div>
            </div>

            {seoOpen && (
              <SeoEditorPanel
                value={seo}
                onChange={setSeo}
                previewTitle={name}
                previewUrl={productPublicUrl(seo.general?.slug || permalink || mongoId || productId)}
                onGenerateSlug={() => {
                  const s = slugify(name);
                  setPermalink(s);
                  setSeo((prev) => ({
                    ...prev,
                    general: { ...prev.general, slug: s },
                  }));
                }}
              />
            )}
            {saveError ? (
              <div className="text-xs text-red-600 font-medium">{saveError}</div>
            ) : null}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT SIDEBAR COLUMN (4 cols)                                             */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card: Publish Actions */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Publish
            </h4>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-md text-xs shadow-xs transition disabled:opacity-60"
              >
                <FiSave size={14} />
                <span>{saving ? 'Saving…' : 'Save'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-slate-900 text-white font-semibold py-2 px-3 rounded-md text-xs transition disabled:opacity-60"
              >
                <FiCheck size={14} />
                <span>Save & Exit</span>
              </button>

              <button
                type="button"
                onClick={() => setDuplicateOpen(true)}
                disabled={!mongoId || duplicating}
                className="w-full flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-1.5 px-3 rounded-md text-xs transition disabled:opacity-50"
              >
                <FiCopy size={13} />
                <span>{duplicating ? 'Duplicating…' : 'Duplicate'}</span>
              </button>
            </div>
          </div>

          {/* Card: Languages */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Languages
            </h4>
            <div className="flex flex-wrap gap-1.5 text-xs text-slate-600">
              <button className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-sm border border-slate-200">
                <span>🇫🇷</span> <span>Français</span>
              </button>
              <button className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-sm border border-slate-200">
                <span>🇯🇵</span> <span>日本語</span>
              </button>
              <button className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-sm border border-slate-200">
                <span>🇨🇳</span> <span>中文 (中国)</span>
              </button>
              <button className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-sm border border-slate-200">
                <span>🇩🇪</span> <span>Deutsch</span>
              </button>
              <button className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-sm border border-slate-200">
                <span>🇮🇹</span> <span>Italiano</span>
              </button>
            </div>
          </div>

          {/* Card: Status */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Status<span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs bg-white text-slate-700 focus:outline-hidden focus:border-blue-500"
            >
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          {/* Card: Store */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Store</h4>
            <select
              value={store}
              onChange={(e) => setStore(e.target.value)}
              className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="">Select a store...</option>
              <option value="Jaipur Crafts Flagship">Jaipur Crafts Flagship</option>
              <option value="Makrana Artisans Guild">Makrana Artisans Guild</option>
            </select>
          </div>

          {/* Card: Is Featured */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Is featured?</span>
            </label>
          </div>

          {/* Card: Categories (Nested Hierarchical Tree) */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Categories
            </h4>
            <div className="max-h-64 overflow-y-auto space-y-1 text-xs text-slate-700 pr-1">
              {/* Jewellery */}
              <div>
                <div className="flex items-center gap-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={() => toggleCategoryExpand('jewellery')}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <FiChevronRight
                      size={12}
                      className={`transform transition-transform ${expandedCategories['jewellery'] ? 'rotate-90' : ''}`}
                    />
                  </button>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" className="rounded-sm border-slate-300 text-blue-600 h-3.5 w-3.5" />
                    <span>Jewellery</span>
                  </label>
                </div>
                {expandedCategories['jewellery'] && (
                  <div className="pl-5 space-y-1 border-l border-slate-200 ml-2">
                    {['Bangles', 'Bracelets', 'Rings', 'Necklaces', 'Earrings'].map((sub) => (
                      <label key={sub} className="flex items-center gap-1.5 cursor-pointer py-0.5">
                        <input type="checkbox" className="rounded-sm border-slate-300 text-blue-600 h-3.5 w-3.5" />
                        <span>{sub}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Home & Living */}
              <div>
                <div className="flex items-center gap-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={() => toggleCategoryExpand('home-living')}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <FiChevronRight
                      size={12}
                      className={`transform transition-transform ${expandedCategories['home-living'] ? 'rotate-90' : ''}`}
                    />
                  </button>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                    <input type="checkbox" checked className="rounded-sm border-slate-300 text-blue-600 h-3.5 w-3.5" readOnly />
                    <span>Home & Living</span>
                  </label>
                </div>

                {expandedCategories['home-living'] && (
                  <div className="pl-4 space-y-1 border-l border-slate-200 ml-2 py-0.5">
                    {/* Spirituality & Religion */}
                    <div>
                      <div className="flex items-center gap-1.5 py-0.5">
                        <button
                          type="button"
                          onClick={() => toggleCategoryExpand('spirituality')}
                          className="text-slate-400"
                        >
                          <FiChevronRight
                            size={12}
                            className={`transform transition-transform ${expandedCategories['spirituality'] ? 'rotate-90' : ''}`}
                          />
                        </button>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked className="rounded-sm border-slate-300 text-blue-600 h-3.5 w-3.5" readOnly />
                          <span>Spirituality & Religion</span>
                        </label>
                      </div>

                      {expandedCategories['spirituality'] && (
                        <div className="pl-4 space-y-1 border-l border-slate-200 ml-2 py-0.5">
                          {/* Statuary Idols */}
                          <div>
                            <div className="flex items-center gap-1.5 py-0.5">
                              <button
                                type="button"
                                onClick={() => toggleCategoryExpand('religious-statuary')}
                                className="text-slate-400"
                              >
                                <FiChevronRight
                                  size={12}
                                  className={`transform transition-transform ${expandedCategories['religious-statuary'] ? 'rotate-90' : ''}`}
                                />
                              </button>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked className="rounded-sm border-slate-300 text-blue-600 h-3.5 w-3.5" readOnly />
                                <span>Religious Statuary Idols</span>
                              </label>
                            </div>

                            {expandedCategories['religious-statuary'] && (
                              <div className="pl-4 space-y-0.5 border-l border-slate-200 ml-2">
                                <label className="flex items-center gap-1.5 cursor-pointer py-0.5 text-blue-700 font-medium">
                                  <input
                                    type="checkbox"
                                    checked={selectedCategories['marble-idols']}
                                    onChange={() => toggleCategorySelect('marble-idols')}
                                    className="rounded-sm border-slate-300 text-blue-600 h-3.5 w-3.5"
                                  />
                                  <span>Marble Idols</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer py-0.5">
                                  <input type="checkbox" className="rounded-sm border-slate-300 text-blue-600 h-3.5 w-3.5" />
                                  <span>Brass Idols</span>
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <label className="flex items-center gap-1.5 cursor-pointer py-0.5 font-medium">
                      <input
                        type="checkbox"
                        checked={selectedCategories['home-decor']}
                        onChange={() => toggleCategorySelect('home-decor')}
                        className="rounded-sm border-slate-300 text-blue-600 h-3.5 w-3.5"
                      />
                      <span>Home Decor</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer py-0.5 font-medium">
                      <input
                        type="checkbox"
                        checked={selectedCategories['handicrafts']}
                        onChange={() => toggleCategorySelect('handicrafts')}
                        className="rounded-sm border-slate-300 text-blue-600 h-3.5 w-3.5"
                      />
                      <span>Handicrafts</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Clothing */}
              <div>
                <div className="flex items-center gap-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={() => toggleCategoryExpand('clothing')}
                    className="text-slate-400"
                  >
                    <FiChevronRight
                      size={12}
                      className={`transform transition-transform ${expandedCategories['clothing'] ? 'rotate-90' : ''}`}
                    />
                  </button>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" className="rounded-sm border-slate-300 text-blue-600 h-3.5 w-3.5" />
                    <span>Clothing</span>
                  </label>
                </div>
              </div>

              {/* Accessories */}
              <div>
                <div className="flex items-center gap-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={() => toggleCategoryExpand('accessories')}
                    className="text-slate-400"
                  >
                    <FiChevronRight
                      size={12}
                      className={`transform transition-transform ${expandedCategories['accessories'] ? 'rotate-90' : ''}`}
                    />
                  </button>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" className="rounded-sm border-slate-300 text-blue-600 h-3.5 w-3.5" />
                    <span>Accessories</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Brand */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Brand</h4>
            <div className="flex items-center justify-between border border-slate-300 rounded-md py-1.5 px-3 text-xs bg-slate-50">
              <span className="font-semibold text-slate-800">{brand}</span>
              <button
                type="button"
                onClick={() => setBrand('')}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ×
              </button>
            </div>
          </div>

          {/* Card: Featured Image */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Featured image (optional)
            </h4>
            <div className="relative group w-full h-44 rounded-md border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
              <img src={featuredImage} alt="Featured" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setFeaturedImage('')}
                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-90 group-hover:opacity-100 transition shadow-xs"
                title="Remove image"
              >
                <FiTrash2 size={13} />
              </button>
            </div>
            <div className="flex items-center justify-between text-xs text-blue-600 pt-1">
              <button type="button" className="hover:underline font-medium">
                Choose image
              </button>
              <span className="text-slate-400">or</span>
              <button type="button" className="hover:underline font-medium">
                Add from URL
              </button>
            </div>
          </div>

          {/* Card: Product Collections */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Product collections
            </h4>
            <div className="space-y-1.5 text-xs text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={collections.newArrival}
                  onChange={(e) => setCollections({ ...collections, newArrival: e.target.checked })}
                  className="rounded-sm border-slate-300 text-blue-600 h-3.5 w-3.5"
                />
                <span>New Arrival</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={collections.bestSellers}
                  onChange={(e) => setCollections({ ...collections, bestSellers: e.target.checked })}
                  className="rounded-sm border-slate-300 text-blue-600 h-3.5 w-3.5"
                />
                <span>Best Sellers</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={collections.specialOffer}
                  onChange={(e) => setCollections({ ...collections, specialOffer: e.target.checked })}
                  className="rounded-sm border-slate-300 text-blue-600 h-3.5 w-3.5"
                />
                <span>Special Offer</span>
              </label>
            </div>
          </div>

          {/* Card: Labels */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Labels
            </h4>
            <div className="space-y-1.5 text-xs text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={labels.hot}
                  onChange={(e) => setLabels({ ...labels, hot: e.target.checked })}
                  className="rounded-sm border-slate-300 text-blue-600 h-3.5 w-3.5"
                />
                <span>Hot</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={labels.new}
                  onChange={(e) => setLabels({ ...labels, new: e.target.checked })}
                  className="rounded-sm border-slate-300 text-blue-600 h-3.5 w-3.5"
                />
                <span>New</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={labels.sale}
                  onChange={(e) => setLabels({ ...labels, sale: e.target.checked })}
                  className="rounded-sm border-slate-300 text-blue-600 h-3.5 w-3.5"
                />
                <span>Sale</span>
              </label>
            </div>
          </div>

          {/* Card: Taxes */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Taxes
            </h4>
            <div className="space-y-1.5 text-xs text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tax"
                  value="none"
                  checked={tax === 'none'}
                  onChange={() => setTax('none')}
                  className="text-blue-600"
                />
                <span>None (0%)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tax"
                  value="vat"
                  checked={tax === 'vat'}
                  onChange={() => setTax('vat')}
                  className="text-blue-600"
                />
                <span>VAT (10%)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tax"
                  value="import"
                  checked={tax === 'import'}
                  onChange={() => setTax('import')}
                  className="text-blue-600"
                />
                <span>Import Tax (15%)</span>
              </label>
            </div>
          </div>

          {/* Card: Min & Max Order Quantity */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Minimum order quantity
              </h4>
              <input
                type="number"
                value={minOrderQty}
                onChange={(e) => setMinOrderQty(e.target.value)}
                className="w-full border border-slate-300 rounded-md py-1 px-2.5 text-xs"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Minimum quantity to place an order, if the value is 0, there is no limit.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Maximum order quantity
              </h4>
              <input
                type="number"
                value={maxOrderQty}
                onChange={(e) => setMaxOrderQty(e.target.value)}
                className="w-full border border-slate-300 rounded-md py-1 px-2.5 text-xs"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Maximum quantity to place an order, if the value is 0, there is no limit.
              </p>
            </div>
          </div>

          {/* Card: Tags */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Tags
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-md border border-slate-200"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-400 hover:text-red-500 font-bold ml-0.5 text-sm"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Write some tags..."
              className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductEdit;
