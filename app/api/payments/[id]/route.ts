import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, validateRequest, parseDate, isNotFoundError } from '@/lib/api-utils'
import { updatePaymentSchema } from '@/lib/validations/payments'

// GET /api/payments/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { id } = await params

    const payment = await prisma.payment.findUnique({
      where: { id },
    })

    if (!payment) {
      return apiError('Payment not found', 404)
    }

    return apiSuccess(payment)
  } catch (error) {
    return apiError('Failed to fetch payment record', 500)
  }
}

// PUT /api/payments/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { id } = await params

    const validation = await validateRequest(request, updatePaymentSchema)
    if (!validation.success) {
      return apiError(validation.error, 400)
    }

    const { data } = validation

    // Validate amount > 0
    if (data.amount !== undefined && data.amount <= 0) {
      return apiError('Amount must be greater than 0', 400)
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        ...data,
        paymentDate: data.paymentDate ? parseDate(data.paymentDate) : undefined,
      },
    })

    return apiSuccess(payment)
  } catch (error) {
    if (isNotFoundError(error)) {
      return apiError('Payment not found', 404)
    }
    return apiError('Failed to update payment record', 500)
  }
}

// DELETE /api/payments/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { id } = await params

    const payment = await prisma.payment.delete({
      where: { id },
    })

    return apiSuccess(payment)
  } catch (error) {
    if (isNotFoundError(error)) {
      return apiError('Payment not found', 404)
    }
    return apiError('Failed to delete payment record', 500)
  }
}
