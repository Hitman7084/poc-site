import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, apiPaginated, parsePaginationParams, validateRequest, parseDate, parseEndOfDayDate } from '@/lib/api-utils'
import { createPaymentSchema } from '@/lib/validations/payments'
import { PaymentType } from '@/lib/types'

// GET /api/payments - Fetch payment records with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const clientName = searchParams.get('clientName')
    const paymentType = searchParams.get('paymentType')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const fetchAll = searchParams.get('all') === 'true'
    const { page, limit, skip } = parsePaginationParams(searchParams)

    const where = {
      ...(clientName && { clientName: { contains: clientName, mode: 'insensitive' as const } }),
      ...(paymentType && { paymentType: paymentType as PaymentType }),
      ...(fromDate || toDate ? {
        paymentDate: {
          ...(fromDate && { gte: parseDate(fromDate) }),
          ...(toDate && { lte: parseEndOfDayDate(toDate) }),
        },
      } : {}),
    }

    // If fetching all records (for export), skip pagination
    if (fetchAll) {
      const records = await prisma.payment.findMany({
        where,
        orderBy: { paymentDate: 'desc' },
      })
      return apiPaginated(records, {
        total: records.length,
        page: 1,
        limit: records.length,
        totalPages: 1,
      })
    }

    const [records, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { paymentDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ])

    return apiPaginated(records, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
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
    return apiError('Failed to create payment record', 500)
  }
}
