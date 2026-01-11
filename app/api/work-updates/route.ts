import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, validateRequest, parseDate } from '@/lib/api-utils'
import { createWorkUpdateSchema } from '@/lib/validations/work-updates'

// GET /api/work-updates - Fetch all work updates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const date = searchParams.get('date')

    const records = await prisma.workUpdate.findMany({
      where: {
        ...(siteId && { siteId }),
        ...(date && { date: parseDate(date) }),
      },
      include: { site: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
    })

    return apiSuccess(records)
  } catch (error) {
    console.error('GET /api/work-updates error:', error)
    return apiError('Failed to fetch work updates', 500)
  }
}

// POST /api/work-updates - Create new work update
// NOTE: Photo uploads should be handled separately via /api/upload endpoint
// This endpoint expects photoUrl (from Supabase) and videoUrl (Google Drive link)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const validation = await validateRequest(request, createWorkUpdateSchema)
    if (!validation.success) {
      return apiError(validation.error, 400)
    }

    const { data } = validation

    const record = await prisma.workUpdate.create({
      data: {
        ...data,
        date: parseDate(data.date),
      },
      include: { site: { select: { id: true, name: true } } },
    })

    return apiSuccess(record, 201)
  } catch (error) {
    console.error('POST /api/work-updates error:', error)
    return apiError('Failed to create work update', 500)
  }
}
