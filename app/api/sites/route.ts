import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, apiPaginated, parsePaginationParams, validateRequest } from '@/lib/api-utils'
import { createSiteSchema } from '@/lib/validations/sites'

// GET /api/sites - Fetch sites with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const name = searchParams.get('name')
    const all = searchParams.get('all') // For dropdowns - fetch all without pagination
    const { page, limit, skip } = parsePaginationParams(searchParams)

    const where = {
      ...(isActive !== null && { isActive: isActive === 'true' }),
      ...(name && { name: { contains: name, mode: 'insensitive' as const } }),
    }

    // If 'all' param is present, return all sites without pagination (for dropdowns)
    if (all === 'true') {
      const sites = await prisma.site.findMany({
        where,
        orderBy: { name: 'asc' },
      })
      return apiSuccess(sites)
    }

    const [sites, total] = await Promise.all([
      prisma.site.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.site.count({ where }),
    ])

    return apiPaginated(sites, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/sites error:', error)
    return apiError('Failed to fetch sites', 500)
  }
}

// POST /api/sites - Create new site
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const validation = await validateRequest(request, createSiteSchema)
    if (!validation.success) {
      return apiError(validation.error, 400)
    }

    const { data } = validation
    const site = await prisma.site.create({
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    })

    return apiSuccess(site, 201)
  } catch (error) {
    console.error('POST /api/sites error:', error)
    return apiError('Failed to create site', 500)
  }
}
