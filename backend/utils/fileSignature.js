// Upload type check by the file's first bytes, not its name or the browser's claim (security, 21 Nov 2026).
// A PHP, HTML or SVG file renamed to .jpg is refused because its bytes are not an image.
const SIGNATURES = {
  jpg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  png: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  gif: (b) => b.subarray(0, 4).toString('latin1') === 'GIF8',
  webp: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
  pdf: (b) => b.subarray(0, 5).toString('latin1') === '%PDF-',
  mp4: (b) => b.subarray(4, 8).toString('latin1') === 'ftyp', // mp4 and mov
  webm: (b) => b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])), // webm and mkv
  avi: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'AVI ',
};

/** Returns the real type ('jpg', 'pdf', ...) or null when the bytes match none of the allowed types. */
const realType = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  return Object.keys(SIGNATURES).find((t) => SIGNATURES[t](buffer)) || null;
};

module.exports = { realType };
