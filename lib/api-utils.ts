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
 * API Response helper - Success
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status })
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
