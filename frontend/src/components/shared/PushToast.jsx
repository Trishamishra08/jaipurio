import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { roleForPath } from '../../services/pushNotificationService';

/**
 * In-page toast for a push that arrives while the site is open (the browser doesn't show an
 * OS notification for a focused tab). Only shows messages meant for the module being viewed.
 */
const PushToast = () => {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onMessage = (e) => {
      const d = e.detail || {};
      if (d.role && d.role !== roleForPath()) return;
      clearTimeout(timer.current);
      setToast(d);
      timer.current = setTimeout(() => setToast(null), 7000);
    };
    window.addEventListener('jaipurio:notification', onMessage);
    return () => {
      window.removeEventListener('jaipurio:notification', onMessage);
      clearTimeout(timer.current);
    };
  }, []);

  if (!toast) return null;

  const open = () => {
    const link = toast.link || '/';
    setToast(null);
    if (/^https?:\/\//i.test(link)) window.location.href = link;
    else navigate(link);
  };

  return (
    <div className="fixed right-3 top-3 z-[400] w-[min(92vw,22rem)]" role="status" aria-live="polite">
      <div className="flex items-start gap-3 rounded-xl border border-[#E8D4B5] bg-white p-3 shadow-xl">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6F241D] text-white">
          <Bell size={15} />
        </span>
        <button type="button" onClick={open} className="min-w-0 flex-1 text-left">
          <p className="truncate text-[13px] font-semibold text-[#2B1E1A]">{toast.title}</p>
          {toast.body && <p className="line-clamp-2 text-[12px] text-[#806653]">{toast.body}</p>}
        </button>
        <button type="button" onClick={() => setToast(null)} aria-label="Dismiss" className="p-1 text-[#9A8B7A] hover:text-[#6F241D]">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default PushToast;
