import { z } from 'zod'

// ============================================
// EXPENSE VALIDATION SCHEMAS
// ============================================

export const createExpenseSchema = z.object({
  category: z.enum(['OFFICE', 'SITE_VISIT', 'PARTY_VISIT']),
  amount: z.number().positive(),
  description: z.string().min(1),
  date: z.string().datetime().or(z.date()),
  billUrl: z.string().url().optional(),
  notes: z.string().optional(),
})

export const updateExpenseSchema = createExpenseSchema.partial()

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
