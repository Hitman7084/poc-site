import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Keep-alive endpoint to prevent Supabase from going idle
 * This endpoint performs a simple database query to keep the connection active
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret if configured (for security)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Perform a simple query to keep database active
    await prisma.$queryRaw`SELECT 1`
    
    const timestamp = new Date().toISOString()

    return NextResponse.json({
      success: true, 
      message: 'Database connection active',
      timestamp 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to ping database' 
    }, { status: 500 })
  }
}
