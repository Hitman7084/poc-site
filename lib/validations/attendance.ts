import { z } from 'zod'

// ============================================
// ATTENDANCE VALIDATION SCHEMAS
// ============================================

export const createAttendanceSchema = z.object({
  workerId: z.string().cuid(),
  siteId: z.string().cuid(),
  date: z.string().datetime().or(z.date()),
  checkIn: z.string().datetime().or(z.date()).optional(),
  checkOut: z.string().datetime().or(z.date()).optional(),
  status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY']),
  notes: z.string().optional(),
})

export const updateAttendanceSchema = createAttendanceSchema.partial()

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>
