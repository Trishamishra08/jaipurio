import api from './api';

const unwrap = (res) => res.data?.data ?? res.data;

export const bulkImportLocations = async (rows) => {
  const res = await api.post('/location-tools/import', { rows });
  return unwrap(res);
};

export const importCountryPreset = async (name, code) => {
  const res = await api.post('/location-tools/import-country-preset', { name, code });
  return unwrap(res);
};

export const fetchLocationExportData = async () => {
  const res = await api.get('/location-tools/export-data');
  return unwrap(res);
};
