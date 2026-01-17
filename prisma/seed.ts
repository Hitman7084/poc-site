import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcrypt'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Create Prisma client for seed script
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting database seed...')

  // Create Users
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      name: 'Manager User',
      password: hashedPassword,
      role: 'MANAGER',
    },
  })

  console.log('✅ Created users:', { admin: adminUser.email, manager: managerUser.email })

  // Create Workers
  const workers = await Promise.all([
    prisma.worker.create({
      data: {
        name: 'John Doe',
        phone: '+1234567890',
        role: 'Mason',
        dailyRate: 500,
        isActive: true,
      },
    }),
    prisma.worker.create({
      data: {
        name: 'Jane Smith',
        phone: '+1234567891',
        role: 'Carpenter',
        dailyRate: 600,
        isActive: true,
      },
    }),
    prisma.worker.create({
      data: {
        name: 'Mike Johnson',
        phone: '+1234567892',
        role: 'Electrician',
        dailyRate: 700,
        isActive: true,
      },
    }),
    prisma.worker.create({
      data: {
        name: 'Sarah Williams',
        phone: '+1234567893',
        role: 'Plumber',
        dailyRate: 650,
        isActive: true,
      },
    }),
    prisma.worker.create({
      data: {
        name: 'David Brown',
        phone: '+1234567894',
        role: 'Laborer',
        dailyRate: 400,
        isActive: true,
      },
    }),
  ])

  console.log(`✅ Created ${workers.length} workers`)

  // Create Sites
  const sites = await Promise.all([
    prisma.site.create({
      data: {
        name: 'Downtown Commercial Plaza',
        location: '123 Main Street, City Center',
        description: 'Commercial plaza project for ABC Corp',
        startDate: new Date('2026-01-01'),
        isActive: true,
      },
    }),
    prisma.site.create({
      data: {
        name: 'Residential Complex - Phase 1',
        location: '456 Oak Avenue, Suburbs',
        description: 'Residential development by XYZ Developers',
        startDate: new Date('2025-12-15'),
        isActive: true,
      },
    }),
    prisma.site.create({
      data: {
        name: 'Industrial Warehouse',
        location: '789 Industrial Road, Industrial Park',
        description: 'Warehouse construction for Manufacturing Ltd',
        startDate: new Date('2026-01-10'),
        isActive: true,
      },
    }),
  ])

  console.log(`✅ Created ${sites.length} sites`)

  // Create sample attendance records
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const attendanceRecords = await Promise.all([
    prisma.attendanceRecord.create({
      data: {
        workerId: workers[0].id,
        siteId: sites[0].id,
        date: yesterday,
        checkIn: new Date(yesterday.setHours(8, 0, 0, 0)),
        checkOut: new Date(yesterday.setHours(17, 0, 0, 0)),
        status: 'PRESENT',
      },
    }),
    prisma.attendanceRecord.create({
      data: {
        workerId: workers[1].id,
        siteId: sites[0].id,
        date: yesterday,
        checkIn: new Date(yesterday.setHours(8, 15, 0, 0)),
        checkOut: new Date(yesterday.setHours(17, 30, 0, 0)),
        status: 'PRESENT',
      },
    }),
    prisma.attendanceRecord.create({
      data: {
        workerId: workers[2].id,
        siteId: sites[1].id,
        date: yesterday,
        checkIn: new Date(yesterday.setHours(8, 0, 0, 0)),
        checkOut: new Date(yesterday.setHours(13, 0, 0, 0)),
        status: 'HALF_DAY',
      },
    }),
  ])

  console.log(`✅ Created ${attendanceRecords.length} attendance records`)

  // Create sample material records
  const materialRecords = await Promise.all([
    prisma.materialRecord.create({
      data: {
        siteId: sites[0].id,
        materialName: 'Cement',
        quantity: 100,
        unit: 'Bags',
        date: yesterday,
      },
    }),
    prisma.materialRecord.create({
      data: {
        siteId: sites[0].id,
        materialName: 'Steel Rods',
        quantity: 50,
        unit: 'Tons',
        date: yesterday,
      },
    }),
    prisma.materialRecord.create({
      data: {
        siteId: sites[1].id,
        materialName: 'Bricks',
        quantity: 5000,
        unit: 'Pieces',
        date: yesterday,
      },
    }),
  ])

  console.log(`✅ Created ${materialRecords.length} material records`)

  // Create sample payment record
  await prisma.payment.create({
    data: {
      clientName: 'ABC Corp',
      amount: 50000,
      paymentType: 'ADVANCE',
      paymentDate: new Date('2026-01-05'),
      notes: 'Initial advance payment for Downtown Commercial Plaza',
    },
  })

  console.log('✅ Created sample payment record')

  // Create sample expense record
  await prisma.expense.create({
    data: {
      category: 'SITE_VISIT',
      amount: 500,
      description: 'Site inspection fuel and food expenses',
      date: yesterday,
    },
  })

  console.log('✅ Created sample expense record')

  // Create sample pending work
  await prisma.pendingWork.create({
    data: {
      siteId: sites[0].id,
      taskDescription: 'Complete electrical wiring in 3rd floor',
      reasonForPending: 'Waiting for electrical materials delivery',
      expectedCompletionDate: new Date('2026-01-15'),
      status: 'PENDING',
    },
  })

  console.log('✅ Created sample pending work record')

  console.log('\n🎉 Database seeding completed successfully!')
  console.log('\n📝 Test Credentials:')
  console.log('   Email: admin@example.com')
  console.log('   Password: admin123')
  console.log('\n   Email: manager@example.com')
  console.log('   Password: admin123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
