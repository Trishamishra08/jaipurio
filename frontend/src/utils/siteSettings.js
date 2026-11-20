import api from './api';

/** Public site settings (GET /api/settings), fetched once per page load. */
let pending = null;

export const getSiteSettings = () => {
  if (!pending) {
    pending = api
      .get('/settings')
      .then((res) => res.data?.data?.settings || {})
      .catch(() => {
        pending = null;
        return {};
      });
  }
  return pending;
};
