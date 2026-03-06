import { NextResponse } from 'next/server';

const NO_CACHE = [
  ['Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'],
  ['Pragma',        'no-cache'],
  ['Expires',       '0'],
  ['Surrogate-Control', 'no-store'],
];

function noCache(response) {
  NO_CACHE.forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

export function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname === '/') {
    const auth = req.cookies.get('tracker_auth');
    if (!auth || auth.value !== 'ok') {
      return noCache(NextResponse.redirect(new URL('/login?role=tracker', req.url)));
    }
  }

  if (pathname === '/dashboard') {
    const auth = req.cookies.get('dashboard_auth');
    if (!auth || auth.value !== 'ok') {
      return noCache(NextResponse.redirect(new URL('/login?role=dashboard', req.url)));
    }
  }

  // Pass through but always stamp no-cache so Vercel's CDN never
  // stores an authenticated page and serves it to unauthenticated visitors
  return noCache(NextResponse.next());
}

export const config = {
  matcher: ['/', '/dashboard'],
};
