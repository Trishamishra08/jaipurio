import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SeoEditorPanel, { normalizeSeoState } from '../admin/ecommerce/SeoEditorPanel';
import AdminCkEditor from '../admin/ecommerce/AdminCkEditor';
import { fetchAdminProducts, fetchProductById, isMongoId, saveProduct, duplicateProduct } from '../../utils/marketplaceApi';
import { liveEcommerceList, fetchCategoryAttributes } from '../../utils/ecommerceApi';
import { categoryService } from '../../services/categoryService';
import { productPublicBase, productPublicUrl } from '../../utils/siteUrl';
import api from '../../utils/api';
import {
  FiSave,
  FiCheck,
  FiCopy,
  FiPlus,
  FiTrash2,
  FiSearch,
  FiRotateCcw,
  FiInfo,
  FiUpload
} from 'react-icons/fi';

const isStubHtml = (html) => {
  const plain = String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return !plain || plain.length < 180;
};

const buildSeedDescription = (productName = 'Jaipurio handmade piece') =>
  `<p><strong>Ready to bring authentic Jaipur craftsmanship home?</strong> Our ${productName} is handcrafted for everyday beauty and lasting heritage.</p>
<p><strong>What You'll Receive:</strong></p>
<ul>
<li>Genuine artisan-made piece from Jaipur</li>
<li>Premium mitti / marble craftsmanship</li>
<li>Thoughtful design for home and ritual use</li>
<li>Secure packaging with care guidance</li>
<li>Trusted by families who choose handmade over factory ware</li>
</ul>`;

const buildSeedContent = (productName = 'Jaipurio handmade piece') =>
  `<p>Elevate your space with our ${productName}. Each piece is finished by hand so small variations in tone and texture are a mark of authenticity — not factory moulds.</p>
<h3>Why families choose Jaipurio</h3>
<p><strong>Mass-produced décor fades fast.</strong> Our artisans work with traditional methods so your piece stays beautiful for years of daily use, gifting, and festive rituals.</p>
<figure class="table">
<table>
<thead><tr><th>Detail</th><th>What you get</th><th>Why it matters</th></tr></thead>
<tbody>
<tr><td>Origin</td><td>Jaipur artisan workshops</td><td>Real heritage craft</td></tr>
<tr><td>Make</td><td>Handmade finish</td><td>Unique character in every piece</td></tr>
<tr><td>Use</td><td>Home, puja and gifting</td><td>Beauty with purpose</td></tr>
<tr><td>Care</td><td>Simple dry / soft-cloth clean</td><td>Easy everyday maintenance</td></tr>
</tbody>
</table>
</figure>
<h3>A note from the workshop</h3>
<p><strong>Result:</strong> When you choose ${productName} from Jaipurio, you support living craft traditions and bring a piece of Rajasthan into your home.</p>`;

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

/** Cartesian product of { attributeId, name, values[] } entries into variant attribute combinations. */
const generateVariantCombinations = (variantAxes) => {
  const axes = variantAxes.filter((a) => Array.isArray(a.values) && a.values.length);
  if (!axes.length) return [];
  return axes.reduce(
    (combos, axis) =>
      combos.flatMap((combo) =>
        axis.values.map((value) => [...combo, { attribute: axis.attributeId, name: axis.name, value }])
      ),
    [[]]
  );
};

const variantSkuSuffix = (attrs) =>
  attrs
    .map((a) => String(a.value).replace(/[^a-zA-Z0-9]+/g, '').slice(0, 4).toUpperCase())
    .join('-');

/** Direct file upload for the vendor (the admin media library is admin-only and 403s for a vendor token). */
async function uploadFilesToServer(files) {
  if (!files?.length) return [];
  const formData = new FormData();
  files.forEach((file) => formData.append('documents', file));
  const res = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (res.data?.success && Array.isArray(res.data.data)) return res.data.data;
  throw new Error(res.data?.message || 'Image upload failed');
}

export const VendorProductEdit = ({ productId: productIdProp }) => {
  const navigate = useNavigate();
  const productId = productIdProp || 'create';
  const isCreate = !productIdProp;

  // State management for product details
  const [mongoId, setMongoId] = useState(null);
  const [name, setName] = useState('');
  const [permalink, setPermalink] = useState('');
  const [status, setStatus] = useState('Draft');
  const [store, setStore] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [brand, setBrand] = useState('');

  // Pricing & Inventory
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [costPerItem, setCostPerItem] = useState('');
  const [barcode, setBarcode] = useState('');
  const [storehouseManagement, setStorehouseManagement] = useState(true);
  const [quantity, setQuantity] = useState('');
  const [allowBackorder, setAllowBackorder] = useState(true);

  // Shipping
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');

  // Quantity Limits
  const [minOrderQty, setMinOrderQty] = useState('0');
  const [maxOrderQty, setMaxOrderQty] = useState('0');

  // Specification Table (loaded from API — no hard-coded options)
  const [specTable, setSpecTable] = useState('');
  const [specTableOptions, setSpecTableOptions] = useState([]);

  // Tags
  const [tags, setTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');

  // Collections, Labels, Taxes
  const [collections, setCollections] = useState({
    newArrival: false,
    bestSellers: false,
    specialOffer: false
  });

  const [labels, setLabels] = useState({
    hot: false,
    new: false,
    sale: false
  });

  const [tax, setTax] = useState('none');

  const [seo, setSeo] = useState(() => normalizeSeoState({}));
  const [seoOpen, setSeoOpen] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [descriptionHtml, setDescriptionHtml] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [editorsReady, setEditorsReady] = useState(Boolean(isCreate));
  // Product Images Gallery — mix of already-uploaded URL strings and freshly picked File objects
  const [images, setImages] = useState([]);
  const [featuredImage, setFeaturedImage] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef(null);

  // Category (single-select, backed by the real Category collection)
  const [categoryList, setCategoryList] = useState([]);
  const [categoryRef, setCategoryRef] = useState('');

  // Dynamic, category-driven attributes: assignments come from CategoryAttribute,
  // non-variant values are stored in `specValues`, variant-flagged attributes let
  // the vendor pick multiple values in `variantValueSelections` to generate variants.
  const [categoryAttrs, setCategoryAttrs] = useState([]);
  const [categoryAttrsLoading, setCategoryAttrsLoading] = useState(false);
  const [specValues, setSpecValues] = useState({});
  const [variantValueSelections, setVariantValueSelections] = useState({});
  const [variants, setVariants] = useState([]);

  // FAQs
  const [faqs, setFaqs] = useState([]);

  // Toast / Save State
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    liveEcommerceList('specification-tables')
      .then((list) => setSpecTableOptions(Array.isArray(list) ? list : []))
      .catch(() => setSpecTableOptions([]));
    categoryService
      .getAllCategories()
      .then((res) => setCategoryList(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setCategoryList([]));
  }, []);

  // Fetch the vendor's own store name for a brand-new product; existing products
  // carry their store on the product record itself (loaded below).
  useEffect(() => {
    if (!isCreate) return;
    let cancelled = false;
    api
      .get('/vendors/profile')
      .then((res) => {
        const storeName = res.data?.data?.vendor?.storeName || res.data?.data?.storeName || '';
        if (!cancelled && storeName) setStore(storeName);
      })
      .catch(() => {
        /* store name optional if profile lookup fails */
      });
    return () => {
      cancelled = true;
    };
  }, [isCreate]);

  // Whenever the selected category changes, load which specification attributes apply to it.
  useEffect(() => {
    if (!categoryRef) {
      setCategoryAttrs([]);
      return;
    }
    let cancelled = false;
    setCategoryAttrsLoading(true);
    fetchCategoryAttributes(categoryRef)
      .then((rows) => {
        if (!cancelled) setCategoryAttrs(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setCategoryAttrs([]);
      })
      .finally(() => {
        if (!cancelled) setCategoryAttrsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryRef]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (isCreate) {
        setEditorsReady(true);
        return;
      }
      setEditorsReady(false);
      setLoadError('');
      try {
        let product = null;
        if (isMongoId(productId)) {
          try {
            product = await fetchProductById(productId);
          } catch {
            product = null;
          }
        }
        if (!product) {
          try {
            const list = await fetchAdminProducts();
            product =
              list.find((p) => String(p._id) === String(productId) || String(p.id) === String(productId)) || null;
          } catch {
            product = null;
          }
        }
        if (!product) {
          if (!cancelled) {
            setLoadError('Could not find this product. It may have been removed, or you may not have access to it.');
            setEditorsReady(true);
          }
          return;
        }
        if (cancelled) return;
        setMongoId(product._id || (isMongoId(product.id) ? product.id : null));
        setName(product.title || product.name || '');
        setPermalink(product.slug || product.seo?.general?.slug || slugify(product.name || ''));
        setStatus(product.lifecycle || (product.published ? 'Published' : 'Draft'));
        setStore(product.store || product.storeName || '');
        setIsFeatured(Boolean(product.isFeatured || product.bestseller));
        setBrand(product.brand || '');
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
        setSpecTable(
          String(product.specificationTable?._id || product.specificationTable || '')
        );
        setCategoryRef(String(product.categoryRef?._id || product.categoryRef || ''));
        if (Array.isArray(product.specifications)) {
          const specMap = {};
          product.specifications.forEach((s) => {
            const attrId = String(s.attribute?._id || s.attribute || '');
            if (attrId) specMap[attrId] = s.value;
          });
          setSpecValues(specMap);
        }
        if (Array.isArray(product.variants) && product.variants.length) {
          setVariants(
            product.variants.map((v) => ({
              sku: v.sku || '',
              attributes: Array.isArray(v.attributes)
                ? v.attributes.map((a) => ({
                    attribute: String(a.attribute?._id || a.attribute || ''),
                    name: a.name || '',
                    value: a.value || '',
                  }))
                : [],
              price: v.price ?? '',
              oldPrice: v.oldPrice ?? '',
              salePrice: v.salePrice ?? '',
              stock: v.stock ?? '',
              weight: v.weight ?? '',
              barcode: v.barcode || '',
              images: Array.isArray(v.images) ? v.images : [],
              status: v.status || 'Draft',
            }))
          );
        }
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
        // Keep description and content separate. Short one-line stubs get rich seed HTML.
        const productName = product.title || product.name || 'Jaipurio handmade piece';
        const descRaw = product.description ?? '';
        const contentRaw = product.content ?? '';
        let nextDesc = isStubHtml(descRaw) ? buildSeedDescription(productName) : descRaw;
        let nextContent = isStubHtml(contentRaw)
          ? isStubHtml(descRaw)
            ? buildSeedContent(productName)
            : descRaw
          : contentRaw;
        if (!nextDesc || !nextContent || nextDesc === nextContent) {
          nextDesc = buildSeedDescription(productName);
          nextContent = buildSeedContent(productName);
        }
        setDescriptionHtml(nextDesc);
        setContentHtml(nextContent);
        const loadedFaqs = parseFaqsFromProduct(product.faqs);
        setFaqs(loadedFaqs?.length ? loadedFaqs : []);
        setEditorsReady(true);
      } catch {
        if (!cancelled) {
          setLoadError('Failed to load this product. Please try again.');
          setEditorsReady(true);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [productId, isCreate]);

  const nonVariantAttrs = useMemo(
    () => categoryAttrs.filter((ca) => !ca.isVariantAttribute),
    [categoryAttrs]
  );
  const variantAttrs = useMemo(
    () => categoryAttrs.filter((ca) => ca.isVariantAttribute),
    [categoryAttrs]
  );

  /** Upload any freshly-picked File objects and return resolved URL arrays for images/featuredImage. */
  const resolveImageUrls = async () => {
    const fileItems = images.filter((item) => item instanceof File);
    if (!fileItems.length) {
      return { resolvedImages: images, resolvedFeatured: featuredImage || images[0] || '' };
    }
    setUploadingImages(true);
    try {
      const uploaded = await uploadFilesToServer(fileItems);
      let cursor = 0;
      const wasFeaturedAFile = featuredImage instanceof File;
      const featuredIndex = wasFeaturedAFile ? images.indexOf(featuredImage) : -1;
      const resolvedImages = images.map((item) => (item instanceof File ? uploaded[cursor++] : item));
      const resolvedFeatured = wasFeaturedAFile
        ? resolvedImages[featuredIndex] || resolvedImages[0] || ''
        : featuredImage || resolvedImages[0] || '';
      return { resolvedImages, resolvedFeatured };
    } finally {
      setUploadingImages(false);
    }
  };

  const handleFilesSelected = (fileList) => {
    const picked = Array.from(fileList || []);
    if (!picked.length) return;
    setImages((prev) => [...prev, ...picked]);
  };

  const handleAddImageFromUrl = () => {
    const url = window.prompt('Add image from URL');
    if (!url || !url.trim()) return;
    const trimmed = url.trim();
    setImages((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    if (!featuredImage) setFeaturedImage(trimmed);
  };

  const handleSave = async (andExit = false) => {
    setSaving(true);
    setSaveError('');
    try {
      const { resolvedImages, resolvedFeatured } = await resolveImageUrls();
      setImages(resolvedImages);
      setFeaturedImage(resolvedFeatured);

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
        category: categoryList.find((c) => String(c._id) === String(categoryRef))?.title || '',
        categoryRef: categoryRef || null,
        specifications: nonVariantAttrs
          .filter((ca) => specValues[String(ca.attribute?._id || ca.attribute)] !== undefined && specValues[String(ca.attribute?._id || ca.attribute)] !== '')
          .map((ca) => {
            const attrId = String(ca.attribute?._id || ca.attribute);
            return { attribute: attrId, name: ca.attribute?.name || '', value: specValues[attrId] };
          }),
        hasVariants: variants.length > 0,
        variants: variants.map((v) => ({
          sku: v.sku,
          attributes: v.attributes,
          price: parseMoney(v.price),
          oldPrice: parseMoney(v.oldPrice) || parseMoney(v.price),
          salePrice: parseMoney(v.salePrice) || parseMoney(v.price),
          stock: Number(v.stock) || 0,
          weight: parseMoney(v.weight),
          barcode: v.barcode,
          images: v.images,
          status: v.status,
        })),
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
        specificationTable: specTable || null,
        isFeatured,
        lifecycle: status,
        images: resolvedImages,
        image: resolvedFeatured || resolvedImages[0] || '',
        tagList: tags,
        tags: tags.join(', '),
        collections,
        labels,
        description: isStubHtml(descriptionHtml)
          ? buildSeedDescription(name)
          : descriptionHtml,
        content: isStubHtml(contentHtml) ? buildSeedContent(name) : contentHtml,
        faqs: JSON.stringify(faqs),
        seo: {
          ...seo,
          general: { ...seo.general, slug: nextSlug },
        },
        seoTitle: seo.general?.metaTitle || '',
        seoDescription: seo.general?.metaDescription || '',
      };
      const saved = await saveProduct(payload, 'vendor');
      if (saved?._id) setMongoId(saved._id);
      setPermalink(nextSlug);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (andExit) navigate('/vendor/products');
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
        navigate(`/vendor/add-product?id=${newId}`);
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

  const handleSpecValueChange = (attributeId, value) => {
    setSpecValues((prev) => ({ ...prev, [attributeId]: value }));
  };

  const handleVariantValueToggle = (attributeId, value) => {
    setVariantValueSelections((prev) => {
      const current = prev[attributeId] || [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [attributeId]: next };
    });
  };

  const handleGenerateVariants = () => {
    const axes = variantAttrs
      .map((ca) => {
        const attrId = String(ca.attribute?._id || ca.attribute);
        return {
          attributeId: attrId,
          name: ca.attribute?.name || '',
          values: variantValueSelections[attrId] || [],
        };
      })
      .filter((axis) => axis.values.length);

    const combinations = generateVariantCombinations(axes);
    const baseSku = sku || slugify(name).toUpperCase().slice(0, 10) || 'VAR';
    setVariants(
      combinations.map((attrs) => {
        const existing = variants.find(
          (v) =>
            v.attributes.length === attrs.length &&
            v.attributes.every((a, i) => a.attribute === attrs[i].attribute && a.value === attrs[i].value)
        );
        if (existing) return existing;
        return {
          sku: `${baseSku}-${variantSkuSuffix(attrs)}`,
          attributes: attrs,
          price: price,
          oldPrice: price,
          salePrice: salePrice,
          stock: '',
          weight: '',
          barcode: '',
          images: [],
          status: 'Draft',
        };
      })
    );
  };

  const handleVariantFieldChange = (index, field, value) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const handleRemoveVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
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

  if (loadError) {
    return (
      <div className="bg-white p-6 rounded-md border border-slate-200 text-center space-y-2">
        <p className="text-sm font-semibold text-red-600">{loadError}</p>
        <Link to="/vendor/products" className="text-xs text-blue-600 hover:underline font-medium">
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Toast Notification */}
      {saveSuccess && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2 animate-bounce">
          <FiCheck size={16} />
          <span>Product saved successfully!</span>
        </div>
      )}

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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFilesSelected(e.target.files);
                e.target.value = '';
              }}
            />
            <div className="flex flex-wrap gap-3 items-center">
              {images.map((imgItem, idx) => {
                const src = imgItem instanceof File ? URL.createObjectURL(imgItem) : imgItem;
                return (
                  <div
                    key={idx}
                    className="relative group w-24 h-24 rounded-md border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center"
                  >
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-90 group-hover:opacity-100 transition shadow-xs hover:scale-110"
                      title="Remove image"
                    >
                      <FiTrash2 size={11} />
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImages}
                className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-md flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 transition bg-slate-50/50 disabled:opacity-60"
              >
                <FiUpload size={18} />
                <span className="text-[11px] font-medium mt-1">
                  {uploadingImages ? 'Uploading…' : 'Add Images'}
                </span>
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={handleAddImageFromUrl}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Add from URL
              </button>
              <button
                type="button"
                onClick={() => setImages([])}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
              >
                Reset
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
              <option value="">None</option>
              {specTableOptions.map((t) => (
                <option key={t._id || t.id} value={t._id || t.id}>
                  {t.name}
                </option>
              ))}
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
                </div>
                <input
                  type="text"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs font-medium"
                />
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

          {/* Card: Specifications (dynamic, category-driven, non-variant attributes) */}
          <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Specifications</h4>
            </div>
            {!categoryRef ? (
              <p className="text-[11px] text-slate-500">
                Select a category above to load the attributes that apply to this product.
              </p>
            ) : categoryAttrsLoading ? (
              <p className="text-[11px] text-slate-500">Loading attributes for this category…</p>
            ) : nonVariantAttrs.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                No non-variant attributes assigned to this category yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {nonVariantAttrs.map((ca) => {
                  const attr = ca.attribute || {};
                  const attrId = String(attr._id || ca.attribute);
                  const value = specValues[attrId] ?? '';
                  return (
                    <div key={attrId} className={attr.type === 'Textarea' ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {attr.name}
                        {ca.isRequired ? <span className="text-red-500"> *</span> : null}
                        {attr.unit ? <span className="text-slate-400 font-normal"> ({attr.unit})</span> : null}
                      </label>
                      {attr.type === 'Textarea' ? (
                        <textarea
                          rows={2}
                          value={value}
                          onChange={(e) => handleSpecValueChange(attrId, e.target.value)}
                          className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs"
                        />
                      ) : attr.type === 'Select' ? (
                        <select
                          value={value}
                          onChange={(e) => handleSpecValueChange(attrId, e.target.value)}
                          className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs bg-white"
                        >
                          <option value="">Select…</option>
                          {(attr.options || []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : attr.type === 'Radio' ? (
                        <div className="flex flex-wrap gap-3 pt-1">
                          {(attr.options || []).map((opt) => (
                            <label key={opt} className="flex items-center gap-1 text-xs cursor-pointer">
                              <input
                                type="radio"
                                name={`spec-${attrId}`}
                                checked={value === opt}
                                onChange={() => handleSpecValueChange(attrId, opt)}
                                className="text-blue-600"
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      ) : attr.type === 'Checkbox' ? (
                        <div className="flex flex-wrap gap-3 pt-1">
                          {(attr.options || []).map((opt) => {
                            const arr = Array.isArray(value) ? value : [];
                            return (
                              <label key={opt} className="flex items-center gap-1 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={arr.includes(opt)}
                                  onChange={() =>
                                    handleSpecValueChange(
                                      attrId,
                                      arr.includes(opt) ? arr.filter((v) => v !== opt) : [...arr, opt]
                                    )
                                  }
                                  className="rounded-sm border-slate-300 text-blue-600 h-3.5 w-3.5"
                                />
                                {opt}
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleSpecValueChange(attrId, e.target.value)}
                          placeholder={attr.defaultValue || ''}
                          className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card: Variants (generated from variant-flagged category attributes) */}
          {categoryRef && (variantAttrs.length > 0 || variants.length > 0) ? (
            <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Variants</h4>

              {variantAttrs.length > 0 ? (
                <div className="space-y-3 border border-slate-200 rounded-md p-3 bg-slate-50/60">
                  {variantAttrs.map((ca) => {
                    const attr = ca.attribute || {};
                    const attrId = String(attr._id || ca.attribute);
                    const selected = variantValueSelections[attrId] || [];
                    return (
                      <div key={attrId}>
                        <div className="text-xs font-semibold text-slate-700 mb-1">{attr.name}</div>
                        <div className="flex flex-wrap gap-2">
                          {(attr.options || []).map((opt) => (
                            <button
                              type="button"
                              key={opt}
                              onClick={() => handleVariantValueToggle(attrId, opt)}
                              className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                                selected.includes(opt)
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'bg-white border-slate-300 text-slate-600 hover:border-blue-400'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                          {!(attr.options || []).length ? (
                            <span className="text-[11px] text-slate-400">
                              No values defined for this attribute yet.
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleGenerateVariants}
                    className="text-xs bg-slate-800 hover:bg-slate-900 text-white font-semibold px-3 py-1.5 rounded-md"
                  >
                    Generate variants
                  </button>
                </div>
              ) : null}

              {variants.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] border border-slate-200 rounded-md overflow-hidden">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="text-left px-2 py-1.5 font-semibold">Combination</th>
                        <th className="text-left px-2 py-1.5 font-semibold">SKU</th>
                        <th className="text-left px-2 py-1.5 font-semibold">Price ₹</th>
                        <th className="text-left px-2 py-1.5 font-semibold">Sale ₹</th>
                        <th className="text-left px-2 py-1.5 font-semibold">Stock</th>
                        <th className="text-left px-2 py-1.5 font-semibold">Status</th>
                        <th className="px-2 py-1.5"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v, index) => (
                        <tr key={index} className="border-t border-slate-100">
                          <td className="px-2 py-1.5 text-slate-700">
                            {v.attributes.map((a) => a.value).join(' / ') || '—'}
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={v.sku}
                              onChange={(e) => handleVariantFieldChange(index, 'sku', e.target.value)}
                              className="w-28 border border-slate-300 rounded-sm py-1 px-1.5 font-mono"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={v.price}
                              onChange={(e) => handleVariantFieldChange(index, 'price', e.target.value)}
                              className="w-20 border border-slate-300 rounded-sm py-1 px-1.5"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={v.salePrice}
                              onChange={(e) => handleVariantFieldChange(index, 'salePrice', e.target.value)}
                              className="w-20 border border-slate-300 rounded-sm py-1 px-1.5"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={v.stock}
                              onChange={(e) => handleVariantFieldChange(index, 'stock', e.target.value)}
                              className="w-16 border border-slate-300 rounded-sm py-1 px-1.5"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <select
                              value={v.status}
                              onChange={(e) => handleVariantFieldChange(index, 'status', e.target.value)}
                              className="border border-slate-300 rounded-sm py-1 px-1 bg-white"
                            >
                              <option value="Draft">Draft</option>
                              <option value="Pending Approval">Pending Approval</option>
                            </select>
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(index)}
                              className="text-slate-400 hover:text-red-600"
                              title="Remove variant"
                            >
                              <FiTrash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}

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
                              ogImage: featuredImage instanceof File ? '' : featuredImage || images[0] || '',
                              twitterTitle: metaTitle,
                              twitterDescription: metaDescription,
                              twitterImage: featuredImage instanceof File ? '' : featuredImage || images[0] || '',
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
                disabled={saving || uploadingImages}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-md text-xs shadow-xs transition disabled:opacity-60"
              >
                <FiSave size={14} />
                <span>{saving ? 'Saving…' : 'Save'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving || uploadingImages}
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
              <option value="Draft">Draft</option>
              <option value="Pending Approval">Pending Approval</option>
            </select>
            <p className="text-[10px] text-slate-400">
              Submit as "Pending Approval" to send this product to the admin team for review before it goes live.
            </p>
          </div>

          {/* Card: Store (read-only — your own store, from your vendor profile) */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Store</h4>
            <input
              type="text"
              value={store}
              readOnly
              className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs bg-slate-50 text-slate-600"
            />
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

          {/* Card: Category (single-select, from the real Category collection) */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Category
            </h4>
            <select
              value={categoryRef}
              onChange={(e) => setCategoryRef(e.target.value)}
              className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs bg-white text-slate-700 focus:outline-hidden focus:border-blue-500"
            >
              <option value="">Select a category…</option>
              {categoryList.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.path || c.title}
                </option>
              ))}
            </select>
            {!categoryList.length ? (
              <p className="text-[11px] text-amber-600">No categories available yet.</p>
            ) : !categoryRef ? (
              <p className="text-[11px] text-slate-400">Selecting a category loads its dynamic attributes below.</p>
            ) : null}
          </div>

          {/* Card: Brand */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Brand</h4>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Jaipurio Heritage"
              className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs"
            />
          </div>

          {/* Card: Featured Image */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Featured image (optional)
            </h4>
            <div className="relative group w-full h-44 rounded-md border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
              {featuredImage ? (
                <img
                  src={featuredImage instanceof File ? URL.createObjectURL(featuredImage) : featuredImage}
                  alt="Featured"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[11px] text-slate-400">No featured image selected</span>
              )}
              {featuredImage ? (
                <button
                  type="button"
                  onClick={() => setFeaturedImage('')}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-90 group-hover:opacity-100 transition shadow-xs"
                  title="Remove image"
                >
                  <FiTrash2 size={13} />
                </button>
              ) : null}
            </div>
            <div className="flex items-center justify-between text-xs text-blue-600 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="hover:underline font-medium"
              >
                Choose image
              </button>
              <span className="text-slate-400">or</span>
              <button
                type="button"
                onClick={() => {
                  const url = window.prompt('Add featured image from URL');
                  if (url && url.trim()) setFeaturedImage(url.trim());
                }}
                className="hover:underline font-medium"
              >
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
    </>
  );
};

export default VendorProductEdit;
