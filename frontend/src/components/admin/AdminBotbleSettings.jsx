import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Folder,
  Link2,
  Languages,
  Palette,
  Key,
  Box,
  Table,
  Globe,
  Gauge,
  MessageSquare,
  Check,
  AlertCircle,
  X,
  Save
} from 'lucide-react';
import api from '../../utils/api';

const COMMON_SETTINGS = [
  {
    id: 'email',
    title: 'Email',
    description: 'View and update your email settings and email templates',
    icon: Mail,
    fields: [
      { key: 'emailSenderName', label: 'Sender Name', type: 'text', default: 'Jaipurio Admin' },
      { key: 'emailSenderAddress', label: 'Sender Email Address', type: 'email', default: 'support@jaipurio.in' },
      { key: 'emailDriver', label: 'Mail Driver', type: 'select', options: ['SMTP', 'Sendmail', 'SES', 'Mailgun'] },
      { key: 'smtpHost', label: 'SMTP Host', type: 'text', default: 'smtp.gmail.com' },
      { key: 'smtpPort', label: 'SMTP Port', type: 'number', default: 587 },
      { key: 'smtpEncryption', label: 'Encryption', type: 'select', options: ['TLS', 'SSL', 'None'] },
    ],
  },
  {
    id: 'email-templates',
    title: 'Email templates',
    description: 'Email templates using HTML & system variables.',
    icon: Mail,
    fields: [
      { key: 'emailHeaderLogo', label: 'Email Header Logo URL', type: 'text', default: '/jaipurio_logo.png' },
      { key: 'emailFooterText', label: 'Email Footer Copyright', type: 'text', default: '© 2026 Jaipurio Bazaar' },
      { key: 'orderConfirmationSubject', label: 'Order Confirmation Subject', type: 'text', default: 'Your Jaipurio Order #{order_id} has been confirmed!' },
    ],
  },
  {
    id: 'email-rules',
    title: 'Email rules',
    description: 'Configure email rules for validation',
    icon: Mail,
    fields: [
      { key: 'emailStrictDomainCheck', label: 'Strict MX / DNS Domain Verification', type: 'select', options: ['Enabled', 'Disabled'] },
      { key: 'emailBlacklistDomains', label: 'Blocked Disposable Domains', type: 'textarea', default: 'mailinator.com, tempmail.com, 10minutemail.com' },
    ],
  },
  {
    id: 'media',
    title: 'Media',
    description: 'View and update your media settings',
    icon: Folder,
    link: '/admin/media',
    fields: [
      { key: 'mediaDriver', label: 'Media Storage Driver', type: 'select', options: ['Cloudinary', 'Local Server Storage', 'AWS S3'] },
      { key: 'mediaMaxUploadSize', label: 'Max Upload File Size (MB)', type: 'number', default: 15 },
      { key: 'mediaAllowedExtensions', label: 'Allowed File Extensions', type: 'text', default: 'jpg, png, webp, mp4, svg, pdf' },
    ],
  },
  {
    id: 'permalink',
    title: 'Permalink',
    description: 'View and update your permalink settings',
    icon: Link2,
    fields: [
      { key: 'permalinkProductPrefix', label: 'Product URL Structure', type: 'text', default: '/products/:slug' },
      { key: 'permalinkCategoryPrefix', label: 'Category URL Structure', type: 'text', default: '/product-categories/:slug' },
      { key: 'permalinkBlogPrefix', label: 'Blog Post URL Structure', type: 'text', default: '/blogs/:slug' },
    ],
  },
  {
    id: 'languages',
    title: 'Languages',
    description: 'View and update your website languages',
    icon: Languages,
    fields: [
      { key: 'defaultLanguage', label: 'Default Storefront Language', type: 'select', options: ['English (US)', 'Hindi (India)', 'Rajasthani'] },
      { key: 'enableMultiLang', label: 'Enable Multi-Language Switcher', type: 'select', options: ['Yes', 'No'] },
    ],
  },
  {
    id: 'admin-appearance',
    title: 'Admin appearance',
    description: 'View and update logo, favicon, layout,...',
    icon: Palette,
    link: '/admin/theme/options/opt-text-subsection-general',
  },
  {
    id: 'api-settings',
    title: 'API Settings',
    description: 'View and update your API settings',
    icon: Key,
    fields: [
      { key: 'apiRateLimit', label: 'API Rate Limit (Requests per minute)', type: 'number', default: 120 },
      { key: 'apiPublicToken', label: 'Public Storefront API Key', type: 'text', default: 'jp_live_pk_9942a7810bce42' },
      { key: 'apiCorsAllowed', label: 'Allowed CORS Domains', type: 'text', default: '*' },
    ],
  },
  {
    id: 'cache',
    title: 'Cache',
    description: 'Config cache for system for optimize speed',
    icon: Box,
    fields: [
      { key: 'cacheDriver', label: 'Cache Backend Engine', type: 'select', options: ['Redis', 'In-Memory Cache', 'File Cache'] },
      { key: 'cacheTTL', label: 'Default Cache Lifetime (seconds)', type: 'number', default: 300 },
      { key: 'enableQueryCache', label: 'Enable Catalog Query Cache', type: 'select', options: ['Yes', 'No'] },
    ],
  },
  {
    id: 'datatables',
    title: 'Datatables',
    description: 'Settings for datatables',
    icon: Table,
    fields: [
      { key: 'datatablePageLength', label: 'Default Rows Per Page', type: 'select', options: ['10', '25', '50', '100'] },
      { key: 'datatableShowSearch', label: 'Show Instant Search Bar', type: 'select', options: ['Yes', 'No'] },
      { key: 'datatableShowExportButtons', label: 'Show Quick Export Toolbar', type: 'select', options: ['Yes', 'No'] },
    ],
  },
  {
    id: 'website-tracking',
    title: 'Website Tracking',
    description: 'Configure website tracking',
    icon: Globe,
    fields: [
      { key: 'googleAnalyticsId', label: 'Google Analytics 4 Measurement ID', type: 'text', default: 'G-XXXXXXXXXX' },
      { key: 'facebookPixelId', label: 'Facebook Meta Pixel ID', type: 'text', default: '' },
      { key: 'googleTagManagerId', label: 'Google Tag Manager Container ID', type: 'text', default: 'GTM-XXXXXXX' },
    ],
  },
  {
    id: 'optimize',
    title: 'Optimize',
    description: 'Minify HTML output, inline CSS, remove comments...',
    icon: Gauge,
    fields: [
      { key: 'optMinifyHtml', label: 'Minify Server HTML Response', type: 'select', options: ['Yes', 'No'] },
      { key: 'optInlineCriticalCss', label: 'Inline Critical CSS Assets', type: 'select', options: ['Yes', 'No'] },
      { key: 'optCompressImages', label: 'Auto WebP Compression on Upload', type: 'select', options: ['Yes', 'No'] },
    ],
  },
];

const LOCALIZATION_SETTINGS = [
  {
    id: 'locales',
    title: 'Locales',
    description: 'View, download and import locales',
    icon: Globe,
    fields: [
      { key: 'localeTimeZone', label: 'Default Timezone', type: 'select', options: ['Asia/Kolkata (IST)', 'UTC', 'America/New_York (EST)'] },
      { key: 'localeDateFormat', label: 'Date Format Display', type: 'select', options: ['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY'] },
      { key: 'localeCurrency', label: 'Store Currency', type: 'select', options: ['INR (₹)', 'USD ($)', 'EUR (€)', 'GBP (£)'] },
    ],
  },
  {
    id: 'theme-translations',
    title: 'Theme Translations',
    description: 'Manage the theme translations',
    icon: Languages,
    link: '/admin/theme/options/opt-text-subsection-general',
  },
  {
    id: 'other-translations',
    title: 'Other Translations',
    description: 'Manage the other translations (admin, plugins, packages...)',
    icon: MessageSquare,
    fields: [
      { key: 'translationAutoFallback', label: 'Auto Fallback to English on missing keys', type: 'select', options: ['Yes', 'No'] },
      { key: 'translationStoragePath', label: 'Translations Storage Directory', type: 'text', default: 'lang/' },
    ],
  },
];

const AdminBotbleSettings = () => {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    api.get('/settings')
      .then((res) => {
        const s = res.data?.data?.settings || {};
        setFormData(s);
      })
      .catch(() => {});
  }, []);

  const handleCardClick = (item) => {
    if (item.link) {
      navigate(item.link);
      return;
    }
    setActiveItem(item);
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', formData);
      showToast('success', `${activeItem.title} settings saved successfully.`);
      setActiveItem(null);
    } catch (err) {
      showToast('error', err.parsedMessage || err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Breadcrumb */}
      <div className="mb-4">
        <nav className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          <Link to="/admin" className="text-blue-600 hover:underline">
            DASHBOARD
          </Link>
          <span>/</span>
          <span className="text-blue-600 font-bold">SETTINGS</span>
        </nav>
      </div>

      {/* Toast notifications */}
      {toast && (
        <div
          className={`mb-4 p-3 text-xs rounded-md flex items-center gap-2 border ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <Check size={15} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={15} className="text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-6 md:p-8 space-y-8">
        {/* Section 1: Common */}
        <div>
          <h2 className="text-base font-semibold text-slate-800 mb-4 tracking-tight">
            Common
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMMON_SETTINGS.map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className="flex items-start gap-4 p-4 rounded-lg border border-slate-100 bg-white hover:border-slate-300 hover:shadow-2xs transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-400 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
                    <IconComp size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[13px] text-slate-800 group-hover:text-blue-600 transition-colors leading-tight mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-normal line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Localization */}
        <div className="pt-4 border-t border-slate-100">
          <h2 className="text-base font-semibold text-slate-800 mb-4 tracking-tight">
            Localization
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LOCALIZATION_SETTINGS.map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className="flex items-start gap-4 p-4 rounded-lg border border-slate-100 bg-white hover:border-slate-300 hover:shadow-2xs transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-400 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
                    <IconComp size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[13px] text-slate-800 group-hover:text-blue-600 transition-colors leading-tight mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-normal line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Drawer Modal */}
      {activeItem && activeItem.fields && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full p-6 relative">
            <button
              type="button"
              onClick={() => setActiveItem(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <activeItem.icon size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {activeItem.title} Settings
                </h3>
                <p className="text-xs text-slate-400">
                  {activeItem.description}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {activeItem.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-slate-800 mb-1.5">
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={formData[field.key] ?? field.options[0]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-slate-400"
                    >
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      rows={3}
                      value={formData[field.key] ?? field.default ?? ''}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-slate-400"
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.key] ?? field.default ?? ''}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-slate-400"
                    />
                  )}
                </div>
              ))}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-medium bg-black hover:bg-neutral-800 text-white rounded-md shadow-xs transition disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {saving ? (
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={13} />
                  )}
                  <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBotbleSettings;
