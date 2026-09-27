import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { Save, Check, AlertCircle, Upload, ExternalLink } from 'lucide-react';
import api from '../../utils/api';

const PAGE_CONFIG = {
  'robots-txt': {
    title: 'Robots.txt Editor',
    contentTitle: 'Robots.txt Content',
    crumb: 'ROBOTS.TXT EDITOR',
    field: 'robotsTxt',
    defaultCode: 'User-agent: *\nAllow: /\n\nSitemap: https://jaipurio.in/sitemap.xml',
    fileLabel: 'Upload robots.txt file',
    fileHelp: 'If you want to upload a robots.txt file, please select it here.',
    accept: '.txt,text/plain',
    externalLink: {
      text: 'After saved, you can check your robots.txt here: ',
      url: 'https://jaipurio.in/robots.txt',
    },
  },
  robots: {
    title: 'Robots.txt Editor',
    contentTitle: 'Robots.txt Content',
    crumb: 'ROBOTS.TXT EDITOR',
    field: 'robotsTxt',
    defaultCode: 'User-agent: *\nAllow: /\n\nSitemap: https://jaipurio.in/sitemap.xml',
    fileLabel: 'Upload robots.txt file',
    fileHelp: 'If you want to upload a robots.txt file, please select it here.',
    accept: '.txt,text/plain',
    externalLink: {
      text: 'After saved, you can check your robots.txt here: ',
      url: 'https://jaipurio.in/robots.txt',
    },
  },
  'custom-css': {
    title: 'Custom CSS',
    contentTitle: 'Custom CSS Content',
    crumb: 'CUSTOM CSS',
    field: 'customCss',
    defaultCode: '/* Jaipurio Custom CSS */\n\n:root {\n  --brand-primary: #000000;\n}\n\n.site-announcement {\n  letter-spacing: 0.05em;\n}',
    fileLabel: 'Upload CSS file',
    fileHelp: 'If you want to upload a .css file, please select it here.',
    accept: '.css,text/css',
    note: 'Add your custom CSS here. It will be loaded on every storefront page in the <head>.',
  },
  'custom-js': {
    title: 'Custom JS',
    contentTitle: 'Custom JS Content',
    crumb: 'CUSTOM JS',
    field: 'customJs',
    defaultCode: '// Jaipurio Custom JavaScript\n\n(function() {\n  console.log("Jaipurio storefront initialized");\n})();',
    fileLabel: 'Upload JavaScript file',
    fileHelp: 'If you want to upload a .js file, please select it here.',
    accept: '.js,text/javascript',
    note: 'Add your custom JavaScript here. It will be loaded before the closing </body> tag on storefront pages.',
  },
  'custom-html': {
    title: 'Custom HTML',
    contentTitle: 'Custom HTML Content',
    crumb: 'CUSTOM HTML',
    field: 'customHtml',
    defaultCode: '<!-- Jaipurio Custom HTML Header/Footer Tags -->\n<meta name="theme-color" content="#182433">\n',
    fileLabel: 'Upload HTML file',
    fileHelp: 'If you want to upload a .html file, please select it here.',
    accept: '.html,.txt,text/html',
    note: 'Add custom HTML snippet (meta tags, tracking scripts, schema JSON-LD, etc.).',
  },
};

const AdminCodeEditorPage = () => {
  const location = useLocation();
  const params = useParams();

  // Determine section from pathname or params
  const segment = location.pathname.split('/').pop() || params.section || 'robots-txt';
  const config = PAGE_CONFIG[segment] || PAGE_CONFIG['robots-txt'];

  const [code, setCode] = useState(config.defaultCode);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fileName, setFileName] = useState('');

  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  // Load from backend
  const loadCode = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/settings');
      const settings = res.data?.data?.settings || {};
      const savedVal = settings[config.field];
      if (savedVal !== undefined && savedVal !== null && savedVal !== '') {
        setCode(savedVal);
      } else {
        setCode(config.defaultCode);
      }
    } catch (err) {
      console.warn('Could not load code, fallback to default:', err.message);
      setCode(config.defaultCode);
    } finally {
      setLoading(false);
    }
  }, [config.field, config.defaultCode]);

  useEffect(() => {
    loadCode();
  }, [loadCode]);

  // Handle scroll sync between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Compute line count
  const lines = (code || '').split('\n');
  const lineCount = Math.max(lines.length, 1);

  // File upload handler
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setCode(content);
      }
    };
    reader.readAsText(file);
  };

  // Save handler
  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      await api.put('/settings', {
        [config.field]: code,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      setErrorMsg(err.parsedMessage || err.message || 'Failed to save changes.');
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
          <span className="text-slate-500">APPEARANCE</span>
          <span>/</span>
          <span className="text-blue-600 font-bold">{config.crumb}</span>
        </nav>
      </div>

      {/* Notifications */}
      {savedSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center gap-2">
          <Check size={15} className="text-emerald-600" />
          <span>Saved successfully!</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-md flex items-center gap-2">
          <AlertCircle size={15} className="text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2-Column Botble Layout (Col 9 / Col 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editor & File Upload */}
        <div className="lg:col-span-9 bg-white rounded-lg border border-slate-200 shadow-2xs p-5 md:p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">
            {config.contentTitle}
          </h2>

          {/* Line-numbered Code Editor Box */}
          <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-2xs">
            <div className="flex">
              {/* Line Numbers Gutter */}
              <div
                ref={lineNumbersRef}
                className="bg-slate-50 border-r border-slate-200 text-slate-400 select-none text-right px-3 py-3 font-mono text-xs leading-6 overflow-hidden min-w-[45px]"
                aria-hidden="true"
              >
                {Array.from({ length: lineCount }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Code Textarea */}
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onScroll={handleScroll}
                rows={16}
                spellCheck={false}
                className="w-full font-mono text-xs text-slate-800 leading-6 p-3 focus:outline-hidden whitespace-pre resize-y min-h-[300px] bg-transparent"
                placeholder={config.defaultCode}
              />
            </div>

            {/* Resize handle bar */}
            <div className="h-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center text-[10px] text-slate-400 select-none">
              ≡
            </div>
          </div>

          {/* External Link or Note */}
          {config.externalLink && (
            <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
              <span>{config.externalLink.text}</span>
              <a
                href={config.externalLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-mono inline-flex items-center gap-1"
              >
                <span>{config.externalLink.url}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}

          {config.note && (
            <p className="mt-3 text-xs text-slate-400">{config.note}</p>
          )}

          {/* File Upload Section */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-800 mb-2">
              {config.fileLabel}
            </label>
            <div className="flex items-center border border-slate-200 rounded-md bg-white overflow-hidden p-1 shadow-2xs">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-sm cursor-pointer transition">
                <Upload size={13} />
                <span>Choose File</span>
                <input
                  type="file"
                  accept={config.accept}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-slate-500 ml-3 truncate">
                {fileName || 'No file chosen'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">{config.fileHelp}</p>
          </div>
        </div>

        {/* Right Column: Publish Card */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-slate-200 shadow-2xs p-4">
          <h3 className="font-semibold text-sm text-slate-900 pb-3 border-b border-slate-100 mb-4">
            Publish
          </h3>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 bg-black hover:bg-neutral-800 active:scale-[0.98] text-white text-xs font-medium rounded-md shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : savedSuccess ? (
              <Check size={14} className="text-emerald-400" />
            ) : (
              <Save size={14} />
            )}
            <span>{saving ? 'Saving...' : savedSuccess ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCodeEditorPage;
