import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'mybudget-super-secret-jwt-key-2026'
);

const PUBLIC_ROUTES = ['/login', '/register'];
const ADMIN_ROUTES = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/icons') ||
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

  // Redirect authenticated users away from login/register
  if (PUBLIC_ROUTES.includes(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Protect all other routes
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect admin routes
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    if ((session as any).role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
