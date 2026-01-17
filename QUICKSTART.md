# 🚀 Quick Start Guide

## Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env.local`:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

### 4. Create Test User

```bash
# Open Prisma Studio
npx prisma studio
```

Navigate to `http://localhost:5555`, go to User table, add:
- **name**: Admin User
- **email**: admin@example.com  
- **password**: `$2a$10$YourBcryptHashHere` (hash "password123")
- **role**: ADMIN

**Generate hash:**
```bash
node -e "console.log(require('bcryptjs').hashSync('password123', 10))"
```

### 5. Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000/login`

**Login credentials:**
- Email: `admin@example.com`
- Password: `password123`

## Production Build

```bash
npm run build
npm start
```

## Common Commands

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm start               # Start production
npx prisma studio        # Database GUI
npx prisma migrate dev   # Create migration
```

## Project Structure

```
app/
├── api/                # 24 API endpoints
├── dashboard/          # 10 module pages
└── login/             # Auth page

components/             # Reusable UI
hooks/                 # React Query hooks
lib/                   # Utilities & types
prisma/                # Database schema
```

## Features

✅ Authentication (NextAuth.js)  
✅ CRUD Operations (10 modules)  
✅ File Links (Google Drive)  
✅ Toast Notifications  
✅ Form Validation  
✅ Responsive Design  
✅ Dark Mode  
✅ Accessibility (ARIA)  

## Tech Stack

- Next.js 16.1 + TypeScript 5.9
- Prisma 7.2 + PostgreSQL (Neon)
- React Query 5.90
- shadcn/ui + Tailwind
- NextAuth 4.24

## Troubleshooting

**Database connection error**: Check DATABASE_URL in .env.local  
**Login fails**: Ensure user exists with hashed password  

---

**Need more details?** See [README.md](./README.md)
