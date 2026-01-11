import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, validateRequest, parseDate } from '@/lib/api-utils'
import { createMaterialSchema } from '@/lib/validations/materials'

// GET /api/materials - Fetch all material records
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const materialName = searchParams.get('materialName')

    const records = await prisma.materialRecord.findMany({
      where: {
        ...(siteId && { siteId }),
        ...(materialName && { materialName: { contains: materialName, mode: 'insensitive' } }),
      },
      include: { site: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
    })

    return apiSuccess(records)
  } catch (error) {
    console.error('GET /api/materials error:', error)
    return apiError('Failed to fetch material records', 500)
  }
}

// POST /api/materials - Create new material record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const validation = await validateRequest(request, createMaterialSchema)
    if (!validation.success) {
      return apiError(validation.error, 400)
    }

    const { data } = validation

    // Business logic: Validate quantity is positive
    if (data.quantity <= 0) {
      return apiError('Quantity must be greater than 0', 400)
    }

    const record = await prisma.materialRecord.create({
      data: {
        ...data,
        date: parseDate(data.date),
      },
      include: { site: { select: { id: true, name: true } } },
    })

    return apiSuccess(record, 201)
  } catch (error) {
    console.error('POST /api/materials error:', error)
    return apiError('Failed to create material record', 500)
  }
}
