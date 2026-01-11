import { z } from 'zod'

// ============================================
// OVERTIME VALIDATION SCHEMAS
// ============================================

export const createOvertimeSchema = z.object({
  workerId: z.string().cuid(),
  siteId: z.string().cuid(),
  date: z.string().datetime().or(z.date()),
  extraHours: z.number().positive(),
  rate: z.number().positive(),
  totalAmount: z.number().positive().optional(), // Can be auto-calculated
  notes: z.string().optional(),
})

export const updateOvertimeSchema = createOvertimeSchema.partial()

export type CreateOvertimeInput = z.infer<typeof createOvertimeSchema>
export type UpdateOvertimeInput = z.infer<typeof updateOvertimeSchema>
