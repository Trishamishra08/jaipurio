/** Free Google/Bing APIs: service-account token, Search Console, PageSpeed, CrUX, Bing Webmaster. */
const crypto = require('crypto');
const { credentialGet } = require('./store');
const { ToolError } = require('./errors');

const cache = new Map();

const b64url = (v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');

const httpJson = async (url, opts = {}) => {
  const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(opts.timeout || 30_000) });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text.slice(0, 500) };
  }
  if (!res.ok) {
    const msg = body?.error?.message || body?.Message || body?.raw || res.statusText;
    throw new ToolError(`${new URL(url).host} answered ${res.status}: ${msg}`);
  }
  return body;
};

/** OAuth access token for the saved service account (JWT bearer grant, RS256). */
const googleToken = async (scope) => {
  const raw = await credentialGet('gsc_service_account_json');
  if (!raw) throw new ToolError('Save gsc_service_account_json first (credential_set).');
  let sa;
  try {
    sa = JSON.parse(raw);
  } catch {
    throw new ToolError('Saved gsc_service_account_json is not valid JSON.');
  }
  const key = `${sa.client_email}|${scope}`;
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now() + 60_000) return hit.token;
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url({
    iss: sa.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`;
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key).toString('base64url');
  const body = await httpJson('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
  });
  cache.set(key, { token: body.access_token, exp: Date.now() + (body.expires_in || 3600) * 1000 });
  return body.access_token;
};

const GSC = 'https://www.googleapis.com/webmasters/v3';
const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters';

const gscProperty = async () => {
  const p = (await credentialGet('gsc_property')) || 'sc-domain:jaipurio.in';
  return p;
};

const gsc = async (path, body, method = body ? 'POST' : 'GET') => {
  const token = await googleToken(GSC_SCOPE);
  return httpJson(`${GSC}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
};

const isoDay = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => isoDay(new Date(Date.now() - n * 86_400_000));

/** Search analytics rows. Dates default to the last 28 complete days (GSC lags ~3 days). */
const gscQuery = async ({ dimensions = ['query'], days = 28, startDate, endDate, rowLimit = 250, filters = [] } = {}) => {
  const prop = await gscProperty();
  const body = {
    startDate: startDate || daysAgo(days + 3),
    endDate: endDate || daysAgo(3),
    dimensions,
    rowLimit: Math.min(rowLimit, 25000),
    dataState: 'final',
  };
  if (filters.length) body.dimensionFilterGroups = [{ filters }];
  const r = await gsc(`/sites/${encodeURIComponent(prop)}/searchAnalytics/query`, body);
  return {
    property: prop,
    startDate: body.startDate,
    endDate: body.endDate,
    rows: (r.rows || []).map((x) => ({
      keys: x.keys,
      clicks: x.clicks,
      impressions: x.impressions,
      ctr: Math.round(x.ctr * 10000) / 100,
      position: Math.round(x.position * 10) / 10,
    })),
  };
};

const pagespeed = async (url, strategy = 'mobile') => {
  const key = await credentialGet('pagespeed_api_key');
  const q = new URLSearchParams({ url, strategy });
  for (const c of ['performance', 'accessibility', 'seo', 'best-practices']) q.append('category', c);
  if (key) q.set('key', key);
  const r = await httpJson(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${q}`, { timeout: 90_000 });
  const cats = r.lighthouseResult?.categories || {};
  const a = r.lighthouseResult?.audits || {};
  const ms = (k) => a[k]?.numericValue ?? null;
  return {
    url,
    strategy,
    scores: Object.fromEntries(Object.entries(cats).map(([k, v]) => [k, Math.round((v.score || 0) * 100)])),
    lab: { lcpMs: ms('largest-contentful-paint'), cls: ms('cumulative-layout-shift'), tbtMs: ms('total-blocking-time'), fcpMs: ms('first-contentful-paint') },
    field: r.loadingExperience?.metrics
      ? Object.fromEntries(Object.entries(r.loadingExperience.metrics).map(([k, v]) => [k, { p75: v.percentile, category: v.category }]))
      : null,
    topFixes: Object.values(a)
      .filter((x) => x.score !== null && x.score < 0.9 && x.details?.type === 'opportunity')
      .sort((x, y) => (y.numericValue || 0) - (x.numericValue || 0))
      .slice(0, 6)
      .map((x) => ({ id: x.id, title: x.title, savingsMs: Math.round(x.numericValue || 0) })),
  };
};

const crux = async ({ url, origin, formFactor = 'PHONE' }) => {
  const key = await credentialGet('pagespeed_api_key');
  if (!key) throw new ToolError('CrUX needs pagespeed_api_key (a Google API key with the Chrome UX Report API on).');
  const r = await fetch(`https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(url ? { url, formFactor } : { origin, formFactor }),
    signal: AbortSignal.timeout(30_000),
  });
  if (r.status === 404) return { url, origin, formFactor, data: null, note: 'Not enough Chrome users for field data yet.' };
  const body = await r.json();
  if (!r.ok) throw new ToolError(`CrUX answered ${r.status}: ${body?.error?.message || ''}`);
  const m = body.record?.metrics || {};
  return {
    url,
    origin,
    formFactor,
    p75: Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v.percentiles?.p75 ?? null])),
    period: body.record?.collectionPeriod || null,
  };
};

const bing = async (method, siteUrl) => {
  const key = await credentialGet('bing_webmaster_api_key');
  if (!key) throw new ToolError('Save bing_webmaster_api_key first (credential_set).');
  const q = new URLSearchParams({ apikey: key });
  if (siteUrl) q.set('siteUrl', siteUrl);
  const r = await httpJson(`https://ssl.bing.com/webmaster/api.svc/json/${method}?${q}`);
  return r.d ?? r;
};

module.exports = { googleToken, gsc, gscQuery, gscProperty, pagespeed, crux, bing, httpJson, daysAgo };
