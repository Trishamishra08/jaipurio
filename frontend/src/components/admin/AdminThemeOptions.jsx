import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import {
  Home,
  Palette,
  Compass,
  BookOpen,
  Image as ImageIcon,
  Store,
  PenSquare,
  ShoppingCart,
  Link2,
  Type,
  Share2,
  ShieldCheck,
  Mail,
  Check,
  ChevronDown,
  Upload,
  Trash2,
  AlertCircle,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { FaFacebook } from 'react-icons/fa';
import api from '../../utils/api';
import { mediaUrl } from '../../data/cloudinaryMedia';
import MediaGalleryModal from './ecommerce/MediaGalleryModal';

// 15 Subsections matching Jaipurio / Botble Theme Options
export const THEME_TABS = [
  {
    id: 'opt-text-subsection-general',
    name: 'General',
    crumb: 'GENERAL',
    icon: Home,
  },
  {
    id: 'opt-text-subsection-style',
    name: 'Style',
    crumb: 'STYLE',
    icon: Palette,
  },
  {
    id: 'opt-text-subsection-breadcrumb',
    name: 'Breadcrumb',
    crumb: 'BREADCRUMB',
    icon: Compass,
  },
  {
    id: 'opt-text-subsection-page',
    name: 'Page',
    crumb: 'PAGE',
    icon: BookOpen,
  },
  {
    id: 'opt-text-subsection-logo',
    name: 'Logo',
    crumb: 'LOGO',
    icon: ImageIcon,
  },
  {
    id: 'opt-text-subsection-facebook-integration',
    name: 'Facebook Integration',
    crumb: 'FACEBOOK INTEGRATION',
    icon: FaFacebook,
  },
  {
    id: 'opt-text-subsection-marketplace',
    name: 'Marketplace',
    crumb: 'MARKETPLACE',
    icon: Store,
  },
  {
    id: 'opt-text-subsection-blog',
    name: 'Blog',
    crumb: 'BLOG',
    icon: PenSquare,
  },
  {
    id: 'opt-text-subsection-ecommerce',
    name: 'Ecommerce',
    crumb: 'ECOMMERCE',
    icon: ShoppingCart,
  },
  {
    id: 'opt-text-subsection-ecommerce-slug',
    name: 'Ecommerce URLs',
    crumb: 'ECOMMERCE URLS',
    icon: Link2,
  },
  {
    id: 'opt-text-subsection-typography',
    name: 'Typography',
    crumb: 'TYPOGRAPHY',
    icon: Type,
  },
  {
    id: 'opt-text-subsection-social-links',
    name: 'Social Links',
    crumb: 'SOCIAL LINKS',
    icon: Share2,
  },
  {
    id: 'opt-text-subsection-cookie-consent',
    name: 'Cookie Consent',
    crumb: 'COOKIE CONSENT',
    icon: ShieldCheck,
  },
  {
    id: 'opt-text-subsection-newsletter-popup',
    name: 'Newsletter Popup',
    crumb: 'NEWSLETTER POPUP',
    icon: Mail,
  },
  {
    id: 'opt-text-subsection-social-sharing',
    name: 'Social Sharing',
    crumb: 'SOCIAL SHARING',
    icon: Share2,
  },
];

// Comprehensive initial defaults for all 15 sections
const DEFAULT_THEME_DATA = {
  // General
  stickyHeader: 'Yes',
  stickyHeaderMobile: 'Yes',
  stickyHeaderPosition: 'Header middle',
  enablePreloader: 'Yes',
  enableLazyLoad: 'Yes',
  imagePlaceholder: '/matka.png',
  siteTitle: 'Jaipurio',
  siteTagline: 'Authentic Mitti & Handicraft Bazaar',
  copyrightText: 'Copyright 2026 © Jaipurio. All rights reserved.',

  // Style
  primaryColor: '#000000',
  secondaryColor: '#6c7a91',
  headingColor: '#182433',
  textColor: '#182433',
  linkColor: '#206bc4',
  linkHoverColor: '#1a569d',
  backgroundColor: '#ffffff',
  accentColor: '#792823',

  // Breadcrumb
  enableBreadcrumb: 'Yes',
  breadcrumbStyle: 'Default',
  breadcrumbBgImage: '/jaipurio_home_banner.jpg',
  breadcrumbOverlayOpacity: '0.4',
  breadcrumbAlign: 'Left',

  // Page
  pageBannerEnabled: 'Yes',
  pageDefaultBanner: '/jaipurio_banner.png',
  enablePageComments: 'No',
  showBreadcrumbOnPages: 'Yes',
  pageLayout: 'Full width',

  // Logo
  logoMain: '/jaipurio_logo.png',
  logoDark: '/jaipurio_logo_bg.png',
  logoMobile: '/jaipurio_logo.png',
  favicon: '/favicon.png',
  logoHeight: '45',
  logoMaxWidth: '180',

  // Facebook Integration
  facebookAppId: '',
  facebookAdminId: '',
  facebookPageUrl: 'https://facebook.com/jaipurio',
  facebookPixelId: '',
  facebookChatEnabled: 'No',
  facebookCommentsEnabled: 'No',

  // Marketplace
  enableMarketplace: 'Yes',
  allowVendorRegistration: 'Yes',
  vendorCommission: '10',
  minimumPayout: '1000',
  vendorStoreBanner: '/jaipurio_banner_clean.jpg',
  showVendorInfoOnProduct: 'Yes',

  // Blog
  blogTitle: 'Our Stories & Insights',
  blogDescription: 'Discover the rich heritage and handcrafted traditions of Rajasthan artisans.',
  blogLayout: 'Grid',
  postsPerPage: '9',
  showAuthorBio: 'Yes',
  showPostDate: 'Yes',
  enableRelatedPosts: 'Yes',
  enableBlogComments: 'Yes',

  // Ecommerce
  productsPerPage: '16',
  productLayout: 'Grid view',
  enableQuickView: 'Yes',
  enableWishlist: 'Yes',
  enableProductComparison: 'Yes',
  showOutOfStockBadge: 'Yes',
  lowInventoryThreshold: '5',
  freeShippingThreshold: '1000',
  standardDeliveryCharge: '50',
  enableCod: 'Yes',

  // Ecommerce URLs
  slugProducts: 'products',
  slugCategories: 'product-categories',
  slugTags: 'product-tags',
  slugBrands: 'brands',
  slugCollections: 'collections',

  // Typography
  primaryFont: 'Inter Tight',
  headingFont: 'Playfair Display',
  baseFontSize: '14',
  headingFontWeight: '600',
  loadGoogleFonts: 'Yes',

  // Social Links
  socialFacebook: 'https://facebook.com/jaipurio',
  socialInstagram: 'https://instagram.com/jaipurio',
  socialTwitter: 'https://twitter.com/jaipurio',
  socialYoutube: 'https://youtube.com/@jaipurio',
  socialPinterest: 'https://pinterest.com/jaipurio',
  socialWhatsapp: '+919829012345',
  socialLinkedin: 'https://linkedin.com/company/jaipurio',

  // Cookie Consent
  enableCookieConsent: 'Yes',
  cookieMessage: 'We use cookies to improve your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.',
  cookieAcceptBtn: 'Accept All',
  cookieDeclineBtn: 'Decline',
  cookiePrivacyUrl: '/privacy-policy',
  cookiePosition: 'Bottom',

  // Newsletter Popup
  enableNewsletterPopup: 'Yes',
  newsletterTitle: 'Subscribe to Our Newsletter',
  newsletterSubtitle: 'Get 10% off your first handcrafted mitti order plus exclusive heritage stories.',
  newsletterImage: '/jaipurio_banner_art.jpg',
  newsletterDelay: '5',
  newsletterDaysToHide: '7',

  // Social Sharing
  shareOnProductPage: 'Yes',
  shareOnBlogPage: 'Yes',
  shareFacebook: 'Yes',
  shareTwitter: 'Yes',
  shareWhatsapp: 'Yes',
  sharePinterest: 'Yes',
  shareLinkedin: 'Yes',
  shareTelegram: 'No',
};

const AdminThemeOptions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Determine active tab from URL or query
  const rawTab = params.tab || params['*'] || '';
  const currentTabId = useMemo(() => {
    const match = THEME_TABS.find(
      (t) =>
        t.id === rawTab ||
        rawTab.endsWith(t.id) ||
        rawTab === t.id.replace('opt-text-subsection-', '')
    );
    return match ? match.id : THEME_TABS[0].id;
  }, [rawTab]);

  const activeTab = useMemo(
    () => THEME_TABS.find((t) => t.id === currentTabId) || THEME_TABS[0],
    [currentTabId]
  );

  const [formData, setFormData] = useState(DEFAULT_THEME_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedLang, setSelectedLang] = useState('English');
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaTargetKey, setMediaTargetKey] = useState(null);

  const openMediaPicker = (key) => {
    setMediaTargetKey(key);
    setMediaModalOpen(true);
  };

  // Load persisted settings from backend
  const loadSettings = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/settings');
      const dbSettings = res.data?.data?.settings || {};
      const themeSettings = dbSettings.theme || {};
      setFormData((prev) => ({
        ...prev,
        ...themeSettings,
      }));
    } catch (err) {
      console.warn('Could not load theme settings, using local defaults:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleTabChange = (tabId) => {
    // Navigate smoothly to the requested route
    navigate(`/admin/theme/options/${tabId}`);
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      await api.put('/settings', {
        theme: formData,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      setErrorMsg(err.parsedMessage || err.message || 'Failed to save theme options.');
    } finally {
      setSaving(false);
    }
  };

  // Reusable Form Controls
  const renderSelect = (label, key, options, helpText) => (
    <div className="mb-5">
      <label className="block text-[13px] font-medium text-slate-800 mb-2">
        {label}
      </label>
      <div className="relative">
        <select
          value={formData[key] ?? options[0]}
          onChange={(e) => handleChange(key, e.target.value)}
          className="w-full appearance-none bg-white border border-slate-200 rounded-md px-3.5 py-2 text-[13px] text-slate-800 focus:outline-hidden focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-colors shadow-2xs cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3.5 top-3 text-slate-400 pointer-events-none"
        />
      </div>
      {helpText && <p className="text-xs text-slate-400 mt-1">{helpText}</p>}
    </div>
  );

  const renderInput = (label, key, type = 'text', placeholder = '', helpText) => (
    <div className="mb-5">
      <label className="block text-[13px] font-medium text-slate-800 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={formData[key] ?? ''}
        placeholder={placeholder}
        onChange={(e) => handleChange(key, e.target.value)}
        className="w-full bg-white border border-slate-200 rounded-md px-3.5 py-2 text-[13px] text-slate-800 focus:outline-hidden focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-colors shadow-2xs"
      />
      {helpText && <p className="text-xs text-slate-400 mt-1">{helpText}</p>}
    </div>
  );

  const renderTextarea = (label, key, rows = 3, placeholder = '', helpText) => (
    <div className="mb-5">
      <label className="block text-[13px] font-medium text-slate-800 mb-2">
        {label}
      </label>
      <textarea
        rows={rows}
        value={formData[key] ?? ''}
        placeholder={placeholder}
        onChange={(e) => handleChange(key, e.target.value)}
        className="w-full bg-white border border-slate-200 rounded-md px-3.5 py-2 text-[13px] text-slate-800 focus:outline-hidden focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-colors shadow-2xs resize-y"
      />
      {helpText && <p className="text-xs text-slate-400 mt-1">{helpText}</p>}
    </div>
  );

  const renderColorPicker = (label, key) => (
    <div className="mb-5">
      <label className="block text-[13px] font-medium text-slate-800 mb-2">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={formData[key] || '#000000'}
          onChange={(e) => handleChange(key, e.target.value)}
          className="w-10 h-10 p-0.5 rounded-md border border-slate-200 cursor-pointer"
        />
        <input
          type="text"
          value={formData[key] || ''}
          onChange={(e) => handleChange(key, e.target.value)}
          className="w-36 bg-white border border-slate-200 rounded-md px-3 py-1.5 text-[13px] font-mono text-slate-700"
        />
      </div>
    </div>
  );

  const renderImagePicker = (label, key, note = 'Select or enter image URL') => {
    const val = formData[key] || '';
    return (
      <div className="mb-6">
        <label className="block text-[13px] font-medium text-slate-800 mb-2">
          {label}
        </label>
        <div className="flex flex-col sm:flex-row items-start gap-4 p-4 border border-slate-200 rounded-lg bg-slate-50/50">
          <div className="w-24 h-24 rounded-md border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
            {val ? (
              <img
                src={mediaUrl(val)}
                alt={label}
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = mediaUrl('/matka.png');
                }}
              />
            ) : (
              <ImageIcon className="text-slate-300" size={32} />
            )}
          </div>
          <div className="flex-1 w-full space-y-2">
            <input
              type="text"
              value={val}
              placeholder="e.g. /matka.png or https://..."
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-[13px] text-slate-700 focus:outline-hidden focus:border-slate-400"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openMediaPicker(key)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                <Upload size={13} />
                <span>Choose image</span>
              </button>
              {val && (
                <button
                  type="button"
                  onClick={() => handleChange(key, '')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-md transition"
                >
                  <Trash2 size={13} />
                  <span>Remove</span>
                </button>
              )}
            </div>
            {note && <p className="text-[11px] text-slate-400">{note}</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb */}
      <div className="mb-4">
        <nav className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          <Link to="/admin" className="text-blue-600 hover:underline">
            DASHBOARD
          </Link>
          <span>/</span>
          <span className="text-slate-500">APPEARANCE</span>
          <span>/</span>
          <span className="text-blue-600 font-bold">
            THEME OPTIONS - {activeTab.crumb}
          </span>
        </nav>
      </div>

      {/* Page Header with Title, Language and Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Theme Options
        </h1>

        <div className="flex items-center gap-4">
          {/* Translations selector */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Translations:</span>
            <div className="relative inline-block">
              <button
                type="button"
                className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300"
              >
                <span>🇺🇸</span>
                <span>{selectedLang}</span>
                <ChevronDown size={14} className="text-slate-400 ml-1" />
              </button>
            </div>
          </div>

          {/* Save Changes button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-black hover:bg-neutral-800 active:scale-[0.98] text-white text-xs font-semibold rounded-md shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : savedSuccess ? (
              <Check size={14} className="text-emerald-400" />
            ) : null}
            <span>{saving ? 'Saving...' : savedSuccess ? 'Saved!' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {savedSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center gap-2">
          <Check size={15} className="text-emerald-600" />
          <span>Theme settings have been saved successfully.</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-md flex items-center gap-2">
          <AlertCircle size={15} className="text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar of Subsections */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {THEME_TABS.map((tab) => {
              const IconComp = tab.icon;
              const isActive = tab.id === currentTabId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-[13px] font-normal transition-colors text-left ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <IconComp
                    size={16}
                    className={`shrink-0 ${
                      isActive ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content Form Area */}
        <div className="lg:col-span-9 bg-white rounded-lg border border-slate-200 shadow-2xs p-6 md:p-8">
          <form onSubmit={handleSave}>
            {/* 1. GENERAL */}
            {currentTabId === 'opt-text-subsection-general' && (
              <div>
                <h2 className="text-base font-semibold text-slate-900 mb-5 pb-3 border-b border-slate-100">
                  General Settings
                </h2>
                {renderSelect('Enable sticky header?', 'stickyHeader', ['Yes', 'No'])}
                {renderSelect('Enable sticky header on mobile?', 'stickyHeaderMobile', ['Yes', 'No'])}
                {renderSelect('Sticky header content position?', 'stickyHeaderPosition', [
                  'Header middle',
                  'Header top',
                  'Header bottom',
                ])}
                {renderSelect('Enable Preloader?', 'enablePreloader', ['Yes', 'No'])}
                {renderSelect('Enable lazy load images?', 'enableLazyLoad', ['Yes', 'No'])}
                {renderImagePicker('Image placeholder', 'imagePlaceholder', 'Fallback image displayed while media assets are loading.')}
                {renderInput('Site title', 'siteTitle', 'text', 'Jaipurio')}
                {renderInput('Site tagline', 'siteTagline', 'text', 'Authentic Mitti & Handicraft Bazaar')}
                {renderInput('Copyright text', 'copyrightText', 'text', '© 2026 Jaipurio. All Rights Reserved.')}
              </div>
            )}

            {/* 2. STYLE */}
            {currentTabId === 'opt-text-subsection-style' && (
              <div>
                <h2 className="text-base font-semibold text-slate-900 mb-5 pb-3 border-b border-slate-100">
                  Theme Colors & Appearance
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderColorPicker('Primary color', 'primaryColor')}
                  {renderColorPicker('Secondary color', 'secondaryColor')}
                  {renderColorPicker('Heading color', 'headingColor')}
                  {renderColorPicker('Text color', 'textColor')}
                  {renderColorPicker('Link color', 'linkColor')}
                  {renderColorPicker('Link hover color', 'linkHoverColor')}
                  {renderColorPicker('Accent / Brand color', 'accentColor')}
                  {renderColorPicker('Background color', 'backgroundColor')}
                </div>
              </div>
            )}

            {/* 3. BREADCRUMB */}
            {currentTabId === 'opt-text-subsection-breadcrumb' && (
              <div>
                <h2 className="text-base font-semibold text-slate-900 mb-5 pb-3 border-b border-slate-100">
                  Breadcrumb Settings
                </h2>
                {renderSelect('Enable breadcrumb?', 'enableBreadcrumb', ['Yes', 'No'])}
                {renderSelect('Breadcrumb style', 'breadcrumbStyle', ['Default', 'Compact', 'Minimal', 'Centered'])}
                {renderSelect('Breadcrumb text alignment', 'breadcrumbAlign', ['Left', 'Center', 'Right'])}
                {renderInput('Breadcrumb overlay opacity (0.0 to 1.0)', 'breadcrumbOverlayOpacity', 'text', '0.4')}
                {renderImagePicker('Breadcrumb background image', 'breadcrumbBgImage')}
              </div>
            )}

            {/* 4. PAGE */}
            {currentTabId === 'opt-text-subsection-page' && (
              <div>
                <h2 className="text-base font-semibold text-slate-900 mb-5 pb-3 border-b border-slate-100">
                  Page Options
                </h2>
                {renderSelect('Default page banner enabled?', 'pageBannerEnabled', ['Yes', 'No'])}
                {renderSelect('Show breadcrumbs on pages?', 'showBreadcrumbOnPages', ['Yes', 'No'])}
                {renderSelect('Default page layout', 'pageLayout', ['Full width', 'With sidebar', 'Centered container'])}
                {renderSelect('Enable page comments?', 'enablePageComments', ['Yes', 'No'])}
                {renderImagePicker('Default page banner image', 'pageDefaultBanner')}
              </div>
            )}

            {/* 5. LOGO */}
            {currentTabId === 'opt-text-subsection-logo' && (
              <div>
                <h2 className="text-base font-semibold text-slate-900 mb-5 pb-3 border-b border-slate-100">
                  Logo & Favicon
                </h2>
                {renderImagePicker('Main Logo', 'logoMain', 'Recommended height: 45px, transparent PNG/SVG/WebP.')}
                {renderImagePicker('Dark Mode Logo', 'logoDark', 'Alternative light logo used on dark headers or themes.')}
                {renderImagePicker('Mobile Logo', 'logoMobile', 'Optimized logo for mobile viewport.')}
                {renderImagePicker('Favicon', 'favicon', 'Favicon image (16x16, 32x32, or 64x64 PNG).')}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderInput('Logo height (px)', 'logoHeight', 'number', '45')}
                  {renderInput('Logo max width (px)', 'logoMaxWidth', 'number', '180')}
                </div>
              </div>
            )}

            {/* 6. FACEBOOK INTEGRATION */}
            {currentTabId === 'opt-text-subsection-facebook-integration' && (
              <div>
                <h2 className="text-base font-semibold text-slate-900 mb-5 pb-3 border-b border-slate-100">
                  Facebook Integration
                </h2>
                {renderInput('Facebook App ID', 'facebookAppId', 'text', 'e.g. 123456789012345')}
                {renderInput('Facebook Admin ID', 'facebookAdminId', 'text', 'e.g. 100000000000000')}
                {renderInput('Facebook Page URL', 'facebookPageUrl', 'text', 'https://facebook.com/jaipurio')}
                {renderInput('Facebook Pixel ID', 'facebookPixelId', 'text', 'e.g. 987654321098765')}
                {renderSelect('Enable Facebook Chat widget?', 'facebookChatEnabled', ['No', 'Yes'])}
                {renderSelect('Enable Facebook Comments?', 'facebookCommentsEnabled', ['No', 'Yes'])}
              </div>
            )}

            {/* 7. MARKETPLACE */}
            {currentTabId === 'opt-text-subsection-marketplace' && (
              <div>
                <h2 className="text-base font-semibold text-slate-900 mb-5 pb-3 border-b border-slate-100">
                  Marketplace Options
                </h2>
                {renderSelect('Enable multi-vendor marketplace?', 'enableMarketplace', ['Yes', 'No'])}
                {renderSelect('Allow vendor registration?', 'allowVendorRegistration', ['Yes', 'No'])}
                {renderInput('Default vendor commission (%)', 'vendorCommission', 'number', '10')}
                {renderInput('Minimum payout amount (₹)', 'minimumPayout', 'number', '1000')}
                {renderSelect('Show vendor info on product detail page?', 'showVendorInfoOnProduct', ['Yes', 'No'])}
                {renderImagePicker('Vendor store banner placeholder', 'vendorStoreBanner')}
              </div>
            )}

            {/* 8. BLOG */}
            {currentTabId === 'opt-text-subsection-blog' && (
              <div>
                <h2 className="text-base font-semibold text-slate-900 mb-5 pb-3 border-b border-slate-100">
                  Blog Options
                </h2>
                {renderInput('Blog page title', 'blogTitle', 'text', 'Our Stories & Insights')}
                {renderTextarea('Blog page description', 'blogDescription', 2)}
                {renderSelect('Blog layout', 'blogLayout', ['Grid', 'List', 'Masonry', 'Classic'])}
                {renderInput('Posts per page', 'postsPerPage', 'number', '9')}
                {renderSelect('Show author info?', 'showAuthorBio', ['Yes', 'No'])}
                {renderSelect('Show publication date?', 'showPostDate', ['Yes', 'No'])}
                {renderSelect('Enable related posts?', 'enableRelatedPosts', ['Yes', 'No'])}
                {renderSelect('Enable blog comments?', 'enableBlogComments', ['Yes', 'No'])}
              </div>
            )}

            {/* 9. ECOMMERCE */}
            {currentTabId === 'opt-text-subsection-ecommerce' && (
              <div>
                <h2 className="text-base font-semibold text-slate-900 mb-5 pb-3 border-b border-slate-100">
                  Ecommerce Settings
                </h2>
                {renderInput('Number of products per page', 'productsPerPage', 'number', '16')}
                {renderSelect('Default product display', 'productLayout', ['Grid view', 'List view'])}
                {renderSelect('Enable quick view popup?', 'enableQuickView', ['Yes', 'No'])}
                {renderSelect('Enable wishlist?', 'enableWishlist', ['Yes', 'No'])}
                {renderSelect('Enable product comparison?', 'enableProductComparison', ['Yes', 'No'])}
                {renderSelect('Show out of stock badge?', 'showOutOfStockBadge', ['Yes', 'No'])}
                {renderInput('Low inventory threshold alert', 'lowInventoryThreshold', 'number', '5')}
                {renderInput('Free shipping threshold (₹)', 'freeShippingThreshold', 'number', '1000')}
                {renderInput('Standard delivery charge (₹)', 'standardDeliveryCharge', 'number', '50')}
                {renderSelect('Enable Cash on Delivery (COD)?', 'enableCod', ['Yes', 'No'])}
              </div>
            )}

            {/* 10. ECOMMERCE URLS */}
            {currentTabId === 'opt-text-subsection-ecommerce-slug' && (
              <div>
                <h2 className="text-base font-semibold text-slate-900 mb-5 pb-3 border-b border-slate-100">
                  Ecommerce URL Slugs
                </h2>
                {renderInput('Product slug prefix', 'slugProducts', 'text', 'products', 'Pattern: /products/:slug')}
                {renderInput('Product category slug', 'slugCategories', 'text', 'product-categories', 'Pattern: /product-categories/:slug')}
                {renderInput('Product tag slug', 'slugTags', 'text', 'product-tags', 'Pattern: /product-tags/:slug')}
                {renderInput('Product brand slug', 'slugBrands', 'text', 'brands', 'Pattern: /brands/:slug')}
                {renderInput('Product collection slug', 'slugCollections', 'text', 'collections', 'Pattern: /collections/:slug')}
              </div>
            )}

            {/* 11. TYPOGRAPHY */}
            {currentTabId === 'opt-text-subsection-typography' && (
              <div>
                <h2 className="text-base font-semibold text-slate-900 mb-5 pb-3 border-b border-slate-100">
                  Typography Settings
                </h2>
                {renderSelect('Primary font family', 'primaryFont', [
                  'Inter Tight',
                  'DM Sans',
                  'Outfit',
                  'Roboto',
                  'Open Sans',
                  'Poppins',
                ])}
                {renderSelect('Heading font family', 'headingFont', [
                  'Playfair Display',
                  'DM Serif Display',
                  'Montserrat',
                  'Cinzel',
                  'Inter Tight',
                ])}
                {renderInput('Base font size (px)', 'baseFontSize', 'number', '14')}
                {renderSelect('Heading font weight', 'headingFontWeight', ['400', '500', '600', '700', '800'])}
                {renderSelect('Load Google Fonts automatically?', 'loadGoogleFonts', ['Yes', 'No'])}
              </div>
            )}

            {/* 12. SOCIAL LINKS */}
            {currentTabId === 'opt-text-subsection-social-links' && (
              <div>
                <h2 className="text-base font-semibold text-slate-900 mb-5 pb-3 border-b border-slate-100">
                  Social Media Links
                </h2>
                {renderInput('Facebook URL', 'socialFacebook', 'text', 'https://facebook.com/jaipurio')}
                {renderInput('Instagram URL', 'socialInstagram', 'text', 'https://instagram.com/jaipurio')}
                {renderInput('Twitter / X URL', 'socialTwitter', 'text', 'https://twitter.com/jaipurio')}
                {renderInput('YouTube URL', 'socialYoutube', 'text', 'https://youtube.com/@jaipurio')}
                {renderInput('Pinterest URL', 'socialPinterest', 'text', 'https://pinterest.com/jaipurio')}
                {renderInput('WhatsApp Business Number / Link', 'socialWhatsapp', 'text', '+919829012345')}
                {renderInput('LinkedIn URL', 'socialLinkedin', 'text', 'https://linkedin.com/company/jaipurio')}
              </div>
            )}

            {/* 13. COOKIE CONSENT */}
            {currentTabId === 'opt-text-subsection-cookie-consent' && (
              <div>
                <h2 className="text-base font-semibold text-slate-900 mb-5 pb-3 border-b border-slate-100">
                  Cookie Consent Banner
                </h2>
                {renderSelect('Enable cookie consent banner?', 'enableCookieConsent', ['Yes', 'No'])}
                {renderTextarea('Cookie consent message', 'cookieMessage', 4)}
                {renderInput('Accept button text', 'cookieAcceptBtn', 'text', 'Accept All')}
                {renderInput('Decline button text', 'cookieDeclineBtn', 'text', 'Decline')}
                {renderInput('Privacy policy page URL', 'cookiePrivacyUrl', 'text', '/privacy-policy')}
                {renderSelect('Banner position', 'cookiePosition', ['Bottom', 'Bottom Left', 'Bottom Right', 'Top'])}
              </div>
            )}

            {/* 14. NEWSLETTER POPUP */}
            {currentTabId === 'opt-text-subsection-newsletter-popup' && (
              <div>
                <h2 className="text-base font-semibold text-slate-900 mb-5 pb-3 border-b border-slate-100">
                  Newsletter Popup
                </h2>
                {renderSelect('Enable newsletter popup?', 'enableNewsletterPopup', ['Yes', 'No'])}
                {renderInput('Popup title', 'newsletterTitle', 'text', 'Subscribe to Our Newsletter')}
                {renderTextarea('Popup description', 'newsletterSubtitle', 3)}
                {renderImagePicker('Popup background image', 'newsletterImage')}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderInput('Display delay (seconds)', 'newsletterDelay', 'number', '5')}
                  {renderInput('Do not show again for (days)', 'newsletterDaysToHide', 'number', '7')}
                </div>
              </div>
            )}

            {/* 15. SOCIAL SHARING */}
            {currentTabId === 'opt-text-subsection-social-sharing' && (
              <div>
                <h2 className="text-base font-semibold text-slate-900 mb-5 pb-3 border-b border-slate-100">
                  Social Sharing Buttons
                </h2>
                {renderSelect('Enable social sharing on product pages?', 'shareOnProductPage', ['Yes', 'No'])}
                {renderSelect('Enable social sharing on blog posts?', 'shareOnBlogPage', ['Yes', 'No'])}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  {renderSelect('Share on Facebook', 'shareFacebook', ['Yes', 'No'])}
                  {renderSelect('Share on Twitter / X', 'shareTwitter', ['Yes', 'No'])}
                  {renderSelect('Share on WhatsApp', 'shareWhatsapp', ['Yes', 'No'])}
                  {renderSelect('Share on Pinterest', 'sharePinterest', ['Yes', 'No'])}
                  {renderSelect('Share on LinkedIn', 'shareLinkedin', ['Yes', 'No'])}
                  {renderSelect('Share on Telegram', 'shareTelegram', ['No', 'Yes'])}
                </div>
              </div>
            )}

            {/* Bottom Save bar */}
            <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-black hover:bg-neutral-800 active:scale-[0.98] text-white text-xs font-semibold rounded-md shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : savedSuccess ? (
                  <Check size={14} className="text-emerald-400" />
                ) : null}
                <span>{saving ? 'Saving Changes...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <MediaGalleryModal
        open={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onInsert={(asset) => {
          if (asset?.url && mediaTargetKey) handleChange(mediaTargetKey, asset.url);
          setMediaModalOpen(false);
        }}
      />
    </div>
  );
};

export default AdminThemeOptions;
