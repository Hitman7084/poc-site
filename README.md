# 📘 Internal Management System

Production-grade internal management system for construction/field operations with 10 core modules, authentication, file uploads, and modern UI.

## Tech Stack

- **Framework**: Next.js 16.1 (App Router, Turbopack)
- **Language**: TypeScript 5.9 (strict mode)
- **Database**: PostgreSQL (Neon) + Prisma 7.2
- **Auth**: NextAuth.js 4.24 (Credentials)
- **State**: TanStack React Query 5.90
- **UI**: shadcn/ui + Tailwind CSS
- **Notifications**: Sonner
- **Storage**: Google Drive (links only)

## Core Modules (10)

1. **Workers** - Labor management (name, role, rate, contact)
2. **Sites** - Project locations (name, location, dates, status)
3. **Attendance** - Daily records (worker, site, hours, status)
4. **Materials** - Inventory (name, quantity, price, supplier)
5. **Dispatch** - Material transfers (material, site, quantity, date)
6. **Work Updates** - Daily progress (description, photos, videos)
   - Photos: Google Drive links
   - Videos: Google Drive links
7. **Overtime** - Extra hours (worker, site, hours, reason)

**Components**:
- `DataTable.tsx` - Paginated table (desktop) + cards (mobile)
- `ConfirmDialog.tsx` - Modal confirmation
- `LoadingState.tsx`, `ErrorState.tsx`, `EmptyState.tsx` - UI states
- `Breadcrumbs.tsx` - Navigation trail

## Key Features

### 🔐 Authentication
- Email + Password (bcrypt hashed)
- JWT sessions with secure cookies
- No registration (users pre-created)
- Protected routes via middleware

### 📤 File Management
- Documents: Google Drive links only
- No local file storage needed
- Simple URL inputs for photos and videos

### 🎨 UI/UX
- **Toast Notifications**: Success/error feedback (Sonner)
- **Form Validation**: Field-level errors, real-time clearing
- **Loading States**: Spinners, progress bars, disabled buttons
- **Empty States**: Friendly messages with CTAs
- **Confirmation Dialogs**: Replace native confirm()

### 📱 Responsive Design
- Mobile: < 640px (cards, drawer sidebar)
- Tablet: 640px - 1024px
- Desktop: > 1024px (full tables, fixed sidebar)
- Touch-friendly tap targets (44x44px minimum)

### 🌙 Dark Mode
- next-themes with localStorage persistence
- System preference detection
- Toggle in header (Sun/Moon icon)

### ♿ Accessibility
- ARIA labels on all icon buttons
- aria-invalid on invalid inputs
- aria-describedby linking errors
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader support (sr-only text)
- Semantic HTML (main, section, nav)

### 📊 Data Table
- Desktop: Full table with sorting placeholders
- Mobile: Card-based layout
- Pagination: First, Prev, Next, Last
- Rows per page: 10, 20, 30, 50, 100
- Empty state handling

## Database Schema (11 Models)

- **User**: name, email, password, role
- **Worker**: name, phone, email, role, dailyRate, isActive
- **Site**: name, location, startDate, endDate, status
- **Attendance**: workerId, siteId, date, status, hoursWorked
- **Material**: name, unit, quantity, pricePerUnit, supplier
- **DispatchMaterial**: materialId, siteId, quantity, date
- **WorkUpdate**: siteId, date, description, photoUrls, videoUrl
- **Overtime**: workerId, siteId, date, hours, reason
- **Payment**: workerId, siteId, amount, date, type, receiptUrl
- **Expense**: siteId, category, amount, date, receiptUrl
- **PendingWork**: siteId, description, priority, status, dueDate

## Code Patterns

### CRUD Page Template

```typescript
// State
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [editingItem, setEditingItem] = useState<Item | null>(null);
const [errors, setErrors] = useState<{ [key: string]: string }>({});
const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

// Data Fetching
const { data, isLoading, error } = useItems();
const createMutation = useCreateItem();
const updateMutation = useUpdateItem();
const deleteMutation = useDeleteItem();

// Submit Handler
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validate
  const newErrors: { [key: string]: string } = {};
  if (!formData.name.trim()) newErrors.name = 'Name is required';
  
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    toast.error('Please fix the form errors');
    return;
  }
  
  // Submit
  try {
    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, data: formData });
      toast.success('Updated successfully');
    } else {
      await createMutation.mutateAsync(formData);
      toast.success('Created successfully');
    }
    handleCloseDialog();
  } catch (err) {
    toast.error('Operation failed');
  }
};

// Delete Handler
const handleDelete = (id: string) => {
  setItemToDelete(id);
  setDeleteConfirmOpen(true);
};
```

### Form Validation

```typescript
// Input with Error Display
<div className="space-y-2">
  <Label htmlFor="name">Name *</Label>
  <Input
    id="name"
    value={formData.name}
    onChange={(e) => {
      setFormData({ ...formData, name: e.target.value });
      if (errors.name) setErrors({ ...errors, name: '' });
    }}
    className={errors.name ? 'border-destructive' : ''}
    aria-invalid={!!errors.name}
    aria-describedby={errors.name ? 'name-error' : undefined}
  />
  {errors.name && (
    <p id="name-error" className="text-sm text-destructive">
      {errors.name}
    </p>
  )}
</div>
```

### Toast Notifications

```typescript
import { toast } from 'sonner';

toast.success('Item created successfully');
toast.error('Failed to create item');
toast.info('Loading data...');
toast.warning('Warning message');
```

## Environment Variables

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## Development

```bash
npm install              # Install dependencies
npx prisma generate      # Generate Prisma Client
npx prisma migrate dev   # Run migrations
npx prisma studio        # Open database GUI
npm run dev              # Start dev server
```

## Deployment (Vercel)

1. Push code to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy
5. Run: `npx prisma migrate deploy`

## Reference Implementation

**Workers Module** (`app/dashboard/workers/page.tsx`) demonstrates all best practices:
- ✅ Toast notifications
- ✅ Form validation with errors
- ✅ Confirmation dialogs
- ✅ ARIA attributes
- ✅ Loading states
- ✅ Mobile responsive

**Apply this pattern to all other modules.**

## Project Structure

```
app/
├── api/                      # 24 API routes
│   ├── workers/
│   ├── sites/
│   ├── attendance/
│   ├── materials/
│   ├── dispatch/
│   ├── work-updates/
│   ├── overtime/
│   ├── payments/
│   ├── expenses/
│   ├── pending-work/
│   ├── auth/
│   └── upload/
├── dashboard/                # Module pages
│   ├── workers/
│   ├── sites/
│   ├── attendance/
│   ├── materials/
│   ├── dispatch/
│   ├── work-updates/
│   ├── overtime/
│   ├── payments/
│   ├── expenses/
│   ├── pending-work/
│   ├── header.tsx
│   ├── sidebar.tsx
│   ├── breadcrumbs.tsx
│   └── navigation.ts
├── login/
└── components/
    └── providers.tsx

components/
├── ui/                       # shadcn/ui components
├── DataTable.tsx
├── ConfirmDialog.tsx
├── FileUpload.tsx
├── LoadingState.tsx
├── ErrorState.tsx
└── EmptyState.tsx

hooks/
├── useWorkers.ts
├── useSites.ts
├── useAttendance.ts
├── useMaterials.ts
├── useDispatch.ts
├── useWorkUpdates.ts
├── useOvertime.ts
├── usePayments.ts
├── useExpenses.ts
└── usePendingWork.ts

lib/
├── types.ts                  # TypeScript types
├── utils.ts                  # Utilities
├── storage-utils.ts          # Local file storage
└── validations/              # Zod schemas

prisma/
├── schema.prisma             # Database schema
└── migrations/
```

## Troubleshooting

**Database connection fails**: Verify DATABASE_URL in .env.local

**Login fails**: Ensure user exists with bcrypt hashed password

**Build errors**: Run `npx prisma generate` after schema changes

## Limitations

- No user registration (manual creation only)
- No password reset flow
- Single role system (no complex permissions)
- Files stored as Google Drive links only
- No direct file uploads

## Future Enhancements

- Search/filter in tables
- Actual column sorting
- Export to CSV/Excel
- Bulk operations
- Reports and charts
- Email notifications
- Audit logs
- Advanced permissions
- Password reset
- 2FA

---

**Status**: ✅ Production Ready  
**Build**: ✅ Passing (0 errors)  
**Quick Start**: See [QUICKSTART.md](./QUICKSTART.md)
