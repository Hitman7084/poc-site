import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, validateRequest, parseDate, isNotFoundError } from '@/lib/api-utils'
import { updateExpenseSchema } from '@/lib/validations/expenses'

// GET /api/expenses/[id]
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

    const expense = await prisma.expense.findUnique({
      where: { id },
    })

    if (!expense) {
      return apiError('Expense not found', 404)
    }

    return apiSuccess(expense)
  } catch (error) {
    return apiError('Failed to fetch expense record', 500)
  }
}

// PUT /api/expenses/[id]
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

    const validation = await validateRequest(request, updateExpenseSchema)
    if (!validation.success) {
      return apiError(validation.error, 400)
    }

    const { data } = validation

    // Validate amount > 0
    if (data.amount !== undefined && data.amount <= 0) {
      return apiError('Amount must be greater than 0', 400)
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? parseDate(data.date) : undefined,
      },
    })

    return apiSuccess(expense)
  } catch (error) {
    if (isNotFoundError(error)) {
      return apiError('Expense not found', 404)
    }
    return apiError('Failed to update expense record', 500)
  }
}

// DELETE /api/expenses/[id]
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

    const expense = await prisma.expense.delete({
      where: { id },
    })

    return apiSuccess(expense)
  } catch (error) {
    if (isNotFoundError(error)) {
      return apiError('Expense not found', 404)
    }
    return apiError('Failed to delete expense record', 500)
  }
}
