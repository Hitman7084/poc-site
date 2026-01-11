import { z } from 'zod'

// ============================================
// PAYMENT VALIDATION SCHEMAS
// ============================================

export const createPaymentSchema = z.object({
  clientName: z.string().min(1),
  paymentType: z.enum(['ADVANCE', 'DURING', 'FINAL']),
  amount: z.number().positive(),
  paymentDate: z.string().datetime().or(z.date()),
  documentUrl: z.string().url().optional(),
  projectName: z.string().optional(),
  notes: z.string().optional(),
})

export const updatePaymentSchema = createPaymentSchema.partial()

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>
