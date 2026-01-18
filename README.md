# Singh Fire Engineers - Internal Management System

A production-ready internal management system designed for construction and fire safety field operations.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL (Neon) + Prisma ORM |
| Authentication | NextAuth.js (Credentials) |
| State Management | TanStack React Query |
| UI Components | shadcn/ui + Tailwind CSS |
| Notifications | Sonner |

## Features

### Core Modules

| Module | Description |
|--------|-------------|
| Workers | Employee management with roles and daily rates |
| Sites | Project location tracking with status |
| Attendance | Daily attendance records per worker per site |
| Materials | Inventory management with suppliers |
| Dispatch | Material transfers between sites |
| Work Updates | Daily progress with photo/video links |
| Overtime | Extra hours tracking with reasons |
| Payments | Worker payment records (advance, during, final) |
| Expenses | Site expenses by category |
| Pending Work | Task tracking with priorities and status |

### Authentication & Security

- Email + password authentication (bcrypt hashed)
- JWT sessions with secure HTTP-only cookies
- **Single-session enforcement** - Login from new device invalidates previous sessions
- Protected routes via middleware
- No public registration (users managed by admin)

### User Interface

- Responsive design (mobile, tablet, desktop)
- Dark/Light mode with system preference detection
- Toast notifications for all actions
- Form validation with real-time error feedback
- Confirmation dialogs for destructive actions
- Data tables with pagination (cards on mobile)

### Accessibility

- ARIA labels and semantic HTML
- Keyboard navigation support
- Screen reader compatible

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Secret key for JWT signing |
| `NEXTAUTH_URL` | Application URL |

## Development

1. Install dependencies
2. Generate Prisma client
3. Run database migrations
4. Start development server

## Deployment

Optimized for Vercel deployment with Neon PostgreSQL.

