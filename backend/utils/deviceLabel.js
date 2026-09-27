/** Best-effort "OS / Browser" label from a User-Agent string, e.g. "Windows / Chrome". */
const deviceLabelFromUserAgent = (ua = '') => {
  if (!ua) return 'Unknown device';

  let os = 'Unknown OS';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/iphone/i.test(ua)) os = 'iPhone';
  else if (/ipad/i.test(ua)) os = 'iPad';
  else if (/mac os/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = 'Unknown browser';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/chrome\//i.test(ua) && !/edg\//i.test(ua)) browser = 'Chrome';
  else if (/firefox\//i.test(ua)) browser = 'Firefox';
  else if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) browser = 'Safari';

  return `${os} / ${browser}`;
};

module.exports = { deviceLabelFromUserAgent };
