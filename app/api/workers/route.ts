import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, apiPaginated, parsePaginationParams, validateRequest } from '@/lib/api-utils'
import { createWorkerSchema } from '@/lib/validations/workers'

// GET /api/workers - Fetch workers with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const name = searchParams.get('name')
    const fetchAll = searchParams.get('all') === 'true'

    const where = {
      ...(isActive !== null && { isActive: isActive === 'true' }),
      ...(name && { name: { contains: name, mode: 'insensitive' as const } }),
    }

    // If fetching all workers (for dropdowns), skip pagination
    if (fetchAll) {
      const workers = await prisma.worker.findMany({
        where,
        orderBy: { name: 'asc' },
      })
      const total = workers.length
      return apiPaginated(workers, {
        total,
        page: 1,
        limit: total,
        totalPages: 1,
      })
    }

    const { page, limit, skip } = parsePaginationParams(searchParams)

    const [workers, total] = await Promise.all([
      prisma.worker.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.worker.count({ where }),
    ])

    return apiPaginated(workers, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return apiError('Failed to fetch workers', 500)
  }
}

// POST /api/workers - Create new worker
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const validation = await validateRequest(request, createWorkerSchema)
    if (!validation.success) {
      return apiError(validation.error, 400)
    }

    const { data } = validation
    const worker = await prisma.worker.create({
      data,
    })

    return apiSuccess(worker, 201)
  } catch (error) {
    return apiError('Failed to create worker', 500)
  }
}
