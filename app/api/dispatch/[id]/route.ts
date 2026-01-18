import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, validateRequest, parseDate, isNotFoundError } from '@/lib/api-utils'
import { updateDispatchSchema } from '@/lib/validations/dispatch'

// GET /api/dispatch/[id]
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

    const dispatch = await prisma.dispatchRecord.findUnique({
      where: { id },
      include: {
        fromSite: true,
        toSite: true,
      },
    })

    if (!dispatch) {
      return apiError('Dispatch not found', 404)
    }

    return apiSuccess(dispatch)
  } catch (error) {
    console.error('GET /api/dispatch/[id] error:', error)
    return apiError('Failed to fetch dispatch record', 500)
  }
}

// PUT /api/dispatch/[id]
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

    const validation = await validateRequest(request, updateDispatchSchema)
    if (!validation.success) {
      return apiError(validation.error, 400)
    }

    const { data } = validation

    // Validate from != to if both are being changed
    if (data.fromSiteId && data.toSiteId && data.fromSiteId === data.toSiteId) {
      return apiError('From site and to site cannot be the same', 400)
    }

    // Validate quantity > 0
    if (data.quantity !== undefined && data.quantity <= 0) {
      return apiError('Quantity must be greater than 0', 400)
    }

    const dispatch = await prisma.dispatchRecord.update({
      where: { id },
      data: {
        ...data,
        dispatchDate: data.dispatchDate ? parseDate(data.dispatchDate) : undefined,
        receivedDate: data.receivedDate ? parseDate(data.receivedDate) : undefined,
      },
    })

    return apiSuccess(dispatch)
  } catch (error) {
    console.error('PUT /api/dispatch/[id] error:', error)
    if (isNotFoundError(error)) {
      return apiError('Dispatch not found', 404)
    }
    return apiError('Failed to update dispatch record', 500)
  }
}

// DELETE /api/dispatch/[id]
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

    const dispatch = await prisma.dispatchRecord.delete({
      where: { id },
    })

    return apiSuccess(dispatch)
  } catch (error) {
    console.error('DELETE /api/dispatch/[id] error:', error)
    if (isNotFoundError(error)) {
      return apiError('Dispatch not found', 404)
    }
    return apiError('Failed to delete dispatch record', 500)
  }
}
