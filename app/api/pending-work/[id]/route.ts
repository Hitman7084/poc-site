import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, validateRequest, parseDate, isNotFoundError } from '@/lib/api-utils'
import { updatePendingWorkSchema } from '@/lib/validations/pending-work'

// GET /api/pending-work/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { id } = await params

    const pendingWork = await prisma.pendingWork.findUnique({
      where: { id },
      include: {
        site: true,
      },
    })

    if (!pendingWork) {
      return apiError('Pending work not found', 404)
    }

    return apiSuccess(pendingWork)
  } catch (error) {
    console.error('GET /api/pending-work/[id] error:', error)
    return apiError('Failed to fetch pending work record', 500)
  }
}

// PUT /api/pending-work/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { id } = await params

    const validation = await validateRequest(request, updatePendingWorkSchema)
    if (!validation.success) {
      return apiError(validation.error, 400)
    }

    const { data } = validation
    const pendingWork = await prisma.pendingWork.update({
      where: { id },
      data: {
        ...data,
        expectedCompletionDate: data.expectedCompletionDate ? parseDate(data.expectedCompletionDate) : undefined,
        actualCompletionDate: data.actualCompletionDate ? parseDate(data.actualCompletionDate) : undefined,
      },
    })

    return apiSuccess(pendingWork)
  } catch (error) {
    console.error('PUT /api/pending-work/[id] error:', error)
    if (isNotFoundError(error)) {
      return apiError('Pending work not found', 404)
    }
    return apiError('Failed to update pending work record', 500)
  }
}

// DELETE /api/pending-work/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { id } = await params

    const pendingWork = await prisma.pendingWork.delete({
      where: { id },
    })

    return apiSuccess(pendingWork)
  } catch (error) {
    console.error('DELETE /api/pending-work/[id] error:', error)
    if (isNotFoundError(error)) {
      return apiError('Pending work not found', 404)
    }
    return apiError('Failed to delete pending work record', 500)
  }
}
