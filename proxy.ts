import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Proxy for handling authentication, authorization, and route protection
 * Next.js 16+ uses "proxy" instead of "middleware"
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get authentication token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Allow public routes
  if (isPublicRoute) {
    // If already authenticated and trying to access login, redirect to dashboard
    if (pathname === '/login' && token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return addSecurityHeaders(NextResponse.next(), request)
  }

  // Protect dashboard and API routes
  if (!token) {
    // API routes return 401, dashboard routes redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    if (pathname.startsWith('/dashboard')) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Check token expiry for authenticated routes
  if (token && token.exp && Date.now() >= (token.exp as number) * 1000) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 401 }
      )
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return addSecurityHeaders(NextResponse.next(), request)
}

/**
 * Add comprehensive security headers to response
 */
function addSecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl
  const isProduction = process.env.NODE_ENV === 'production'

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // XSS Protection (legacy, but still useful for older browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // DNS Prefetch Control
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  
  // Content Security Policy
  if (isProduction) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https:; " +
      "frame-ancestors 'none';"
    )
  }
  
  // Strict Transport Security (HTTPS enforcement)
  if (isProduction) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  
  // Permissions Policy (restrict browser features)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
    
    // In production, only allow specific origins
    if (isProduction && origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    } else if (!isProduction) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*')
    }
    
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS')
    response.headers.set(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    )
    response.headers.set('Access-Control-Max-Age', '86400')
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: response.headers,
    })
  }

  return response
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
