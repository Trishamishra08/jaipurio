import React, { useEffect, useState } from 'react';
import { FiInfo } from 'react-icons/fi';
import AdminPageHeader from './AdminPageHeader';
import api from '../../utils/api';

const AdminAdsSettings = () => {
  const [headerScript, setHeaderScript] = useState('');
  const [adsenseClientId, setAdsenseClientId] = useState('');
  const [enableAds, setEnableAds] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/ads/settings')
      .then((res) => {
        const data = res.data?.data || {};
        setHeaderScript(data.headerScript || '');
        setAdsenseClientId(data.adsenseClientId || '');
        setEnableAds(data.enableAds !== false);
      })
      .catch((err) => setError(err.parsedMessage || err.message || 'Failed to load ads settings.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put('/ads/settings', { headerScript, adsenseClientId, enableAds });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to save ads settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <AdminPageHeader title="Ads Settings" hideAction />
        <p className="text-sm text-slate-400 py-10 text-center">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title="Ads Settings" hideAction />
      <p className="text-xs text-slate-500 -mt-3 mb-4">Manage ads settings</p>

      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
      {saved && <p className="text-sm text-emerald-700 mb-3">Saved successfully.</p>}

      <div className="max-w-2xl space-y-5">
        <label className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-md p-4 shadow-2xs cursor-pointer">
          <span className="text-xs font-bold text-slate-700">Enable ads module</span>
          <button
            type="button"
            role="switch"
            aria-checked={enableAds}
            onClick={() => setEnableAds((v) => !v)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${enableAds ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${enableAds ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
          </button>
        </label>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-2">
          <label className="block text-xs font-bold text-slate-700">Google AdSense Auto Ads Snippet</label>
          <textarea
            value={headerScript}
            onChange={(e) => setHeaderScript(e.target.value)}
            rows={10}
            placeholder={'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"\n     crossorigin="anonymous"></script>'}
            className="w-full border border-slate-300 rounded-md py-2.5 px-3 text-xs font-mono text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y bg-slate-50"
          />
          <p className="text-[11px] text-slate-500">
            You can get this snippet from Google AdSense — go to Ads → Get code → copy the code snippet and paste it here.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-2">
          <label className="block text-xs font-bold text-slate-700">Google AdSense Unit Ads Client ID</label>
          <input
            value={adsenseClientId}
            onChange={(e) => setAdsenseClientId(e.target.value)}
            placeholder="ca-pub-123456789"
            className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs font-mono text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-[11px] text-slate-500">
            You can get this from Google AdSense — go to Ads → Unit Ads → Get code → copy the client ID and paste it here.
          </p>
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-md p-4 flex items-start gap-2.5 text-xs text-sky-800">
          <FiInfo size={16} className="text-sky-500 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-bold">Where to get Google AdSense Client ID?</p>
            <ol className="list-decimal list-inside space-y-0.5 text-sky-700">
              <li>Sign in to your Google AdSense account.</li>
              <li>Go to <strong>Ads</strong> in the left menu.</li>
              <li>Select <strong>By ad unit</strong>, then <strong>Get code</strong>.</li>
              <li>Copy the client ID (starts with <code className="bg-sky-100 px-1 rounded">ca-pub-</code>) and paste it above.</li>
            </ol>
            <p className="text-sky-500 pt-1">Credentials aren't required to save — add them whenever you're ready.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-md text-xs font-semibold bg-slate-900 hover:bg-black disabled:opacity-60 text-white"
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  );
};

export default AdminAdsSettings;
