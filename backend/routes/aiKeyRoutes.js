/** Admin: save the free AI image keys (write-only; values are never sent back). */
const express = require('express');
const router = express.Router();
const { protect, authorize, requirePermission } = require('../middlewares/authMiddleware');
const { credentialSet, credentialStatus } = require('../mcp/store');

const NAMES = ['cloudflare_account_id', 'cloudflare_api_token', 'pollinations_api_key'];
const guard = [protect, authorize('admin'), requirePermission('manage_settings')];

router.get('/', ...guard, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ keys: await credentialStatus(NAMES) });
});

router.post('/', ...guard, async (req, res) => {
  const name = String(req.body?.name || '');
  const value = String(req.body?.value || '').trim();
  if (!NAMES.includes(name)) return res.status(400).json({ message: 'Unknown key.' });
  if (value.length < 4) return res.status(400).json({ message: 'Value is empty.' });
  if (name === 'cloudflare_account_id' && !/^[a-f0-9]{32}$/.test(value)) return res.status(400).json({ message: 'A Cloudflare account id is 32 letters a-f and digits.' });
  await credentialSet(name, value, req.user?.email || 'admin');
  res.set('Cache-Control', 'no-store');
  res.json({ keys: await credentialStatus(NAMES) });
});

module.exports = router;
