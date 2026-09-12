const fs = require('fs');
const path = require('path');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(jsx|js)$/.test(entry.name)) out.push(p);
  }
  return out;
}

const root = path.join(__dirname, '..', '..', 'frontend', 'src');
const files = walk(root);

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes('mediaUrl(')) continue;
  if (code.includes('cloudinaryMedia')) continue;
  if (file.includes('cloudinaryMedia.js') || file.includes('photos.js') || file.includes('categoryMedia.js')) continue;

  const rel = path.relative(path.dirname(file), path.join(root, 'data', 'cloudinaryMedia')).replace(/\\/g, '/');
  const importPath = rel.startsWith('.') ? rel : `./${rel}`;
  const importLine = `import { mediaUrl } from '${importPath.replace(/\.js$/, '')}';\n`;

  if (/^import /m.test(code)) {
    code = code.replace(/^(import .+?;\r?\n)/m, `$1${importLine}`);
  } else {
    code = importLine + code;
  }
  fs.writeFileSync(file, code);
  console.log('added import', path.relative(root, file));
}
