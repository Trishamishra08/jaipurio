const test = require('node:test');
const assert = require('node:assert');
const { isStaticOtpMode } = require('../services/otpService');

// Staging shares the live database: a fixed OTP must never be the default for real numbers.
test('real numbers need a real OTP unless USE_DEFAULT_OTP is set on purpose', () => {
  delete process.env.USE_DEFAULT_OTP;
  delete process.env.SMS_OTP_ENABLED;
  assert.strictEqual(isStaticOtpMode('9876543210'), false);
  assert.strictEqual(isStaticOtpMode('9999988888'), true);
  process.env.USE_DEFAULT_OTP = 'true';
  assert.strictEqual(isStaticOtpMode('9876543210'), true);
  delete process.env.USE_DEFAULT_OTP;
});
