import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, validateRequest, parseDate } from '@/lib/api-utils'
import { updateOvertimeSchema } from '@/lib/validations/overtime'

// GET /api/overtime/[id]
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

    const overtime = await prisma.overtime.findUnique({
      where: { id },
      include: {
        worker: true,
        site: true,
      },
    })

    if (!overtime) {
      return apiError('Overtime not found', 404)
    }

    return apiSuccess(overtime)
  } catch (error) {
    console.error('GET /api/overtime/[id] error:', error)
    return apiError('Failed to fetch overtime record', 500)
  }
}

// PUT /api/overtime/[id]
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

    const validation = await validateRequest(request, updateOvertimeSchema)
    if (!validation.success) {
      return apiError(validation.error, 400)
    }

    const { data } = validation

    // Validate extraHours > 0
    if (data.extraHours !== undefined && data.extraHours <= 0) {
      return apiError('Extra hours must be greater than 0', 400)
    }

    // Get current record to calculate totalAmount if rate or extraHours changed
    const currentOvertime = await prisma.overtime.findUnique({
      where: { id },
    })

    if (!currentOvertime) {
      return apiError('Overtime not found', 404)
    }

    // Calculate totalAmount if rate or extraHours changed
    const newRate = data.rate ?? currentOvertime.rate
    const newExtraHours = data.extraHours ?? currentOvertime.extraHours
    const calculatedTotalAmount = newRate * newExtraHours

    const overtime = await prisma.overtime.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? parseDate(data.date) : undefined,
        totalAmount: data.rate !== undefined || data.extraHours !== undefined
          ? calculatedTotalAmount
          : data.totalAmount,
      },
    })

    return apiSuccess(overtime)
  } catch (error) {
    console.error('PUT /api/overtime/[id] error:', error)
    if ((error as any).code === 'P2025') {
      return apiError('Overtime not found', 404)
    }
    return apiError('Failed to update overtime record', 500)
  }
}

// DELETE /api/overtime/[id]
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

    const overtime = await prisma.overtime.delete({
      where: { id },
    })

    return apiSuccess(overtime)
  } catch (error) {
    console.error('DELETE /api/overtime/[id] error:', error)
    if ((error as any).code === 'P2025') {
      return apiError('Overtime not found', 404)
    }
    return apiError('Failed to delete overtime record', 500)
  }
}
