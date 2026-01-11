import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, validateRequest, parseDate } from '@/lib/api-utils'
import { createPaymentSchema } from '@/lib/validations/payments'

// GET /api/payments - Fetch all payment records
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const clientName = searchParams.get('clientName')
    const paymentType = searchParams.get('paymentType')

    const records = await prisma.payment.findMany({
      where: {
        ...(clientName && { clientName: { contains: clientName, mode: 'insensitive' } }),
        ...(paymentType && { paymentType: paymentType as any }),
      },
      orderBy: { paymentDate: 'desc' },
    })

    return apiSuccess(records)
  } catch (error) {
    console.error('GET /api/payments error:', error)
    return apiError('Failed to fetch payment records', 500)
  }
}

// POST /api/payments - Create new payment record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const validation = await validateRequest(request, createPaymentSchema)
    if (!validation.success) {
      return apiError(validation.error, 400)
    }

    const { data } = validation

    // Business logic: Validate amount is positive
    if (data.amount <= 0) {
      return apiError('Amount must be greater than 0', 400)
    }

    const record = await prisma.payment.create({
      data: {
        ...data,
        paymentDate: parseDate(data.paymentDate),
      },
    })

    return apiSuccess(record, 201)
  } catch (error) {
    console.error('POST /api/payments error:', error)
    return apiError('Failed to create payment record', 500)
  }
}
