import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, validateRequest, parseDate, isNotFoundError } from '@/lib/api-utils'
import { updateWorkUpdateSchema } from '@/lib/validations/work-updates'

// GET /api/work-updates/[id]
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

    const workUpdate = await prisma.workUpdate.findUnique({
      where: { id },
      include: {
        site: true,
      },
    })

    if (!workUpdate) {
      return apiError('Work update not found', 404)
    }

    return apiSuccess(workUpdate)
  } catch (error) {
    return apiError('Failed to fetch work update', 500)
  }
}

// PUT /api/work-updates/[id]
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

    const validation = await validateRequest(request, updateWorkUpdateSchema)
    if (!validation.success) {
      return apiError(validation.error, 400)
    }

    const { data } = validation
    const workUpdate = await prisma.workUpdate.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? parseDate(data.date) : undefined,
      },
    })

    return apiSuccess(workUpdate)
  } catch (error) {
    if (isNotFoundError(error)) {
      return apiError('Work update not found', 404)
    }
    return apiError('Failed to update work update', 500)
  }
}

// DELETE /api/work-updates/[id]
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

    const workUpdate = await prisma.workUpdate.delete({
      where: { id },
    })

    return apiSuccess(workUpdate)
  } catch (error) {
    if (isNotFoundError(error)) {
      return apiError('Work update not found', 404)
    }
    return apiError('Failed to delete work update', 500)
  }
}
