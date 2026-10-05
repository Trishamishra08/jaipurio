/** One-off: confirm the MinIO client can reach the bucket and presigned URLs actually serve the image. */
require('dotenv').config();
const https = require('https');
const { objectExists, getPresignedUrl, listObjects, bucketName } = require('../utils/minioStorage');

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let bytes = 0;
      res.on('data', (chunk) => { bytes += chunk.length; });
      res.on('end', () => resolve({ status: res.statusCode, contentType: res.headers['content-type'], bytes }));
    }).on('error', (err) => resolve({ error: err.message }));
  });
}

async function main() {
  console.log('bucket:', bucketName);

  const candidates = ['00001-13.jpg', 'product-categories/1-1.png'];
  for (const key of candidates) {
    const exists = await objectExists(key);
    console.log(`\nobjectExists("${key}"):`, exists);
    if (!exists) continue;

    const url = await getPresignedUrl(key, 3600);
    console.log('presigned URL (first 100 chars):', url.slice(0, 100) + '...');

    const result = await checkUrl(url);
    console.log('fetch via presigned URL ->', result);
  }

  console.log('\n--- malformed key check ---');
  console.log('objectExists("product-categories/27-27jpg"):', await objectExists('product-categories/27-27jpg'));

  console.log('\n--- quick prefix listing (product-categories/, first 5) ---');
  const items = await listObjects('product-categories/', false);
  items.slice(0, 5).forEach((i) => console.log(i.name || i.prefix, i.size));
}

main().catch((err) => {
  console.error('ERROR:', err.name, err.message);
  process.exit(1);
});
