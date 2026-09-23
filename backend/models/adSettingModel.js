const mongoose = require('mongoose');

// Singleton document (one row) holding site-wide ad configuration.
const adSettingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    enableAds: { type: Boolean, default: true },
    adsenseClientId: { type: String, default: '' },
    headerScript: { type: String, default: '' },
    footerScript: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdSetting', adSettingSchema);
