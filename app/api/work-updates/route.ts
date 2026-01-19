import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, apiPaginated, parsePaginationParams, validateRequest, parseDate } from '@/lib/api-utils'
import { createWorkUpdateSchema } from '@/lib/validations/work-updates'

// GET /api/work-updates - Fetch work updates with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const date = searchParams.get('date')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const fetchAll = searchParams.get('all') === 'true'
    const { page, limit, skip } = parsePaginationParams(searchParams)

    const where = {
      ...(siteId && { siteId }),
      ...(date && { date: parseDate(date) }),
      ...(fromDate || toDate ? {
        date: {
          ...(fromDate && { gte: parseDate(fromDate) }),
          ...(toDate && { lte: parseDate(toDate) }),
        },
      } : {}),
    }

    // If fetching all records (for export), skip pagination
    if (fetchAll) {
      const records = await prisma.workUpdate.findMany({
        where,
        include: { site: { select: { id: true, name: true } } },
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
      prisma.workUpdate.findMany({
        where,
        include: { site: { select: { id: true, name: true } } },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workUpdate.count({ where }),
    ])

    return apiPaginated(records, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/work-updates error:', error)
    return apiError('Failed to fetch work updates', 500)
  }
}

// POST /api/work-updates - Create new work update
// This endpoint expects photoUrl (from Google Drive) and videoUrl (Google Drive link)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const validation = await validateRequest(request, createWorkUpdateSchema)
    if (!validation.success) {
      return apiError(validation.error, 400)
    }

    const { data } = validation

    const record = await prisma.workUpdate.create({
      data: {
        ...data,
        date: parseDate(data.date),
      },
      include: { site: { select: { id: true, name: true } } },
    })

    return apiSuccess(record, 201)
  } catch (error) {
    console.error('POST /api/work-updates error:', error)
    return apiError('Failed to create work update', 500)
  }
}
