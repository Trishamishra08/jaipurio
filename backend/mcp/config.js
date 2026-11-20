/** Claude connector (MCP) settings for Jaipurio. Tunable with environment variables. */

const MCP_SERVER_NAME = 'Jaipurio';
const MCP_SERVER_VERSION = '1.0.0';
const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];

const ACCESS_TTL = 7 * 24 * 3600;
const REFRESH_TTL = 90 * 24 * 3600;
const CODE_TTL = 5 * 60;
const CONSENT_TTL = 10 * 60;

const GRANTABLE = ['read', 'write', 'delete', 'secrets'];

const mcpEnabled = () => String(process.env.MCP_ENABLED ?? 'true').toLowerCase() !== 'false';

const DEFAULT_URL = 'https://jaipurio.in';

const knownHosts = () => {
  const hosts = ['jaipurio.in', 'www.jaipurio.in', 'jaipurio.sakha.cloud'];
  for (const u of [process.env.SITE_URL, process.env.FRONTEND_URL, process.env.MCP_PUBLIC_URL]) {
    try {
      if (u) hosts.push(new URL(u).host.toLowerCase());
    } catch {
      /* ignore */
    }
  }
  for (const h of String(process.env.MCP_ALLOWED_HOSTS || '').split(',')) if (h.trim()) hosts.push(h.trim().toLowerCase());
  return hosts;
};

/** Public base URL for this request: the request's own host when it is one of ours. */
const baseFor = (req) => {
  if (process.env.MCP_PUBLIC_URL) return process.env.MCP_PUBLIC_URL.replace(/\/$/, '');
  const raw = String((req && (req.headers['x-forwarded-host'] || req.headers.host)) || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  if (raw) {
    const hostname = raw.replace(/:\d+$/, '');
    if (['localhost', '127.0.0.1'].includes(hostname)) return `http://${raw}`;
    if (knownHosts().includes(raw)) return `https://${raw.replace(/^www\./, '')}`;
  }
  return String(process.env.SITE_URL || DEFAULT_URL).replace(/\/$/, '');
};

const ALLOWED_ORIGIN_HOSTS = ['claude.ai', 'www.claude.ai', 'claude.com', 'www.claude.com'];

const redirectAllowed = (u) => {
  let p;
  try {
    p = new URL(u);
  } catch {
    return false;
  }
  if (p.username || p.password || p.hash) return false;
  const host = p.hostname.toLowerCase();
  const extra = String(process.env.MCP_OAUTH_REDIRECT_HOSTS || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  if (p.protocol === 'https:' && [...ALLOWED_ORIGIN_HOSTS, ...extra].includes(host)) return true;
  return p.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(host);
};

/** Values never returned to Claude. */
const SECRET_KEY_PATTERN =
  /^(password|salt|hash|token|accessToken|refreshToken|secret|apiKey|twoFactorSecret|twoFactorLastStep|twoFactorFails|twoFactorLockUntil|otp|otpExpires|resetPasswordToken|resetPasswordExpire|__v)$/i;

/** Customer contact fields blanked in every result. */
const PII_KEY_PATTERN =
  /^(guestName|guestEmail|email|phone|mobile|whatsapp|address|addresses|shippingAddress|billingAddress|ip|ipAddress|userAgent|customerName|customerEmail|customerPhone)$/i;

/** Product fields Claude must never change (money, stock, variants, vendor, approval). */
const PRODUCT_LOCKED_FIELDS = [
  'price', 'oldPrice', 'salePrice', 'discountProductPrice', 'costPerItem', 'saleStartDate', 'saleEndDate',
  'variants', 'hasVariants', 'stock', 'stockStatus', 'trackQuantity', 'warehouse', 'minQty', 'maxQty',
  'vendor', 'admin', 'storeName', 'status', 'lifecycle', 'rejectReason', 'rating', 'reviews', 'sku', 'barcode',
  'weight', 'length', 'width', 'height', 'codAvailable', 'noRefund',
];

module.exports = {
  MCP_SERVER_NAME,
  MCP_SERVER_VERSION,
  PROTOCOL_VERSIONS,
  ACCESS_TTL,
  REFRESH_TTL,
  CODE_TTL,
  CONSENT_TTL,
  GRANTABLE,
  mcpEnabled,
  baseFor,
  knownHosts,
  ALLOWED_ORIGIN_HOSTS,
  redirectAllowed,
  SECRET_KEY_PATTERN,
  PII_KEY_PATTERN,
  PRODUCT_LOCKED_FIELDS,
};
