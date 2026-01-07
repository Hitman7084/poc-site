import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * API Response helper
 */
export function apiResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

/**
 * API Error response helper
 */
export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
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
