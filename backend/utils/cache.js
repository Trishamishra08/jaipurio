const { cacheGet, cacheSet, cacheDel } = require('../config/redis');
const { optimizeMediaUrls } = require('./imageOptimize');

const PREFIX = 'jaipurio:catalog:v1:';

const CATALOG_KEYS = {
  products: `${PREFIX}products`,
  categories: `${PREFIX}categories`,
  banners: `${PREFIX}banners`,
  offers: `${PREFIX}offers`,
  settings: `${PREFIX}settings`,
  testimonials: `${PREFIX}testimonials`,
  instagram: `${PREFIX}instagram`,
  blogs: `${PREFIX}blogs`,
  coupons: `${PREFIX}coupons-public`,
  policies: `${PREFIX}policies`,
  locations: `${PREFIX}locations`
};

const catalogKey = (name, extra) => {
  const base = CATALOG_KEYS[name] || `${PREFIX}${name}`;
  return extra ? `${base}:${extra}` : base;
};

const invalidateCatalog = async (...names) => {
  const keys = names.flat().map((name) => catalogKey(name));
  await cacheDel(...keys);
};

const clearAllCatalogCache = async () => {
  await cacheDel(...Object.values(CATALOG_KEYS));
};

const cachePublic = (name, ttlSeconds = 60) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();

    const paramPart = req.params && req.params.id
      ? req.params.id
      : req.params && req.params.type
        ? req.params.type
        : '';
    // Query params (page/limit/search/category/sort/ids/...) must be part of
    // the cache key too — otherwise every distinct request (e.g. every page
    // of a paginated list) collapses onto the same cached entry and callers
    // silently get back whichever query happened to populate the cache first.
    const queryPart = Object.keys(req.query || {})
      .sort()
      .filter((k) => req.query[k] !== undefined && req.query[k] !== '')
      .map((k) => `${k}=${req.query[k]}`)
      .join('&');
    const extra = [paramPart, queryPart].filter(Boolean).join(':');
    const key = catalogKey(name, extra);

    try {
      const hit = await cacheGet(key);
      if (hit) {
        res.set('X-Cache', 'HIT');
        res.set('Cache-Control', `public, max-age=20, stale-while-revalidate=${ttlSeconds}`);
        return res.status(200).json(optimizeMediaUrls(hit));
      }
    } catch (err) {
      // Fall through to the database on cache errors
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const payload = optimizeMediaUrls(body);
      const ok = res.statusCode < 400 && payload && payload.success !== false && payload.status !== 'fail';
      if (ok) {
        cacheSet(key, payload, ttlSeconds).catch(() => {});
      }
      if (!res.get('X-Cache')) res.set('X-Cache', 'MISS');
      res.set('Cache-Control', `public, max-age=20, stale-while-revalidate=${ttlSeconds}`);
      return originalJson(payload);
    };

    next();
  };
};

module.exports = {
  CATALOG_KEYS,
  catalogKey,
  invalidateCatalog,
  clearAllCatalogCache,
  cachePublic
};
