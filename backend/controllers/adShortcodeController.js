const Ad = require('../models/adModel');

/** Public — resolves a `[ads key="..."][/ads]` shortcode to renderable ad data, counts an impression. */
const getByShortcode = async (req, res) => {
  try {
    const ad = await Ad.findOne({ shortcode: req.params.code, status: 'Published' });
    if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });

    const now = new Date();
    if (ad.startDate && now < ad.startDate) return res.status(404).json({ success: false, message: 'Ad not active yet' });
    if (ad.endDate && now > ad.endDate) return res.status(404).json({ success: false, message: 'Ad expired' });

    Ad.updateOne({ _id: ad._id }, { $inc: { impressions: 1 } }).catch(() => {});
    res.json({
      success: true,
      data: { title: ad.title, image: ad.image, link: ad.link, shortcode: ad.shortcode },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** Public — records a click on a rendered ad; returns the destination link for the frontend to follow. */
const trackClick = async (req, res) => {
  try {
    const ad = await Ad.findOneAndUpdate(
      { shortcode: req.params.code },
      { $inc: { clicks: 1 } },
      { new: true }
    );
    if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });
    res.json({ success: true, data: { link: ad.link } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getByShortcode, trackClick };
