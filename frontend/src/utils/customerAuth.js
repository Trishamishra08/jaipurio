import api from './api';

const DEMO_TOKEN = 'demo-token-jaipurio';

export function getCustomerToken() {
  const token = localStorage.getItem('customer_token');
  if (!token || token === DEMO_TOKEN) return null;
  return token;
}

export function isDemoToken() {
  return localStorage.getItem('customer_token') === DEMO_TOKEN;
}

/** Exchange demo/local session for a real API JWT (used at checkout). */
export async function ensureCustomerAuth() {
  const existing = getCustomerToken();
  if (existing) return existing;

  try {
    const res = await api.post('/users/login', {
      email: 'customer@gmail.com',
      password: 'customer123',
    });
    if (!res.data?.success) return null;

    const { token, ...userData } = res.data.data || {};
    if (!token) return null;

    localStorage.setItem('customer_token', token);
    localStorage.setItem('jaipurio_auth', '1');
    localStorage.setItem('jaipurio_user', JSON.stringify(userData));
    return token;
  } catch {
    return null;
  }
}

export async function loginDemoCustomer(userData) {
  try {
    const res = await api.post('/users/login', {
      email: 'customer@gmail.com',
      password: 'customer123',
    });
    if (res.data?.success) {
      const { token, ...profile } = res.data.data || {};
      localStorage.setItem('customer_token', token);
      localStorage.setItem('jaipurio_auth', '1');
      localStorage.setItem(
        'jaipurio_user',
        JSON.stringify({ ...profile, ...userData, mobile: userData.mobile || profile.mobile })
      );
      return { token, user: { ...profile, ...userData } };
    }
  } catch {
    /* fall through */
  }
  return null;
}
