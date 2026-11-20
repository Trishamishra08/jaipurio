/** In-memory rate limits and one-time-use markers (single backend process). */

const hits = new Map();
const used = new Map();

/** True when `key` has passed `max` hits in the last `windowMs`. Counts this hit. */
const rateLimited = (key, max, windowMs = 60_000) => {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > windowMs) hits.delete(k);
  }
  return list.length > max;
};

/** Mark `id` used. Returns false when it was already used (codes, refresh tokens). */
const consumeOnce = (id, ttlMs) => {
  const now = Date.now();
  for (const [k, exp] of used) if (exp < now) used.delete(k);
  if (used.has(id)) return false;
  used.set(id, now + ttlMs);
  return true;
};

const clientIp = (req) => req.ip || req.socket?.remoteAddress || 'unknown';

const _reset = () => {
  hits.clear();
  used.clear();
};

module.exports = { rateLimited, consumeOnce, clientIp, _reset };
