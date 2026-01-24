import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, validateRequest, parseDate, parseEndOfDayDate } from '@/lib/api-utils'
import { createAttendanceSchema } from '@/lib/validations/attendance'
import { AttendanceStatus } from '@/lib/types'

// GET /api/attendance - Fetch all attendance records (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const workerId = searchParams.get('workerId')
    const siteId = searchParams.get('siteId')
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    const records = await prisma.attendanceRecord.findMany({
      where: {
        ...(workerId && { workerId }),
        ...(siteId && { siteId }),
        ...(date && { date: parseDate(date) }),
        ...(status && { status: status as AttendanceStatus }),
        ...(fromDate || toDate ? {
          date: {
            ...(fromDate && { gte: parseDate(fromDate) }),
            ...(toDate && { lte: parseEndOfDayDate(toDate) }),
          },
        } : {}),
      },
      include: {
        worker: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    })

    return apiSuccess(records)
  } catch (error) {
    console.error('GET /api/attendance error:', error)
    return apiError('Failed to fetch attendance records', 500)
  }
}

// POST /api/attendance - Create new attendance record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const validation = await validateRequest(request, createAttendanceSchema)
    if (!validation.success) {
      return apiError(validation.error, 400)
    }

    const { data } = validation

    // Business logic: Check for duplicate attendance (unique per worker/site/date)
    const existing = await prisma.attendanceRecord.findFirst({
      where: {
        workerId: data.workerId,
        siteId: data.siteId,
        date: parseDate(data.date),
      },
    })

    if (existing) {
      return apiError('Attendance record already exists for this worker, site, and date', 400)
    }

    // Business logic: Validate checkOut is after checkIn
    if (data.checkOut && data.checkIn) {
      const checkIn = parseDate(data.checkIn)
      const checkOut = parseDate(data.checkOut)
      if (checkOut <= checkIn) {
        return apiError('Check-out time must be after check-in time', 400)
      }
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        ...data,
        date: parseDate(data.date),
        checkIn: data.checkIn ? parseDate(data.checkIn) : null,
        checkOut: data.checkOut ? parseDate(data.checkOut) : null,
      },
      include: {
        worker: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
      },
    })

    return apiSuccess(record, 201)
  } catch (error) {
    console.error('POST /api/attendance error:', error)
    return apiError('Failed to create attendance record', 500)
  }
}
