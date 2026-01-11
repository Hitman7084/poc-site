import { z } from 'zod'

// ============================================
// DISPATCH VALIDATION SCHEMAS
// ============================================

export const createDispatchSchema = z.object({
  fromSiteId: z.string().cuid(),
  toSiteId: z.string().cuid(),
  materialName: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  dispatchDate: z.string().datetime().or(z.date()),
  receivedDate: z.string().datetime().or(z.date()).optional(),
  isReceived: z.boolean().default(false),
  dispatchedBy: z.string().optional(),
  receivedBy: z.string().optional(),
  notes: z.string().optional(),
})

export const updateDispatchSchema = createDispatchSchema.partial()

export type CreateDispatchInput = z.infer<typeof createDispatchSchema>
export type UpdateDispatchInput = z.infer<typeof updateDispatchSchema>
