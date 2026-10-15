/**
 * seedMobileMenu.js
 * Creates the "Mobile menu" (location: Mobile Menu) the storefront's slide-out
 * drawer reads, so admins can edit it under Appearance → Menus. Same entries
 * as the built-in default (frontend/src/data/mobileMenuDefaults.js).
 * Safe to re-run: does nothing if a menu is already assigned to that location.
 *
 * `@categories` is a special link that expands to the live category tree.
 *
 * Usage: node scripts/seedMobileMenu.js
 */
'use strict';
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Menu = require('../models/menuModel');

const ITEMS = [
  ['Home', '/home'],
  ['Shop by Category', '@categories'],
  ['Journal', '/blog'],
  ['Our Story', '/about'],
  ['Contact', '/contact'],
  ['Wishlist', '/wishlist'],
  ['Order Tracking', '/orders'],
  ['My Profile', '/profile'],
  ['Affiliate Program', '/affiliate'],
  ['Sell on Jaipurio', '/vendor/register'],
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const existing = await Menu.findOne({ locations: 'Mobile Menu' });
  if (existing) {
    console.log(`A menu is already assigned to "Mobile Menu": "${existing.name}" — nothing to do.`);
  } else {
    const menu = await Menu.create({
      name: 'Mobile menu',
      slug: 'mobile-menu',
      status: 'Published',
      locations: ['Mobile Menu'],
      items: ITEMS.map(([title, url], i) => ({ title, url, itemType: 'custom-link', order: i, status: 'Published' })),
    });
    console.log(`Created "${menu.name}" with ${menu.items.length} items.`);
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
