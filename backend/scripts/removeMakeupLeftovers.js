const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', '..', 'frontend', 'public');
const junk = [
  'catkin_oriental_art_lipstick.jpg',
  'gleva_lipstick.jpg',
  'glide___hide_concealer.jpg',
  'lakme_2_in_1_lipstick___liner.jpg',
  'lakme_uv_protect_face_powder.jpg',
  'tirtir_mask_fit_foundation.jpg',
  'tirtir_mask_fit_red_cushion.jpg',
  'verymiss_kiss_proof_trio___kajal.jpg',
  'facebook_logo.jpg',
  'logo_invoice.jpg',
  'logo_s.jpg',
  'logo_uploaded.jpg',
];

let removed = 0;
for (const name of junk) {
  const p = path.join(publicDir, name);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    removed += 1;
    console.log('removed', name);
  }
}

const offersDir = path.join(publicDir, 'offers');
if (fs.existsSync(offersDir)) {
  for (const name of fs.readdirSync(offersDir)) {
    fs.unlinkSync(path.join(offersDir, name));
    console.log('removed offers/' + name);
    removed += 1;
  }
  try {
    fs.rmdirSync(offersDir);
  } catch (_) {}
}

console.log('TOTAL_REMOVED=', removed);
