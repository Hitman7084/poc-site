import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, validateRequest } from '@/lib/api-utils'
import { createWorkerSchema } from '@/lib/validations/workers'

// GET /api/workers - Fetch all workers with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const name = searchParams.get('name')

    const workers = await prisma.worker.findMany({
      where: {
        ...(isActive !== null && { isActive: isActive === 'true' }),
        ...(name && { name: { contains: name, mode: 'insensitive' } }),
      },
      orderBy: { name: 'asc' },
    })

    return apiSuccess(workers)
  } catch (error) {
    console.error('GET /api/workers error:', error)
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
    console.error('POST /api/workers error:', error)
    return apiError('Failed to create worker', 500)
  }
}
