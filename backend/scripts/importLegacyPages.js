/**
 * Imports the content pages of the old jaipurio.in site (Our Story, About Us,
 * FAQs, policies…) into the `pages` collection under their ORIGINAL slugs, so
 * the old header/footer URLs (/our-story, /about-us, /faqs, …) keep working on
 * the new site and can be edited in Admin → Pages.
 *
 * Input: a folder of saved HTML pages named <slug>.html (downloaded from
 * https://jaipurio.in/<slug>). Pages that already exist are left untouched.
 * Links to jaipurio.in inside the content become site-relative.
 *
 *   node scripts/importLegacyPages.js <html-folder>            dry run
 *   node scripts/importLegacyPages.js <html-folder> --apply    write to MongoDB
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const connectDB = require('../config/db');
const Page = require('../models/pageModel');

const PAGES = {
  'our-story': 'Our Story',
  'about-us': 'About Us',
  'artisan-spotlight': 'Artisan Spotlight',
  'crafts-of-india': 'Craft of India',
  faqs: 'FAQs',
  career: 'Career',
  'cookie-policy': 'Cookie Policy',
  'terms-of-use': 'Terms of Use',
  'refund-policy': 'Returns and Exchanges',
  'customer-service': 'Customer Service',
  'terms-conditions': 'Terms of Service',
};

const decode = (s = '') =>
  s.replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

/** Inner HTML of the first <div class="ck-content"> (balanced div matching). */
const extractContent = (html) => {
  const start = html.indexOf('class="ck-content"');
  if (start < 0) return '';
  const open = html.indexOf('>', start) + 1;
  const tag = /<\/?div\b[^>]*>/gi;
  tag.lastIndex = open;
  let depth = 1;
  let m;
  while ((m = tag.exec(html))) {
    depth += m[0][1] === '/' ? -1 : 1;
    if (depth === 0) return html.slice(open, m.index);
  }
  return html.slice(open);
};

const cleanContent = (inner) =>
  inner
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/href="https?:\/\/(www\.)?jaipurio\.in\/*/gi, 'href="/')
    .trim();

const meta = (html, name) => {
  const m = html.match(new RegExp(`<meta[^>]+name="${name}"[^>]+content="([^"]*)"`, 'i'));
  return m ? decode(m[1]).trim() : '';
};

async function main() {
  const dir = process.argv[2];
  const apply = process.argv.includes('--apply');
  if (!dir || !fs.existsSync(dir)) throw new Error('Usage: node scripts/importLegacyPages.js <html-folder> [--apply]');
  console.log(`Legacy page import — ${apply ? 'APPLY' : 'DRY RUN'}`);
  await connectDB();

  for (const [slug, name] of Object.entries(PAGES)) {
    const file = path.join(dir, `${slug}.html`);
    if (!fs.existsSync(file)) {
      console.log(`  ${slug}: no saved HTML, skipped`);
      continue;
    }
    const existing = await Page.findOne({ slug }).select('_id').lean();
    if (existing) {
      console.log(`  ${slug}: already in the database, left as is`);
      continue;
    }
    const html = fs.readFileSync(file, 'utf8');
    const content = cleanContent(extractContent(html));
    if (!content) {
      console.log(`  ${slug}: no content block found, skipped`);
      continue;
    }
    const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1];
    const description = meta(html, 'description');
    console.log(`  ${slug}: ${content.length} chars — "${decode(title || name).slice(0, 70)}"`);
    if (apply) {
      await Page.create({
        name,
        slug,
        description,
        content,
        status: 'Published',
        seoTitle: decode(title || name).trim(),
        seoDescription: description,
        seo: { general: { slug, metaTitle: decode(title || name).trim().slice(0, 70), metaDescription: description.slice(0, 320) } },
      });
    }
  }
  if (!apply) console.log('  dry run — re-run with --apply to write.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
