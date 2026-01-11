// Prisma 7.x Configuration
import { config } from 'dotenv'

config({ path: '.env.local' })

export default {
  datasource: {
    url: process.env.DATABASE_URL,
  },
}
