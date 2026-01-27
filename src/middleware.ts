import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Apply authentication only to specific protected routes
export default function middleware(req: any) {
  // Define protected routes
  const protectedPaths = [
    '/admin',
    '/admin/',
    '/security',
    '/security/',
    '/dashboard',
    '/dashboard/',
    '/profile',
    '/profile/',
  ];

  const isProtected = protectedPaths.some(path =>
    req.nextUrl.pathname.startsWith(path)
  );

  if (isProtected) {
    return withAuth({
      pages: {
        signIn: '/login',
      },
    })(req);
  }

  // Allow access to all other routes (including root '/')
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
