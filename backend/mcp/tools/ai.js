/**
 * Free AI images for Jaipurio (same chain as Govindam Sweets):
 * Cloudflare Workers AI FLUX (free daily quota) first, then Pollinations.
 * The image is saved to the media library (MinIO, WebP) with alt text and marked AI-generated.
 * Never use it to fake a real product, the real shop, a person or a review.
 */
const { ToolError } = require('../errors');
const { credentialGet } = require('../store');

const MIN_IMAGE_BYTES = 20 * 1024;
const CF_MODEL = '@cf/black-forest-labs/flux-1-schnell';
const SAFETY = 'No real identifiable people, celebrities, logos, brand names or readable text. Not a photo of a real product.';
const S = (props, required = []) => ({ type: 'object', properties: props, required, additionalProperties: false });

const fromCloudflare = async (prompt, fetchFn) => {
  const [account, token] = await Promise.all([credentialGet('cloudflare_account_id'), credentialGet('cloudflare_api_token')]);
  if (!account || !token) throw new ToolError('no cloudflare_account_id / cloudflare_api_token');
  const res = await fetchFn(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/ai/run/${CF_MODEL}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: `${prompt}. ${SAFETY}`.slice(0, 2048), steps: 4 }),
    signal: AbortSignal.timeout(120000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new ToolError(`Cloudflare ${res.status}: ${(data.errors || []).map((e) => e.message).filter(Boolean).join('; ') || 'request failed'}`);
  const buffer = Buffer.from(String(data.result?.image || ''), 'base64');
  if (buffer.length < MIN_IMAGE_BYTES) throw new ToolError(`Cloudflare image too small (${buffer.length} bytes)`);
  return { buffer, mime: 'image/jpeg', provider: 'cloudflare', model: CF_MODEL };
};

const fromPollinations = async (prompt, fetchFn) => {
  const key = await credentialGet('pollinations_api_key');
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(`${prompt}. ${SAFETY}`)}?width=1200&height=675&nologo=true&model=flux`;
  const res = await fetchFn(url, { headers: key ? { authorization: `Bearer ${key}` } : {}, signal: AbortSignal.timeout(150000) });
  const type = res.headers.get('content-type') || '';
  if (!res.ok || !type.startsWith('image/')) throw new ToolError(`Pollinations ${res.status} ${type || 'no content type'}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  // When rate-limited Pollinations answers 200 with a small flat "limit reached" picture.
  if (buffer.length < MIN_IMAGE_BYTES) throw new ToolError(`Pollinations image too small (${buffer.length} bytes), likely its rate-limit placeholder`);
  return { buffer, mime: type, provider: 'pollinations', model: 'flux' };
};

/** First provider that returns a real image wins; errors from all are reported together. */
const generateImage = async (prompt, fetchFn = fetch) => {
  const errors = [];
  for (const [name, fn] of [['cloudflare', fromCloudflare], ['pollinations', fromPollinations]]) {
    try {
      return await fn(prompt, fetchFn);
    } catch (e) {
      errors.push(`${name}: ${e.message}`);
    }
  }
  throw new ToolError(`No image provider worked. ${errors.join(' | ')}`);
};

const tools = [
  {
    name: 'ai_providers_status',
    ability: 'read',
    description: 'Which free AI image providers are ready (Cloudflare FLUX first, Pollinations fallback).',
    inputSchema: S({}),
    run: async () => {
      const [a, t, p] = await Promise.all([credentialGet('cloudflare_account_id'), credentialGet('cloudflare_api_token'), credentialGet('pollinations_api_key')]);
      return {
        image: [
          { provider: 'cloudflare', ready: Boolean(a && t), model: CF_MODEL, note: 'free Workers AI quota (10,000 neurons a day, resets 00:00 UTC)' },
          { provider: 'pollinations', ready: true, model: 'flux', note: p ? 'key saved' : 'no key (about 1 image per 45 s)' },
        ],
      };
    },
  },
  {
    name: 'ai_image_generate',
    ability: 'write',
    description: 'Create an illustration or background with free AI (Cloudflare FLUX, then Pollinations) and save it to the media library with alt text, marked AI-generated. Never use it to fake a real product, the shop, a person or a review. Look at the result before using it.',
    inputSchema: S(
      {
        prompt: { type: 'string', minLength: 10, maxLength: 1500 },
        name: { type: 'string', description: 'SEO file name, e.g. brass-diya-festive-decor-jaipurio' },
        alt: { type: 'string', minLength: 5, maxLength: 250 },
        title: { type: 'string' },
        keywords: { type: 'array', items: { type: 'string' } },
      },
      ['prompt', 'name', 'alt']
    ),
    run: async ({ prompt, name, alt, title = '', keywords = [] }) => {
      const img = await generateImage(prompt);
      const { uploadBuffer } = require('../../utils/mediaStorage');
      const stored = await uploadBuffer({ buffer: img.buffer, originalname: `${name}.jpg`, mimetype: img.mime }, 'media/ai');
      const Media = require('../../models/mediaImageModel');
      const credit = `AI-generated image (${img.provider === 'cloudflare' ? 'Cloudflare Workers AI' : 'Pollinations'}, ${img.model})`;
      const doc = await Media.create({
        name: name.slice(0, 120),
        originalName: `${name}.jpg`,
        url: stored.url,
        storageKey: stored.key,
        storageProvider: stored.provider,
        mimeType: stored.mimeType,
        size: stored.size,
        width: stored.width,
        height: stored.height,
        alt: alt.slice(0, 250),
        title: String(title).slice(0, 200),
        keywords: (keywords || []).slice(0, 20).map(String),
        description: credit,
        copyright: `© ${new Date().getFullYear()} Jaipurio. ${credit}`,
      });
      return { id: String(doc._id), url: stored.url, provider: img.provider, model: img.model, bytes: img.buffer.length };
    },
  },
];

module.exports = { tools, generateImage };
