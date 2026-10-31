// GSTIN validation: format, check digit and state code.
// Format: 2-digit state code + 10-char PAN + entity no. + 'Z' + check character.

export const GST_STATE_CODES = {
  '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur',
  '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
  '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '26': 'Dadra and Nagar Haveli and Daman and Diu', '27': 'Maharashtra', '29': 'Karnataka',
  '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands', '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh',
  '97': 'Other Territory',
};

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Official GSTIN check character (mod-36 weighted sum over the first 14 chars). */
const checkChar = (first14) => {
  let sum = 0;
  for (let i = 0; i < 14; i += 1) {
    const value = CHARS.indexOf(first14[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(value / 36) + (value % 36);
  }
  return CHARS[(36 - (sum % 36)) % 36];
};

const norm = (s) => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z]/g, '');

/** Returns '' when valid, otherwise a customer-friendly error message. */
export function validateGstin(gstin, stateName = '') {
  const g = String(gstin || '').trim().toUpperCase();
  if (g.length !== 15) return 'GST number must be exactly 15 characters.';
  if (!GSTIN_RE.test(g)) return 'GST number format is invalid (e.g. 08ABCDE1234F1Z5).';
  const code = g.slice(0, 2);
  const codeState = GST_STATE_CODES[code];
  if (!codeState) return `GST number starts with an unknown state code (${code}).`;
  if (checkChar(g.slice(0, 14)) !== g[14]) return 'GST number is not valid (check digit does not match). Please re-check it.';
  if (stateName && norm(stateName) && norm(codeState) !== norm(stateName)) {
    return `This GST number is registered in ${codeState} (code ${code}), but the business state is "${stateName}". They must match.`;
  }
  return '';
}
