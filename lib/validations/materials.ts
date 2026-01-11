import { z } from 'zod'

// ============================================
// MATERIAL VALIDATION SCHEMAS
// ============================================

export const createMaterialSchema = z.object({
  siteId: z.string().cuid(),
  materialName: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  date: z.string().datetime().or(z.date()),
  cost: z.number().positive().optional(),
  supplierName: z.string().optional(),
  notes: z.string().optional(),
})

export const updateMaterialSchema = createMaterialSchema.partial()

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>
