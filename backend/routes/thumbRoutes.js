const express = require('express');
const {
  extractKey,
  snapThumbWidth,
  canThumbnail,
  ensureThumbnail,
  getPublicUrl,
} = require('../utils/minioStorage');

const router = express.Router();

// GET /api/media/thumb?src=<MinIO or legacy image URL>&w=400
// Public. Creates (once) and redirects to a small WebP copy of a catalog image
// stored in our bucket. Only our own bucket's URLs are accepted, so this can
// never be used to redirect elsewhere; anything it can't thumbnail goes to the
// original object instead.
router.get('/', async (req, res) => {
  const src = String(req.query.src || '');
  const key = src ? extractKey(src) : null;
  if (!key) return res.status(400).json({ success: false, message: 'src must be an image in the Jaipurio media bucket' });
  if (!canThumbnail(key)) return res.redirect(302, getPublicUrl(key));

  try {
    const thumbKey = await ensureThumbnail(key, snapThumbWidth(req.query.w));
    res.set('Cache-Control', 'public, max-age=86400');
    return res.redirect(302, getPublicUrl(thumbKey));
  } catch (error) {
    console.warn('[thumb] falling back to original for', key, '-', error.message);
    return res.redirect(302, getPublicUrl(key));
  }
});

module.exports = router;
