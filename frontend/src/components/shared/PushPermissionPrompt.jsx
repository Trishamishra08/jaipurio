import React, { useEffect, useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { enablePush, getPushState } from '../../services/pushNotificationService';

const DISMISS_DAYS = 14;
const dismissKey = (role) => `jaipurio_push_dismissed_${role}`;
const dismissedRecently = (role) => {
  const at = Number(localStorage.getItem(dismissKey(role)) || 0);
  return at && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
};

/**
 * Friendly "turn on notifications" card: the only place permission is requested.
 * Hidden when push isn't available, already on, handled by the native app, or dismissed.
 *
 * @param {'user'|'vendor'|'admin'} role
 * @param {string} title / text   copy for the module
 * @param {boolean} dismissible   show a close button (remembered for 14 days)
 * @param {boolean} showBlocked   when the browser blocked notifications, explain how to unblock
 */
const PushPermissionPrompt = ({ role, title, text, dismissible = true, showBlocked = false, className = '', onEnabled }) => {
  const [state, setState] = useState(() => getPushState(role));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [hidden, setHidden] = useState(() => dismissible && dismissedRecently(role));

  useEffect(() => setState(getPushState(role)), [role]);

  if (hidden || state === 'unsupported' || state === 'in-app' || state === 'enabled') return null;
  if (state === 'denied' && !showBlocked) return null;

  const turnOn = async () => {
    setBusy(true);
    setMessage('');
    const result = await enablePush(role);
    setBusy(false);
    setState(result.state);
    if (!result.ok) setMessage(result.message || '');
    else onEnabled?.();
  };

  const dismiss = () => {
    localStorage.setItem(dismissKey(role), String(Date.now()));
    setHidden(true);
  };

  return (
    <div
      role="region"
      aria-label="Notifications"
      className={`flex flex-wrap items-center gap-3 rounded-xl border border-[#E8D4B5] bg-[#FCF8F2] px-4 py-3 ${className}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6F241D] text-white">
        {state === 'denied' ? <BellOff size={17} /> : <Bell size={17} />}
      </span>
      <div className="min-w-0 flex-1 text-[13px] text-[#3F261B]">
        <p className="font-semibold">{state === 'denied' ? 'Notifications are blocked' : title}</p>
        <p className="text-[12px] text-[#806653]">
          {state === 'denied'
            ? 'Allow notifications for this site in your browser settings (lock icon in the address bar), then reload.'
            : text}
        </p>
        {message && <p className="mt-1 text-[12px] text-red-600">{message}</p>}
      </div>
      {state !== 'denied' && (
        <button
          type="button"
          onClick={turnOn}
          disabled={busy}
          className="rounded-full bg-[#6F241D] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#873A24] disabled:opacity-60"
        >
          {busy ? 'Turning on…' : 'Turn on'}
        </button>
      )}
      {dismissible && (
        <button type="button" onClick={dismiss} aria-label="Dismiss" className="p-1 text-[#9A8B7A] hover:text-[#6F241D]">
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default PushPermissionPrompt;
