const AUTH_KEY = 'jaipurio_admin_auth';
const USER_KEY = 'jaipurio_admin_user';
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

export function isAdminAuthenticated() {
  try {
    return localStorage.getItem(AUTH_KEY) === '1' && Boolean(getAdminUser());
  } catch {
    return false;
  }
}

export function loginAdmin({ email, password, remember }) {
  const match =
    email.trim().toLowerCase() === ADMIN_DEMO.email &&
    password === ADMIN_DEMO.password;

  if (!match) {
    return { ok: false, message: 'These credentials do not match our records.' };
  }

  const user = {
    name: ADMIN_DEMO.name,
    email: ADMIN_DEMO.email,
    role: ADMIN_DEMO.role,
  };

  localStorage.setItem(AUTH_KEY, '1');
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (remember) localStorage.setItem('jaipurio_admin_remember', email);
  else localStorage.removeItem('jaipurio_admin_remember');

  pushActivityLog({
    actor: user.name,
    message: `${user.name} logged in to the system`,
  });

  return { ok: true, user };
}

export function logoutAdmin() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
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
    {
      id: 'log-2',
      actor: 'Admin Final',
      message: 'Admin Final updated product "Rajasthani Design Matka (5L)"',
      ip: '103.21.244.12',
      createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-3',
      actor: 'Admin Final',
      message: 'Admin Final created a new order #ORD-JM-8921',
      ip: '49.36.18.201',
      createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-4',
      actor: 'Admin Final',
      message: 'Admin Final logged in to the system',
      ip: '49.36.18.201',
      createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-5',
      actor: 'Admin Final',
      message: 'Admin Final published post "Handcrafted Terracotta Planters"',
      ip: '103.21.244.12',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
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
