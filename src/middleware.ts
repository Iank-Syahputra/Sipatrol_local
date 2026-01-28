import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // 1. Get the token securely
  // PENTING: Secret di sini HARUS sama persis dengan yang di route.ts
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || "rahasia_dapur_sipatrol_2026"
  });

  const { pathname } = req.nextUrl;

  console.log(`[Middleware] Path: ${pathname} | Token Found: ${!!token} | Role: ${token?.role}`);

  // 2. Define protected routes
  const isAdminRoute = pathname.startsWith('/admin');
  const isSecurityRoute = pathname.startsWith('/security');
  const isLoginRoute = pathname.startsWith('/login');

  // 3. Logic: If trying to access protected route but NOT logged in
  if ((isAdminRoute || isSecurityRoute) && !token) {
    const loginUrl = new URL('/login', req.url);
    // Hapus callbackUrl agar tidak looping aneh-aneh dulu, kita bikin simple
    // loginUrl.searchParams.set('callbackUrl', pathname); 
    return NextResponse.redirect(loginUrl);
  }

  // 4. Logic: If ALREADY logged in but trying to access Login
  if (isLoginRoute && token) {
    if (token.role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    } else {
      return NextResponse.redirect(new URL('/security', req.url));
    }
  }

  // 5. Logic: Role Protection
  if (isAdminRoute && token?.role !== 'admin') {
    return NextResponse.redirect(new URL('/security', req.url));
  }

  if (isSecurityRoute && token?.role !== 'security' && token?.role !== 'admin') {
     return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/security/:path*',
    '/login',
  ],
};