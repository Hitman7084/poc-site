import { Home, Users, MapPin, CalendarCheck, Package, Truck, ImageIcon, Clock, DollarSign, Receipt, AlertCircle } from 'lucide-react'

export const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Workers',
    href: '/dashboard/workers',
    icon: Users,
  },
  {
    name: 'Sites',
    href: '/dashboard/sites',
    icon: MapPin,
  },
  {
    name: 'Attendance',
    href: '/dashboard/attendance',
    icon: CalendarCheck,
  },
  {
    name: 'Materials',
    href: '/dashboard/materials',
    icon: Package,
  },
  {
    name: 'Dispatch',
    href: '/dashboard/dispatch',
    icon: Truck,
  },
  {
    name: 'Work Updates',
    href: '/dashboard/work-updates',
    icon: ImageIcon,
  },
  {
    name: 'Overtime',
    href: '/dashboard/overtime',
    icon: Clock,
  },
  {
    name: 'Payments',
    href: '/dashboard/payments',
    icon: DollarSign,
  },
  {
    name: 'Expenses',
    href: '/dashboard/expenses',
    icon: Receipt,
  },
  {
    name: 'Pending Work',
    href: '/dashboard/pending-work',
    icon: AlertCircle,
  },
]
