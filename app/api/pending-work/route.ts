import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, validateRequest, parseDate } from '@/lib/api-utils'
import { createPendingWorkSchema } from '@/lib/validations/pending-work'

// GET /api/pending-work - Fetch all pending work records
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const status = searchParams.get('status')

    const records = await prisma.pendingWork.findMany({
      where: {
        ...(siteId && { siteId }),
        ...(status && { status: status as any }),
      },
      include: { site: { select: { id: true, name: true } } },
      orderBy: { expectedCompletionDate: 'asc' },
    })

    return apiSuccess(records)
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
