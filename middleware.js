import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname === '/') {
    const auth = req.cookies.get('tracker_auth');
    if (!auth || auth.value !== 'ok') {
      return NextResponse.redirect(new URL('/login?role=tracker', req.url));
    }
  }

  if (pathname === '/dashboard') {
    const auth = req.cookies.get('dashboard_auth');
    if (!auth || auth.value !== 'ok') {
      return NextResponse.redirect(new URL('/login?role=dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard'],
};
