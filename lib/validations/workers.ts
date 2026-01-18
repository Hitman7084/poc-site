import { z } from 'zod'

// ============================================
// WORKER VALIDATION SCHEMAS
// ============================================

export const createWorkerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  dailyRate: z.number().positive().optional(),
  assignedSites: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const updateWorkerSchema = createWorkerSchema.partial()

export type CreateWorkerInput = z.infer<typeof createWorkerSchema>
export type UpdateWorkerInput = z.infer<typeof updateWorkerSchema>
