import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, apiPaginated, parsePaginationParams, validateRequest, parseDate, parseEndOfDayDate } from '@/lib/api-utils'
import { createOvertimeSchema } from '@/lib/validations/overtime'

// GET /api/overtime - Fetch overtime records with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const workerId = searchParams.get('workerId')
    const siteId = searchParams.get('siteId')
    const date = searchParams.get('date')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const fetchAll = searchParams.get('all') === 'true'
    const { page, limit, skip } = parsePaginationParams(searchParams)

    const where = {
      ...(workerId && { workerId }),
      ...(siteId && { siteId }),
      ...(date && { date: parseDate(date) }),
      ...(fromDate || toDate ? {
        date: {
          ...(fromDate && { gte: parseDate(fromDate) }),
          ...(toDate && { lte: parseEndOfDayDate(toDate) }),
        },
      } : {}),
    }

    // If fetching all records (for export), skip pagination
    if (fetchAll) {
      const records = await prisma.overtime.findMany({
        where,
        include: {
          worker: { select: { id: true, name: true } },
          site: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
      })
      return apiPaginated(records, {
        total: records.length,
        page: 1,
        limit: records.length,
        totalPages: 1,
      })
    }

    const [records, total] = await Promise.all([
      prisma.overtime.findMany({
        where,
        include: {
          worker: { select: { id: true, name: true } },
          site: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.overtime.count({ where }),
    ])

    return apiPaginated(records, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/overtime error:', error)
    return apiError('Failed to fetch overtime records', 500)
  }
}

// POST /api/overtime - Create new overtime record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const validation = await validateRequest(request, createOvertimeSchema)
    if (!validation.success) {
      return apiError(validation.error, 400)
    }

    const { data } = validation

    // Business logic: Auto-calculate totalAmount if not provided
    const totalAmount = data.totalAmount ?? (data.extraHours * data.rate)

    // Business logic: Validate extraHours is positive
    if (data.extraHours <= 0) {
      return apiError('Extra hours must be greater than 0', 400)
    }

    const record = await prisma.overtime.create({
      data: {
        ...data,
        date: parseDate(data.date),
        totalAmount,
      },
      include: {
        worker: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
      },
    })

    return apiSuccess(record, 201)
  } catch (error) {
    console.error('POST /api/overtime error:', error)
    return apiError('Failed to create overtime record', 500)
  }
}
