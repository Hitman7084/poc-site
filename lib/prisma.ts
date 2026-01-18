import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool, PoolConfig } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Secure connection pool configuration
const getPoolConfig = (): PoolConfig => {
  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  return {
    connectionString,
    // Connection pool settings for security and performance
    max: 10, // Maximum connections in pool
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 10000, // Timeout after 10 seconds
    // SSL is enforced via sslmode=require in connection string
  }
}

// Avoid instantiating Prisma during build time
const createPrismaClient = () => {
  // During build phase, return a mock
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.warn('Prisma Client not initialized - build phase')
    return null as unknown as PrismaClient
  }

  if (!process.env.DATABASE_URL) {
    console.warn('Prisma Client not initialized - no DATABASE_URL')
    return null as unknown as PrismaClient
  }
  
  const pool = new Pool(getPoolConfig())
  
  // Handle pool errors gracefully
  pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err)
  })
  
  const adapter = new PrismaPg(pool)
  
  return new PrismaClient({
    adapter,
    // Only log errors in production, more verbose in development
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
