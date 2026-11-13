import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api';

const inputCls =
  'w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500';
const btnCls =
  'px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-md text-xs font-bold';

const errText = (e) => e.response?.data?.message || e.message || 'Something went wrong.';

/**
 * Turn admin two-factor sign-in (authenticator app) on or off.
 * Flow: Set up → add the key to the app → type the 6-digit code to confirm.
 */
const TwoFactorPanel = () => {
  const [enabled, setEnabled] = useState(null); // null = loading
  const [setup, setSetup] = useState(null); // { secret, otpauthUrl } while enrolling
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/users/2fa/status');
      setEnabled(Boolean(res.data?.data?.enabled));
    } catch (e) {
      setErr(errText(e));
      setEnabled(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn) => {
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      await fn();
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  };

  const startSetup = () =>
    run(async () => {
      const res = await api.post('/users/2fa/setup');
      setSetup(res.data.data);
      setCode('');
    });

  const confirmEnable = (e) => {
    e.preventDefault();
    run(async () => {
      const res = await api.post('/users/2fa/enable', { code });
      setMsg(res.data.message);
      setSetup(null);
      setCode('');
      setEnabled(true);
    });
  };

  const disable = (e) => {
    e.preventDefault();
    run(async () => {
      const res = await api.post('/users/2fa/disable', { password, code });
      setMsg(res.data.message);
      setPassword('');
      setCode('');
      setEnabled(false);
    });
  };

  if (enabled === null) return <p className="text-xs text-slate-400">Loading…</p>;

  const groupedKey = setup?.secret?.match(/.{1,4}/g)?.join(' ');

  return (
    <div className="max-w-md">
      {err && <p className="mb-3 text-xs text-rose-600 font-medium">{err}</p>}
      {msg && <p className="mb-3 text-xs text-emerald-600 font-medium">{msg}</p>}

      <div className="flex items-center justify-between p-3 border border-slate-200 rounded-md mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-800">Two-factor authentication</p>
          <p className="text-[11px] text-slate-400">
            Asks for a 6-digit code from your authenticator app each time you sign in.
          </p>
        </div>
        <span
          className={`text-[11px] font-bold px-2 py-1 rounded-full ${
            enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {enabled ? 'ON' : 'OFF'}
        </span>
      </div>

      {!enabled && !setup && (
        <button type="button" onClick={startSetup} disabled={busy} className={btnCls}>
          Set up two-factor
        </button>
      )}

      {!enabled && setup && (
        <form onSubmit={confirmEnable} className="space-y-4">
          <ol className="list-decimal pl-4 text-xs text-slate-600 space-y-1.5">
            <li>Open Google Authenticator, Authy or 1Password.</li>
            <li>Choose “Add account” → “Enter a setup key”.</li>
            <li>
              Account: <b>Jaipurio</b>. Key (time-based):
              <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-md font-mono text-[13px] tracking-wider text-slate-900 select-all break-all">
                {groupedKey}
              </div>
            </li>
            <li>Type the 6-digit code the app shows now:</li>
          </ol>
          <input
            className={inputCls}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            required
          />
          <div className="flex gap-2">
            <button type="submit" disabled={busy || code.length !== 6} className={btnCls}>
              Turn on
            </button>
            <button
              type="button"
              onClick={() => {
                setSetup(null);
                setErr('');
              }}
              className="px-5 py-2 border border-slate-300 rounded-md text-xs font-bold text-slate-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {enabled && (
        <form onSubmit={disable} className="space-y-4">
          <p className="text-xs text-slate-500">
            To turn it off, enter your password and a current code from the app.
          </p>
          <input
            type="password"
            className={inputCls}
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            className={inputCls}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            required
          />
          <button type="submit" disabled={busy || code.length !== 6} className={btnCls}>
            Turn off two-factor
          </button>
        </form>
      )}
    </div>
  );
};

export default TwoFactorPanel;
