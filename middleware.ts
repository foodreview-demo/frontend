import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken')?.value; // Assume accessToken is stored in cookies
  const refreshToken = request.cookies.get('refreshToken')?.value; // Assume refreshToken is stored in cookies

  const publicPaths = ['/login', '/signup', '/oauth']; // Publicly accessible paths

  // Check if the current path is public
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

  // If there's no access token and not on a public path, redirect to login
  if (!accessToken && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Allow the request to continue if authenticated or on a public path
  return NextResponse.next();
}

// Configure middleware to run on all paths except API routes, static files, and _next
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|signup|oauth|.*\\..*).*)'],
};
