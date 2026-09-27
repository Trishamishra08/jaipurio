import api from './api';

const unwrap = (res) => res.data?.data ?? res.data;

const mediaError = (err) => {
  const status = err?.response?.status;
  const msg =
    err?.parsedMessage ||
    err?.response?.data?.message ||
    err?.message ||
    'Media request failed';
  if (status === 404) {
    return new Error(
      `${msg} (404). Media API is missing on this server — use local backend http://localhost:5000/api (VITE_API_URL).`
    );
  }
  return new Error(msg);
};

export const listMedia = async (params = {}) => {
  try {
    const res = await api.get('/media', { params });
    return unwrap(res);
  } catch (err) {
    throw mediaError(err);
  }
};

export const ensureMediaFolders = async () => {
  try {
    const res = await api.post('/media/folders/ensure-defaults');
    return unwrap(res);
  } catch (err) {
    throw mediaError(err);
  }
};

export const createMediaFolder = async (name, parentFolder = null) => {
  try {
    const res = await api.post('/media/folders', { name, parentFolder });
    return unwrap(res);
  } catch (err) {
    throw mediaError(err);
  }
};

/**
 * `coords` (optional): { latitude, longitude } — the uploader's current device location,
 * used server-side as a fallback only for files that carry no EXIF GPS tag of their own.
 */
export const uploadMediaFiles = async (files, parentFolder = null, coords = null) => {
  try {
    const form = new FormData();
    [...files].forEach((f) => form.append('documents', f));
    if (parentFolder) form.append('parentFolder', parentFolder);
    if (coords?.latitude != null && coords?.longitude != null) {
      form.append('latitude', coords.latitude);
      form.append('longitude', coords.longitude);
    }
    const res = await api.post('/media/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap(res);
  } catch (err) {
    throw mediaError(err);
  }
};

/** Resolves with { latitude, longitude } from the browser, or null if denied/unavailable. */
export const getBrowserLocation = (timeoutMs = 4000) =>
  new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    const timer = setTimeout(() => resolve(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 5 * 60 * 1000 }
    );
  });

export const renameMedia = async (id, name) => {
  try {
    const res = await api.put(`/media/${id}/rename`, { name });
    return unwrap(res);
  } catch (err) {
    throw mediaError(err);
  }
};

export const updateMediaAlt = async (id, alt) => {
  try {
    const res = await api.put(`/media/${id}/alt`, { alt });
    return unwrap(res);
  } catch (err) {
    throw mediaError(err);
  }
};

export const updateMediaMetadata = async (id, metadata) => {
  try {
    const res = await api.put(`/media/${id}/metadata`, metadata);
    return unwrap(res);
  } catch (err) {
    throw mediaError(err);
  }
};

export const reoptimizeMedia = async (id) => {
  try {
    const res = await api.post(`/media/${id}/reoptimize`);
    return unwrap(res);
  } catch (err) {
    throw mediaError(err);
  }
};

export const replaceMediaFile = async (id, file) => {
  try {
    const form = new FormData();
    form.append('document', file);
    const res = await api.put(`/media/${id}/replace`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap(res);
  } catch (err) {
    throw mediaError(err);
  }
};

export const getMediaById = async (id) => {
  try {
    const res = await api.get(`/media/${id}`);
    return unwrap(res);
  } catch (err) {
    throw mediaError(err);
  }
};

export const toggleMediaFavorite = async (id, isFavorite) => {
  try {
    const res = await api.put(`/media/${id}/favorite`, { isFavorite: Boolean(isFavorite) });
    const data = unwrap(res);
    if (data && (data.id || data._id)) return data;
    return getMediaById(id);
  } catch (err) {
    throw mediaError(err);
  }
};

export const copyMedia = async (id) => {
  try {
    const res = await api.post(`/media/${id}/copy`);
    return unwrap(res);
  } catch (err) {
    throw mediaError(err);
  }
};

export const trashMedia = async (id) => {
  try {
    const res = await api.put(`/media/${id}/trash`);
    return unwrap(res);
  } catch (err) {
    throw mediaError(err);
  }
};

export const restoreMedia = async (id) => {
  try {
    const res = await api.put(`/media/${id}/restore`);
    return unwrap(res);
  } catch (err) {
    throw mediaError(err);
  }
};

export const deleteMedia = async (id) => {
  try {
    const res = await api.delete(`/media/${id}`);
    return unwrap(res);
  } catch (err) {
    throw mediaError(err);
  }
};

export const downloadMedia = async (id) => {
  try {
    const res = await api.get(`/media/${id}/download`);
    return unwrap(res);
  } catch (err) {
    throw mediaError(err);
  }
};

export const moveMedia = async (id, parentFolder) => {
  try {
    const res = await api.put(`/media/${id}/move`, { parentFolder });
    return unwrap(res);
  } catch (err) {
    throw mediaError(err);
  }
};
