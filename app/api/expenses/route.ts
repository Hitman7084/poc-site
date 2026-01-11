import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, validateRequest, parseDate } from '@/lib/api-utils'
import { createExpenseSchema } from '@/lib/validations/expenses'

// GET /api/expenses - Fetch all expense records
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const records = await prisma.expense.findMany({
      where: {
        ...(category && { category: category as any }),
        ...(startDate && endDate && {
          date: {
            gte: parseDate(startDate),
            lte: parseDate(endDate),
          },
        }),
      },
      orderBy: { date: 'desc' },
    })

    return apiSuccess(records)
  } catch (error) {
    console.error('GET /api/expenses error:', error)
    return apiError('Failed to fetch expense records', 500)
  }
}

// POST /api/expenses - Create new expense record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const validation = await validateRequest(request, createExpenseSchema)
    if (!validation.success) {
      return apiError(validation.error, 400)
    }

    const { data } = validation

    // Business logic: Validate amount is positive
    if (data.amount <= 0) {
      return apiError('Amount must be greater than 0', 400)
    }

    const record = await prisma.expense.create({
      data: {
        ...data,
        date: parseDate(data.date),
      },
    })

    return apiSuccess(record, 201)
  } catch (error) {
    console.error('POST /api/expenses error:', error)
    return apiError('Failed to create expense record', 500)
  }
}
