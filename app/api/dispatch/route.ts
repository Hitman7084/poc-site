import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, validateRequest, parseDate } from '@/lib/api-utils'
import { createDispatchSchema } from '@/lib/validations/dispatch'

// GET /api/dispatch - Fetch all dispatch records
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

    const records = await prisma.dispatchRecord.findMany({
      where: {
        ...(fromSiteId && { fromSiteId }),
        ...(toSiteId && { toSiteId }),
        ...(isReceived !== null && { isReceived: isReceived === 'true' }),
      },
      include: {
        fromSite: { select: { id: true, name: true } },
        toSite: { select: { id: true, name: true } },
      },
      orderBy: { dispatchDate: 'desc' },
    })

    return apiSuccess(records)
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
