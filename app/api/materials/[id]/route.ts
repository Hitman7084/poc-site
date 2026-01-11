import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, validateRequest, parseDate } from '@/lib/api-utils'
import { updateMaterialSchema } from '@/lib/validations/materials'

// GET /api/materials/[id]
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

    const material = await prisma.materialRecord.findUnique({
      where: { id },
      include: {
        site: true,
      },
    })

    if (!material) {
      return apiError('Material not found', 404)
    }

    return apiSuccess(material)
  } catch (error) {
    console.error('GET /api/materials/[id] error:', error)
    return apiError('Failed to fetch material record', 500)
  }
}

// PUT /api/materials/[id]
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

    const validation = await validateRequest(request, updateMaterialSchema)
    if (!validation.success) {
      return apiError(validation.error, 400)
    }

    const { data } = validation
    const material = await prisma.materialRecord.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? parseDate(data.date) : undefined,
      },
    })

    return apiSuccess(material)
  } catch (error) {
    console.error('PUT /api/materials/[id] error:', error)
    if ((error as any).code === 'P2025') {
      return apiError('Material not found', 404)
    }
    return apiError('Failed to update material record', 500)
  }
}

// DELETE /api/materials/[id]
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

    const material = await prisma.materialRecord.delete({
      where: { id },
    })

    return apiSuccess(material)
  } catch (error) {
    console.error('DELETE /api/materials/[id] error:', error)
    if ((error as any).code === 'P2025') {
      return apiError('Material not found', 404)
    }
    return apiError('Failed to delete material record', 500)
  }
}
