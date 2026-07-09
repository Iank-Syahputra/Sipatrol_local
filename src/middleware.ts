import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || "rahasia_dapur_sipatrol_2026"
  });

  const { pathname } = req.nextUrl;

  const isAdminRoute = pathname.startsWith('/admin');
  const isSecurityRoute = pathname.startsWith('/security');

  if ((isAdminRoute || isSecurityRoute) && !token) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/security/:path*',
  ],
};