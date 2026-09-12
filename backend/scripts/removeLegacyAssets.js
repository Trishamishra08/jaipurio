const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', '..', 'frontend', 'public');
const junk = [
  'aloe_vera_gel.png',
  'ashwagandha_capsules.png',
  'ayurvedic_background.png',
  'ayurvedic_hero.png',
  'bhringraj_hair_oil.png',
  'blog_haircare.png',
  'blog_skincare.png',
  'blog_vit_c.png',
  'catkin_oriental_lipstick.png',
  'cat_essentialoils_new.png',
  'cat_haircare.png',
  'cat_skincare.png',
  'cat_skincare_new.png',
  'cat_wellness.png',
  'hair_care_offer.png',
  'herbal_tea_offer.png',
  'lakme_2_in_1_lipstick.png',
  'lakme_face_powder.png',
  'liquid_highlighter.png',
  'neem_tulsi_face_wash.png',
  'pink_silk_bow.png',
  'plumping_lip_gloss.png',
  'promo.png',
  'rose_gold_eyeshadow_palette.png',
  'skin_care_offer.png',
  'tirtir_concealer_stick.png',
  'tirtir_pink_cushion.png',
  'tirtir_red_cushion.png',
  'tulsi_green_tea.png',
  'verymiss_lipstick_set.png',
  'volumizing_mascara.png',
  'offers_video.mp4',
  'auth-bg.png',
  'banner_1.png',
  'banner_2.png',
  'banner_3.png',
  'hero1.png',
  'hero2.png',
  'hero3.png',
  'ig_1.png',
  'ig_2.png',
  'ig_3.png',
  'ig_4.png',
  'ig_5.png',
  'insta_1.png',
  'insta_2.png',
  'insta_3.png',
  'insta_4.png',
  'insta_5.png',
  'testi_1.png',
  'testi_2.png',
  'testi_3.png',
  'testi_4.png',
  'testi_5.png',
  'testi_bg.png',
  'trending_banner.png',
  'logo_pink_test.png',
  'logo_src_test.png',
  'reference.png',
  'footer_pattern.png',
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

const iconDir = path.join(__dirname, '..', '..', 'frontend', 'src', 'assets', 'images', 'icons');
if (fs.existsSync(iconDir)) {
  for (const name of fs.readdirSync(iconDir)) {
    fs.unlinkSync(path.join(iconDir, name));
    console.log('removed icon', name);
    removed += 1;
  }
}

console.log('TOTAL_REMOVED=', removed);
