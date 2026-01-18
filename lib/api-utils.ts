import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Standard API Response Type
 */
export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Prisma Error type for type-safe error code checks
 */
export interface PrismaError {
  code?: string
  message?: string
  meta?: Record<string, unknown>
}

/**
 * Type guard to check if an error is a Prisma error with a specific code
 */
export function isPrismaError(error: unknown): error is PrismaError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as PrismaError).code === 'string'
  )
}

/**
 * Check if error is a Prisma "Record not found" error (P2025)
 */
export function isNotFoundError(error: unknown): boolean {
  return isPrismaError(error) && error.code === 'P2025'
}

/**
 * API Response helper - Success
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status })
}

/**
 * Pagination info type
 */
export type PaginationInfo = {
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Paginated API Response type
 */
export type PaginatedApiResponse<T> = {
  success: boolean
  data?: T[]
  pagination?: PaginationInfo
  error?: string
}

/**
 * API Response helper - Paginated Success
 */
export function apiPaginated<T>(
  data: T[],
  pagination: PaginationInfo,
  status = 200
): NextResponse<PaginatedApiResponse<T>> {
  return NextResponse.json({ success: true, data, pagination }, { status })
}

/**
 * Parse pagination params from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

/**
 * API Error response helper
 */
export function apiError(message: string, status = 400): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error: message }, { status })
}

/**
 * Validate request body with Zod schema
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return {
        success: false,
        error: zodError.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      }
    }
    return { success: false, error: 'Invalid request body' }
  }
}

/**
 * Parse and convert date strings to Date objects
 */
export function parseDate(dateString: string | Date): Date {
  return dateString instanceof Date ? dateString : new Date(dateString)
}
