// A real cookie (not localStorage) on purpose — middleware.js runs on the
// server before any page renders, and only cookies are visible there.
// 30 days, matching the backend's own token expiry.
const COOKIE_NAME = 'billing_token';
const MAX_AGE = 60 * 60 * 24 * 30;

export function getToken() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + COOKIE_NAME + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setToken(token) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
}

export function clearToken() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
