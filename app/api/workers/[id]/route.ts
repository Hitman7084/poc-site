import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, validateRequest, isNotFoundError } from '@/lib/api-utils'
import { updateWorkerSchema } from '@/lib/validations/workers'

// GET /api/workers/[id]
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

    const worker = await prisma.worker.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attendanceRecords: true,
            overtimeRecords: true,
          },
        },
      },
    })

    if (!worker) {
      return apiError('Worker not found', 404)
    }

    return apiSuccess(worker)
  } catch (error) {
    return apiError('Failed to fetch worker', 500)
  }
}

// PUT /api/workers/[id]
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
    const validation = await validateRequest(request, updateWorkerSchema)
    
    if (!validation.success) {
      return apiError(validation.error, 400)
    }

    const { data } = validation
    const worker = await prisma.worker.update({
      where: { id },
      data,
    })

    return apiSuccess(worker)
  } catch (error) {
    if (isNotFoundError(error)) {
      return apiError('Worker not found', 404)
    }
    return apiError('Failed to update worker', 500)
  }
}

// DELETE /api/workers/[id]
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

    // Delete related records first (attendance and overtime)
    await prisma.$transaction(async (tx) => {
      // Delete attendance records for this worker
      await tx.attendanceRecord.deleteMany({
        where: { workerId: id },
      })
      
      // Delete overtime records for this worker
      await tx.overtime.deleteMany({
        where: { workerId: id },
      })
      
      // Delete the worker
      await tx.worker.delete({
        where: { id },
      })
    })

    return apiSuccess({ deleted: true })
  } catch (error) {
    if (isNotFoundError(error)) {
      return apiError('Worker not found', 404)
    }
    return apiError('Failed to delete worker', 500)
  }
}
