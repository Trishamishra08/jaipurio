'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const creds = {};
const storePath = require.resolve(path.join(__dirname, '..', 'mcp/store'));
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: { credentialGet: async (n) => creds[n] || null } };
const { generateImage } = require('../mcp/tools/ai');

const big = Buffer.alloc(40 * 1024, 7);
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

test('Cloudflare FLUX goes first when its keys are saved', async () => {
  Object.assign(creds, { cloudflare_account_id: 'a'.repeat(32), cloudflare_api_token: 'tok' });
  let url;
  const out = await generateImage('brass diya on a red cloth', async (u) => { url = u; return json({ success: true, result: { image: big.toString('base64') } }); });
  assert.equal(out.provider, 'cloudflare');
  assert.match(url, /\/accounts\/a{32}\/ai\/run\/@cf\/black-forest-labs\/flux-1-schnell$/);
});

test('falls back to Pollinations when the quota is used and rejects its small placeholder', async () => {
  Object.assign(creds, { cloudflare_account_id: 'a'.repeat(32), cloudflare_api_token: 'tok' });
  const fail = async (u) => (u.includes('cloudflare') ? json({ success: false, errors: [{ message: 'daily free allocation used' }] }, 429) : new Response(Buffer.alloc(9000), { headers: { 'content-type': 'image/jpeg' } }));
  await assert.rejects(generateImage('brass diya on a red cloth', fail), /cloudflare: Cloudflare 429: daily free allocation used.*pollinations: Pollinations image too small/);
  const ok = async (u) => (u.includes('cloudflare') ? json({ success: false }, 429) : new Response(big, { headers: { 'content-type': 'image/jpeg' } }));
  assert.equal((await generateImage('brass diya on a red cloth', ok)).provider, 'pollinations');
});
