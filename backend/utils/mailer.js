const nodemailer = require('nodemailer');

let cachedTransporter;

const isConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (!isConfigured()) return null;
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return cachedTransporter;
};

/**
 * Sends an email if SMTP credentials are configured; otherwise no-ops safely
 * (logs a warning) so features built on top of this work today and start
 * actually delivering the moment SMTP_HOST/SMTP_USER/SMTP_PASS are set.
 */
const sendMail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(`[mailer] SMTP not configured — skipped email to ${to}: "${subject}"`);
    return { sent: false, reason: 'not_configured' };
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text,
  });
  return { sent: true };
};

module.exports = { sendMail, isConfigured };
