import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, apiPaginated, parsePaginationParams, validateRequest, parseDate } from '@/lib/api-utils'
import { createDispatchSchema } from '@/lib/validations/dispatch'

// GET /api/dispatch - Fetch dispatch records with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const fromSiteId = searchParams.get('fromSiteId')
    const toSiteId = searchParams.get('toSiteId')
    const isReceived = searchParams.get('isReceived')
    const date = searchParams.get('date')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const fetchAll = searchParams.get('all') === 'true'
    const { page, limit, skip } = parsePaginationParams(searchParams)

    const where = {
      ...(fromSiteId && { fromSiteId }),
      ...(toSiteId && { toSiteId }),
      ...(isReceived !== null && { isReceived: isReceived === 'true' }),
      ...(date && { dispatchDate: parseDate(date) }),
      ...(fromDate || toDate ? {
        dispatchDate: {
          ...(fromDate && { gte: parseDate(fromDate) }),
          ...(toDate && { lte: parseDate(toDate) }),
        },
      } : {}),
    }

    // If fetching all records (for export), skip pagination
    if (fetchAll) {
      const records = await prisma.dispatchRecord.findMany({
        where,
        include: {
          fromSite: { select: { id: true, name: true } },
          toSite: { select: { id: true, name: true } },
        },
        orderBy: { dispatchDate: 'desc' },
      })
      return apiPaginated(records, {
        total: records.length,
        page: 1,
        limit: records.length,
        totalPages: 1,
      })
    }

    const [records, total] = await Promise.all([
      prisma.dispatchRecord.findMany({
        where,
        include: {
          fromSite: { select: { id: true, name: true } },
          toSite: { select: { id: true, name: true } },
        },
        orderBy: { dispatchDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dispatchRecord.count({ where }),
    ])

    return apiPaginated(records, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/dispatch error:', error)
    return apiError('Failed to fetch dispatch records', 500)
  }
}

// POST /api/dispatch - Create new dispatch record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const validation = await validateRequest(request, createDispatchSchema)
    if (!validation.success) {
      return apiError(validation.error, 400)
    }

    const { data } = validation

    // Business logic: Validate from and to sites are different
    if (data.fromSiteId === data.toSiteId) {
      return apiError('From and to sites must be different', 400)
    }

    // Business logic: Validate quantity is positive
    if (data.quantity <= 0) {
      return apiError('Quantity must be greater than 0', 400)
    }

    const record = await prisma.dispatchRecord.create({
      data: {
        ...data,
        dispatchDate: parseDate(data.dispatchDate),
      },
      include: {
        fromSite: { select: { id: true, name: true } },
        toSite: { select: { id: true, name: true } },
      },
    })

    return apiSuccess(record, 201)
  } catch (error) {
    console.error('POST /api/dispatch error:', error)
    return apiError('Failed to create dispatch record', 500)
  }
}
