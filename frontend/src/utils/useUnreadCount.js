import { useCallback, useEffect, useState } from 'react';
import api from './api';
import { getRoleAuthToken } from '../services/pushNotificationService';

/** Tell every bell/inbox that notifications changed (after marking read, etc.). */
export const notificationsChanged = () => window.dispatchEvent(new CustomEvent('jaipurio:notifications-changed'));

/**
 * Unread notification count for a role ('user' | 'vendor' | 'admin'). Refreshes every
 * minute, when the tab regains focus, and instantly when a push arrives.
 */
export const useUnreadCount = (role, { enabled = true } = {}) => {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const token = getRoleAuthToken(role);
    if (!enabled || !token) {
      setCount(0);
      return;
    }
    try {
      const res = await api.get('/notifications/unread-count', { headers: { Authorization: `Bearer ${token}` } });
      setCount(Number(res.data?.data?.unread) || 0);
    } catch {
      /* keep the last known count */
    }
  }, [role, enabled]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 60000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    window.addEventListener('jaipurio:notification', refresh);
    window.addEventListener('jaipurio:notifications-changed', refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('jaipurio:notification', refresh);
      window.removeEventListener('jaipurio:notifications-changed', refresh);
    };
  }, [refresh]);

  return [count, refresh];
};
