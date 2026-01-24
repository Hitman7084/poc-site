import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, validateRequest, parseDate, isNotFoundError } from '@/lib/api-utils'
import { updateAttendanceSchema } from '@/lib/validations/attendance'

// GET /api/attendance/[id] - Get single attendance record
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

    const record = await prisma.attendanceRecord.findUnique({
      where: { id },
      include: {
        worker: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
      },
    })

    if (!record) {
      return apiError('Attendance record not found', 404)
    }

    return apiSuccess(record)
  } catch (error) {
    return apiError('Failed to fetch attendance record', 500)
  }
}

// PUT /api/attendance/[id] - Update attendance record
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
    const validation = await validateRequest(request, updateAttendanceSchema)
    
    if (!validation.success) {
      return apiError(validation.error, 400)
    }

    const { data } = validation

    // Business logic: Validate checkOut is after checkIn if both provided
    if (data.checkOut && data.checkIn) {
      const checkIn = parseDate(data.checkIn)
      const checkOut = parseDate(data.checkOut)
      if (checkOut <= checkIn) {
        return apiError('Check-out time must be after check-in time', 400)
      }
    }

    const record = await prisma.attendanceRecord.update({
      where: { id },
      data: {
        ...data,
        ...(data.date && { date: parseDate(data.date) }),
        ...(data.checkIn && { checkIn: parseDate(data.checkIn) }),
        ...(data.checkOut && { checkOut: parseDate(data.checkOut) }),
      },
      include: {
        worker: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
      },
    })

    return apiSuccess(record)
  } catch (error) {
    if (isNotFoundError(error)) {
      return apiError('Attendance record not found', 404)
    }
    return apiError('Failed to update attendance record', 500)
  }
}

// DELETE /api/attendance/[id] - Delete attendance record
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

    await prisma.attendanceRecord.delete({
      where: { id },
    })

    return apiSuccess({ message: 'Attendance record deleted successfully' })
  } catch (error) {
    if (isNotFoundError(error)) {
      return apiError('Attendance record not found', 404)
    }
    return apiError('Failed to delete attendance record', 500)
  }
}
