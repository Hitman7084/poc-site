import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
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
  
  return new PrismaClient({
    // Only log errors - remove query logging for performance
    log: ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
