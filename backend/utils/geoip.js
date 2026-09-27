const axios = require('axios');

const PRIVATE_IP_RE = /^(::1|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/;

const extractClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.ip || req.connection?.remoteAddress || '';
};

/**
 * Best-effort IP -> approximate {latitude, longitude} lookup (free, no API key,
 * ~city-level accuracy). Used only as a last-resort fallback when a photo has no
 * EXIF GPS tag and the browser didn't/couldn't supply a live device location.
 * Returns null on any failure, on localhost/private IPs, or if the lookup times out.
 */
const lookupIpLocation = async (req) => {
  try {
    const ip = extractClientIp(req);
    if (!ip || PRIVATE_IP_RE.test(ip)) return null;
    const res = await axios.get(`http://ip-api.com/json/${ip}`, {
      params: { fields: 'status,lat,lon' },
      timeout: 2500,
    });
    if (res.data?.status === 'success' && Number.isFinite(res.data.lat) && Number.isFinite(res.data.lon)) {
      return { latitude: res.data.lat, longitude: res.data.lon };
    }
    return null;
  } catch {
    return null;
  }
};

module.exports = { lookupIpLocation, extractClientIp };
