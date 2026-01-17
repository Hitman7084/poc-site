/**
 * API Route Middleware Utilities
 * 
 * Helper functions for wrapping API route handlers with common functionality
 * like rate limiting, logging, error handling, validation, and CORS.
 * 
 * Note: This is different from Next.js proxy (root-level proxy.ts)
 * which handles request routing and authentication.
 * 
 * Usage:
 * import { withRateLimit, withErrorHandling, compose } from '@/lib/api-middleware'
 * 
 * export const GET = compose(withRateLimit, withErrorHandling)(handler)
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Rate limiting configuration
 */
interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

/**
 * Simple in-memory rate limiter (for production, use Redis or similar)
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map()

  check(identifier: string, config: RateLimitConfig): boolean {
    const now = Date.now()
    const windowStart = now - config.windowMs

    // Get existing requests for this identifier
    let userRequests = this.requests.get(identifier) || []
    
    // Filter out requests outside the current window
    userRequests = userRequests.filter(timestamp => timestamp > windowStart)
    
    // Check if limit exceeded
    if (userRequests.length >= config.maxRequests) {
      return false
    }
    
    // Add current request
    userRequests.push(now)
    this.requests.set(identifier, userRequests)
    
    return true
  }

  reset(identifier: string): void {
    this.requests.delete(identifier)
  }

  cleanup(): void {
    const now = Date.now()
    const maxAge = 3600000 // 1 hour
    
    for (const [identifier, timestamps] of this.requests.entries()) {
      const recentTimestamps = timestamps.filter(ts => now - ts < maxAge)
      if (recentTimestamps.length === 0) {
        this.requests.delete(identifier)
      } else {
        this.requests.set(identifier, recentTimestamps)
      }
    }
  }
}

export const rateLimiter = new RateLimiter()

// Cleanup old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 300000) // Every 5 minutes
}

/**
 * Apply rate limiting to API routes
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 60 }
) {
  return async (req: NextRequest) => {
    // Get identifier (IP address or user ID)
    const identifier = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    
    if (!rateLimiter.check(identifier, config)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
          }
        }
      )
    }
    
    return handler(req)
  }
}

/**
 * Request/Response logging
 */
export function withLogging(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const startTime = Date.now()
    const { method, url } = req
    
    console.log(`[${new Date().toISOString()}] ${method} ${url} - Request started`)
    
    try {
      const response = await handler(req)
      const duration = Date.now() - startTime
      
      console.log(
        `[${new Date().toISOString()}] ${method} ${url} - ${response.status} (${duration}ms)`
      )
      
      return response
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(
        `[${new Date().toISOString()}] ${method} ${url} - Error (${duration}ms):`,
        error
      )
      throw error
    }
  }
}

/**
 * Error handling wrapper
 */
export function withErrorHandling(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      return await handler(req)
    } catch (error) {
      console.error('API Error:', error)
      
      // Handle known error types
      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'An unexpected error occurred' },
        { status: 500 }
      )
    }
  }
}

/**
 * Compose multiple middleware functions
 */
export function compose(...middlewares: Array<(handler: any) => any>) {
  return (handler: any) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}

/**
 * Request validation
 */
export function withValidation<T>(
  handler: (req: NextRequest, body: T) => Promise<NextResponse>,
  validator: (data: unknown) => T
) {
  return async (req: NextRequest) => {
    try {
      const body = await req.json()
      const validatedBody = validator(body)
      return handler(req, validatedBody)
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json(
          { error: `Validation error: ${error.message}` },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
  }
}

/**
 * Cache control helper
 */
export function withCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  maxAge: number = 60
) {
  return async (req: NextRequest) => {
    const response = await handler(req)
    
    if (response.ok) {
      response.headers.set(
        'Cache-Control',
        `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`
      )
    }
    
    return response
  }
}

/**
 * CORS headers helper
 */
export function withCORS(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    origin?: string
    methods?: string[]
    headers?: string[]
    credentials?: boolean
  } = {}
) {
  return async (req: NextRequest) => {
    const {
      origin = '*',
      methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      headers = ['Content-Type', 'Authorization'],
      credentials = true,
    } = options
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': methods.join(','),
          'Access-Control-Allow-Headers': headers.join(','),
          'Access-Control-Allow-Credentials': credentials.toString(),
          'Access-Control-Max-Age': '86400',
        },
      })
    }
    
    const response = await handler(req)
    
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', methods.join(','))
    response.headers.set('Access-Control-Allow-Headers', headers.join(','))
    if (credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }
    
    return response
  }
}
