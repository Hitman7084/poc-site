import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, apiPaginated, parsePaginationParams, validateRequest, parseDate } from '@/lib/api-utils'
import { createExpenseSchema } from '@/lib/validations/expenses'
import { ExpenseCategory } from '@/lib/types'

// GET /api/expenses - Fetch expense records with pagination
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
    const { page, limit, skip } = parsePaginationParams(searchParams)

    const where = {
      ...(category && { category: category as ExpenseCategory }),
      ...(startDate && endDate && {
        date: {
          gte: parseDate(startDate),
          lte: parseDate(endDate),
        },
      }),
    }

    const [records, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ])

    return apiPaginated(records, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
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
