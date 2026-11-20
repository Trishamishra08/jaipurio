import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const LABELS = {
  cloudflare_account_id: 'Cloudflare Account ID (free AI images)',
  cloudflare_api_token: 'Cloudflare API Token, Workers AI (free AI images)',
  pollinations_api_key: 'Pollinations key (optional fallback)',
};

/** Free AI image keys for the Claude connector. Saved encrypted; a saved value is never shown again. */
const AdminAiKeys = () => {
  const [keys, setKeys] = useState([]);
  const [values, setValues] = useState({});
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/admin/ai-keys').then((r) => setKeys(r.data.keys || [])).catch(() => {});
  }, []);

  const save = async (name) => {
    setMsg('');
    try {
      const r = await api.post('/admin/ai-keys', { name, value: values[name] || '' });
      setKeys(r.data.keys || []);
      setValues((v) => ({ ...v, [name]: '' }));
      setMsg(`${name} saved`);
    } catch (e) {
      setMsg(e?.response?.data?.message || e.message);
    }
  };

  return (
    <div className="mt-6 bg-white border border-slate-200 rounded-lg p-5" id="ai-keys">
      <h2 className="text-sm font-semibold text-slate-800">AI image keys</h2>
      <p className="text-xs text-slate-500 mb-4">Free Cloudflare Workers AI first, Pollinations as fallback. Saved encrypted; never shown again.</p>
      {keys.map((k) => (
        <div key={k.name} className="flex flex-wrap items-center gap-3 py-2 border-t border-slate-100" data-key={k.name}>
          <div className="flex-1 min-w-[220px]">
            <div className="text-xs font-medium text-slate-800">{LABELS[k.name] || k.name}</div>
            <div className="text-[11px] text-slate-500">{k.name} · {k.set ? 'set' : 'not set'}</div>
          </div>
          <input
            type="password"
            autoComplete="off"
            aria-label={k.name}
            value={values[k.name] || ''}
            onChange={(e) => setValues((v) => ({ ...v, [k.name]: e.target.value }))}
            className="flex-1 min-w-[220px] bg-white border border-slate-200 rounded-md px-3 py-2 text-xs"
          />
          <button type="button" onClick={() => save(k.name)} disabled={!values[k.name]} className="px-4 py-2 text-xs font-medium bg-black text-white rounded-md disabled:opacity-50">
            Save
          </button>
        </div>
      ))}
      {msg ? <p className="text-xs mt-3 text-slate-600">{msg}</p> : null}
    </div>
  );
};

export default AdminAiKeys;
