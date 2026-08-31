import api from './api';
import { loginAdminApi } from './adminApi';

const AUTH_KEY = 'jaipurio_admin_auth';
const USER_KEY = 'jaipurio_admin_user';
const TOKEN_KEY = 'admin_token';
const LOGS_KEY = 'jaipurio_admin_logs';
const THEME_KEY = 'jaipurio_admin_theme';
const WIDGETS_KEY = 'jaipurio_admin_widgets';

export const ADMIN_DEMO = {
  name: 'Admin Final',
  email: 'admin@gmail.com',
  password: 'admin',
  role: 'Super Admin',
};

export function getAdminUser() {
  try {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore */
  }
  return null;
}

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function isAdminAuthenticated() {
  try {
    return localStorage.getItem(AUTH_KEY) === '1' && Boolean(getAdminToken()) && Boolean(getAdminUser());
  } catch {
    return false;
  }
}

export async function loginAdmin({ email, password, remember }) {
  try {
    const data = await loginAdminApi(email.trim(), password);
    const user = {
      name: data.name || ADMIN_DEMO.name,
      email: data.email,
      role: data.role || 'admin',
    };

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(AUTH_KEY, '1');
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (remember) localStorage.setItem('jaipurio_admin_remember', email);
    else localStorage.removeItem('jaipurio_admin_remember');

    pushActivityLog({
      actor: user.name,
      message: `${user.name} logged in to the system`,
    });

    return { ok: true, user };
  } catch (err) {
    return {
      ok: false,
      message: err.response?.data?.message || err.message || 'Could not sign in. Check backend is running.',
    };
  }
}

export function logoutAdmin() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function pushActivityLog({ actor, message, ip }) {
  const entry = {
    id: `log-${Date.now()}`,
    actor: actor || 'Admin Final',
    message,
    ip: ip || '103.21.244.12',
    createdAt: new Date().toISOString(),
  };
  const logs = getActivityLogs();
  localStorage.setItem(LOGS_KEY, JSON.stringify([entry, ...logs].slice(0, 40)));
  return entry;
}

export function getActivityLogs() {
  try {
    const saved = localStorage.getItem(LOGS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore */
  }
  return [
    {
      id: 'log-1',
      actor: 'Admin Final',
      message: 'Admin Final logged in to the system',
      ip: '103.21.244.12',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export function getAdminTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function setAdminTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function getWidgetPrefs() {
  try {
    const saved = localStorage.getItem(WIDGETS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore */
  }
  return { stats: true, posts: true, logs: true };
}

export function setWidgetPrefs(prefs) {
  localStorage.setItem(WIDGETS_KEY, JSON.stringify(prefs));
}

export function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function loadCollection(id, seed) {
  try {
    const saved = localStorage.getItem(`jaipurio_admin_${id}`);
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore */
  }
  return seed || [];
}

export function saveCollection(id, items) {
  localStorage.setItem(`jaipurio_admin_${id}`, JSON.stringify(items));
}

/** Dispatch after admin actions so layout badges refresh */
export function refreshAdminBadges() {
  window.dispatchEvent(new CustomEvent('jaipurio:admin-badges-refresh'));
}
