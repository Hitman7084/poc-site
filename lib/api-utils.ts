import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * DEAR DEVELOPER DO  NOT TOUCH THE BELOW DATE AND TIME HELLISH CODE I MYSELF DON'T KNOW HOW I HAVE MANAGED THE DATA AND TIME.
 * IF YOU CHANGE THE CODE THEN DO SO AT YOUR OWN RISK. I WILL NOT BE RESPONSIBLE FOR ANY BUGS OR ISSUES ARISING OUT OF IT.
 * THIS CODE IS A RESULT OF HOURS OF STRUGGLE TO MAKE DATES WORK PROPERLY WITH POSTGRESQL AND NEXT.JS.
 * PROCEED WITH CAUTION AND TEST THOROUGHLY IF YOU DECIDE TO MODIFY ANYTHING BELOW.
 *
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
 * Parse and convert date strings to Date objects at start of day (00:00:00)
 * Used for "from date" filters to include the entire day
 * For @db.Date columns, creates a Date that PostgreSQL will interpret correctly
 */
export function parseDate(dateString: string | Date): Date {
  if (dateString instanceof Date) {
    const date = new Date(dateString)
    date.setUTCHours(0, 0, 0, 0)
    return date
  }
  
  // Extract just the date part if it's an ISO string with time
  const datePart = dateString.split('T')[0]
  
  // Create Date at midnight UTC for consistent @db.Date comparison
  return new Date(`${datePart}T00:00:00.000Z`)
}

/**
 * Parse date string and set time to end of day (23:59:59.999)
 * Used for "to date" filters to include all records on that day
 * For @db.Date columns, creates a Date that PostgreSQL will interpret correctly
 */
export function parseEndOfDayDate(dateString: string | Date): Date {
  if (dateString instanceof Date) {
    const date = new Date(dateString)
    date.setUTCHours(23, 59, 59, 999)
    return date
  }
  
  // Extract just the date part if it's an ISO string with time
  const datePart = dateString.split('T')[0]
  
  // Create Date at end of day UTC for consistent @db.Date comparison
  return new Date(`${datePart}T23:59:59.999Z`)
}

/**
 * Format a Date object to YYYY-MM-DD format in local timezone
 * Prevents timezone-related date shifting when passing dates to API
 */
export function formatDateForAPI(date: Date | undefined): string | undefined {
  if (!date) return undefined
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Convert YYYY-MM-DD string to ISO string preserving the date in local timezone
 * Used when sending dates from forms to API
 * For @db.Date columns, this ensures the date is stored correctly regardless of server timezone
 */
export function dateStringToISO(dateString: string): string {
  if (!dateString) return ''
  
  // Extract just the date part if it's already an ISO string
  const datePart = dateString.split('T')[0]
  
  // For date-only fields (@db.Date), append time at start of day in ISO format
  // This ensures PostgreSQL extracts the correct date regardless of server timezone
  return `${datePart}T00:00:00.000Z`
}
