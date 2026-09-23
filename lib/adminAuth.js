import crypto from 'crypto';

// Not enterprise-grade auth - it's a single shared password gating one
// internal page for one owner. Good enough here, but keep the /admin URL
// out of public links, and treat this as worth upgrading (e.g. NextAuth)
// if you ever add employees who need their own logins.

const COOKIE_NAME = 'mmb_admin';

function expectedToken() {
  return crypto
    .createHash('sha256')
    .update((process.env.ADMIN_PASSWORD || '') + ':mmb-admin-salt')
    .digest('hex');
}

export function checkPassword(password) {
  return password && password === process.env.ADMIN_PASSWORD;
}

export function sessionCookieHeader() {
  const token = expectedToken();
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function isAdminRequest(request) {
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie) return false;
  return cookie.value === expectedToken();
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
