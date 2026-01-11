import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, validateRequest, parseDate } from '@/lib/api-utils'
import { createOvertimeSchema } from '@/lib/validations/overtime'

// GET /api/overtime - Fetch all overtime records
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

    const records = await prisma.overtime.findMany({
      where: {
        ...(workerId && { workerId }),
        ...(siteId && { siteId }),
        ...(date && { date: parseDate(date) }),
      },
      include: {
        worker: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    })

    return apiSuccess(records)
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
