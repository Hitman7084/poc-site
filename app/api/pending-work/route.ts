import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, apiPaginated, parsePaginationParams, validateRequest, parseDate, parseEndOfDayDate } from '@/lib/api-utils'
import { createPendingWorkSchema } from '@/lib/validations/pending-work'
import { PendingWorkStatus } from '@/lib/types'

// GET /api/pending-work - Fetch pending work records with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const status = searchParams.get('status')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const fetchAll = searchParams.get('all') === 'true'
    const { page, limit, skip } = parsePaginationParams(searchParams)

    const where = {
      ...(siteId && { siteId }),
      ...(status && { status: status as PendingWorkStatus }),
      ...(fromDate || toDate ? {
        expectedCompletionDate: {
          ...(fromDate && { gte: parseDate(fromDate) }),
          ...(toDate && { lte: parseEndOfDayDate(toDate) }),
        },
      } : {}),
    }

    // If fetching all records (for export), skip pagination
    if (fetchAll) {
      const records = await prisma.pendingWork.findMany({
        where,
        include: { site: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      })
      return apiPaginated(records, {
        total: records.length,
        page: 1,
        limit: records.length,
        totalPages: 1,
      })
    }

    const [records, total] = await Promise.all([
      prisma.pendingWork.findMany({
        where,
        include: { site: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pendingWork.count({ where }),
    ])

    return apiPaginated(records, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/pending-work error:', error)
    return apiError('Failed to fetch pending work records', 500)
  }
}

// POST /api/pending-work - Create new pending work record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const validation = await validateRequest(request, createPendingWorkSchema)
    if (!validation.success) {
      return apiError(validation.error, 400)
    }

    const { data } = validation

    const record = await prisma.pendingWork.create({
      data: {
        ...data,
        expectedCompletionDate: data.expectedCompletionDate ? parseDate(data.expectedCompletionDate) : null,
        actualCompletionDate: data.actualCompletionDate ? parseDate(data.actualCompletionDate) : null,
      },
      include: { site: { select: { id: true, name: true } } },
    })

    return apiSuccess(record, 201)
  } catch (error) {
    console.error('POST /api/pending-work error:', error)
    return apiError('Failed to create pending work record', 500)
  }
}
