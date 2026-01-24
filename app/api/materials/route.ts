import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, apiPaginated, parsePaginationParams, validateRequest, parseDate, parseEndOfDayDate } from '@/lib/api-utils'
import { createMaterialSchema } from '@/lib/validations/materials'

// GET /api/materials - Fetch material records with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const materialName = searchParams.get('materialName')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const fetchAll = searchParams.get('all') === 'true'
    const { page, limit, skip } = parsePaginationParams(searchParams)

    const where = {
      ...(siteId && { siteId }),
      ...(materialName && { materialName: { contains: materialName, mode: 'insensitive' as const } }),
      ...(fromDate || toDate ? {
        date: {
          ...(fromDate && { gte: parseDate(fromDate) }),
          ...(toDate && { lte: parseEndOfDayDate(toDate) }),
        },
      } : {}),
    }

    // If fetching all records (for export), skip pagination
    if (fetchAll) {
      const records = await prisma.materialRecord.findMany({
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
      prisma.materialRecord.findMany({
        where,
        include: { site: { select: { id: true, name: true } } },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.materialRecord.count({ where }),
    ])

    return apiPaginated(records, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return apiError('Failed to fetch material records', 500)
  }
}

// POST /api/materials - Create new material record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const validation = await validateRequest(request, createMaterialSchema)
    if (!validation.success) {
      return apiError(validation.error, 400)
    }

    const { data } = validation

    // Business logic: Validate quantity is positive
    if (data.quantity <= 0) {
      return apiError('Quantity must be greater than 0', 400)
    }

    const record = await prisma.materialRecord.create({
      data: {
        ...data,
        date: parseDate(data.date),
      },
      include: { site: { select: { id: true, name: true } } },
    })

    return apiSuccess(record, 201)
  } catch (error) {
    return apiError('Failed to create material record', 500)
  }
}
