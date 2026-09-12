const fs = require('fs');
const path = require('path');

const mapPath = path.join(__dirname, 'jaipurio-media-map.json');
const seedPath = path.join(__dirname, '..', 'seedData.js');
const map = JSON.parse(fs.readFileSync(mapPath, 'utf8')).images;
let seed = fs.readFileSync(seedPath, 'utf8');

for (const [local, remote] of Object.entries(map)) {
  seed = seed.split(`'${local}'`).join(`'${remote}'`);
  seed = seed.split(`"${local}"`).join(`"${remote}"`);
}

fs.writeFileSync(seedPath, seed);
console.log('Updated seedData.js with Cloudinary image URLs');
