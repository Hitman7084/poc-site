import { z } from 'zod'

// ============================================
// SITE VALIDATION SCHEMAS
// ============================================

export const createSiteSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
})

export const updateSiteSchema = createSiteSchema.partial()

export type CreateSiteInput = z.infer<typeof createSiteSchema>
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>
