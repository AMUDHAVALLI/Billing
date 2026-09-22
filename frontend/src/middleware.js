import { NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'billing_token';

// Presence-only check — this just decides whether a page loads at all. Real
// enforcement is the backend's requireAuth on every API call; a stale or
// tampered cookie gets a 401 there, and the frontend's own response
// interceptor (see lib/api.js) clears it and bounces back here anyway.
export function middleware(request) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  if (!token && pathname !== '/login') {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except static assets and Next's own internals.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
