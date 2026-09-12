const fs = require('fs');
const path = require('path');

const mapPath = path.join(__dirname, 'jaipurio-media-map.json');
const map = JSON.parse(fs.readFileSync(mapPath, 'utf8')).images;

const files = [
  'seedOffers.js',
  'seedBlogs.js',
  'seedBanners.js',
  'seedCategories.js',
  'seedInstagram.js',
  'seedMarketplaceFlow.js',
  'seedVendorBanners.js',
].map((f) => path.join(__dirname, '..', f));

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let seed = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const [local, remote] of Object.entries(map)) {
    const a = `'${local}'`;
    const b = `'${remote}'`;
    if (seed.includes(a)) {
      seed = seed.split(a).join(b);
      changed = true;
    }
    const a2 = `"${local}"`;
    const b2 = `"${remote}"`;
    if (seed.includes(a2)) {
      seed = seed.split(a2).join(b2);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, seed);
    console.log('patched', path.basename(file));
  } else {
    console.log('no local paths', path.basename(file));
  }
}
