import { z } from 'zod'

// ============================================
// WORK UPDATE VALIDATION SCHEMAS
// ============================================

export const createWorkUpdateSchema = z.object({
  siteId: z.string().cuid(),
  date: z.string().datetime().or(z.date()),
  description: z.string().min(1),
  photoUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  createdBy: z.string().optional(),
})

export const updateWorkUpdateSchema = createWorkUpdateSchema.partial()

export type CreateWorkUpdateInput = z.infer<typeof createWorkUpdateSchema>
export type UpdateWorkUpdateInput = z.infer<typeof updateWorkUpdateSchema>
