import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, validateRequest } from '@/lib/api-utils'
import { updateSiteSchema } from '@/lib/validations/sites'

// GET /api/sites/[id]
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

    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attendanceRecords: true,
            materialRecords: true,
            dispatchRecordsFrom: true,
            dispatchRecordsTo: true,
            workUpdates: true,
            overtimeRecords: true,
            pendingWork: true,
          },
        },
      },
    })

    if (!site) {
      return apiError('Site not found', 404)
    }

    return apiSuccess(site)
  } catch (error) {
    console.error('GET /api/sites/[id] error:', error)
    return apiError('Failed to fetch site', 500)
  }
}

// PUT /api/sites/[id]
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

    const validation = await validateRequest(request, updateSiteSchema)
    if (!validation.success) {
      return apiError(validation.error, 400)
    }

    const { data } = validation
    const site = await prisma.site.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    })

    return apiSuccess(site)
  } catch (error) {
    console.error('PUT /api/sites/[id] error:', error)
    if ((error as any).code === 'P2025') {
      return apiError('Site not found', 404)
    }
    return apiError('Failed to update site', 500)
  }
}

// DELETE /api/sites/[id]
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

    // Soft delete - set isActive to false
    const site = await prisma.site.update({
      where: { id },
      data: { isActive: false },
    })

    return apiSuccess(site)
  } catch (error) {
    console.error('DELETE /api/sites/[id] error:', error)
    if ((error as any).code === 'P2025') {
      return apiError('Site not found', 404)
    }
    return apiError('Failed to delete site', 500)
  }
}
