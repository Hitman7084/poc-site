import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcrypt'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Create Prisma client for seed script
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting database seed...')

  // Create Admin User
  const hashedPassword = await bcrypt.hash('Himanshu.mall@8858', 10)
  console.log(hashedPassword);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'cliad350@gmail.com' },
    update: {},
    create: {
      email: 'cliad350@gmail.com',
      name: 'Himanshu',
      password: hashedPassword,
      role: 'user',
    },
  })

  console.log('✅ Created admin user:', adminUser.email)
  console.log('\n🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
