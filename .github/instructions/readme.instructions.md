🔹 Project Overview

Build a production-grade internal management system using Next.js + TypeScript with a Node.js backend.

The system is meant for daily operational use for many years, so prioritize:

Stability

Security

Maintainability

Cost efficiency

🧱 FINAL TECH STACK (MANDATORY)
Frontend

Next.js (App Router)

TypeScript (strict mode)

Tailwind CSS

shadcn/ui

next-themes (Light/Dark mode)

TanStack React Query

Backend

Node.js via Next.js API Routes

Prisma ORM

Database & Storage

Supabase PostgreSQL (Primary database)

Supabase Storage (Images, PDFs, DOC/DOCX)

Authentication

NextAuth (Auth.js)

Credentials Provider (Email + Password)

❌ No registration

❌ No forgot password

Users are pre-created in the database

Media

Images & documents → Supabase Storage

Videos → Google Drive (store link only)

🗂️ REQUIRED PROJECT STRUCTURE (STRICT)
/app
  /api
    /auth
    /attendance
    /materials
    /dispatch
    /work-updates
    /overtime
    /payments
    /expenses
    /pending-work
  /login
  /dashboard
  /components
  /lib
  /hooks
  /types
  /utils

/prisma
  schema.prisma
  migrations

/public

🔐 AUTHENTICATION RULES

Login page contains:

Email

Password

No self-registration

Passwords:

Hashed using bcrypt

Sessions:

JWT-based

Secure cookies

Protect all routes except /login

🧭 UI / LAYOUT RULES
Navbar (Global)

Fixed top navbar

Right side:

Profile icon

Light/Dark mode toggle (next-themes)

Responsive and accessible

📊 CORE MODULE REQUIREMENTS

Design normalized relational schemas with foreign keys.

1️⃣ Attendance Record

Worker

Site

Date

Check-in

Check-out

Status (Present / Absent / Half-day)

2️⃣ Material Record

Material name

Quantity

Unit

Site

Date

3️⃣ Dispatch Material Record

From site

To site

Material

Quantity

Dispatch date

Received status

4️⃣ Daily Work Update

Site

Date

Description

Photo URL (Supabase Storage)

Video URL (Google Drive)

5️⃣ Overtime Management

Worker

Site

Date

Extra hours

Rate

Auto-calculated amount

6️⃣ Payment Record

Client

Payment type:

Advance

During work

Final

Amount

Date

Uploaded document URL

7️⃣ Misc Expenses

Expense category:

Office

Site visit

Party visit

Amount

Description

Date

Optional bill URL

8️⃣ Pending Work

Site

Task description

Reason for pending

Expected completion date

Status

☁️ SUPABASE STORAGE — STRICT RULES

❌ Never store files in PostgreSQL

❌ Never store files on server disk

✅ Upload files to Supabase Storage

✅ Store in DB only:

File URL

File type

Upload timestamp

Storage Implementation

Use private buckets

Generate signed upload URLs from API routes

Use environment-specific buckets (dev/prod)

🧠 BACKEND RULES

Use Prisma for all DB operations

No raw SQL unless unavoidable

Use Zod for:

API input validation

All API routes must:

Verify authentication

Validate input

Handle errors gracefully

🎨 FRONTEND RULES

Server Components by default

Client Components only when needed

All forms must include:

Validation

Loading state

Error handling

Use React Query for API interactions

Avoid prop drilling

🧪 CODE QUALITY STANDARDS

TypeScript strict mode ON

No any types

Clear naming conventions

Reusable components

Business logic separated from UI

Minimal but meaningful comments

🚀 DEPLOYMENT & ENVIRONMENT VARIABLES
Required Environment Variables
DATABASE_URL
NEXTAUTH_SECRET
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

Deployment Target

Vercel (Next.js + API)

Supabase (PostgreSQL + Storage)

❗ CONSTRAINTS

No over-engineering

No premature optimization

Build module-by-module

Prefer clarity over cleverness

🎯 FINAL GOAL

Deliver a secure, scalable, maintainable internal management system using:

Next.js

Prisma

Supabase PostgreSQL

Supabase Storage

NextAuth

The system must be reliable for long-term daily use without architectural changes.

✅ CODE GENERATION RULE

Follow these instructions strictly.
Ask for clarification only if absolutely necessary.