const crypto = require('crypto');

const COOKIE_NAME = 'lp3_admin_token';
const DEFAULT_PIN = 'pramuka2026';

function getAdminPin() {
  return String(process.env.ADMIN_PIN || DEFAULT_PIN);
}

function authToken() {
  return crypto
    .createHmac('sha256', getAdminPin())
    .update('lp3-admin-v1')
    .digest('hex');
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  const out = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > -1) {
      out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
    }
  }
  return out;
}

function isAuthenticated(req) {
  return parseCookies(req)[COOKIE_NAME] === authToken();
}

function verifyPin(input) {
  const expected = getAdminPin();
  const a = Buffer.from(String(input || ''));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function setAuthCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${authToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
  );
}

function clearAuthCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

function requireAuth(req, res, next) {
  if (isAuthenticated(req)) return next();
  if (req.baseUrl && req.baseUrl.startsWith('/api')) {
    return res.status(401).json({
      success: false,
      message: 'Sesi berakhir. Silakan login kembali.'
    });
  }
  return res.redirect('/login');
}

module.exports = {
  isAuthenticated,
  verifyPin,
  setAuthCookie,
  clearAuthCookie,
  requireAuth
};
