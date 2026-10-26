import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'mybudget-dev-secret-jwt-key-change-in-production'
);

const PUBLIC_ROUTES = ['/login', '/register'];
const ADMIN_ROUTES = ['/admin'];

// Simple in-memory rate limiting (per-IP, resets on server restart)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5 menit

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public assets, static files, and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/icons') ||
    pathname.includes('.') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;
  let session = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      session = payload;
    } catch {
      // Invalid token
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // Rate limit login attempts
  if (pathname === '/login' && request.method === 'POST') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const record = loginAttempts.get(ip);
    
    if (record && now < record.resetAt) {
      if (record.count >= MAX_ATTEMPTS) {
        return new NextResponse('Too many attempts. Try again in 5 minutes.', { status: 429 });
      }
      record.count++;
    } else {
      loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    }
  }

  // Redirect authenticated users away from login/register
  if (PUBLIC_ROUTES.includes(pathname)) {
    if (session) {
      if ((session as any).role === 'admin' && !(session as any).impersonatorAdminId) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Protect all other routes
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isPureAdmin = (session as any).role === 'admin' && !(session as any).impersonatorAdminId;

  // Pure admin should strictly access /admin (and not personal user finance pages)
  if (isPureAdmin && !pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Non-admins cannot access /admin (unless impersonating as admin)
  if (!isPureAdmin && ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!(session as any).impersonatorAdminId) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
