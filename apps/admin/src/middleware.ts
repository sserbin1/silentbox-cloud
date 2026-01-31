import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password'];

// Routes that require super_admin role
const SUPER_ADMIN_ROUTES = ['/super'];

// API URL for token refresh
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface JWTPayload {
  sub: string;
  email: string;
  role: 'admin' | 'operator' | 'super_admin';
  tenant_id: string | null;
  iat: number;
  exp: number;
}

/**
 * Verify JWT token using jose
 */
async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-in-production');
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch (error) {
    // Token invalid or expired
    return null;
  }
}

/**
 * Try to refresh the access token
 */
async function tryRefreshToken(request: NextRequest): Promise<NextResponse | null> {
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/admin/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refresh_token=${refreshToken}`,
      },
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        // Get the Set-Cookie headers from the refresh response
        const setCookieHeaders = response.headers.getSetCookie?.() || [];

        // Create a response that continues to the requested page
        const continueResponse = NextResponse.next();

        // Forward the new cookies
        setCookieHeaders.forEach((cookie) => {
          continueResponse.headers.append('Set-Cookie', cookie);
        });

        return continueResponse;
      }
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // Get access token from cookies
  const accessToken = request.cookies.get('access_token')?.value;

  // Public routes - allow access
  if (isPublicRoute) {
    // If user is already authenticated and trying to access login, redirect to dashboard
    if (accessToken && pathname === '/login') {
      const payload = await verifyToken(accessToken);
      if (payload) {
        const redirectUrl = payload.role === 'super_admin' ? '/super' : '/dashboard';
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }
    }
    return NextResponse.next();
  }

  // Protected routes - require valid token
  if (!accessToken) {
    // No token - redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify the token
  let payload = await verifyToken(accessToken);

  // Token invalid or expired - try refresh
  if (!payload) {
    const refreshResult = await tryRefreshToken(request);
    if (refreshResult) {
      // Refresh successful - the response contains new cookies
      // Re-verify with the new token would require another request
      // For now, allow the request and let the client handle re-authentication if needed
      return refreshResult;
    }

    // Refresh failed - redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);

    // Clear invalid cookies
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    response.cookies.delete('csrf_token');
    return response;
  }

  // Check super admin routes
  const isSuperAdminRoute = SUPER_ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  if (isSuperAdminRoute && payload.role !== 'super_admin') {
    // Not super admin - redirect to dashboard with error
    return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
  }

  // All checks passed - continue to the requested page
  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
