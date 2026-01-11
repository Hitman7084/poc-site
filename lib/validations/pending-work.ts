import { z } from 'zod'

// ============================================
// PENDING WORK VALIDATION SCHEMAS
// ============================================

export const createPendingWorkSchema = z.object({
  siteId: z.string().cuid(),
  taskDescription: z.string().min(1),
  reasonForPending: z.string().min(1),
  expectedCompletionDate: z.string().datetime().or(z.date()).optional(),
  actualCompletionDate: z.string().datetime().or(z.date()).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).default('PENDING'),
  priority: z.string().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
})

export const updatePendingWorkSchema = createPendingWorkSchema.partial()

export type CreatePendingWorkInput = z.infer<typeof createPendingWorkSchema>
export type UpdatePendingWorkInput = z.infer<typeof updatePendingWorkSchema>
